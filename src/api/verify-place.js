import { isAllowed, clientIp } from "./_rateLimit.js";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

// Feature #1 (accuracy): rather than trusting the LLM's claim that a place
// exists and is open, this pings Google's live Places data. Feature #2
// (geographic logic) reuses the SAME response — Places results include
// coordinates, which the client uses to compute real distances between a
// day's stops instead of relying on the model's word that a route "makes
// sense." One integration, two problems solved.
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
        res.status(501).json({ error: "Server is missing GOOGLE_PLACES_API_KEY." });
        return;
    }

    const { query, context = "" } = req.query;
    if (!query) {
        res.status(400).json({ error: "query is required." });
        return;
    }

    try {
        const upstream = await fetch(SEARCH_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": API_KEY,
                "X-Goog-FieldMask":
                    "places.displayName,places.businessStatus,places.rating,places.location,places.formattedAddress",
            },
            body: JSON.stringify({
                textQuery: context ? `${query}, ${context}` : query,
                maxResultCount: 1,
            }),
        });

        if (!upstream.ok) {
            res.status(200).json({ found: false });
            return;
        }

        const data = await upstream.json();
        const place = data?.places?.[0];

        if (!place) {
            res.status(200).json({ found: false });
            return;
        }

        res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
        res.status(200).json({
            found: true,
            name: place.displayName?.text ?? query,
            status: place.businessStatus ?? null, // OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY
            rating: place.rating ?? null,
            lat: place.location?.latitude ?? null,
            lng: place.location?.longitude ?? null,
        });
    } catch (err) {
        // Verification is a nice-to-have enhancement, not a critical path — fail
        // soft so a Places API hiccup never blocks the itinerary itself.
        res.status(200).json({ found: false });
    }
}