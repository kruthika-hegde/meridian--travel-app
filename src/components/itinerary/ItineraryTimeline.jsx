import "./ItineraryTimeline.css";

const TIME_ICON = {
  Morning: "🌅",
  Afternoon: "☀️",
  Evening: "🌆",
};

export function ItineraryTimeline({ days, activeDay, onDayChange, destinationName, currencySymbol = "$" }) {
  const day = days[activeDay];

  return (
    <div className="itinerary-timeline">
      <div className="itinerary-timeline__tabs" role="tablist" aria-label="Itinerary days">
        {days.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={activeDay === i}
            className={activeDay === i ? "itinerary-timeline__tab itinerary-timeline__tab--active" : "itinerary-timeline__tab"}
            onClick={() => onDayChange(i)}
          >
            Day {i + 1}
          </button>
        ))}
      </div>

      <div className="itinerary-timeline__banner">
        <span className="itinerary-timeline__badge">{activeDay + 1}</span>
        <p className="itinerary-timeline__eyebrow">
          {destinationName} · Day {activeDay + 1}
        </p>
        <h3 className="itinerary-timeline__day-title">{day.title}</h3>
      </div>

      {typeof day.estimatedCost === "number" && (
        <div className="itinerary-timeline__cost-card">
          <p className="itinerary-timeline__cost-label">Estimated cost, day {activeDay + 1}</p>
          <p className="itinerary-timeline__cost-value">
            {currencySymbol}
            {day.estimatedCost.toLocaleString()}
          </p>
        </div>
      )}

      {day.summary && <p className="itinerary-timeline__day-summary">{day.summary}</p>}

      <div className="itinerary-timeline__sections">
        {day.activities.map((activity, j) => (
          <div
            key={j}
            className={
              activity.isNew
                ? "itinerary-timeline__section itinerary-timeline__section--new"
                : "itinerary-timeline__section"
            }
          >
            <p className="itinerary-timeline__section-label">
              <span aria-hidden="true">{TIME_ICON[activity.time] || "•"}</span> {activity.time}
              {activity.isNew && <span className="itinerary-timeline__new-badge">New</span>}
            </p>
            <p className="itinerary-timeline__section-title">{activity.title}</p>
            <p className="itinerary-timeline__section-desc">{activity.description}</p>
          </div>
        ))}

        {day.foodRecommendation && (
          <div className="itinerary-timeline__section itinerary-timeline__section--food">
            <p className="itinerary-timeline__section-label">
              <span aria-hidden="true">🍴</span> Food recommendations
            </p>
            <p className="itinerary-timeline__section-desc">{day.foodRecommendation}</p>
          </div>
        )}

        {day.hiddenGem && (
          <div className="itinerary-timeline__section itinerary-timeline__section--gem">
            <p className="itinerary-timeline__section-label">
              <span aria-hidden="true">✦</span> Hidden gem
            </p>
            <p className="itinerary-timeline__section-desc">{day.hiddenGem}</p>
          </div>
        )}

        {day.gettingAround && (
          <div className="itinerary-timeline__section itinerary-timeline__section--transport">
            <p className="itinerary-timeline__section-label">
              <span aria-hidden="true">🚗</span> Getting around
            </p>
            <p className="itinerary-timeline__section-desc">{day.gettingAround}</p>
          </div>
        )}
      </div>

      <div className="itinerary-timeline__pagination">
        <button
          type="button"
          disabled={activeDay === 0}
          onClick={() => onDayChange(activeDay - 1)}
        >
          ‹ Previous day
        </button>
        <button
          type="button"
          disabled={activeDay === days.length - 1}
          onClick={() => onDayChange(activeDay + 1)}
        >
          Next day ›
        </button>
      </div>
    </div>
  );
}
