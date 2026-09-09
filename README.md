# Meridian — Travel Exploration App

A travel web app for exploring destinations, checking real-time weather, browsing
famous places, and planning a trip with an AI assistant. Built for the Designesthetics
front-end developer assignment.

**Live app:** _add your deployed URL here_
**Repository:** _add your GitHub repo URL here_

## Screenshots

_Add 3–4 screenshots here after deploying — the landing hero, the destination
explorer, a destination detail page, and the itinerary planner in use. Drop the
images in a `/screenshots` folder and reference them, e.g.:_

```md
![Landing page](./screenshots/landing.png)
![Destination detail](./screenshots/destination.png)
![Itinerary planner](./screenshots/itinerary.png)
```

## Features

- **Landing hero** — full-bleed looping background video with an orchestrated
  entrance animation.
- **Destination explorer** — search by name/country, filter by region, editorial
  mosaic grid. Each destination opens its own page.
- **Famous places** — presented as an illustrated list with a photo and a note
  per place, not a bare list of names.
- **Location awareness** — a header control lets a visitor share their browser
  location or search for a place manually; the app works either way, and
  denied/unsupported permission states are handled explicitly. Once set, the
  location actually does things: the homepage shows live weather where the
  visitor is, every destination gets a "X km away" badge, and there's a
  "sort by distance" toggle on the explorer. On a destination page, the
  visitor's own weather is shown alongside the destination's for a quick
  comparison.
- **Real-time weather** — live conditions for each destination via OpenWeather,
  with loading, error, and "not configured" states.
- **Images fetched at runtime** — every photo (destination cards, place gallery,
  destination hero) is fetched from Pexels by search query; no image URLs are
  hardcoded in the data.
- **AI chatbot** — a floating assistant (Google Gemini) that answers questions
  about a specific destination — timing, budget, what to see.
- **Itinerary planning** — pick trip length, interests, and pace; the assistant
  returns a structured itinerary rendered as a real day-by-day timeline with
  tabs per day, not a block of chat text.
- **Error/empty/loading states everywhere** — every async piece (weather,
  images, chat, itinerary, geolocation, location search) has its own loading,
  empty, and error UI. Nothing silently breaks. The hero video also falls back
  to a plain gradient if the clip fails to load, instead of a broken frame.
- **Accessibility** — semantic landmarks, a skip link, visible focus rings,
  `aria-live` regions for async updates, form labels, `prefers-reduced-motion`
  support, and full keyboard operability (chat panel, itinerary tabs, filters,
  location picker).
- **Fully responsive** — tested down to a 360px-wide phone viewport up through
  large desktop.

## APIs used

| Purpose | Provider | Notes |
|---|---|---|
| Weather | [OpenWeather](https://openweathermap.org/api) | Current weather + geocoding (location search) |
| Images | [Pexels](https://www.pexels.com/api/) | Destination and place photography, fetched by search query |
| AI assistant + itinerary | [Google Gemini](https://aistudio.google.com/) | `gemini-3.6-flash` via the REST `generateContent` endpoint |
| Hero video | Coverr / Mixkit | Downloaded and self-hosted, see below — not hotlinked |

## Architecture: server-side API keys

All three third-party APIs (OpenWeather, Pexels, Gemini) are called through
serverless functions in `/api`, not directly from the browser. The real API
keys live only in server-side environment variables (`OPENWEATHER_API_KEY`,
`PEXELS_API_KEY`, `GEMINI_API_KEY` — **no `VITE_` prefix**), so they're never
bundled into client-side JS or visible to anyone inspecting network requests.
The client code in `src/api/*.js` just calls Meridian's own `/api/*` routes.

The Gemini function also handles retries, model fallback, and a request
timeout server-side, and every function applies a basic per-IP rate limit
(see `api/_rateLimit.js` for its limitations at scale).

## Getting started locally

Because API calls now go through serverless functions, plain `npm run dev`
(the Vite dev server) can't run them — Vite only serves static files and
doesn't execute `/api/*.js`. Use the Vercel CLI instead, which runs both the
Vite frontend and the serverless functions together:

```bash
npm install -g vercel   # one-time
npm install
cp .env.example .env
# fill in your API keys in .env
vercel dev
```

### API keys

Create free keys for:

1. **OpenWeather** — https://openweathermap.org/api (free tier)
2. **Pexels** — https://www.pexels.com/api/ (free)
3. **Google Gemini** — https://aistudio.google.com/apikey (free tier)

Put them in `.env` (see `.env.example`) using the **unprefixed** names —
`vercel dev` reads `.env` the same way `vercel` reads dashboard environment
variables in production. `.env` is git-ignored — never commit it.

### Hero video

The hero expects a file at `public/video/hero.mp4`. Download a royalty-free
looping clip from [Coverr](https://coverr.co) or [Mixkit](https://mixkit.co)
(something aerial/travel — mountains, coastline, a city from above works
well), save it as `public/video/hero.mp4`, and it'll be picked up automatically.

## Deploying

Deployed on **Vercel**, which is required now that the app relies on
`/api` serverless functions (a plain static host like GitHub Pages can't run
these). A `vercel.json` is included with an SPA rewrite (so client-side
routes like `/destinations/:id` don't 404 on refresh) and baseline security
headers (CSP, X-Frame-Options, etc.).

1. In the Vercel dashboard, set `OPENWEATHER_API_KEY`, `PEXELS_API_KEY`, and
   `GEMINI_API_KEY` under **Environment Variables** — unprefixed, as **Config**
   type is fine since these are only ever read server-side.
2. Make sure `public/video/hero.mp4` is committed (or hosted elsewhere and the
   `VIDEO_SRC` in `src/components/hero/Hero.jsx` updated to point at it).
3. Update the placeholder domain (`meridian-travel-app-seven.vercel.app`) in
   `index.html`, `public/robots.txt`, and `public/sitemap.xml` to match your
   actual deployed domain.

```bash
npm run build   # outputs to dist/
npm run preview # sanity-check the production build locally (static parts only —
                 # /api routes need `vercel dev` or a real deployment to test)
```

## Project structure

```
api/            serverless functions — the only place real API keys live
src/
  api/          client-side fetch wrappers that call this app's own /api routes
  hooks/        useGeolocation, useWeather, useImage
  context/      LocationContext (shared "where the visitor is")
  data/         seed destination dataset (no image URLs — only search queries)
  components/
    layout/     Header, Footer, LocationControl
    hero/       landing hero with background video
    destinations/  search/filter bar, mosaic grid, card
    destination/   detail-page hero, weather widget, places gallery
    chat/       floating AI chat widget
    itinerary/  planner form + rendered day-by-day timeline
    common/     LoadingState / EmptyState / ErrorState / Skeleton / ErrorBoundary
  pages/        Home, DestinationDetail, NotFound
```

## Design notes

Visual identity is built around cartography rather than a generic travel-blog
look: ink navy + parchment as the base palette, a brass accent standing in for
compass hardware, a deep teal reserved for weather/data readouts. `Fraunces`
carries headlines, `Inter` carries UI text. The itinerary's day timeline and
the header's location pin use the same route-line/marker motif to tie the
"planning a route" idea together visually.

## Known limitations

- The per-IP rate limiting in `/api` is in-memory and scoped to a single
  serverless instance — a reasonable deterrent, not a strict guarantee at
  scale. A production deployment handling real traffic should move this to a
  shared store (Vercel KV, Upstash Redis, etc.).
- Destination and place data is a curated static set (8 destinations); it's
  not pulled from a destinations API, since the brief left data sourcing open.
- The chat assistant has no persistent memory across page reloads.
- No automated tests yet (unit or e2e) — a natural next addition (Vitest +
  React Testing Library for components, Playwright for the itinerary/chat
  flows) given more time.
