import { useLocationContext } from "../../context/LocationContext";
import { WeatherWidget } from "../destination/WeatherWidget";
import "./LocalWeatherStrip.css";

export function LocalWeatherStrip() {
  const { location } = useLocationContext();

  if (!location) {
    return (
      <div className="local-weather-strip local-weather-strip--empty">
        <p>
          Share or search your location up top and we'll show you the weather
          right where you are — and how far each destination is from you.
        </p>
      </div>
    );
  }

  return (
    <div className="local-weather-strip">
      <WeatherWidget lat={location.lat} lon={location.lon} label={`Right now in ${location.label}`} />
    </div>
  );
}
