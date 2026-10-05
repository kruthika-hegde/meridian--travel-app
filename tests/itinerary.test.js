import { describe, it, expect } from "vitest";
import { reorderActivity, removeActivity, calculateTotalCost, analyzeRoute } from "../src/utils/itinerary";

const makeItinerary = () => ({
  currencySymbol: "$",
  days: [
    { title: "Day 1", activities: [{ title: "A" }, { title: "B" }, { title: "C" }], estimatedCost: { total: 40 } },
    { title: "Day 2", activities: [{ title: "D" }], estimatedCost: { total: 25 } },
  ],
});
const titles = (day) => day.activities.map((a) => a.title);

describe("reorderActivity", () => {
  it("moves an activity later", () => {
    const next = reorderActivity(makeItinerary(), 0, 0, 1);
    expect(titles(next.days[0])).toEqual(["B", "A", "C"]);
  });

  it("moves an activity earlier", () => {
    const next = reorderActivity(makeItinerary(), 0, 2, -1);
    expect(titles(next.days[0])).toEqual(["A", "C", "B"]);
  });

  it("does nothing at the edges of the list", () => {
    const original = makeItinerary();
    expect(reorderActivity(original, 0, 0, -1)).toBe(original);
    expect(reorderActivity(original, 0, 2, 1)).toBe(original);
  });

  it("does not mutate the original or touch other days", () => {
    const original = makeItinerary();
    const next = reorderActivity(original, 0, 0, 1);
    expect(titles(original.days[0])).toEqual(["A", "B", "C"]);
    expect(next.days[1]).toBe(original.days[1]);
  });

  it("ignores an invalid day index", () => {
    const original = makeItinerary();
    expect(reorderActivity(original, 9, 0, 1)).toBe(original);
  });
});

describe("removeActivity", () => {
  it("removes only the chosen activity", () => {
    const next = removeActivity(makeItinerary(), 0, 1);
    expect(titles(next.days[0])).toEqual(["A", "C"]);
    expect(titles(next.days[1])).toEqual(["D"]);
  });

  it("does not mutate the original", () => {
    const original = makeItinerary();
    removeActivity(original, 0, 1);
    expect(titles(original.days[0])).toEqual(["A", "B", "C"]);
  });
});

describe("calculateTotalCost", () => {
  it("sums per-day totals", () => {
    expect(calculateTotalCost(makeItinerary().days)).toBe(65);
  });

  it("supports plain numeric day costs", () => {
    expect(calculateTotalCost([{ estimatedCost: 10 }, { estimatedCost: 5 }])).toBe(15);
  });

  it("ignores missing or non-numeric costs instead of producing NaN", () => {
    expect(calculateTotalCost([{ estimatedCost: { total: "lots" } }, {}, { estimatedCost: { total: 12 } }])).toBe(12);
  });

  it("returns 0 for anything that is not an array", () => {
    expect(calculateTotalCost(undefined)).toBe(0);
  });
});

describe("analyzeRoute", () => {
  it("returns null when there are fewer than two usable stops", () => {
    expect(analyzeRoute([])).toBeNull();
    expect(analyzeRoute([{ lat: 35, lng: 135 }])).toBeNull();
    expect(analyzeRoute([{ lat: 35, lng: 135 }, { lat: null, lng: null }])).toBeNull();
  });

  it("does not flag a compact route", () => {
    // Three stops roughly 1-2 km apart in central Kyoto.
    const result = analyzeRoute([
      { lat: 35.0116, lng: 135.7681 },
      { lat: 35.0210, lng: 135.7556 },
      { lat: 35.0300, lng: 135.7500 },
    ]);
    expect(result.legs).toHaveLength(2);
    expect(result.hasOutlierLeg).toBe(false);
  });

  it("can flag an outlier on a typical 3-stop day (only 2 legs) — regression for the average-includes-self bug", () => {
    const result = analyzeRoute([
      { lat: 35.0116, lng: 135.7681 },
      { lat: 35.0150, lng: 135.7700 },
      { lat: 34.6937, lng: 135.5023 },
    ]);
    expect(result.legs).toHaveLength(2);
    expect(result.hasOutlierLeg).toBe(true);
  });

  it("flags one leg that is far longer than the rest", () => {
    // Two close stops, then a jump of tens of kilometres.
    const result = analyzeRoute([
      { lat: 35.0116, lng: 135.7681 },
      { lat: 35.0150, lng: 135.7700 },
      { lat: 34.6937, lng: 135.5023 }, // Osaka
    ]);
    expect(result.hasOutlierLeg).toBe(true);
    expect(result.totalKm).toBeGreaterThan(30);
  });

  it("never flags short hops even when one is relatively longer", () => {
    // Legs under 5 km should not trigger a warning regardless of ratio.
    const result = analyzeRoute([
      { lat: 35.0, lng: 135.0 },
      { lat: 35.001, lng: 135.0 },
      { lat: 35.02, lng: 135.0 },
    ]);
    expect(result.hasOutlierLeg).toBe(false);
  });
});
