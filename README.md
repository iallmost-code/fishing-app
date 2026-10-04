# WTF — Where’s the Fish

The existing React + TypeScript + Vite fishing app, extended with mobile bottom navigation, an interactive real-data pressure graph, continuous bite windows, a full seven-day Forecast screen, and a MapLibre map. The dark lake design pairs deep teal panels with aqua, mint, amber and lime accents. Monroe fallback, GPS, Open-Meteo, explainable scores and condition-based bass lure recommendations are preserved.

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

- **Today:** fishing score, best bite window, pressure/wind/sun, the top three lure picks with their reasons, the next 12 hours, the closest spots, and an interactive pressure graph and score breakdown.
- **Spots:** map plus list of nearby water within 5/10/25 miles, filterable by lakes, rivers, and ramps & piers. Tap a spot for its own score, best bite and lure, directions, or "Fish here".
- **Forecast:** seven daily outlook cards with scores, weather and bite windows, plus hourly cards that expand to show conditions and score explanations.

GPS is requested on launch. The last location is remembered (rounded to about 100 m) so the app opens on your water. If the high-accuracy fix times out it retries with a network fix, and a blocked permission tells you how to turn it back on.

## Water data

- **Live:** named lakes, ponds, reservoirs and rivers, boat ramps, fishing piers and fishing spots from OpenStreetMap via the public Overpass API (`src/services/water/overpass.ts`). Private water is hidden. Results are cached per area for 24 hours, and a second Overpass server is tried if the first fails.
- **Built in:** 23 parks within about 50 miles of Monroe that AllTrails lists for fishing (`src/services/water/knownSpots.ts`). Only facts are kept: park name, lake/river, fees and accessible paths. Coordinates come from OpenStreetMap and were checked against AllTrails' distances. These show instantly and work offline; a live lake inside one of these parks is folded into the park. Outside this area the list adds nothing.

Being on the map doesn't mean public access.

See [fishing formulas](docs/FISHING_LOGIC.md) and [map provider notes](docs/MAPS.md).

## Mobile preview

Phone screenshots at 412 × 915 using actual weather and nearby-water results at validation time:

[Today](docs/mobile-home.png) · [Forecast](docs/mobile-forecast.png) · [Spots](docs/mobile-map.png)

## Mobile visual design

The app now uses the WTF — Where’s the Fish brand, the supplied crossed-hooks logo, a locally bundled bass header and soft background on every tab, colorful thumb-friendly actions, deep lake-teal panels, mint fishing scores, amber bite windows, and a dark map, and a phone-width layout capped at 480 CSS pixels. Forecast hours expand into touch-friendly cards. Presentation changes do not modify weather, pressure, fishing-score, window, or lure rules.

The original uploaded logo is preserved in `public/brand/wtf-original.jpg`. Bass artwork was generated for this app and packaged as a roughly 165 KB twilight WebP for mobile delivery. Public asset paths remain relative for GitHub Pages. The decorative fish image is not presented as a photograph of the selected fishing location.

The dark palette is isolated in `src/styles/dark.css`, while component layout remains in the existing stylesheets. The PWA theme and launch colors match the app. The Twilight bass artwork is decorative, not a live view of the selected location.
