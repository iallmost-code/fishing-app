import { describe, expect, it } from "vitest";
import { isSewage, normalizeOverpass, overpassQuery } from "./overpass";
import { mergeSpots } from "./index";
import { knownSpotsNear } from "./knownSpots";
import { GUIDE_SPOTS } from "./guideSpots";

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
    // Confirmed spots first, each group nearest first.
    const confirmed = merged.filter(
      (s) => !s.facts.includes("Fishing unconfirmed"),
    );
    expect(merged.slice(0, confirmed.length)).toEqual(confirmed);
    expect(confirmed.map((s) => s.distanceMiles)).toEqual(
      [...confirmed.map((s) => s.distanceMiles)].sort((a, b) => a - b),
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

describe("guide spots", () => {
  it("adds local and state spots near Monroe with honest tags", () => {
    const near = knownSpotsNear(monroe, 25);
    const mathews = near.find((s) => s.name === "Mathews Park")!;
    expect(mathews.source).toBe("guide");
    expect(mathews.facts).toContain("Fishing unconfirmed");
    const hardLabor = near.find(
      (s) => s.name === "Hard Labor Creek State Park",
    )!;
    expect(hardLabor.facts).toContain("License 16+");
    // Overlaps enrich the existing AllTrails entry instead of duplicating it.
    expect(near.filter((s) => s.name === "Fort Yargo State Park")).toHaveLength(
      1,
    );
    expect(
      near.find((s) => s.name === "Fort Yargo State Park")!.facts,
    ).toContain("Motors ≤10 HP");
  });
  it("covers state parks across Georgia", () => {
    const hartwell = knownSpotsNear({ latitude: 34.37, longitude: -82.92 }, 25);
    expect(hartwell.map((s) => s.name)).toContain("Hart State Park");
  });
  it("keeps a live lake separate from a park with no known water", () => {
    const mathews = knownSpotsNear(monroe, 25).find(
      (s) => s.name === "Mathews Park",
    )!;
    const park = { ...mathews, water: undefined };
    const merged = mergeSpots(
      [park],
      [
        {
          id: "osm-way-1",
          source: "osm",
          name: "Some Pond",
          type: "pond",
          latitude: park.latitude + 0.001,
          longitude: park.longitude,
          distanceMiles: park.distanceMiles,
          facts: [],
        },
      ],
      25,
    );
    expect(merged).toHaveLength(2);
  });
  it("has no park with unconfirmed fishing and no known water", () => {
    for (const s of GUIDE_SPOTS)
      expect(
        s.facts.includes("Fishing unconfirmed") && !s.water?.length,
        s.name,
      ).toBe(false);
  });
});

describe("sewage water", () => {
  it("is never listed as a place to fish", () => {
    const at = { lat: 33.8, lon: -83.7 };
    const spots = normalizeOverpass(
      [
        {
          type: "way",
          id: 1,
          center: at,
          tags: { natural: "water", name: "Monroe Wastewater Treatment Pond" },
        },
        {
          type: "way",
          id: 2,
          center: at,
          tags: { natural: "water", name: "Sewage Lagoon 2" },
        },
        {
          type: "way",
          id: 3,
          center: at,
          tags: { natural: "water", name: "Pond B", water: "wastewater" },
        },
        {
          type: "way",
          id: 4,
          center: at,
          tags: {
            natural: "water",
            name: "Pond C",
            operator: "City Water Pollution Control Plant",
          },
        },
        {
          type: "way",
          id: 5,
          center: at,
          tags: { natural: "water", name: "Lake Varner" },
        },
      ],
      monroe,
    );
    expect(spots.map((s) => s.name)).toEqual(["Lake Varner"]);
    expect(isSewage({ name: "Rhodes Jordan Lake" })).toBe(false);
  });
});
