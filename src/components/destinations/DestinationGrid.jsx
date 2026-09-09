import { DestinationCard } from "./DestinationCard";
import { EmptyState } from "../common/StatusStates";
import "./DestinationGrid.css";

export function DestinationGrid({ destinations, onClearFilters, showDistance = false }) {
  if (destinations.length === 0) {
    return (
      <EmptyState
        title="No destinations match that search"
        message="Try a different city, country, or clear your filters to see everything."
        action={
          <button type="button" className="dest-grid__clear" onClick={onClearFilters}>
            Clear filters
          </button>
        }
      />
    );
  }

  return (
    <div className="dest-grid">
      {destinations.map((d, i) => (
        <DestinationCard
          key={d.id}
          destination={d}
          size={i === 0 ? "lg" : i % 5 === 3 ? "sm" : "md"}
          showDistance={showDistance}
        />
      ))}
    </div>
  );
}
