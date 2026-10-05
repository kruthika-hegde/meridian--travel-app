# Meridian — Technical Design

## Goals
- Let a traveler explore destinations and get an AI-planned itinerary that is **checked against real data**, not just trusted.
- Keep secrets and costs under control: no API key in the browser, and no way to use the AI endpoint for anything except trip planning.
- Degrade gracefully: every network-dependent feature has loading, empty and error states, and optional features fail silently.

## System overview

```
Browser (React 19 + Vite SPA)
   │  calls only /api/*  (CSP: connect-src 'self')
   ▼
Vercel serverless functions (/api)          ┌─ OpenWeather  (weather, geocoding)
   _validate.js  → rejects bad input        ├─ Pexels       (photos)
   _prompts.js   → builds AI prompts        ├─ Gemini       (itinerary, chat)
   _rateLimit.js → per-IP limiting          └─ Foursquare   (place verification)
```

The browser never talks to a third-party API. Keys exist only as server-side environment variables (no `VITE_` prefix), so they are never bundled into client JavaScript.

## Request flow: generating an itinerary
1. The planner form collects trip length, interests, pace, budget, dietary needs, travel style and must-visit places, and navigates to the result page with that state.
2. The result page calls `POST /api/gemini` with `{ task: "itinerary", destinationId, days, ... }` — structured parameters only.
3. The server validates the request (`validateItineraryRequest`), looks the destination up from its own dataset by id, builds the system prompt (`buildItineraryRequest`), and calls Gemini with a time budget that fits inside the 10 s function limit.
4. The client parses the JSON and renders a day-by-day timeline.
5. For the visible day, the timeline calls `GET /api/verify-place` for each stop, the food pick and the hidden gem. Results are cached for the session.
6. Coordinates returned by verification feed `analyzeRoute`, which totals the distance and warns when one leg is much longer than the others.

## Security decisions
| Risk | Decision |
|---|---|
| API keys exposed to the browser | All calls proxied through `/api`; keys only in server env vars. |
| `/api/gemini` used as a free general-purpose AI proxy | The endpoint accepts a task name plus validated parameters. System prompts are built on the server; any caller-supplied prompt is rejected. |
| Prompt injection through free-text fields | Chip fields (interests, dietary, travel style, pace) are whitelisted against `planOptions.js`. Free text (place names, questions) is stripped of control characters and line breaks, length-capped, and the prompt marks traveler text as untrusted data. |
| Oversized or malformed payloads | Length caps on every field, a cap on chat history, and a size cap on the itinerary sent for add-a-place. |
| Key leakage through logs | The Gemini key is sent in the `x-goog-api-key` header, not the URL. |
| Parameter abuse on proxies | Coordinates range-checked, `units` whitelisted, search terms length-capped, page sizes clamped. |
| Clickjacking, MIME sniffing, injected scripts | CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` set in `vercel.json`. |
| Abuse and cost | Per-IP rate limiting on every function. |

## Known limitations
- The rate limiter is in-memory per serverless instance, so it is a deterrent, not a guarantee. A shared store (Vercel KV or Upstash Redis) is the production fix.
- AI output is validated for shape only. The itinerary's geographic grouping and cost figures are the model's estimates; only the distance warning and place status are computed from external data.
- Verification depends on Foursquare having the place under a matching name, so a real but obscure place may show no badge.
- Itineraries live in router state and are lost on a hard refresh.
- No end-to-end browser tests yet.

## Testing strategy
- **Pure logic** (distance, reorder, cost, route analysis, validators, prompt builders): fast unit tests with no mocking.
- **API handler**: called directly with fake request and response objects and a stubbed `fetch`, asserting on what would be sent to Gemini.
- **Components**: React Testing Library, querying by role and label so tests double as accessibility checks.
- **CI**: lint, test and build on every push and pull request.
