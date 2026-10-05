// Single source of truth for the planner's selectable options. The form
// (ItineraryPlanner.jsx) renders these as chips, and the serverless API
// (api/_validate.js) uses the SAME lists to reject anything else — so the UI
// and the server-side validation can never drift apart.

export const INTEREST_OPTIONS = ["Food", "History", "Nature", "Nightlife", "Art & museums", "Shopping"];
export const PACE_OPTIONS = ["Relaxed", "Balanced", "Packed"];
export const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Dairy-free"];
export const TRAVEL_STYLE_OPTIONS = [
  "Kid-friendly",
  "Wheelchair-accessible",
  "Solo traveler",
  "Group of friends",
  "Senior-friendly",
  "Low-mobility pace",
];

export const LIMITS = {
  minDays: 1,
  maxDays: 14, // Gemini's single-shot response can't finish much beyond this within the 10s serverless limit
  maxBudget: 1_000_000,
  maxMustVisit: 10,
  maxPlaceNameLength: 80,
  maxQuestionLength: 500,
  maxHistoryMessages: 20,
  maxHistoryMessageLength: 1000,
  maxItineraryJsonChars: 40_000,
};
