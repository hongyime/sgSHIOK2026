import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchLampOverlayManifest,
  fetchLampTiles,
  lampTilesToFeatureCollection,
  normalizeLampOverlayBase,
  tilesForBounds,
  type LampOverlayManifest,
  type LampTileIndex,
} from "../lamp-overlay";

function jsonResponse(ok: boolean, payload?: unknown): Response {
  return {
    ok,
    status: ok ? 200 : 404,
    json: async () => payload,
  } as Response;
}

function bareUrl(input: RequestInfo | URL): string {
  return String(input).split("?")[0];
}

const TILE_A: LampTileIndex = {
  cell: "cell-a",
  path: "tiles/cell-a.json",
  count: 2,
  bytes: 50,
  bbox: [103.8, 1.3, 103.81, 1.31],
};

const TILE_B: LampTileIndex = {
  cell: "cell-b",
  path: "tiles/cell-b.json",
  count: 1,
  bytes: 40,
  bbox: [103.95, 1.45, 103.96, 1.46],
};

const MANIFEST: LampOverlayManifest = {
  schema_version: 1,
  generated_at: "2026-08-16T00:00:00+00:00",
  source: {
    path: "raw/hash/lamp_posts.geojson",
    sha256: "abc",
    bytes: 123,
  },
  h3_resolution: 8,
  point_count: 3,
  skipped_feature_count: 0,
  tile_count: 2,
  tile_bytes: 90,
  bbox: [103.8, 1.3, 103.96, 1.46],
  tiles: [TILE_A, TILE_B],
};

describe("lamp overlay data access", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("normalizes relative and absolute artifact bases", () => {
    expect(normalizeLampOverlayBase()).toBe("/data/lamp_posts_v1/");
    expect(normalizeLampOverlayBase("")).toBe("/data/lamp_posts_v1/");
    expect(normalizeLampOverlayBase("data/lamp_posts_v1")).toBe("/data/lamp_posts_v1/");
    expect(normalizeLampOverlayBase("/data/lamp_posts_v1")).toBe("/data/lamp_posts_v1/");
    expect(normalizeLampOverlayBase("https://example.test/lamp")).toBe("https://example.test/lamp/");
  });

  it("keeps only manifest tiles intersecting the current map bounds", () => {
    expect(
      tilesForBounds(MANIFEST, {
        west: 103.79,
        south: 1.29,
        east: 103.82,
        north: 1.32,
      }).map((tile) => tile.cell)
    ).toEqual(["cell-a"]);
  });

  it("loads manifest and tile JSON through cache-busted no-store fetches", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = bareUrl(input);
      if (url.endsWith("/manifest.json")) return jsonResponse(true, MANIFEST);
      if (url.endsWith("/tiles/cell-a.json")) {
        return jsonResponse(true, {
          cell: "cell-a",
          points: [
            [103.8, 1.3],
            [103.8001, 1.3001],
          ],
        });
      }
      return jsonResponse(false);
    });
    vi.stubGlobal("fetch", fetchMock);

    const manifest = await fetchLampOverlayManifest("/data/lamp_posts_v1/");
    const tiles = await fetchLampTiles([TILE_A], "/data/lamp_posts_v1/");

    expect(manifest?.tiles).toHaveLength(2);
    expect(tiles).toEqual([
      {
        cell: "cell-a",
        points: [
          [103.8, 1.3],
          [103.8001, 1.3001],
        ],
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/data\/lamp_posts_v1\/manifest\.json\?v=/),
      { cache: "no-store" }
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/data\/lamp_posts_v1\/tiles\/cell-a\.json\?v=/),
      { cache: "no-store" }
    );
  });

  it("converts compact tile payloads into map point features", () => {
    expect(
      lampTilesToFeatureCollection([
        {
          cell: "cell-a",
          points: [
            [103.8, 1.3],
            [103.8001, 1.3001],
          ],
        },
      ])
    ).toEqual({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [103.8, 1.3] },
          properties: { kind: "lamp_post", cell: "cell-a", index: 0 },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [103.8001, 1.3001] },
          properties: { kind: "lamp_post", cell: "cell-a", index: 1 },
        },
      ],
    });
  });
});
