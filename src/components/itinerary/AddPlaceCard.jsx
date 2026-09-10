import { useState } from "react";
import "./AddPlaceCard.css";

export function AddPlaceCard({ onSubmit, status, note, errorMessage }) {
    const [value, setValue] = useState("");

    function handleSubmit(e) {
        e.preventDefault();
        const trimmed = value.trim();
        if (!trimmed || status === "loading") return;
        onSubmit(trimmed);
        setValue("");
    }

    return (
        <div className="add-place-card">
            <h4 className="add-place-card__title">Have a specific place in mind?</h4>
            <p className="add-place-card__hint">
                Add anywhere you want to visit — it'll be slotted into whichever day is geographically
                closest, so you're not zig-zagging across the city.
            </p>

            <form className="add-place-card__form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. Panna Meena ka Kund"
                    aria-label="Place to add to your itinerary"
                    disabled={status === "loading"}
                />
                <button type="submit" disabled={status === "loading" || !value.trim()}>
                    {status === "loading" ? "Adding…" : "Add to itinerary"}
                </button>
            </form>

            {status === "success" && note && (
                <p className="add-place-card__note" role="status">
                    {note}
                </p>
            )}
            {status === "error" && (
                <p className="add-place-card__error" role="alert">
                    {errorMessage}
                </p>
            )}
        </div>
    );
}