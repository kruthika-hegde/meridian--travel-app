import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { getDestinationById } from "../data/destinations";
import { generateItinerary, addPlaceToItinerary, GeminiApiError } from "../api/gemini";
import { ItineraryTimeline } from "../components/itinerary/ItineraryTimeline";
import { AddPlaceCard } from "../components/itinerary/AddPlaceCard";
import { LoadingState, ErrorState } from "../components/common/StatusStates";
import { ChatWidget } from "../components/chat/ChatWidget";
import "./ItineraryResult.css";

export function ItineraryResult() {
  const { id } = useParams();
  const routerLocation = useLocation();
  const destination = getDestinationById(id);
  // Trip details are handed off from the planner form via router state
  // rather than the URL, since they're a one-time input, not something
  // that needs to be bookmarkable or shared.
  const params = routerLocation.state;

  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [itinerary, setItinerary] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeDay, setActiveDay] = useState(0);

  const [addPlaceStatus, setAddPlaceStatus] = useState("idle");
  const [addPlaceNote, setAddPlaceNote] = useState(null);
  const [addPlaceError, setAddPlaceError] = useState(null);

  async function runGenerate() {
    if (!params) return;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const result = await generateItinerary(params);
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
          : isTimeout && params.days > 10
            ? "That trip length took too long for the AI to plan in one go. Try a shorter trip, or try again."
            : import.meta.env.DEV
              ? `Couldn't generate an itinerary. ${err.message}`
              : "Couldn't generate an itinerary just now."
      );
    }
  }

  // Auto-generate the moment this page loads with valid trip details.
  useEffect(() => {
    runGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  if (!destination) {
    return (
      <div className="container itinerary-result">
        <p>We couldn't find that destination.</p>
        <Link to="/explore" className="back-link">
          ← Back to Explore
        </Link>
      </div>
    );
  }

  // Router state is lost on a hard refresh or a direct link — send the
  // traveler back to the form rather than showing a broken/empty page.
  if (!params) {
    return (
      <div className="container itinerary-result">
        <Link to={`/destinations/${destination.id}`} className="back-link">
          ← Back to {destination.name}
        </Link>
        <h1 className="itinerary-result__heading">Your itinerary</h1>
        <p>We lost your trip details — head back and plan your trip again.</p>
      </div>
    );
  }

  return (
    <div className="container itinerary-result">
      <Link to={`/destinations/${destination.id}`} className="back-link">
        ← Back to {destination.name}
      </Link>
      <h1 className="itinerary-result__heading">
        Your {params.days}-day {destination.name} itinerary
      </h1>
      <p className="itinerary-result__sub">
        {params.interests.length ? params.interests.join(", ") : "General sightseeing"} · {params.pace} pace
      </p>

      {status === "loading" && <LoadingState label="Building your itinerary…" />}
      {status === "error" && <ErrorState message={errorMessage} onRetry={runGenerate} />}
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
      <ChatWidget destination={destination} />
    </div>
  );
}