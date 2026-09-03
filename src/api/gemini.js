const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Try the primary model first; if it's persistently overloaded (503), fall
// back to a second, usually-less-congested model rather than failing outright.
const MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite"];
const urlFor = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

class GeminiApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "GeminiApiError";
  }
}

function assertKey() {
  if (!API_KEY) {
    throw new GeminiApiError(
      "Missing VITE_GEMINI_API_KEY. Add it to your .env file."
    );
  }
}

const RETRYABLE_STATUSES = new Set([429, 500, 503]);
const MAX_ATTEMPTS = 3;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Turn a raw HTTP failure into a short, visitor-facing sentence instead of
// dumping the provider's JSON error body straight into the chat UI.
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
  assertKey();

  let lastError;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      let res;
      try {
        res = await fetch(`${urlFor(model)}?key=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        // Network failure (offline, DNS, CORS) — not retryable in a way that helps here.
        throw new GeminiApiError(
          "Couldn't reach the AI assistant. Check your connection and try again."
        );
      }

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
        if (!text) throw new GeminiApiError("Gemini returned an empty response.");
        return text;
      }

      lastError = new GeminiApiError(friendlyErrorMessage(res.status));

      const canRetrySameModel = RETRYABLE_STATUSES.has(res.status) && attempt < MAX_ATTEMPTS;
      if (canRetrySameModel) {
        // Exponential backoff with a little jitter: ~600ms, ~1200ms, ...
        await sleep(600 * attempt + Math.random() * 200);
        continue;
      }

      // Exhausted retries on this model. If it was an overload-type error and
      // another model is available, fall through to try that one next.
      if (!RETRYABLE_STATUSES.has(res.status)) throw lastError;
      break;
    }
  }

  throw lastError;
}

/**
 * Ask a free-form question about a destination.
 * `history` is an array of { role: 'user' | 'model', text } from the current thread.
 */
export async function askDestinationQuestion(destination, question, history = []) {
  const systemInstruction = `You are a knowledgeable, concise travel assistant embedded in a travel app.
The visitor is looking at the destination "${destination.name}, ${destination.country}".
Context: ${destination.description}
Answer questions about when to go, how long to stay, what to see, budgeting, and logistics.
Keep answers to 2-4 short sentences unless the visitor asks for more detail. Do not use markdown headers.`;

  const contents = [
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: question }] },
  ];

  return callGemini({ systemInstruction, contents });
}

/**
 * Generate a structured day-by-day itinerary as JSON.
 */
export async function generateItinerary({ destination, days, interests, pace }) {
  const systemInstruction = `You are a travel planner. Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "days": [
    {
      "title": "short day title",
      "summary": "one sentence overview of the day",
      "activities": [
        { "time": "Morning" | "Afternoon" | "Evening", "title": "activity name", "description": "1-2 sentence description" }
      ]
    }
  ]
}
Produce exactly the requested number of days. Ground activities in real, well-known places and neighbourhoods in the destination when possible.`;

  const userPrompt = `Destination: ${destination.name}, ${destination.country}
Trip length: ${days} day${days > 1 ? "s" : ""}
Traveler interests: ${interests.length ? interests.join(", ") : "general sightseeing"}
Pace: ${pace}
Known highlights to consider: ${destination.places.map((p) => p.name).join(", ")}`;

  const raw = await callGemini({
    systemInstruction,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    responseMimeType: "application/json",
  });

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.days)) throw new Error("Malformed itinerary shape");
    return parsed.days;
  } catch {
    throw new GeminiApiError("Couldn't parse the itinerary response. Try again.");
  }
}

export { GeminiApiError };