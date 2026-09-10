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

  const [addPlaceStatus, setAddPlaceStatus] = useState("idle"); // idle | loading | success | error
  const [addPlaceNote, setAddPlaceNote] = useState(null);
  const [addPlaceError, setAddPlaceError] = useState(null);

  function toggleInterest(interest) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    setAddPlaceStatus("idle");
    setAddPlaceNote(null);
    try {
      const result = await generateItinerary({ destination, days, interests, pace });
      setItinerary(result);
      setActiveDay(0);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      console.error("Itinerary generation failed:", err);
      const isMissingKey = err instanceof GeminiApiError && err.message.includes("GEMINI_API_KEY");
      setErrorMessage(
        isMissingKey
          ? "The planner isn't configured yet — add a Gemini API key to enable it."
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
            <span id="days" aria-live="polite">
              {days} day{days > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={() => setDays((d) => Math.min(10, d + 1))}
              aria-label="More days"
            >
              +
            </button>
          </div>
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