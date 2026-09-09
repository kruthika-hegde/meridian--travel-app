import { useEffect, useState } from "react";
import { fetchCurrentWeather } from "../api/weather";

/**
 * Fetches current weather whenever lat/lon change.
 * Returns { data, status } where status is idle | loading | success | error.
 */
export function useWeather(lat, lon) {
  const [state, setState] = useState({ status: "idle", data: null, error: null });

  useEffect(() => {
    if (lat == null || lon == null) {
      setState({ status: "idle", data: null, error: null });
      return;
    }
    let cancelled = false;
    setState({ status: "loading", data: null, error: null });

    fetchCurrentWeather(lat, lon)
      .then((data) => {
        if (!cancelled) setState({ status: "success", data, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", data: null, error });
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  return state;
}
