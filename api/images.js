import { isAllowed, clientIp } from "./_rateLimit.js";

const API_KEY = process.env.PEXELS_API_KEY;
const BASE_URL = "https://api.pexels.com/v1";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAllowed(`images:${clientIp(req)}`, 60, 60_000)) {
    res.status(429).json({ error: "Too many requests. Please slow down." });
    return;
  }

  if (!API_KEY) {
    res.status(500).json({ error: "Server is missing PEXELS_API_KEY." });
    return;
  }

  const { query, perPage = "1" } = req.query;
  if (!query) {
    res.status(400).json({ error: "query is required." });
    return;
  }

  try {
    const url = `${BASE_URL}/search?query=${encodeURIComponent(
      query
    )}&per_page=${encodeURIComponent(perPage)}&orientation=landscape`;
    const upstream = await fetch(url, { headers: { Authorization: API_KEY } });
    const data = await upstream.json();

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Image request failed." });
      return;
    }

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "Could not reach the image provider." });
  }
}
