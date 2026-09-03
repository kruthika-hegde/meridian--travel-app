import { useImage } from "../../hooks/useImage";
import { Skeleton } from "../common/StatusStates";
import { DistanceBadge } from "./DistanceBadge";
import "./DestinationHero.css";

export function DestinationHero({ destination }) {
  const { status, photo } = useImage(destination.imageQuery);

  return (
    <div className="dest-hero">
      <div className="dest-hero__media">
        {status === "loading" && <Skeleton height="100%" radius="0" />}
        {status === "success" && <img src={photo.src} alt={photo.alt} />}
        {status === "empty" && <div className="dest-hero__media-empty" />}
        <div className="dest-hero__scrim" />
      </div>
      <div className="container dest-hero__content">
        <p className="dest-hero__country">{destination.country}</p>
        <h1 className="dest-hero__name">{destination.name}</h1>
        <p className="dest-hero__tagline">{destination.tagline}</p>
        <div className="dest-hero__badges">
          <DistanceBadge lat={destination.lat} lon={destination.lon} />
        </div>
      </div>
    </div>
  );
}
