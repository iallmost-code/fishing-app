# Map provider and next water-data phase

## Implemented map

MapLibre GL JS is lazy loaded only when Map opens. OpenFreeMap's hosted Liberty style is isolated in `src/services/maps/basemap.ts`. Radius geometry is a geodesic polygon using miles, not an invented collection of spots. The marker labels distinguish live GPS, manually selected town centers, and Monroe fallback. No precise coordinates are stored. Browser permission is requested only by the GPS button; denied/unavailable states retain manual town search. Recenter, zoom, 5/10/20/30/50-mile circles, resize handling, map-load retry, and unsupported-browser states are implemented.

Provider checks performed 2026-10-03:

- [OpenFreeMap quick start](https://openfreemap.org/quick_start/) documents MapLibre browser usage with `https://tiles.openfreemap.org/styles/liberty`.
- Live style response returned HTTP 200, `Access-Control-Allow-Origin: *`, and `Cache-Control: public, max-age=86400`.
- No API key enters browser code. Attribution supplied by the hosted style is retained through MapLibre's attribution control, covering OpenFreeMap, OpenMapTiles, and OpenStreetMap.
- The map is a basemap, not a verified fishing-access or nearby-water database. Large map code is isolated in its own lazy chunk so Home does not pay that download cost.

## Deferred nearby-water discovery

No fake water markers are shown. Discovery is explicitly pending and remains the next phase after these first five features. Before implementing, verify current Overpass instance policy, rate and resource limits, attribution and CORS behavior. Public Overpass instances should not be treated as an unlimited production backend. Prefer a read-only query service with caching, throttling and provider isolation under `src/services/water/`.

A normalized model should carry provider ID, name (or explicitly unnamed), lake/pond/reservoir/river/stream type, centroid coordinates, optional approximate size, distance and favorite state. OpenStreetMap presence does not establish legal/public fishing access. Spot-specific weather should reuse `getWeather` and the existing fishing/lure/window engines. Actual favorites and records follow in tackle/catch/storage phases.
