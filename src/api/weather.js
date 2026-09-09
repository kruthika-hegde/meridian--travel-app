const BASE_URL = "/api/weather";
const GEO_URL = "/api/geocode";

class WeatherApiError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "WeatherApiError";
    this.cause = cause;
  }
}

/** Fetch current weather for a lat/lon pair, via our serverless proxy. */
export async function fetchCurrentWeather(lat, lon, units = "metric") {
  const url = `${BASE_URL}?lat=${lat}&lon=${lon}&units=${units}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new WeatherApiError(data?.error || `Weather request failed (${res.status})`);
  }

  return {
    tempC: units === "metric" ? data.main.temp : ((data.main.temp - 32) * 5) / 9,
    temp: data.main.temp,
    feelsLike: data.main.feels_like,
    condition: data.weather?.[0]?.main ?? "Unknown",
    description: data.weather?.[0]?.description ?? "",
    icon: data.weather?.[0]?.icon ?? null,
    humidity: data.main.humidity,
    windSpeed: data.wind?.speed ?? null,
    units,
    fetchedAt: Date.now(),
  };
}

/** Resolve a free-text place name to coordinates, via our serverless proxy. */
export async function searchLocations(query, limit = 5) {
  if (!query || query.trim().length < 2) return [];
  const url = `${GEO_URL}?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => []);

  if (!res.ok) {
    throw new WeatherApiError(data?.error || `Location search failed (${res.status})`);
  }

  return data.map((loc) => ({
    label: [loc.name, loc.state, loc.country].filter(Boolean).join(", "),
    lat: loc.lat,
    lon: loc.lon,
  }));
}

export function weatherIconUrl(icon) {
  return icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : null;
}

export { WeatherApiError };
