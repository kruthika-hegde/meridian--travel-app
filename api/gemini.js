import { isAllowed, clientIp } from "./_rateLimit.js";

const API_KEY = process.env.GEMINI_API_KEY;
const urlFor = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const RETRYABLE_STATUSES = new Set([429, 500, 503]);

// Vercel's Hobby plan caps serverless functions at 10s wall-clock time (see
// vercel.json's maxDuration: 10 for this function). Everything below is
// budgeted against that ceiling with a safety margin.
const OVERALL_BUDGET_MS = 9200;
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

async function attempt(model, { systemInstruction, contents, responseMimeType }, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const upstream = await fetch(`${urlFor(model)}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        contents,
        generationConfig: {
          temperature: 0.7,
          ...(responseMimeType ? { responseMimeType } : {}),
        },
      }),
    });

    if (upstream.ok) {
      const data = await upstream.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
      if (!text) return { ok: false, message: "Gemini returned an empty response." };
      return { ok: true, text };
    }

    return { ok: false, message: friendlyErrorMessage(upstream.status), status: upstream.status };
  } catch (err) {
    return {
      ok: false,
      message:
        err.name === "AbortError"
          ? "The AI assistant took too long to respond. Please try again."
          : "Couldn't reach the AI assistant. Please try again.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callGemini(payload) {
  const startedAt = Date.now();
  const remaining = () => OVERALL_BUDGET_MS - (Date.now() - startedAt);

  // Structured requests (the itinerary planner) ask Gemini to return a full
  // multi-day JSON plan, which takes meaningfully longer to generate than a
  // short chat answer. Splitting an already-tight ~9s budget across several
  // short attempts hurts more than it helps here, so give it ONE attempt on
  // the faster model, using almost the whole budget in a single shot rather
  // than retrying/falling back.
  if (payload.responseMimeType) {
    const result = await attempt("gemini-3.5-flash-lite", payload, Math.max(remaining() - 300, 3000));
    if (result.ok) return { text: result.text };
    throw new Error(result.message);
  }

  // Plain chat questions are short and fast, so retry across two models if
  // the first is overloaded — there's plenty of budget for a couple of tries.
  const models = ["gemini-3.6-flash", "gemini-3.5-flash-lite"];
  let lastMessage = "The AI assistant couldn't complete that request.";

  for (const model of models) {
    if (remaining() < 1500) break;
    const result = await attempt(model, payload, Math.min(remaining() - 200, 5000));
    if (result.ok) return { text: result.text };
    lastMessage = result.message;
    if (result.status && !RETRYABLE_STATUSES.has(result.status)) throw new Error(lastMessage);
    if (remaining() > 1800) await sleep(300);
  }

  throw new Error(lastMessage);
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