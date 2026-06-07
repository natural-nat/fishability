# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint (Next.js 16 config)
```

No test suite is configured.

## Architecture

FishAbility is a **Next.js 16 (App Router)** fishing-conditions tool. The user picks a location and time, the app fetches live weather, computes a 0–100 fishability score, and lists species ranked by current catch chance.

### Data flow

```
User picks location/time
  → GET /api/score      (geocoding → Open-Meteo weather → scoring)
  → GET /api/species    (weather params → per-species ranking)
```

Both API routes are in `app/api/*/route.ts` and are pure server functions (no database).

### Key modules

| Module | Purpose |
|--------|---------|
| `lib/weather.ts` | Fetches 3-day hourly forecast from **Open-Meteo** (free, no key). Computes pressure trend (3-hour delta). Returns the target hour's `WeatherData` plus a ±12-hour `HourlyPoint[]` for the timeline chart. |
| `lib/scoring.ts` | Pure function `calculateScore(weather)` → `ScoreResult`. Six weighted factors: timeOfDay (15), pressure (20), wind (20), cloudCover (15), rain (15), temperature (15). Total max = 100. |
| `lib/species.ts` | Static `SPECIES[]` catalog (~30 North-American freshwater fish). `scoreSpecies()` blends current conditions with each species' `catchability` (1–5) into a 0–10 catch chance. Bait recommendations are condition-filtered at query time. |
| `lib/regions.ts` | Defines ~10 geographic fishing regions for the Regional view. `STATE_TO_REGION` maps US state names to region IDs. |
| `lib/geocoding.ts` | Resolves text location names via **Open-Meteo Geocoding API**. |
| `components/MapPicker.tsx` | Leaflet map (react-leaflet). Two modes: **Regional** (click a colored US state region) and **Local** (search a specific water body via `/api/search`, which proxies Nominatim/OSM). Switching modes re-mounts the component via `key={viewMode}`. |
| `app/page.tsx` | Single-page client component. Manages all state. Fetches `/api/score` on form submit, then fetches `/api/species` in a `useEffect` whenever `result` changes. Contains `HourlyChart`, `FishCard`, `FishCardSkeleton`, and `SpeciesModal` as co-located sub-components. |

### Species scoring formula

```
conditions (0–10) = tempScore (0–4) + timeScore (0–3) + conditionsScore (0–3)
catchChance (0–10) = round(conditions × CATCH_FACTOR[catchability])
CATCH_FACTOR: { 1→0.1, 2→0.3, 3→0.5, 4→0.75, 5→1.0 }
```

### Map tile provider

CARTO dark-nolabels tiles — no API key required, attribution required. Map is US-only (maxBounds clamped to contiguous 48 states).

### Fish illustrations

Served from Wikimedia Commons via `illustrationUrl()` in `lib/species.ts`. The white-background field-guide art is keyed out in the browser using an inline SVG `<filter id="fishkey">` (luminance-to-alpha + feathered ramp) defined in `app/page.tsx`.

### External APIs (no auth required)

- `https://api.open-meteo.com/v1/forecast` — weather + hourly forecast
- `https://geocoding-api.open-meteo.com/v1/search` — place name → lat/lon
- `https://nominatim.openstreetmap.org/search` — water body search (via `/api/search`)
- Wikimedia Commons `Special:FilePath` — fish illustration thumbnails
