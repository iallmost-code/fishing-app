import { describe, expect, it } from "vitest";
import { normalizeOverpass, overpassQuery } from "./overpass";
import { mergeSpots } from "./index";
import { knownSpotsNear } from "./knownSpots";

const monroe = { latitude: 33.7948, longitude: -83.7132 };

describe("normalizeOverpass", () => {
  it("keeps the closest segment of a named river and drops private water", () => {
    const spots = normalizeOverpass(
      [
        {
          type: "way",
          id: 1,
          center: { lat: 33.9, lon: -83.7 },
          tags: { waterway: "river", name: "Alcovy River" },
        },
        {
          type: "way",
          id: 2,
          center: { lat: 33.8, lon: -83.7 },
          tags: { waterway: "river", name: "Alcovy River" },
        },
        {
          type: "way",
          id: 3,
          center: { lat: 33.79, lon: -83.72 },
          tags: {
            natural: "water",
            water: "pond",
            name: "Farm Pond",
            access: "private",
          },
        },
        {
          type: "way",
          id: 4,
          center: { lat: 33.7, lon: -83.6 },
          tags: { natural: "water", name: "Lake Rutledge" },
        },
      ],
      monroe,
    );
    expect(spots.map((s) => s.name).sort()).toEqual([
      "Alcovy River",
      "Lake Rutledge",
    ]);
    expect(spots.find((s) => s.name === "Alcovy River")!.id).toBe("osm-way-2");
    expect(spots.find((s) => s.name === "Lake Rutledge")!.type).toBe("lake");
  });

  it("names an unnamed boat ramp after the water it sits on", () => {
    const spots = normalizeOverpass(
      [
        {
          type: "way",
          id: 1,
          center: { lat: 33.75, lon: -83.65 },
          tags: { natural: "water", water: "reservoir", name: "Big Lake" },
        },
        {
          type: "node",
          id: 2,
          lat: 33.751,
          lon: -83.651,
          tags: { leisure: "slipway" },
        },
        {
          type: "node",
          id: 3,
          lat: 34.5,
          lon: -83.0,
          tags: { leisure: "slipway" },
        },
      ],
      monroe,
    );
    const names = spots.map((s) => s.name);
    expect(names).toContain("Boat ramp · Big Lake");
    expect(names).toContain("Boat ramp");
  });

  it("caps the query radius at 25 miles", () => {
    expect(overpassQuery(33.79, -83.71, 50)).toContain("around:40234,");
  });
});

describe("mergeSpots", () => {
  it("folds a live lake inside a known park into that park", () => {
    const parks = knownSpotsNear(monroe, 25);
    const meridian = parks.find((p) => p.name === "Meridian Park")!;
    const merged = mergeSpots(
      parks,
      [
        {
          id: "osm-way-9",
          source: "osm",
          name: "Meridian Lake",
          type: "lake",
          latitude: meridian.latitude + 0.002,
          longitude: meridian.longitude,
          distanceMiles: meridian.distanceMiles,
          facts: [],
        },
        {
          id: "osm-way-10",
          source: "osm",
          name: "Hard Labor Creek Lake",
          type: "lake",
          latitude: 33.67,
          longitude: -83.6,
          distanceMiles: 11,
          facts: [],
        },
      ],
      25,
    );
    expect(merged.some((s) => s.id === "osm-way-9")).toBe(false);
    expect(merged.find((s) => s.name === "Meridian Park")!.facts).toContain(
      "Meridian Lake",
    );
    expect(merged.some((s) => s.id === "osm-way-10")).toBe(true);
    // Sorted nearest first.
    expect(merged.map((s) => s.distanceMiles)).toEqual(
      [...merged.map((s) => s.distanceMiles)].sort((a, b) => a - b),
    );
  });

  it("knows fishing parks near Monroe and none far away", () => {
    expect(knownSpotsNear(monroe, 15).map((s) => s.name)).toEqual(
      expect.arrayContaining([
        "Meridian Park",
        "Fort Yargo State Park",
        "Tribble Mill Park",
      ]),
    );
    expect(knownSpotsNear({ latitude: 30.3, longitude: -81.6 }, 50)).toEqual(
      [],
    );
  });
});
