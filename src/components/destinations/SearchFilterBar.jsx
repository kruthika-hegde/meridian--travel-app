import "./SearchFilterBar.css";

export function SearchFilterBar({
  query,
  onQueryChange,
  regions,
  activeRegion,
  onRegionChange,
  resultCount,
}) {
  return (
    <div className="search-filter-bar">
      <div className="search-filter-bar__search">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
          <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <label className="visually-hidden" htmlFor="destination-search">
          Search destinations
        </label>
        <input
          id="destination-search"
          type="text"
          placeholder="Search destinations or countries…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div className="search-filter-bar__chips" role="group" aria-label="Filter by region">
        <button
          type="button"
          className={activeRegion === null ? "chip chip--active" : "chip"}
          onClick={() => onRegionChange(null)}
          aria-pressed={activeRegion === null}
        >
          All
        </button>
        {regions.map((region) => (
          <button
            key={region}
            type="button"
            className={activeRegion === region ? "chip chip--active" : "chip"}
            onClick={() => onRegionChange(region)}
            aria-pressed={activeRegion === region}
          >
            {region}
          </button>
        ))}
      </div>

      <p className="search-filter-bar__count" aria-live="polite">
        {resultCount} destination{resultCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}
