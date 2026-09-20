# Meridian — Travel Exploration App

A travel web app for exploring destinations, checking real-time weather, browsing
famous places, and planning a trip with an AI assistant that verifies its own
suggestions against live places data instead of just guessing. Originally built
for the Designesthetics front-end developer assignment, then extended well
beyond the brief as a fuller portfolio piece.

**Live app:** _add your deployed URL here_
**Repository:** _add your GitHub repo URL here_


## Features

### Core experience
- **Landing hero** (`/`) — full-bleed looping background video with an
  orchestrated entrance animation and a single call to action into the app.
- **Explore page** (`/explore`) — a dedicated destination browser, split out
  from the landing page so the hero stays a clean first impression: search by
  name/country, filter by region, editorial mosaic grid, optional "sort by
  distance" once location is known.
- **Destination detail pages** — each destination gets its own page: a hero,
  live weather, a description, and its famous places presented as an
  illustrated gallery (photo + note per place), not a bare list of names.
- **Location awareness** — a header control lets a visitor share their browser
  location or search for a place manually; the app works either way, and
  denied/unsupported permission states are handled explicitly. Once set, every
  destination gets a "X km away" badge, and a destination page shows the
  visitor's own weather alongside the destination's for a quick comparison.
- **Real-time weather** — live conditions for each destination via
  OpenWeather, with loading, error, and "not configured" states.
- **Images fetched at runtime** — every photo (destination cards, place
  gallery, destination hero) is fetched from Pexels by search query; no image
  URLs are hardcoded in the data.
- **AI chatbot** — a floating, clearly-labeled "Ask AI" assistant (Google
  Gemini) on every destination and itinerary page, that answers questions
  about a specific destination — timing, budget, what to see. It keeps a
  fixed in-app persona and is instructed to never disclose which underlying
  model or vendor powers it, under any framing, including direct questions or
  attempts to get it to repeat its own instructions.

### Itinerary planning
The planner (on each destination page) collects trip length (no upper cap),
interests, pace, an optional daily budget, optional dietary needs and
travel-style/accessibility tags (toggle chips, not free text — feeds real
personalization into the prompt instead of generic "top 10" suggestions), and
an optional list of specific places the traveler already wants included.
Submitting navigates to a dedicated result page (`/destinations/:id/itinerary`)
which **generates the itinerary automatically on load** and renders it as a
real day-by-day timeline, not a block of chat text. On that page:

- **Real geographic logic, not just an AI's word for it.** Each day's
  activities are checked against live Foursquare place data for their actual
  coordinates, and the app computes the real distance between consecutive
  stops. If one leg of the day is a clear outlier — a long trek compared to
  the rest — a warning is shown so the traveler can reorder or swap it,
  instead of silently trusting that the model's ordering "makes sense."
- **Live verification instead of hallucinated recommendations.** The "hidden
  gem" and food recommendation for each day are checked against Foursquare's
  live places database and shown with an Open / Temporarily closed /
  Permanently closed badge when a confident signal is available — the app
  says nothing rather than guessing when it can't verify.
- **Real cost transparency.** Each day returns a structured cost breakdown
  (activities / food / transport / total, in whatever currency is customary
  for that destination), and the page shows a running estimated trip total —
  not a vague `$$` symbol.
- **Editable, not rigid.** Every activity can be reordered (up/down) or
  removed entirely, client-side, with no AI round-trip needed. A separate
  "add a place" card lets a traveler request one more specific place after
  the fact — the assistant slots it into whichever existing day is
  geographically closest, reordering that day if needed, rather than just
  appending it wherever.
- A **best-time-to-visit** blurb and a **local tip** (bargaining, transport
  norms, etc.) round out the page.

### Everything else
- **Error/empty/loading states everywhere** — every async piece (weather,
  images, chat, itinerary generation, place verification, geolocation,
  location search) has its own loading, empty, and error UI. Nothing silently
  breaks. Place verification specifically fails *silently* by design — a
  missing key or a Foursquare miss just omits the badge rather than showing
  an error, since it's a nice-to-have enhancement, not a critical path. The
  hero video also falls back to a plain gradient if the clip fails to load.
- **Accessibility** — semantic landmarks, a skip link, visible focus rings,
  `aria-live` regions for async updates, form labels, `prefers-reduced-motion`
  support, and full keyboard operability (chat panel, itinerary tabs, filters,
  location picker, reorder/delete controls).
- **Fully responsive** — tested down to a 360px-wide phone viewport up
  through large desktop.
- **Security headers** (CSP, X-Frame-Options, Referrer-Policy,
  Permissions-Policy) and **route-level code splitting** so the initial bundle
  doesn't ship every page up front.

## APIs used

| Purpose | Provider | Notes |
|---|---|---|
| Weather | [OpenWeather](https://openweathermap.org/api) | Current weather + geocoding (location search) |
| Images | [Pexels](https://www.pexels.com/api/) | Destination and place photography, fetched by search query |
| AI assistant + itinerary | [Google Gemini](https://aistudio.google.com/) | `gemini-3.6-flash` (with a lighter fallback model) via the REST `generateContent` endpoint |
| Place verification | [Foursquare Places API](https://foursquare.com/developers) | Real-time open/closed status, ratings, and coordinates — free tier, no credit card required |
| Hero video | Coverr / Mixkit | Downloaded and self-hosted, see below — not hotlinked |

**Why Foursquare instead of Google Places:** Google's Places API requires
billing to be enabled on the Google Cloud project even for its free tier (a
card on file, though not charged for normal usage) — an unnecessary hurdle for
a portfolio project. Foursquare's free tier needs no payment method at all,
and its `closed_bucket` field (`VeryLikelyOpen` / `LikelyClosed` /
`VeryLikelyClosed`, etc.) is arguably a *better* signal for "is this place
actually still open" than a plain boolean.

## Architecture: server-side API keys

All API calls (OpenWeather, Pexels, Gemini, Foursquare) go through serverless
functions in `/api`, not directly from the browser. The real API keys live
only in server-side environment variables (`OPENWEATHER_API_KEY`,
`PEXELS_API_KEY`, `GEMINI_API_KEY`, `FOURSQUARE_API_KEY` — **no `VITE_`
prefix**), so they're never bundled into client-side JS or visible to anyone
inspecting network requests. The client code in `src/api/*.js` just calls
Meridian's own `/api/*` routes.

The Gemini function handles retries, model fallback, and a request timeout
server-side, all budgeted to fit inside Vercel's serverless execution limit.
Every function applies a basic per-IP rate limit (see `api/_rateLimit.js` for
its limitations at scale — it's in-memory, so it's a reasonable deterrent,
not a strict guarantee, and would need a shared store like Vercel KV or
Upstash Redis under real production traffic).

## Getting started locally

Because API calls go through serverless functions in `/api`, plain Vite alone
can't run them — Vite only serves static files. This project runs two servers
side by side instead of relying on `vercel dev`'s combined frontend+API proxy,
which turned out to be unreliable across CLI versions on some machines. This
setup is deliberate and permanent, not a workaround:

```bash
npm ci                  # NOT npm install — see "Reproducible installs" below
npm run dev:full        # runs both servers together
```

`npm run dev:full` starts the Vite frontend (`http://localhost:5173`) and a
`vercel dev` instance that serves **only** `/api/*` (on port 3001, never
opened directly in a browser). Vite's own dev server proxies any `/api/*`
request over to it automatically (see `vite.config.js`). Open
`http://localhost:5173` — not port 3000 or 3001 — to use the app.

If you'd rather run them separately in two terminals:
```bash
npm run dev       # frontend, http://localhost:5173
npm run dev:api   # api functions only, port 3001
```

`dev:api` authenticates using a `VERCEL_TOKEN` environment variable rather
than an interactive login (`vercel login`'s browser-based flow has changed
and broken across CLI versions more than once during this project's
development — a static token is immune to that). Generate one at
[vercel.com/account/tokens](https://vercel.com/account/tokens), then set it
as a permanent environment variable on your machine (e.g. on Windows,
`setx VERCEL_TOKEN "your-token"`, then **fully restart your terminal/editor**
for it to take effect) and run `npx vercel link` once to connect this folder
to your Vercel project.

### Reproducible installs — always use `npm ci`, not `npm install`

This project pins exact versions of `vite`, `@vitejs/plugin-react`, and
`vercel` (no `^` ranges) and commits `package-lock.json`. **Always run
`npm ci`** to set up the project — it installs exactly what's in the
lockfile and never silently upgrades anything. `npm install` is allowed to
pull newer versions that satisfy a range, which is how this project
previously ended up on an untested Vite major version and a broken Vercel
CLI release, costing real debugging time. If you ever need to intentionally
upgrade a dependency, do it deliberately (`npm install <pkg>@<version>`),
test it, then commit the updated lockfile — don't let it happen by accident.

### API keys

Create free keys for:

1. **OpenWeather** — https://openweathermap.org/api (free tier)
2. **Pexels** — https://www.pexels.com/api/ (free)
3. **Google Gemini** — https://aistudio.google.com/apikey (free tier)
4. **Foursquare Places** — https://foursquare.com/developers (free, no credit
   card — optional: the app degrades gracefully with no verification badges
   or route-distance check if this is left blank)

Add these in your **Vercel project's dashboard** under Environment Variables
(unprefixed names, Config type is fine since they're only ever read
server-side) — `vercel dev` pulls them from there automatically when the
project is linked, so a local `.env` file isn't strictly required. If you do
want one locally, copy `.env.example` to `.env` and fill in the same names;
`.env` is git-ignored and should never be committed.

### Hero video

The hero expects a file at `public/video/hero.mp4`. Download a royalty-free
looping clip from [Coverr](https://coverr.co) or [Mixkit](https://mixkit.co)
(something aerial/travel — mountains, coastline, a city from above works
well), save it as `public/video/hero.mp4`, and it'll be picked up automatically.

## Deploying

Deployed on **Vercel**, which is required since the app relies on `/api`
serverless functions (a plain static host like GitHub Pages can't run these).
A `vercel.json` is included with an SPA rewrite (so client-side routes like
`/destinations/:id` or `/explore` don't 404 on refresh) and baseline security
headers (CSP, X-Frame-Options, etc.).

1. In the Vercel dashboard, set `OPENWEATHER_API_KEY`, `PEXELS_API_KEY`,
   `GEMINI_API_KEY`, and `FOURSQUARE_API_KEY` under **Environment Variables**.
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
api/                       serverless functions — the only place real API keys live
  gemini.js                itinerary generation, add-a-place refinement, chat
  weather.js, geocode.js   OpenWeather proxies
  images.js                Pexels proxy
  verify-place.js          Foursquare place verification proxy
  _rateLimit.js            shared per-IP rate limiter
src/
  api/                     client-side fetch wrappers that call this app's own /api routes
  hooks/                   useGeolocation, useWeather, useImage
  context/                 LocationContext (shared "where the visitor is")
  data/                    seed destination dataset (no image URLs — only search queries)
  utils/                   geo.js — haversine distance calculation
  components/
    layout/                Header, Footer, LocationControl
    hero/                  landing hero with background video
    destinations/          search/filter bar, mosaic grid, card, local weather strip
    destination/           detail-page hero, weather widget, places gallery, distance badge
    chat/                  floating AI chat widget
    itinerary/             planner form, day timeline, add-a-place card
    common/                LoadingState / EmptyState / ErrorState / Skeleton / ErrorBoundary
  pages/                   Home, Explore, DestinationDetail, ItineraryResult, NotFound
```

## Design notes

Visual identity is built around cartography rather than a generic travel-blog
look: ink navy + parchment as the base palette, a brass accent standing in for
compass hardware, a deep teal reserved for weather/data readouts. `Fraunces`
carries headlines, `Inter` carries UI text. The itinerary's day banners and
the header's location pin use the same route-line/marker motif to tie the
"planning a route" idea together visually.

## Known limitations

- The per-IP rate limiting in `/api` is in-memory and scoped to a single
  serverless instance — a reasonable deterrent, not a strict guarantee at
  scale.
- Destination and place data is a curated static set (8 destinations); it's
  not pulled from a destinations API, since the brief left data sourcing open.
- Place verification depends on Foursquare actually having the AI-suggested
  place in its database under a matching name — a real but obscure spot may
  come back "unverified" (no badge) even if it does exist.
- Activity reordering is up/down buttons, not drag-and-drop — a deliberate
  tradeoff to avoid adding a new frontend dependency given how much version-
  pinning fragility this project already ran into.
- The chat assistant has no persistent memory across page reloads, and a
  generated itinerary is lost on a hard refresh of the result page (trip
  details are passed via router state, not a URL or storage, since an
  itinerary that never gets revisited didn't seem worth persisting — this is
  the first thing to add if that assumption turns out wrong).
- No automated tests yet (unit or e2e) — a natural next addition (Vitest +
  React Testing Library for components, Playwright for the itinerary/chat
  flows) given more time.
