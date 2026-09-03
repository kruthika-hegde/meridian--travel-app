import { Link } from "react-router-dom";
import { useImage } from "../../hooks/useImage";
import { Skeleton } from "../common/StatusStates";
import { DistanceBadge } from "../destination/DistanceBadge";
import "./DestinationCard.css";

export function DestinationCard({ destination, size = "md", showDistance = false }) {
  const { status, photo } = useImage(destination.imageQuery);

  return (
    <Link
      to={`/destinations/${destination.id}`}
      className={`dest-card dest-card--${size}`}
    >
      <div className="dest-card__media">
        {status === "loading" && <Skeleton height="100%" radius="0" />}
        {status === "success" && (
          <img src={photo.src} alt="" loading="lazy" />
        )}
        {status === "empty" && (
          <div className="dest-card__media-empty" aria-hidden="true" />
        )}
      </div>
      <div className="dest-card__overlay" />
      <div className="dest-card__body">
        <p className="dest-card__country">{destination.country}</p>
        <h3 className="dest-card__name">{destination.name}</h3>
        <p className="dest-card__tagline">{destination.tagline}</p>
        {showDistance && (
          <div className="dest-card__distance">
            <DistanceBadge lat={destination.lat} lon={destination.lon} />
          </div>
        )}
      </div>
    </Link>
  );
}
