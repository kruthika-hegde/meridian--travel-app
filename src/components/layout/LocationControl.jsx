import { useEffect, useRef, useState } from "react";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useLocationContext } from "../../context/LocationContext";
import { searchLocations } from "../../api/weather";
import "./LocationControl.css";

export function LocationControl() {
  const { location, setLocation } = useLocationContext();
  const geo = useGeolocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | loading | error
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // When geolocation resolves, adopt it as the active location.
  useEffect(() => {
    if (geo.status === "granted" && geo.coords) {
      setLocation({ label: "Your location", ...geo.coords, source: "geolocation" });
      setOpen(false);
    }
  }, [geo.status, geo.coords, setLocation]);

  // Debounced search-as-you-type against OpenWeather's geocoding endpoint.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearchStatus("loading");
      try {
        const matches = await searchLocations(query);
        setResults(matches);
        setSearchStatus("idle");
      } catch {
        setSearchStatus("error");
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function chooseResult(result) {
    setLocation({ label: result.label, lat: result.lat, lon: result.lon, source: "search" });
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="location-control" ref={containerRef}>
      <button
        type="button"
        className="location-control__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true">
          <path
            d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <circle cx="12" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span>{location ? location.label : "Set location"}</span>
      </button>

      {open && (
        <div className="location-control__panel" role="dialog" aria-label="Choose your location">
          <button
            type="button"
            className="location-control__geo-btn"
            onClick={geo.request}
            disabled={geo.status === "loading"}
          >
            {geo.status === "loading" ? "Locating…" : "Use my current location"}
          </button>
          {(geo.status === "denied" || geo.status === "error" || geo.status === "unsupported") && (
            <p className="location-control__hint">
              {geo.status === "unsupported"
                ? "Your browser doesn't support location access — search instead."
                : geo.errorMessage + " Search for a place instead."}
            </p>
          )}

          <div className="location-control__divider">or search</div>

          <label className="visually-hidden" htmlFor="location-search">
            Search for a city
          </label>
          <input
            id="location-search"
            type="text"
            placeholder="Search a city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />

          {searchStatus === "error" && (
            <p className="location-control__hint">Search failed. Check your connection.</p>
          )}

          {results.length > 0 && (
            <ul className="location-control__results">
              {results.map((r) => (
                <li key={`${r.lat}-${r.lon}`}>
                  <button type="button" onClick={() => chooseResult(r)}>
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
