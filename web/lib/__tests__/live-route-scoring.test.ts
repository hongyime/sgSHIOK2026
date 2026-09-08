import { describe, expect, it } from "vitest";
import {
  extractShelterEvidence,
  scoreLiveRoute,
} from "../live-route-scoring";
import { encodePolyline, type LatLng } from "../polyline";
import { haversineMeters } from "../nearest-transit";
import { walkMetrics } from "../../components/walk-summary";
import type { PostalGeom, ScoreRecord } from "../types";
import fixture from './fixtures/published-options.json';

describe("live route preview segmentation", () => {
  const sampleShelterPoints: LatLng[] = [
    [1.3501, 103.8501],
    [1.3505, 103.8505],
    [1.3510, 103.8510],
  ];

  const sampleGeom: PostalGeom = {
    postal: "560109",
    shortest: encodePolyline(sampleShelterPoints),
    sheltered: encodePolyline(sampleShelterPoints),
    exposure_gaps: [],
    route_segments: {
      sheltered: [
        {
          geom: encodePolyline(sampleShelterPoints),
          len_m: 140,
          is_covered: true,
          source_class: "lta_covered_linkway",
        },
      ],
      shortest: [
        {
          geom: encodePolyline(sampleShelterPoints),
          len_m: 140,
          is_covered: true,
          source_class: "lta_covered_linkway",
        },
      ],
    },
  };

  const sampleScore: ScoreRecord = {
    postal: "560109",
    state: "SCORED",
    total: 88,
    subscores: {
      access: 95,
      bus: 80,
      rain: 90,
      heat: 85,
      crossing: 90,
    },
    best_node: {
      type: "bus_stop",
      name: "Bef Ang Mo Kio Ave 10",
      routed_m: 140,
    },
    paths: {
      shortest_m: 140,
      sheltered_m: 130,
      detour_pct: 0,
      shade_ratio: 0.15,
    },
    exposure_gaps: [],
    provenance: "test",
    data_as_of: "2026-08-05",
  };

  it("extracts shelter evidence from PostalGeom", () => {
    const evidence = extractShelterEvidence(sampleGeom);
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0].isCovered).toBe(true);
    expect(evidence[0].sourceClass).toBe("lta_covered_linkway");
  });

  it("segments live route along known shelter evidence without fabricating a score", () => {
    const routeCoords: LatLng[] = [
      [1.3501, 103.8501],
      [1.3503, 103.8503],
      [1.3505, 103.8505],
      [1.3510, 103.8510],
    ];

    const result = scoreLiveRoute({
      postal: "560109",
      originCoords: { lat: 1.3501, lng: 103.8501 },
      targetStop: {
        id: "bus:54009",
        name: "Test Bus Stop",
        kind: "bus_stop",
        coordinates: [103.8510, 1.3510],
      },
      routeCoordinates: routeCoords,
      baseScore: sampleScore,
      baseGeom: sampleGeom,
    });

    expect(result.score.state).toBe("NOT_YET_SCORED");
    expect(result.score.total).toBeNull();
    expect(result.score.subscores).toBeNull();
    expect(result.score.total).not.toBe(sampleScore.total);
    expect(result.score.subscores).not.toEqual(sampleScore.subscores);
    expect(result.score.paths?.shortest_m).toBeGreaterThan(0);
    expect(result.score.paths?.covered_ratio).toBeGreaterThan(0.5);
    expect(result.score.paths?.routing_type).toBe("live_onemap_preview");
    expect(result.score.provenance).toMatchObject({
      source: "live_onemap_preview",
      authoritative_score: false,
      reason:
        "Clicked transit POI has preview shelter-map evidence only; published locked scores come from the published shelter-map data.",
    });
    expect(result.geom.route_segments?.sheltered?.length).toBeGreaterThan(0);
    expect(result.geom.shortest).toBeTruthy();
  });

  it("segments exposed route far from shelter as exposed with exposure gaps", () => {
    const exposedCoords: LatLng[] = [
      [1.3700, 103.8700],
      [1.3720, 103.8720],
      [1.3740, 103.8740],
    ];

    const result = scoreLiveRoute({
      postal: "560109",
      originCoords: { lat: 1.3700, lng: 103.8700 },
      targetStop: {
        id: "bus:99999",
        name: "Exposed Stop",
        kind: "bus_stop",
        coordinates: [103.8740, 1.3740],
      },
      routeCoordinates: exposedCoords,
      baseScore: sampleScore,
      baseGeom: sampleGeom,
    });

    expect(result.score.state).toBe("NOT_YET_SCORED");
    expect(result.score.paths?.covered_ratio).toBe(0);
    expect(result.score.paths?.sheltered_m).toBe(result.score.paths?.shortest_m);
    expect(result.score.paths?.covered_m).toBe(0);
    expect(walkMetrics(result.score).distance).toBeGreaterThan(0);
    expect(result.geom.exposure_gaps.length).toBeGreaterThan(0);
    expect(result.score.subscores).toBeNull();
  });

  it("keeps routed length, covered length and direct displacement distinct on a bent preview", () => {
    const coords: LatLng[] = [[1.3501, 103.8501], [1.351, 103.851], [1.354, 103.851]];
    const beforeScore = structuredClone(sampleScore);
    const beforeGeom = structuredClone(sampleGeom);
    const result = scoreLiveRoute({
      postal: "560109", originCoords: { lat: coords[0][0], lng: coords[0][1] },
      targetStop: { id: "bus:test", name: "Bent route", kind: "bus_stop", coordinates: [103.851, 1.354] },
      routeCoordinates: coords, baseScore: sampleScore, baseGeom: sampleGeom,
    });
    const routed = Math.round(haversineMeters(...coords[0], ...coords[1]) + haversineMeters(...coords[1], ...coords[2]));
    const covered = Math.round(haversineMeters(...coords[0], ...coords[1]));
    expect(result.score.paths?.sheltered_m).toBe(routed);
    expect(result.score.paths?.covered_m).toBe(covered);
    expect(result.score.paths?.shortest_m).toBe(routed);
    expect(result.score.best_node?.straight_line_m).toBe(Math.round(haversineMeters(1.3501, 103.8501, 1.354, 103.851)));
    expect(result.score.best_node?.straight_line_m).toBeLessThan(routed);
    expect(result.score.paths?.covered_ratio).toBeLessThan(1);
    expect(result.score.paths?.covered_ratio).toBeGreaterThan(0);
    expect(result.score.total).toBeNull();
    expect(result.score.subscores).toBeNull();
    expect(result.score.provenance).not.toBe(sampleScore.provenance);
    expect(result.score.candidates ?? []).toEqual([]);
    expect(result.score.route_options).toBeUndefined();
    expect(sampleScore).toEqual(beforeScore);
    expect(sampleGeom).toEqual(beforeGeom);
  });

  it.each([
    [], [[1.35, 103.85]], [[1.35, 103.85], [1.35, 103.85]],
    [[1.35, 103.85], [NaN, 103.86]], [[1.35, 103.85], [1.36, Infinity]],
    [[1.35, 103.85], [91, 103.86]], [[1.35, 103.85], [1.36, 181]],
    [[1.35, 103.85], [NaN, 103.86], [1.37, 103.87]],
  ].map((routeCoordinates, index) => ({ routeCoordinates, index })))("rejects invalid/degenerate route coordinates instead of inventing a line: $index", ({ routeCoordinates }) => {
    expect(() => scoreLiveRoute({
      postal: "560109", originCoords: { lat: 1.35, lng: 103.85 },
      targetStop: { id: "bus:test", name: "Test", kind: "bus_stop", coordinates: [103.87, 1.37] },
      routeCoordinates: routeCoordinates as LatLng[], baseScore: sampleScore,
    })).toThrow(/route/i);
  });

  it("rejects invalid endpoint metadata rather than publishing a nonfinite direct distance", () => {
    expect(() => scoreLiveRoute({
      postal: "560109", originCoords: { lat: NaN, lng: 103.85 },
      targetStop: { id: "bus:test", name: "Test", kind: "bus_stop", coordinates: [103.851, 1.351] },
      routeCoordinates: sampleShelterPoints,
    })).toThrow(/coordinates/i);
  });

  it("does not inherit candidates, route options, total, subscores or authoritative provenance from a real base record", () => {
    const base = structuredClone(fixture['scores/DOWNTOWN_CORE_PART_001.json'][0]) as unknown as ScoreRecord;
    const before = structuredClone(base);
    expect(base.candidates!.length).toBeGreaterThan(0);
    expect(base.route_options?.bus).toBeDefined();
    const result = scoreLiveRoute({
      postal: base.postal, originCoords: { lat: 1.3501, lng: 103.8501 },
      targetStop: { id: "mrt:new", name: "Preview MRT exit", kind: "mrt_exit", coordinates: [103.851, 1.351] },
      routeCoordinates: sampleShelterPoints, baseScore: base, baseGeom: sampleGeom,
    });
    expect(result.score.candidates).toBeUndefined();
    expect(result.score.route_options).toBeUndefined();
    expect(result.score.total).toBeNull();
    expect(result.score.subscores).toBeNull();
    expect(result.score.provenance).not.toHaveProperty('scoring_fingerprints');
    expect(result.score.provenance).toMatchObject({ source: 'live_onemap_preview', authoritative_score: false });
    expect(result.score.best_node?.type).toBe('mrt_lrt_exit');
    expect(result.score.paths?.shortest_covered_ratio).toBe(result.score.paths?.covered_ratio);
    expect(result.geom.shortest).toBe(result.geom.sheltered);
    expect(walkMetrics(result.score, true).coverage).toBe(walkMetrics(result.score).coverage);
    expect(walkMetrics(result.score, true).uncovered).toBeNull();
    expect(base).toEqual(before);
  });
});
