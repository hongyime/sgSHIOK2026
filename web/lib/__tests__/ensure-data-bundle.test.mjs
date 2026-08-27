import { describe, expect, it, vi } from "vitest";

import { buildTransitH3ShardCollections } from "../../scripts/ensure-data-bundle.mjs";

describe("buildTransitH3ShardCollections", () => {
  it("groups transit POIs into H3 feature collections and skips invalid points", () => {
    const busStop = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [103.8, 1.3] },
      properties: { id: "bus:12345", kind: "bus_stop", name: "Test Stop" },
    };
    const mrtExit = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [103.81, 1.31] },
      properties: { id: "mrt:42", kind: "mrt_exit", name: "Test Exit" },
    };
    const invalid = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [Number.NaN, 1.32] },
      properties: { id: "bus:bad", kind: "bus_stop", name: "Bad Stop" },
    };
    const cellForLatLng = vi.fn((lat, lng, resolution) => {
      if (resolution !== 8) throw new Error(`unexpected resolution ${resolution}`);
      return lat < 1.31 || lng < 103.81 ? "cell-a" : "cell-b";
    });

    const shards = buildTransitH3ShardCollections(
      { type: "FeatureCollection", features: [busStop, mrtExit, invalid] },
      cellForLatLng
    );

    expect([...shards.keys()].sort()).toEqual(["cell-a", "cell-b"]);
    expect(shards.get("cell-a")).toEqual({
      type: "FeatureCollection",
      features: [busStop],
      provenance: { source: "transit/pois.json", h3_resolution: 8 },
    });
    expect(shards.get("cell-b")).toEqual({
      type: "FeatureCollection",
      features: [mrtExit],
      provenance: { source: "transit/pois.json", h3_resolution: 8 },
    });
    expect(cellForLatLng).toHaveBeenCalledTimes(2);
  });
});
