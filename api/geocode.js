import { isAllowed, clientIp } from "./_rateLimit.js";

const API_KEY = process.env.OPENWEATHER_API_KEY;
const GEO_URL = "https://api.openweathermap.org/geo/1.0";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAllowed(`geocode:${clientIp(req)}`, 30, 60_000)) {
    res.status(429).json({ error: "Too many requests. Please slow down." });
    return;
  }

  if (!API_KEY) {
    res.status(500).json({ error: "Server is missing OPENWEATHER_API_KEY." });
    return;
  }

  const { q, limit = "5" } = req.query;
  if (!q || q.trim().length < 2) {
    res.status(200).json([]);
    return;
  }

  try {
    const url = `${GEO_URL}/direct?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(
      limit
    )}&appid=${API_KEY}`;
    const upstream = await fetch(url);
    const data = await upstream.json();

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Location search failed." });
      return;
    }

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "Could not reach the location provider." });
  }
}
