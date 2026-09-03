import { Link, useParams } from "react-router-dom";
import { getDestinationById } from "../data/destinations";
import { DestinationHero } from "../components/destination/DestinationHero";
import { WeatherWidget } from "../components/destination/WeatherWidget";
import { PlacesGallery } from "../components/destination/PlacesGallery";
import { ItineraryPlanner } from "../components/itinerary/ItineraryPlanner";
import { ChatWidget } from "../components/chat/ChatWidget";
import { useLocationContext } from "../context/LocationContext";
import { NotFound } from "./NotFound";
import "./DestinationDetail.css";

export function DestinationDetail() {
  const { id } = useParams();
  const destination = getDestinationById(id);
  const { location } = useLocationContext();

  if (!destination) return <NotFound />;

  return (
    <>
      <DestinationHero destination={destination} />

      <div className="container" style={{ paddingBlock: "var(--space-6)" }}>
        <Link to="/" className="back-link">
          ← All destinations
        </Link>

        <div className="dest-detail__intro">
          <p className="dest-detail__description">{destination.description}</p>
          <div className="dest-detail__weather-stack">
            <WeatherWidget
              lat={destination.lat}
              lon={destination.lon}
              label={`Right now in ${destination.name}`}
            />
            {location && (
              <WeatherWidget
                lat={location.lat}
                lon={location.lon}
                label={`Right now where you are`}
              />
            )}
          </div>
        </div>

        <section style={{ marginTop: "var(--space-7)" }}>
          <h2 className="dest-detail__heading">Worth your time</h2>
          <PlacesGallery places={destination.places} />
        </section>

        <section style={{ marginTop: "var(--space-7)" }} id="plan">
          <h2 className="dest-detail__heading">Plan your trip</h2>
          <p className="dest-detail__section-sub">
            Tell the assistant how long you have and what you're into — it'll lay out a day-by-day plan.
          </p>
          <ItineraryPlanner destination={destination} />
        </section>
      </div>

      <ChatWidget destination={destination} />
    </>
  );
}
