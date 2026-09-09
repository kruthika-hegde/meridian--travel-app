import { isAllowed, clientIp } from "./_rateLimit.js";

const API_KEY = process.env.GEMINI_API_KEY;
const MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite"];
const urlFor = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const RETRYABLE_STATUSES = new Set([429, 500, 503]);
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 15000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function friendlyErrorMessage(status) {
  if (status === 429) {
    return "The AI assistant is getting a lot of requests right now. Please wait a moment and try again.";
  }
  if (RETRYABLE_STATUSES.has(status)) {
    return "The AI assistant is temporarily overloaded on Google's side. Please try again in a few seconds.";
  }
  return "The AI assistant couldn't complete that request. Please try again.";
}

async function callGemini({ systemInstruction, contents, responseMimeType }) {
  let lastErrorMessage = "The AI assistant couldn't complete that request.";

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let upstream;
      try {
        upstream = await fetch(`${urlFor(model)}?key=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: systemInstruction
              ? { parts: [{ text: systemInstruction }] }
              : undefined,
            contents,
            generationConfig: {
              temperature: 0.7,
              ...(responseMimeType ? { responseMimeType } : {}),
            },
          }),
        });
      } catch (networkErr) {
        clearTimeout(timeoutId);
        if (networkErr.name === "AbortError") {
          lastErrorMessage = "The AI assistant took too long to respond. Please try again.";
        } else {
          lastErrorMessage = "Couldn't reach the AI assistant. Please try again.";
        }
        continue;
      }
      clearTimeout(timeoutId);

      if (upstream.ok) {
        const data = await upstream.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
        if (!text) {
          lastErrorMessage = "Gemini returned an empty response.";
          continue;
        }
        return { text };
      }

      lastErrorMessage = friendlyErrorMessage(upstream.status);

      const canRetrySameModel = RETRYABLE_STATUSES.has(upstream.status) && attempt < MAX_ATTEMPTS;
      if (canRetrySameModel) {
        await sleep(600 * attempt + Math.random() * 200);
        continue;
      }

      if (!RETRYABLE_STATUSES.has(upstream.status)) {
        throw new Error(lastErrorMessage);
      }
      break; // exhausted this model's retries on an overload-type error, try next model
    }
  }

  throw new Error(lastErrorMessage);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAllowed(`gemini:${clientIp(req)}`, 15, 60_000)) {
    res.status(429).json({ error: "The AI assistant is getting a lot of requests right now. Please wait a moment and try again." });
    return;
  }

  if (!API_KEY) {
    res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
    return;
  }

  const { systemInstruction, contents, responseMimeType } = req.body ?? {};
  if (!Array.isArray(contents) || contents.length === 0) {
    res.status(400).json({ error: "contents is required." });
    return;
  }

  try {
    const result = await callGemini({ systemInstruction, contents, responseMimeType });
    res.status(200).json(result);
  } catch (err) {
    res.status(503).json({ error: err.message || "The AI assistant couldn't complete that request." });
  }
}
