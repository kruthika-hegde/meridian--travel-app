import { useCallback, useState } from "react";

/**
 * Wraps navigator.geolocation. Never auto-requests on mount — the browser
 * permission prompt should only ever appear in response to a user action.
 */
export function useGeolocation() {
  const [status, setStatus] = useState("idle"); // idle | loading | granted | denied | unsupported | error
  const [coords, setCoords] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    setErrorMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setStatus("granted");
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
        setErrorMessage(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied."
            : "Couldn't determine your location."
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  return { status, coords, errorMessage, request };
}
