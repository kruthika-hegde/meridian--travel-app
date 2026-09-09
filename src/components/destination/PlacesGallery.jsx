import { useImage } from "../../hooks/useImage";
import { Skeleton } from "../common/StatusStates";
import "./PlacesGallery.css";

function PlaceRow({ place, index }) {
  const { status, photo } = useImage(place.imageQuery);

  return (
    <li className="place-row">
      <div className="place-row__media">
        {status === "loading" && <Skeleton height="100%" radius="0" />}
        {status === "success" && <img src={photo.srcSmall} alt="" loading="lazy" />}
        {status === "empty" && <div className="place-row__media-empty" aria-hidden="true" />}
      </div>
      <div className="place-row__body">
        <span className="place-row__index" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="place-row__name">{place.name}</h3>
        <p className="place-row__note">{place.note}</p>
      </div>
    </li>
  );
}

export function PlacesGallery({ places }) {
  return (
    <ul className="places-gallery">
      {places.map((place, i) => (
        <PlaceRow key={place.name} place={place} index={i} />
      ))}
    </ul>
  );
}
