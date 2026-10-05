// Pure helpers for editing and analysing an itinerary. They live outside the
// React components so the logic is easy to unit test (see tests/itinerary.test.js).

import { distanceKm } from "./geo";

/** Swap an activity with its neighbour. Returns a new itinerary; never mutates. */
export function reorderActivity(itinerary, dayIndex, fromIndex, direction) {
  const day = itinerary.days[dayIndex];
  const toIndex = fromIndex + direction;
  if (!day || fromIndex < 0 || fromIndex >= day.activities.length) return itinerary;
  if (toIndex < 0 || toIndex >= day.activities.length) return itinerary;

  const activities = [...day.activities];
  [activities[fromIndex], activities[toIndex]] = [activities[toIndex], activities[fromIndex]];
  return {
    ...itinerary,
    days: itinerary.days.map((d, i) => (i === dayIndex ? { ...d, activities } : d)),
  };
}

/** Remove one activity from a day. Returns a new itinerary; never mutates. */
export function removeActivity(itinerary, dayIndex, activityIndex) {
  return {
    ...itinerary,
    days: itinerary.days.map((d, i) =>
      i === dayIndex ? { ...d, activities: d.activities.filter((_, j) => j !== activityIndex) } : d
    ),
  };
}

/** Sum each day's estimated total. Accepts both { total } objects and plain numbers. */
export function calculateTotalCost(days) {
  if (!Array.isArray(days)) return 0;
  return days.reduce((sum, d) => {
    const dayTotal = typeof d?.estimatedCost === "object" ? d.estimatedCost?.total : d?.estimatedCost;
    return sum + (typeof dayTotal === "number" && Number.isFinite(dayTotal) ? dayTotal : 0);
  }, 0);
}

/**
 * Route sanity check for one day. Takes the verified stops (each with lat/lng)
 * in visiting order and returns the total distance plus whether any single leg
 * is a clear outlier: more than 2x the average of the OTHER legs AND longer
 * than 5 km. Returns null when there are fewer than two usable stops.
 *
 * Each leg is compared against the average of the *other* legs, not all legs.
 * Comparing against an average that includes the leg itself can never flag
 * anything on a 3-stop day (2 legs), because the longer leg can never exceed
 * twice the mean of itself and a shorter leg.
 */
export function analyzeRoute(stops) {
  const usable = (stops ?? []).filter((s) => s && s.lat != null && s.lng != null);
  if (usable.length < 2) return null;

  const legs = [];
  for (let i = 1; i < usable.length; i++) {
    legs.push(distanceKm(usable[i - 1].lat, usable[i - 1].lng, usable[i].lat, usable[i].lng));
  }
  const totalKm = legs.reduce((a, b) => a + b, 0);

  const hasOutlierLeg =
    legs.length >= 2 &&
    legs.some((leg, i) => {
      const averageOfOthers = (totalKm - leg) / (legs.length - 1);
      return leg > averageOfOthers * 2 && leg > 5;
    });

  return { totalKm, legs, hasOutlierLeg };
}
