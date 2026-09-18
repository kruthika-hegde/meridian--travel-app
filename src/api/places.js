const BASE_URL = "/api/verify-place";

// Cache across the whole session, not just one component — flipping back to
// a previously viewed day (or re-adding a place already checked once)
// shouldn't re-hit the API.
const cache = new Map();

/**
 * Checks a place against live Google Places data: whether it's found at all,
 * its current operating status, rating, and coordinates. Returns
 * { found: false } on any failure (missing key, network error, not found) —
 * callers should treat that as "can't verify," not as an error to surface.
 */
export async function verifyPlace(query, context = "") {
  const cacheKey = `${query}::${context}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const url = `${BASE_URL}?query=${encodeURIComponent(query)}&context=${encodeURIComponent(context)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const result = { found: false };
      cache.set(cacheKey, result);
      return result;
    }
    const data = await res.json();
    cache.set(cacheKey, data);
    return data;
  } catch {
    const result = { found: false };
    cache.set(cacheKey, result);
    return result;
  }
}
