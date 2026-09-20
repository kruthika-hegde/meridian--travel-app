import { isAllowed, clientIp } from "./_rateLimit.js";

const API_KEY = process.env.FOURSQUARE_API_KEY;
const SEARCH_URL = "https://api.foursquare.com/v3/places/search";

// Feature #1 (accuracy): rather than trusting the LLM's claim that a place
// exists and is open, this pings Foursquare's live places database — a
// genuinely free, no-credit-card, scale-ready alternative to Google Places
// (no fixed local dataset limiting this to a curated handful of cities).
// Feature #2 (geographic logic) reuses the SAME response — Foursquare
// results include coordinates, which the client uses to compute real
// distances between a day's stops instead of relying on the model's word
// that a route "makes sense." One integration, two problems solved.
//
// Foursquare's `closed_bucket` field gives a confidence-scored closure
// signal (VeryLikelyOpen / LikelyOpen / Unsure / LikelyClosed /
// VeryLikelyClosed) which maps naturally onto an open/closed badge —
// arguably a better signal for this use case than a plain boolean.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAllowed(`verify-place:${clientIp(req)}`, 40, 60_000)) {
    res.status(429).json({ error: "Too many requests. Please slow down." });
    return;
  }

  if (!API_KEY) {
    // Degrade gracefully: the feature is optional. Callers should treat a
    // 501 as "verification unavailable" and simply not show a badge, rather
    // than surfacing an error to the traveler.
    res.status(501).json({ error: "Server is missing FOURSQUARE_API_KEY." });
    return;
  }

  const { query, context = "" } = req.query;
  if (!query) {
    res.status(400).json({ error: "query is required." });
    return;
  }

  try {
    const params = new URLSearchParams({
      query,
      limit: "1",
      fields: "name,geocodes,hours,rating,closed_bucket",
    });
    if (context) params.set("near", context);

    const upstream = await fetch(`${SEARCH_URL}?${params.toString()}`, {
      headers: {
        Authorization: API_KEY,
        Accept: "application/json",
      },
    });

    if (!upstream.ok) {
      res.status(200).json({ found: false });
      return;
    }

    const data = await upstream.json();
    const place = data?.results?.[0];

    if (!place) {
      res.status(200).json({ found: false });
      return;
    }

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).json({
      found: true,
      name: place.name ?? query,
      status: mapClosureStatus(place),
      rating: place.rating ?? null,
      lat: place.geocodes?.main?.latitude ?? null,
      lng: place.geocodes?.main?.longitude ?? null,
    });
  } catch (err) {
    // Verification is a nice-to-have enhancement, not a critical path — fail
    // soft so a Foursquare hiccup never blocks the itinerary itself.
    res.status(200).json({ found: false });
  }
}

// Normalizes Foursquare's closure signals into the same three-state shape
// the frontend already expects (see ItineraryTimeline.jsx's STATUS_LABEL):
// OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY | null (unknown).
function mapClosureStatus(place) {
  if (place.closed_bucket === "VeryLikelyClosed") return "CLOSED_PERMANENTLY";
  if (place.closed_bucket === "LikelyClosed") return "CLOSED_TEMPORARILY";
  if (place.hours?.open_now === false) return "CLOSED_TEMPORARILY";
  if (place.hours?.open_now === true) return "OPERATIONAL";
  if (place.closed_bucket === "VeryLikelyOpen" || place.closed_bucket === "LikelyOpen") return "OPERATIONAL";
  return null; // no reliable signal either way — the UI simply shows no badge
}
