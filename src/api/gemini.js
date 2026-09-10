const ENDPOINT = "/api/gemini";
// Server function budgets ~9.2s internally (see api/gemini.js) and Vercel's
// platform cap is 10s, so 11.5s here leaves enough margin for network/JSON
// overhead while still failing well before a user would call it "stuck."
const CLIENT_TIMEOUT_MS = 11500;

class GeminiApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "GeminiApiError";
  }
}

/**
 * Calls our own serverless proxy at /api/gemini, which holds the real Gemini
 * key server-side and already handles retries and model fallback. The client
 * just needs a hard timeout so the UI can never hang indefinitely.
 */
async function callGemini(payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new GeminiApiError("The AI assistant took too long to respond. Please try again.");
    }
    throw new GeminiApiError("Couldn't reach the AI assistant. Check your connection and try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new GeminiApiError(data?.error || "The AI assistant couldn't complete that request.");
  }

  if (!data.text) {
    throw new GeminiApiError("Gemini returned an empty response.");
  }

  return data.text;
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
Produce exactly the requested number of days. Ground activities in real, well-known places and neighbourhoods in the destination when possible. Keep every "description" to one short sentence — brevity matters more than detail here.`;

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