# Map provider and next water-data phase

## Implemented map

MapLibre GL JS is lazy loaded only when Map opens. OpenFreeMap's hosted Dark style is isolated in `src/services/maps/basemap.ts`. Radius geometry is a geodesic polygon using miles, not an invented collection of spots. The marker labels distinguish live GPS, manually selected town centers, and Monroe fallback. No precise coordinates are stored. Browser permission is requested only by the GPS button; denied/unavailable states retain manual town search. Recenter, zoom, 5/10/20/30/50-mile circles, resize handling, map-load retry, and unsupported-browser states are implemented.

Provider checks performed 2026-10-03:

- [OpenFreeMap quick start](https://openfreemap.org/quick_start/) documents MapLibre browser usage with `https://tiles.openfreemap.org/styles/liberty`.
- Live style response returned HTTP 200, `Access-Control-Allow-Origin: *`, and `Cache-Control: public, max-age=86400`.
- No API key enters browser code. Attribution supplied by the hosted style is retained through MapLibre's attribution control, covering OpenFreeMap, OpenMapTiles, and OpenStreetMap.
- The map is a basemap, not a verified fishing-access or nearby-water database. Large map code is isolated in its own lazy chunk so Home does not pay that download cost.

## Nearby water

Implemented in `src/services/water/`; see the README's "Water data" section. Public Overpass instances are shared and rate limited, so lookups are capped at 25 miles, cached for 24 hours per area, and fall back to a second instance.

## Dark theme

The current app uses `https://tiles.openfreemap.org/styles/dark`. Verified on 2026-10-04: HTTP 200, valid MapLibre style v8, and `Access-Control-Allow-Origin: *`. The same OpenFreeMap provider, water data, radius geometry, and attribution are retained. Marker colors are brighter for visibility on the dark basemap.
