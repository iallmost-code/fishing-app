# Fishing Companion

The existing React + TypeScript + Vite fishing app, extended with mobile bottom navigation, an interactive real-data pressure graph, continuous bite windows, a full seven-day Forecast screen, and a MapLibre map. Bright blue styling, Monroe fallback, GPS, Open-Meteo, explainable scores and condition-based bass lure recommendations are preserved.

## Run and verify

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

GitHub Pages retains the relative Vite base and existing deployment workflow. The workflow now uses the committed lockfile and runs checks/tests before building. Navigation uses hashes, so refreshing a tab works on Pages without server rewrites.

## Implemented in this phase

- Dedicated Home, Map, Forecast, Tackle and Catches screens, with touch-sized bottom navigation. Tackle and Catches clearly identify the subsequent storage phase.
- Home condition icon, temperature, wind/direction, cloud/rain probability, pressure changes, sun times, score explanations, top three lure picks and remaining-day continuous windows.
- Pressure graph with 12 hours of model history and 12 forecast hours, a current marker, rising/falling/stable segments, inHg units and a keyboard/touch slider. Missing history is identified.
- Primary/secondary windows from consecutive strong hours, without random precision.
- Seven daily outlook cards and selected-day hourly conditions, with per-hour score explanations, full weather breakdown and timezone-aware formatting.
- Lazy-loaded MapLibre/OpenFreeMap map, GPS permission/error states, manual geocoding, real radius geometry, zoom/recenter and explicit nearby-water discovery pending state.
- Weather timeouts, nullable normalization, stale-request protection, an offline notice, prior-data labels after failure, missing-data handling and map screen error recovery.

## Next phases

Nearby-water provider verification/integration, persistent tackle and catch entry, Supabase data layer, and PWA/offline forecast caching are not claimed complete in this first-five-feature delivery. The app currently holds weather and precise location in memory only. Offline weather is available while the already-loaded session remains open; reopening offline requires the later PWA phase.

See [fishing formulas](docs/FISHING_LOGIC.md) and [map provider notes](docs/MAPS.md).

## Mobile preview

Browser screenshots at 412 × 915 pixels, using actual Monroe weather at validation time:

[Home](docs/mobile-home.png) · [Map](docs/mobile-map.png)
