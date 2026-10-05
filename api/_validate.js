// Server-side input validation for every request that can reach a paid or
// rate-limited upstream (Gemini, Foursquare, OpenWeather, Pexels).
//
// Why this exists: the browser is not a trust boundary. Anyone can call
// /api/* directly with curl, so the server must (1) accept only the exact
// shapes it expects, (2) cap sizes, and (3) never let the caller supply the
// AI system prompt. Each validator returns { ok: true, value } or
// { ok: false, error }, and is a pure function so it can be unit tested.

import { getDestinationById } from "../src/data/destinations.js";
import {
  INTEREST_OPTIONS,
  PACE_OPTIONS,
  DIETARY_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
  LIMITS,
} from "../src/data/planOptions.js";

const fail = (error) => ({ ok: false, error });
const ok = (value) => ({ ok: true, value });

const isPlainObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Collapse whitespace/newlines and strip control characters. User text ends up
 * inside an LLM prompt, so removing line breaks makes it much harder to smuggle
 * in fake "instructions" on their own line. Returns "" for non-strings.
 */
export function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function pickAllowed(list, allowed, label) {
  if (list === undefined) return ok([]);
  if (!Array.isArray(list)) return fail(`${label} must be a list.`);
  const unique = [...new Set(list)];
  if (unique.some((item) => typeof item !== "string" || !allowed.includes(item))) {
    return fail(`${label} contains an unsupported option.`);
  }
  return ok(unique);
}

function validateDestination(destinationId) {
  const destination = typeof destinationId === "string" ? getDestinationById(destinationId) : undefined;
  if (!destination) return fail("Unknown destination.");
  return ok(destination);
}

export function validateChatRequest(body) {
  if (!isPlainObject(body)) return fail("Invalid request.");

  const dest = validateDestination(body.destinationId);
  if (!dest.ok) return dest;

  const question = cleanText(body.question, LIMITS.maxQuestionLength);
  if (!question) return fail("A question is required.");

  const rawHistory = body.history ?? [];
  if (!Array.isArray(rawHistory)) return fail("history must be a list.");

  const history = [];
  // Only the most recent messages are kept; older context rarely matters and
  // unbounded history would let a caller inflate the prompt.
  for (const msg of rawHistory.slice(-LIMITS.maxHistoryMessages)) {
    if (!isPlainObject(msg) || (msg.role !== "user" && msg.role !== "model")) {
      return fail("history contains an invalid message.");
    }
    const text = cleanText(msg.text, LIMITS.maxHistoryMessageLength);
    if (text) history.push({ role: msg.role, text });
  }

  return ok({ destination: dest.value, question, history });
}

export function validateItineraryRequest(body) {
  if (!isPlainObject(body)) return fail("Invalid request.");

  const dest = validateDestination(body.destinationId);
  if (!dest.ok) return dest;

  const days = body.days;
  if (!Number.isInteger(days) || days < LIMITS.minDays || days > LIMITS.maxDays) {
    return fail(`days must be a whole number between ${LIMITS.minDays} and ${LIMITS.maxDays}.`);
  }

  const interests = pickAllowed(body.interests, INTEREST_OPTIONS, "interests");
  if (!interests.ok) return interests;
  const dietary = pickAllowed(body.dietary, DIETARY_OPTIONS, "dietary");
  if (!dietary.ok) return dietary;
  const travelStyle = pickAllowed(body.travelStyle, TRAVEL_STYLE_OPTIONS, "travelStyle");
  if (!travelStyle.ok) return travelStyle;

  if (!PACE_OPTIONS.includes(body.pace)) return fail("pace is not a supported option.");

  let budget = "";
  if (body.budget !== undefined && body.budget !== "") {
    const n = Number(body.budget);
    if (!Number.isFinite(n) || n < 0 || n > LIMITS.maxBudget) return fail("budget must be a sensible positive number.");
    budget = String(Math.round(n));
  }

  const rawMustVisit = body.mustVisit ?? [];
  if (!Array.isArray(rawMustVisit) || rawMustVisit.length > LIMITS.maxMustVisit) {
    return fail(`mustVisit can hold at most ${LIMITS.maxMustVisit} places.`);
  }
  const mustVisit = rawMustVisit.map((p) => cleanText(p, LIMITS.maxPlaceNameLength)).filter(Boolean);

  return ok({
    destination: dest.value,
    days,
    interests: interests.value,
    pace: body.pace,
    budget,
    mustVisit,
    dietary: dietary.value,
    travelStyle: travelStyle.value,
  });
}

export function validateAddPlaceRequest(body) {
  if (!isPlainObject(body)) return fail("Invalid request.");

  const dest = validateDestination(body.destinationId);
  if (!dest.ok) return dest;

  const placeName = cleanText(body.placeName, LIMITS.maxPlaceNameLength);
  if (!placeName) return fail("A place name is required.");

  const days = body.days;
  if (!Array.isArray(days) || days.length === 0 || days.length > LIMITS.maxDays) {
    return fail("days must be a non-empty itinerary.");
  }
  if (!days.every((d) => isPlainObject(d) && Array.isArray(d.activities))) {
    return fail("days has an unexpected shape.");
  }
  // Cap the serialized size so this endpoint can't be used to push huge
  // payloads (and token spend) through to the model.
  if (JSON.stringify(days).length > LIMITS.maxItineraryJsonChars) {
    return fail("The itinerary is too large to modify.");
  }

  return ok({ destination: dest.value, placeName, days });
}

/** Coordinates for the weather proxy: must be real numbers in range. */
export function validateCoordinates(lat, lon) {
  const la = Number(lat);
  const lo = Number(lon);
  if (lat === undefined || lon === undefined || lat === "" || lon === "") return fail("lat and lon are required.");
  if (!Number.isFinite(la) || la < -90 || la > 90) return fail("lat must be between -90 and 90.");
  if (!Number.isFinite(lo) || lo < -180 || lo > 180) return fail("lon must be between -180 and 180.");
  return ok({ lat: la, lon: lo });
}

const ALLOWED_UNITS = ["metric", "imperial", "standard"];
export function validateUnits(units = "metric") {
  return ALLOWED_UNITS.includes(units) ? ok(units) : fail("units must be metric, imperial or standard.");
}

/** Free-text search terms (location search, image search, place verification). */
export function validateSearchTerm(value, { min = 1, max = 100 } = {}) {
  if (typeof value !== "string") return fail("A search term is required.");
  const cleaned = cleanText(value, max);
  if (cleaned.length < min) return fail("The search term is too short.");
  return ok(cleaned);
}

/** Small bounded integer from a query string, with a safe default. */
export function boundedInt(value, { fallback, min, max }) {
  const n = Number.parseInt(value, 10);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}
