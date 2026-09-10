import { isAllowed, clientIp } from "./_rateLimit.js";

const API_KEY = process.env.GEMINI_API_KEY;
const MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite"];
const urlFor = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const RETRYABLE_STATUSES = new Set([429, 500, 503]);

// Vercel's Hobby plan caps serverless functions at 10s wall-clock time.
// Everything below is budgeted against that ceiling with a safety margin —
// rather than fixed per-attempt timeouts and retry counts (which could add
// up past the platform limit and get the function killed mid-request), we
// track a single overall deadline and stop trying once we're close to it.
const OVERALL_BUDGET_MS = 8500;
const MIN_ATTEMPT_MS = 1800; // don't bother starting an attempt with less runway than this
const BACKOFF_MS = 300;
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
  const startedAt = Date.now();
  let lastErrorMessage = "The AI assistant couldn't complete that request.";

  for (const model of MODELS) {
    while (true) {
      const elapsed = Date.now() - startedAt;
      const remaining = OVERALL_BUDGET_MS - elapsed;
      if (remaining < MIN_ATTEMPT_MS) {
        throw new Error(lastErrorMessage);
      }

      const attemptTimeout = Math.min(remaining - 200, 6000); // leave a little slack for JSON parsing etc.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), attemptTimeout);
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
        lastErrorMessage =
          networkErr.name === "AbortError"
            ? "The AI assistant took too long to respond. Please try again."
            : "Couldn't reach the AI assistant. Please try again.";
        break; // move on to the next model rather than retrying the same one and burning more budget
      }
      clearTimeout(timeoutId);

      if (upstream.ok) {
        const data = await upstream.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
        if (!text) {
          lastErrorMessage = "Gemini returned an empty response.";
          break;
        }
        return { text };
      }

      lastErrorMessage = friendlyErrorMessage(upstream.status);

      if (!RETRYABLE_STATUSES.has(upstream.status)) {
        throw new Error(lastErrorMessage);
      }

      // Retryable error: try again on the same model once if there's enough
      // budget left for another attempt, otherwise fall through to the next model.
      const remainingAfter = OVERALL_BUDGET_MS - (Date.now() - startedAt);
      if (remainingAfter >= MIN_ATTEMPT_MS + BACKOFF_MS) {
        await sleep(BACKOFF_MS);
        continue;
      }
      break;
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