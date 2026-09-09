// Minimal in-memory rate limiter.
//
// IMPORTANT: Vercel serverless functions are stateless between cold starts and
// run across multiple isolated instances, so this only limits requests that
// happen to land on the same warm instance — it is a basic abuse deterrent,
// not a strict guarantee. For real production traffic, replace this with a
// shared store such as Vercel KV, Upstash Redis, or a similar rate-limit
// service so limits are enforced consistently across all instances.
const buckets = new Map();

/**
 * @param {string} key - usually the caller's IP address
 * @param {number} limit - max requests allowed within the window
 * @param {number} windowMs - window size in milliseconds
 * @returns {boolean} true if the request is allowed, false if rate-limited
 */
export function isAllowed(key, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const entry = buckets.get(key) ?? [];
  const recent = entry.filter((ts) => now - ts < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

export function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}
