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

## What's in the app

Phone-only layout with three tabs:

- **Today:** fishing score, best bite window, pressure/wind/sun, the top lure (more on tap), the next 12 hours, the closest spots, and fold-out pressure graph and score breakdown.
- **Spots:** map plus list of nearby water within 5/10/25 miles, filterable by lakes, rivers, and ramps & piers. Tap a spot for its own score, best bite and lure, directions, or "Fish here".
- **Forecast:** 7 day buttons with scores, a day summary, and an hourly list that expands to show why each hour scored the way it did.

GPS is requested on launch. The last location is remembered (rounded to about 100 m) so the app opens on your water. If the high-accuracy fix times out it retries with a network fix, and a blocked permission tells you how to turn it back on.

## Water data

- **Live:** named lakes, ponds, reservoirs and rivers, boat ramps, fishing piers and fishing spots from OpenStreetMap via the public Overpass API (`src/services/water/overpass.ts`). Private water is hidden. Results are cached per area for 24 hours, and a second Overpass server is tried if the first fails.
- **Built in:** 23 parks within about 50 miles of Monroe that AllTrails lists for fishing (`src/services/water/knownSpots.ts`). Only facts are kept: park name, lake/river, fees and accessible paths. Coordinates come from OpenStreetMap and were checked against AllTrails' distances. These show instantly and work offline; a live lake inside one of these parks is folded into the park. Outside this area the list adds nothing.

Being on the map doesn't mean public access.

See [fishing formulas](docs/FISHING_LOGIC.md) and [map provider notes](docs/MAPS.md).

## Mobile preview

Phone screenshots at 390 × 844 (Spots uses sample live-water data):

[Home](docs/mobile-home.png) · [Map](docs/mobile-map.png)
