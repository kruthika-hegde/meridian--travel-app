import { useEffect, useRef, useState } from "react";
import { verifyPlace } from "../../api/places";
import { distanceKm } from "../../utils/geo";
import "./ItineraryTimeline.css";

const TIME_ICON = {
  Morning: "🌅",
  Afternoon: "☀️",
  Evening: "🌆",
};

const STATUS_LABEL = {
  OPERATIONAL: { text: "Open", className: "verify-badge--ok" },
  CLOSED_TEMPORARILY: { text: "Temporarily closed", className: "verify-badge--warn" },
  CLOSED_PERMANENTLY: { text: "Permanently closed", className: "verify-badge--bad" },
};

function VerifyBadge({ result }) {
  if (!result || result.found === undefined) return null; // still loading
  if (!result.found) return null; // couldn't verify — say nothing rather than guess
  const label = STATUS_LABEL[result.status];
  if (!label) return null;
  return <span className={`verify-badge ${label.className}`}>✓ {label.text}</span>;
}

export function ItineraryTimeline({
  days,
  activeDay,
  onDayChange,
  destinationName,
  currencySymbol = "$",
  onReorderActivity,
}) {
  const day = days[activeDay];

  // Feature #1 (accuracy): verify the hidden gem, food rec, and each
  // activity against live Foursquare Places data. Feature #2 (geographic
  // logic): reuse those same results' coordinates to compute a real
  // distance-based route check, instead of just trusting the model's claim
  // that a day's stops are close together.
  const [verifications, setVerifications] = useState({}); // key -> { found, status, lat, lng, ... }
  const requestedRef = useRef(new Set());

  useEffect(() => {
    const context = `${destinationName}`;
    const toCheck = [
      day.hiddenGem && { key: `gem-${activeDay}`, query: day.hiddenGem.name },
      day.foodRecommendation && { key: `food-${activeDay}`, query: day.foodRecommendation.name },
      ...day.activities.map((a, i) => ({ key: `act-${activeDay}-${i}`, query: a.title })),
    ].filter(Boolean);

    toCheck.forEach(({ key, query }) => {
      if (requestedRef.current.has(key)) return;
      requestedRef.current.add(key);
      verifyPlace(query, context).then((result) => {
        setVerifications((prev) => ({ ...prev, [key]: result }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay]);

  // Route sanity check: sum the distance between consecutively-verified
  // activity coordinates, and flag if one leg is a clear outlier — a real,
  // computed signal instead of just hoping the AI's ordering makes sense.
  const activityCoords = day.activities
    .map((_, i) => verifications[`act-${activeDay}-${i}`])
    .filter((r) => r?.found && r.lat != null && r.lng != null);

  let totalDistance = null;
  let hasOutlierLeg = false;
  if (activityCoords.length >= 2) {
    const legs = [];
    for (let i = 1; i < activityCoords.length; i++) {
      legs.push(
        distanceKm(activityCoords[i - 1].lat, activityCoords[i - 1].lng, activityCoords[i].lat, activityCoords[i].lng)
      );
    }
    totalDistance = legs.reduce((a, b) => a + b, 0);
    const avg = totalDistance / legs.length;
    hasOutlierLeg = legs.some((leg) => leg > avg * 2 && leg > 5);
  }

  const cost = day.estimatedCost;
  const hasCostBreakdown = cost && typeof cost === "object";

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

      {hasCostBreakdown && (
        <div className="itinerary-timeline__cost-card">
          <p className="itinerary-timeline__cost-label">Estimated cost, day {activeDay + 1}</p>
          <p className="itinerary-timeline__cost-value">
            {currencySymbol}
            {cost.total?.toLocaleString()}
          </p>
          <div className="itinerary-timeline__cost-breakdown">
            <span>
              Activities {currencySymbol}
              {cost.activities?.toLocaleString()}
            </span>
            <span>
              Food {currencySymbol}
              {cost.food?.toLocaleString()}
            </span>
            <span>
              Transport {currencySymbol}
              {cost.transport?.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {day.summary && <p className="itinerary-timeline__day-summary">{day.summary}</p>}

      {totalDistance !== null && (
        <p className={hasOutlierLeg ? "itinerary-timeline__route itinerary-timeline__route--warn" : "itinerary-timeline__route"}>
          📍 ~{totalDistance.toFixed(1)}km across today's stops
          {hasOutlierLeg && " — one leg is notably longer than the rest; consider reordering."}
        </p>
      )}

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
            <div className="itinerary-timeline__section-row">
              <div className="itinerary-timeline__section-body">
                <p className="itinerary-timeline__section-label">
                  <span aria-hidden="true">{TIME_ICON[activity.time] || "•"}</span> {activity.time}
                  {activity.isNew && <span className="itinerary-timeline__new-badge">New</span>}
                </p>
                <p className="itinerary-timeline__section-title">
                  {activity.title} <VerifyBadge result={verifications[`act-${activeDay}-${j}`]} />
                </p>
                <p className="itinerary-timeline__section-desc">{activity.description}</p>
              </div>
              {onReorderActivity && (
                <div className="itinerary-timeline__reorder">
                  <button
                    type="button"
                    onClick={() => onReorderActivity(activeDay, j, -1)}
                    disabled={j === 0}
                    aria-label={`Move ${activity.title} earlier`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onReorderActivity(activeDay, j, 1)}
                    disabled={j === day.activities.length - 1}
                    aria-label={`Move ${activity.title} later`}
                  >
                    ↓
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {day.foodRecommendation && (
          <div className="itinerary-timeline__section itinerary-timeline__section--food">
            <p className="itinerary-timeline__section-label">
              <span aria-hidden="true">🍴</span> Food recommendations
            </p>
            <p className="itinerary-timeline__section-title">
              {day.foodRecommendation.name} <VerifyBadge result={verifications[`food-${activeDay}`]} />
            </p>
            <p className="itinerary-timeline__section-desc">{day.foodRecommendation.description}</p>
          </div>
        )}

        {day.hiddenGem && (
          <div className="itinerary-timeline__section itinerary-timeline__section--gem">
            <p className="itinerary-timeline__section-label">
              <span aria-hidden="true">✦</span> Hidden gem
            </p>
            <p className="itinerary-timeline__section-title">
              {day.hiddenGem.name} <VerifyBadge result={verifications[`gem-${activeDay}`]} />
            </p>
            <p className="itinerary-timeline__section-desc">{day.hiddenGem.description}</p>
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
