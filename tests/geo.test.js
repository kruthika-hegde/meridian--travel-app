import { describe, it, expect } from "vitest";
import { distanceKm, formatDistance } from "../src/utils/geo";

describe("distanceKm (haversine)", () => {
  it("returns 0 for identical points", () => {
    expect(distanceKm(35.0116, 135.7681, 35.0116, 135.7681)).toBeCloseTo(0, 5);
  });

  it("matches a known real-world distance (London to Paris ≈ 344 km)", () => {
    const km = distanceKm(51.5074, -0.1278, 48.8566, 2.3522);
    expect(km).toBeGreaterThan(340);
    expect(km).toBeLessThan(348);
  });

  it("is symmetric", () => {
    const ab = distanceKm(35.0116, 135.7681, 31.6295, -7.9811);
    const ba = distanceKm(31.6295, -7.9811, 35.0116, 135.7681);
    expect(ab).toBeCloseTo(ba, 6);
  });
});

describe("formatDistance", () => {
  it("treats under 1 km as 'right where you are'", () => {
    expect(formatDistance(0.4)).toBe("right where you are");
  });

  it("rounds to the nearest 5 km under 100 km", () => {
    expect(formatDistance(42)).toBe("40 km away");
  });

  it("rounds to the nearest 50 km at 100 km and above", () => {
    expect(formatDistance(1234)).toBe("1,250 km away");
  });
});
