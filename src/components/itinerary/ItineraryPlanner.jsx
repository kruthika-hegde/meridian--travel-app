import { useState } from "react";
import { generateItinerary, addPlaceToItinerary, GeminiApiError } from "../../api/gemini";
import { ItineraryTimeline } from "./ItineraryTimeline";
import { AddPlaceCard } from "./AddPlaceCard";
import { LoadingState, ErrorState } from "../common/StatusStates";
import "./ItineraryPlanner.css";

const INTEREST_OPTIONS = ["Food", "History", "Nature", "Nightlife", "Art & museums", "Shopping"];
const PACE_OPTIONS = ["Relaxed", "Balanced", "Packed"];

export function ItineraryPlanner({ destination }) {
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState([]);
  const [pace, setPace] = useState("Balanced");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [itinerary, setItinerary] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeDay, setActiveDay] = useState(0);

  // Places the traveler wants included from the start — woven into
  // generation itself rather than bolted on after.
  const [mustVisitInput, setMustVisitInput] = useState("");
  const [mustVisit, setMustVisit] = useState([]);

  // Places added after the itinerary already exists.
  const [addPlaceStatus, setAddPlaceStatus] = useState("idle"); // idle | loading | success | error
  const [addPlaceNote, setAddPlaceNote] = useState(null);
  const [addPlaceError, setAddPlaceError] = useState(null);

  function toggleInterest(interest) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  function handleDaysChange(rawValue) {
    const parsed = parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) {
      setDays(1);
      return;
    }
    setDays(Math.max(1, parsed));
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

  async function handleGenerate(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    setAddPlaceStatus("idle");
    setAddPlaceNote(null);
    try {
      const result = await generateItinerary({ destination, days, interests, pace, mustVisit });
      setItinerary(result);
      setActiveDay(0);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      console.error("Itinerary generation failed:", err);
      const isMissingKey = err instanceof GeminiApiError && err.message.includes("GEMINI_API_KEY");
      const isTimeout = err instanceof GeminiApiError && err.message.includes("took too long");
      setErrorMessage(
        isMissingKey
          ? "The planner isn't configured yet — add a Gemini API key to enable it."
          : isTimeout && days > 10
            ? "That trip length took too long for the AI to plan in one go. Try a shorter trip, or try again."
            : import.meta.env.DEV
              ? `Couldn't generate an itinerary. ${err.message}`
              : "Couldn't generate an itinerary just now."
      );
    }
  }

  async function handleAddPlace(placeName) {
    setAddPlaceStatus("loading");
    setAddPlaceError(null);
    try {
      const { addedToDayIndex, note, day } = await addPlaceToItinerary({
        destination,
        days: itinerary,
        placeName,
      });
      setItinerary((prev) => prev.map((d, i) => (i === addedToDayIndex ? day : d)));
      setActiveDay(addedToDayIndex);
      setAddPlaceNote(note);
      setAddPlaceStatus("success");
    } catch (err) {
      console.error("Add place failed:", err);
      setAddPlaceStatus("error");
      setAddPlaceError(
        import.meta.env.DEV
          ? `Couldn't add that place. ${err.message}`
          : "Couldn't add that place just now — try again."
      );
    }
  }

  return (
    <div className="itinerary-planner">
      <form className="itinerary-planner__form" onSubmit={handleGenerate}>
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
            <input
              id="days"
              type="number"
              inputMode="numeric"
              min="1"
              value={days}
              onChange={(e) => handleDaysChange(e.target.value)}
              className="itinerary-planner__stepper-input"
              aria-label="Number of days"
            />
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
          <label htmlFor="must-visit-input">Places you want included (optional)</label>
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

        <button type="submit" className="itinerary-planner__submit" disabled={status === "loading"}>
          {status === "loading" ? "Planning…" : "Generate itinerary"}
        </button>
      </form>

      <div className="itinerary-planner__result">
        {status === "loading" && <LoadingState label="Building your itinerary…" />}
        {status === "error" && (
          <ErrorState message={errorMessage} onRetry={() => handleGenerate({ preventDefault() { } })} />
        )}
        {status === "success" && itinerary && (
          <>
            <ItineraryTimeline days={itinerary} activeDay={activeDay} onDayChange={setActiveDay} />
            <AddPlaceCard
              onSubmit={handleAddPlace}
              status={addPlaceStatus}
              note={addPlaceNote}
              errorMessage={addPlaceError}
            />
          </>
        )}
      </div>
    </div>
  );
}