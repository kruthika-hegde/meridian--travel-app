import { useState } from "react";
import "./ItineraryTimeline.css";

export function ItineraryTimeline({ days }) {
  const [activeDay, setActiveDay] = useState(0);

  return (
    <div className="itinerary-timeline">
      <div className="itinerary-timeline__tabs" role="tablist" aria-label="Itinerary days">
        {days.map((day, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={activeDay === i}
            className={activeDay === i ? "itinerary-timeline__tab itinerary-timeline__tab--active" : "itinerary-timeline__tab"}
            onClick={() => setActiveDay(i)}
          >
            Day {i + 1}
          </button>
        ))}
      </div>

      {days.map((day, i) => (
        <div
          key={i}
          role="tabpanel"
          hidden={activeDay !== i}
          className="itinerary-timeline__panel"
        >
          <h3 className="itinerary-timeline__day-title">{day.title}</h3>
          {day.summary && <p className="itinerary-timeline__day-summary">{day.summary}</p>}

          <ol className="itinerary-timeline__activities">
            {day.activities.map((activity, j) => (
              <li key={j} className="itinerary-timeline__activity">
                <span className="itinerary-timeline__time">{activity.time}</span>
                <div>
                  <p className="itinerary-timeline__activity-title">{activity.title}</p>
                  <p className="itinerary-timeline__activity-desc">{activity.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
