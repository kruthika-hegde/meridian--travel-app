const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "https://api.openweathermap.org/geo/1.0";

class WeatherApiError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "WeatherApiError";
    this.cause = cause;
  }
}

function assertKey() {
  if (!API_KEY) {
    throw new WeatherApiError(
      "Missing VITE_OPENWEATHER_API_KEY. Add it to your .env file."
    );
  }
}

/** Fetch current weather for a lat/lon pair. */
export async function fetchCurrentWeather(lat, lon, units = "metric") {
  assertKey();
  const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new WeatherApiError(
      res.status === 401
        ? "Weather key rejected (401) — it may still be activating (can take up to 2 hours after signup) or may be mistyped."
        : `Weather request failed (${res.status})`
    );
  }
  const data = await res.json();
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

/** Resolve a free-text place name to coordinates (used for manual location search). */
export async function searchLocations(query, limit = 5) {
  assertKey();
  if (!query || query.trim().length < 2) return [];
  const url = `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=${limit}&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new WeatherApiError(`Location search failed (${res.status})`);
  }
  const data = await res.json();
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
