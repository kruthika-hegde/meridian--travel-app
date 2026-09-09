import { useLocationContext } from "../../context/LocationContext";
import { distanceKm, formatDistance } from "../../utils/geo";
import "./DistanceBadge.css";

/** Renders nothing if the visitor hasn't shared/set a location — this is a bonus, not a blocker. */
export function DistanceBadge({ lat, lon }) {
  const { location } = useLocationContext();
  if (!location) return null;

  const km = distanceKm(location.lat, location.lon, lat, lon);

  return (
    <span className="distance-badge">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
        <path
          d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="12" cy="9.5" r="2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      {formatDistance(km)} from {location.source === "geolocation" ? "you" : location.label}
    </span>
  );
}
