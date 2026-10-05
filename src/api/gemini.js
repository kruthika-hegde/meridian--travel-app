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
 * key server-side, validates the request, builds the prompt, and handles
 * retries and model fallback. The client just needs a hard timeout so the UI
 * can never hang indefinitely.
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
 *
 * The browser sends only structured parameters — the system prompt is built
 * and the input validated on the server (api/_prompts.js, api/_validate.js).
 */
export async function askDestinationQuestion(destination, question, history = []) {
  return callGemini({
    task: "chat",
    destinationId: destination.id,
    question,
    history: history.map(({ role, text }) => ({ role, text })),
  });
}

/**
 * Generate a structured day-by-day itinerary. `interests`, `dietary` and
 * `travelStyle` are arrays of the chip options defined in
 * src/data/planOptions.js; `mustVisit` is a list of place names.
 *
 * Returns the parsed object: { currencySymbol, bestTimeToVisit, localTip, days }
 */
export async function generateItinerary({
  destination,
  days,
  interests,
  pace,
  budget = "",
  mustVisit = [],
  dietary = [],
  travelStyle = [],
}) {
  const raw = await callGemini({
    task: "itinerary",
    destinationId: destination.id,
    days,
    interests,
    pace,
    budget,
    mustVisit,
    dietary,
    travelStyle,
  });

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.days)) throw new Error("Malformed itinerary shape");
    return {
      currencySymbol: parsed.currencySymbol || "$",
      bestTimeToVisit: parsed.bestTimeToVisit || "",
      localTip: parsed.localTip || "",
      days: parsed.days,
    };
  } catch {
    throw new GeminiApiError("Couldn't parse the itinerary response. Try again.");
  }
}

/**
 * Insert a specific traveler-requested place into whichever existing day is
 * geographically closest. Only the affected day is returned (not the whole
 * itinerary) to keep the response small and fast within the serverless budget.
 */
export async function addPlaceToItinerary({ destination, days: currentDays, placeName }) {
  const raw = await callGemini({
    task: "addPlace",
    destinationId: destination.id,
    days: currentDays,
    placeName,
  });

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.addedToDayIndex !== "number" || !parsed.day || !Array.isArray(parsed.day.activities)) {
      throw new Error("Malformed response shape");
    }
    return parsed;
  } catch {
    throw new GeminiApiError("Couldn't add that place. Try again.");
  }
}

export { GeminiApiError };
