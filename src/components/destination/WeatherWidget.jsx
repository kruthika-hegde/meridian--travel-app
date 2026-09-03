import { useWeather } from "../../hooks/useWeather";
import { weatherIconUrl } from "../../api/weather";
import { LoadingState, ErrorState } from "../common/StatusStates";
import "./WeatherWidget.css";

export function WeatherWidget({ lat, lon, label }) {
  const { status, data, error } = useWeather(lat, lon);

  return (
    <div className="weather-widget">
      <p className="weather-widget__label">{label}</p>

      {status === "loading" && <LoadingState label="Checking the sky…" />}

      {status === "error" && (
        <ErrorState
          message={
            error?.message?.includes("VITE_OPENWEATHER_API_KEY")
              ? "Weather isn't configured yet — add an OpenWeather API key."
              : error?.message?.includes("401")
                ? error.message
                : "Couldn't reach the weather service."
          }
        />
      )}

      {status === "success" && data && (
        <div className="weather-widget__body">
          {weatherIconUrl(data.icon) && (
            <img
              src={weatherIconUrl(data.icon)}
              alt=""
              className="weather-widget__icon"
              width={56}
              height={56}
            />
          )}
          <div>
            <p className="weather-widget__temp">{Math.round(data.temp)}°C</p>
            <p className="weather-widget__condition">{data.description}</p>
          </div>
          <dl className="weather-widget__meta">
            <div>
              <dt>Feels like</dt>
              <dd>{Math.round(data.feelsLike)}°C</dd>
            </div>
            <div>
              <dt>Humidity</dt>
              <dd>{data.humidity}%</dd>
            </div>
            {data.windSpeed != null && (
              <div>
                <dt>Wind</dt>
                <dd>{Math.round(data.windSpeed)} m/s</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
