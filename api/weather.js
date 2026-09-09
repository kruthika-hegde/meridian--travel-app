import { isAllowed, clientIp } from "./_rateLimit.js";

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAllowed(`weather:${clientIp(req)}`, 30, 60_000)) {
    res.status(429).json({ error: "Too many requests. Please slow down." });
    return;
  }

  if (!API_KEY) {
    res.status(500).json({ error: "Server is missing OPENWEATHER_API_KEY." });
    return;
  }

  const { lat, lon, units = "metric" } = req.query;
  if (!lat || !lon) {
    res.status(400).json({ error: "lat and lon are required." });
    return;
  }

  try {
    const url = `${BASE_URL}/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(
      lon
    )}&units=${encodeURIComponent(units)}&appid=${API_KEY}`;
    const upstream = await fetch(url);
    const data = await upstream.json();

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: data?.message || "Weather request failed." });
      return;
    }

    // Cache at the edge briefly — weather doesn't change second to second.
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "Could not reach the weather provider." });
  }
}
