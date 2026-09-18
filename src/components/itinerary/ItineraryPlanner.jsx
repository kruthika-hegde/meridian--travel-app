import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ItineraryPlanner.css";

const INTEREST_OPTIONS = ["Food", "History", "Nature", "Nightlife", "Art & museums", "Shopping"];
const PACE_OPTIONS = ["Relaxed", "Balanced", "Packed"];

export function ItineraryPlanner({ destination }) {
  const navigate = useNavigate();
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState([]);
  const [pace, setPace] = useState("Balanced");
  const [budget, setBudget] = useState("");
  const [dietary, setDietary] = useState("");
  const [travelStyle, setTravelStyle] = useState("");

  // Places the traveler wants included from the start — woven into
  // generation itself rather than bolted on after.
  const [mustVisitInput, setMustVisitInput] = useState("");
  const [mustVisit, setMustVisit] = useState([]);

  function toggleInterest(interest) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  function addMustVisitPlace() {
    const trimmed = mustVisitInput.trim();
    if (!trimmed) return;
    const alreadyAdded = mustVisit.some((p) => p.toLowerCase() === trimmed.toLowerCase());
    if (!alreadyAdded) {
      setMustVisit((prev) => [...prev, trimmed]);
    }
    setMustVisitInput("");
  }

  function removeMustVisitPlace(index) {
    setMustVisit((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Generation itself happens on the itinerary result page, triggered
    // automatically on load there — this form just collects inputs and hands
    // them off via router state.
    navigate(`/destinations/${destination.id}/itinerary`, {
      state: { destination, days, interests, pace, budget: budget.trim(), mustVisit, dietary: dietary.trim(), travelStyle: travelStyle.trim() },
    });
  }

  return (
    <form className="itinerary-planner" onSubmit={handleSubmit}>
      <div className="itinerary-planner__row">
        <div className="itinerary-planner__form">
          <div className="itinerary-planner__field">
            <label htmlFor="days">Trip length</label>
            <div className="itinerary-planner__stepper">
              <button
                type="button"
                onClick={() => setDays((d) => Math.max(1, d - 1))}
                aria-label="Fewer days"
              >
                −
              </button>
              <span id="days" aria-live="polite">
                {days} day{days > 1 ? "s" : ""}
              </span>
              <button type="button" onClick={() => setDays((d) => d + 1)} aria-label="More days">
                +
              </button>
            </div>
            {days > 14 && (
              <p className="itinerary-planner__hint">
                Longer trips take the AI more time to generate and may need a retry — 5–10 days tends to be fastest.
              </p>
            )}
          </div>

          <fieldset className="itinerary-planner__field">
            <legend>Interests</legend>
            <div className="itinerary-planner__chips">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={interests.includes(interest) ? "chip chip--active" : "chip"}
                  aria-pressed={interests.includes(interest)}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="itinerary-planner__field">
            <label htmlFor="budget">
              Budget per day <span className="itinerary-planner__optional">(optional)</span>
            </label>
            <input
              id="budget"
              type="number"
              inputMode="numeric"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 150"
            />
            <p className="itinerary-planner__hint">In your local currency — helps steer suggestions.</p>
          </div>

          <div className="itinerary-planner__field">
            <label htmlFor="pace">Pace</label>
            <select id="pace" value={pace} onChange={(e) => setPace(e.target.value)}>
              {PACE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="itinerary-planner__field">
            <label htmlFor="dietary">
              Dietary needs <span className="itinerary-planner__optional">(optional)</span>
            </label>
            <input
              id="dietary"
              type="text"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="e.g. vegetarian, gluten-free, halal"
            />
          </div>

          <div className="itinerary-planner__field">
            <label htmlFor="travel-style">
              Travel style / accessibility <span className="itinerary-planner__optional">(optional)</span>
            </label>
            <input
              id="travel-style"
              type="text"
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              placeholder="e.g. traveling with kids, wheelchair-accessible routes"
            />
          </div>
        </div>

        <div className="itinerary-planner__form">
          <div className="itinerary-planner__field">
            <label htmlFor="must-visit-input">
              Places you want included <span className="itinerary-planner__optional">(optional)</span>
            </label>
            <div className="itinerary-planner__must-visit-input">
              <input
                id="must-visit-input"
                type="text"
                value={mustVisitInput}
                onChange={(e) => setMustVisitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMustVisitPlace();
                  }
                }}
                placeholder="e.g. Amber Fort"
              />
              <button type="button" onClick={addMustVisitPlace} disabled={!mustVisitInput.trim()}>
                Add
              </button>
            </div>
            {mustVisit.length > 0 && (
              <div className="itinerary-planner__chips">
                {mustVisit.map((place, i) => (
                  <span key={place} className="chip chip--removable">
                    {place}
                    <button
                      type="button"
                      onClick={() => removeMustVisitPlace(i)}
                      aria-label={`Remove ${place}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="itinerary-planner__hint">
              Leave blank and the assistant will choose everything for you.
            </p>
          </div>
        </div>
      </div>

      <button type="submit" className="itinerary-planner__submit">
        Generate itinerary
      </button>
    </form>
  );
}