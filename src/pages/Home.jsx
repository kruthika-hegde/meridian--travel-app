import { useMemo, useRef, useState } from "react";
import { Hero } from "../components/hero/Hero";
import { SearchFilterBar } from "../components/destinations/SearchFilterBar";
import { DestinationGrid } from "../components/destinations/DestinationGrid";
import { LocalWeatherStrip } from "../components/destinations/LocalWeatherStrip";
import { destinations, allRegions } from "../data/destinations";
import { useLocationContext } from "../context/LocationContext";
import { distanceKm } from "../utils/geo";

export function Home() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const gridRef = useRef(null);
  const { location } = useLocationContext();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = destinations.filter((d) => {
      const matchesQuery =
        !q || d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q);
      const matchesRegion = !region || d.region === region;
      return matchesQuery && matchesRegion;
    });

    if (sortByDistance && location) {
      return [...matches].sort(
        (a, b) =>
          distanceKm(location.lat, location.lon, a.lat, a.lon) -
          distanceKm(location.lat, location.lon, b.lat, b.lon)
      );
    }
    return matches;
  }, [query, region, sortByDistance, location]);

  function clearFilters() {
    setQuery("");
    setRegion(null);
  }

  function scrollToGrid() {
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <Hero onExplore={scrollToGrid} />
      <section className="container" ref={gridRef} id="explore" style={{ scrollMarginTop: "80px" }}>
        <h2 style={{ fontSize: "var(--size-2xl)", marginBottom: "var(--space-1)" }}>
          Where to next
        </h2>
        <p style={{ color: "color-mix(in srgb, var(--color-charcoal) 65%, transparent)", marginBottom: "var(--space-4)" }}>
          Eight places worth the trip. Open one for weather, the sights, and a plan.
        </p>

        <LocalWeatherStrip />

        <SearchFilterBar
          query={query}
          onQueryChange={setQuery}
          regions={allRegions}
          activeRegion={region}
          onRegionChange={setRegion}
          resultCount={filtered.length}
        />

        {location && (
          <label className="home__sort-toggle">
            <input
              type="checkbox"
              checked={sortByDistance}
              onChange={(e) => setSortByDistance(e.target.checked)}
            />
            Sort by distance from you
          </label>
        )}

        <DestinationGrid destinations={filtered} onClearFilters={clearFilters} showDistance={Boolean(location)} />
      </section>
    </>
  );
}
