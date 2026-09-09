const BASE_URL = "/api/images";

class ImageApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "ImageApiError";
  }
}

// Small in-memory cache so re-rendering a page doesn't re-fetch the same query.
const cache = new Map();

/**
 * Fetch photos for a search query, via our serverless proxy (which holds the
 * real Pexels key). Returns [] on failure so callers can render an empty
 * state instead of crashing — image fetch failure should never block the page.
 */
export async function searchPhotos(query, perPage = 1) {
  const cacheKey = `${query}::${perPage}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const url = `${BASE_URL}?query=${encodeURIComponent(query)}&perPage=${perPage}`;
    const res = await fetch(url);
    if (!res.ok) throw new ImageApiError(`Image request failed (${res.status})`);
    const data = await res.json();
    const photos = (data.photos ?? []).map((p) => ({
      id: p.id,
      src: p.src.large,
      srcSmall: p.src.medium,
      alt: p.alt || query,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
    }));
    cache.set(cacheKey, photos);
    return photos;
  } catch (err) {
    return [];
  }
}

export async function searchFirstPhoto(query) {
  const [photo] = await searchPhotos(query, 1);
  return photo ?? null;
}

export { ImageApiError };
