import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ScoreRecord } from '../types';
import fixture from './fixtures/published-options.json';
import provenance from './fixtures/published-options.provenance.json';
import sourceIdentities from './fixtures/published-walks.provenance.json';

const records = fixture['scores/DOWNTOWN_CORE_PART_001.json'] as ScoreRecord[];
const geometry = fixture['geom/h3/886520db39fffff.json'][0];

function record(postal: string): ScoreRecord {
  const found = records.find(row => row.postal === postal);
  if (!found) throw new Error(`Missing fixture record: ${postal}`);
  return found;
}

const published = record('018956');
const unrouted = record('018990');
const missing = record('079908');

describe('T04 reduced published option evidence contract', () => {
  it('contains exactly the three scoped real score records and one geometry record', () => {
    expect(records.map(row => row.postal)).toEqual(['018956', '018990', '079908']);
    expect(fixture['geom/h3/886520db39fffff.json']).toHaveLength(1);
    expect(geometry.postal).toBe('018956');
  });

  it('matches the recorded fixture bytes and SHA without reading production data', () => {
    const bytes = readFileSync(new URL('./fixtures/published-options.json', import.meta.url));
    expect(bytes.length).toBe(provenance.fixtureBytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(provenance.fixtureSha256);
  });

  it('retains all four verified source identities, including the compressed prefix source', () => {
    expect(Object.keys(provenance.sources)).toEqual([
      'manifest.json',
      'scores/DOWNTOWN_CORE_PART_001.json',
      'geom/h3/886520db39fffff.json',
      'geom/postal-prefix/079.json',
    ]);
    for (const [key, identity] of Object.entries(provenance.sources)) {
      expect(identity).toEqual(sourceIdentities.sources[key as keyof typeof sourceIdentities.sources]);
      expect(identity.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(identity.decodedSha256).toMatch(/^[a-f0-9]{64}$/);
    }
    const prefix = provenance.sources['geom/postal-prefix/079.json'];
    expect(prefix.path).toMatch(/\.json\.gz$/);
    expect(prefix.sha256).not.toBe(prefix.decodedSha256);
  });

  it('keeps global manifest counts distinct from sample cardinality', () => {
    expect(fixture['manifest.json']).toEqual({
      generated_at: '2026-08-05T14:00:15.974693+00:00',
      data_as_of: '2026-08-01T21:49:20.977890+00:00',
      provenance: {
        record_count: 124443,
        state_counts: {
          NOT_YET_SCORED: 476,
          NO_TRANSIT_IN_RANGE: 9827,
          SCORED: 95157,
          SCORED_PARTIAL: 18983,
        },
      },
    });
  });

  it('preserves the default routed distance separately from direct distance and covered metres', () => {
    expect(published.best_node).toMatchObject({
      type: 'bus_stop', exit: '03509', routed_m: 81.2, straight_line_m: 56.3,
    });
    expect(published.paths).toMatchObject({
      shortest_m: 81.2, sheltered_m: 81.2, covered_m: 44.7,
      covered_ratio: 0.551, shortest_covered_ratio: 0.551, routing_type: 'sheltered',
    });
  });

  it('retains all five candidate identities and original metrics without ranking them', () => {
    expect(published.candidates?.map(candidate => ({
      id: candidate.node_id,
      type: candidate.node_type,
      direct: candidate.direct_distance_m,
      shortest: candidate.paths.shortest_m,
      sheltered: candidate.paths.sheltered_m,
      covered: candidate.paths.covered_ratio,
      trust: candidate.route_trust,
    }))).toEqual([
      { id: 'mrt:21624', type: 'mrt_lrt_exit', direct: 52.5, shortest: 109.2, sheltered: 109.2, covered: 0, trust: 'graph_routed_mrt_lrt_exit_with_access_connector' },
      { id: 'bus:03509', type: 'bus_stop', direct: 56.3, shortest: 81.2, sheltered: 81.2, covered: 0.551, trust: 'graph_routed_bus_stop' },
      { id: 'mrt:21678', type: 'mrt_lrt_exit', direct: 63.1, shortest: 110, sheltered: 110, covered: 0, trust: 'graph_routed_mrt_lrt_exit_with_access_connector' },
      { id: 'bus:03511', type: 'bus_stop', direct: 140.4, shortest: 180.2, sheltered: 180.2, covered: 0, trust: 'graph_routed_bus_stop' },
      { id: 'bus:03519', type: 'bus_stop', direct: 202.7, shortest: 229.2, sheltered: 229.2, covered: 0, trust: 'graph_routed_bus_stop' },
    ]);
  });

  it('pairs each candidate geometry reference with the original matching geometry key', () => {
    expect(Object.keys(geometry.candidates).sort()).toEqual(
      published.candidates!.map(candidate => candidate.node_id).sort(),
    );
    for (const candidate of published.candidates!) {
      expect(candidate.geometry_ref).toBe(`${published.postal}_${candidate.node_id}`);
      const option = geometry.candidates[candidate.node_id as keyof typeof geometry.candidates];
      expect(option.shortest.length).toBeGreaterThan(0);
      expect(option.sheltered.length).toBeGreaterThan(0);
      expect(option.shortest_parts).toHaveLength(3);
      expect(option.sheltered_parts).toHaveLength(3);
      expect(option.exposure_gaps.length).toBeGreaterThan(0);
      expect(candidate).not.toHaveProperty('exposure_gaps');
      expect(candidate.paths).not.toHaveProperty('shortest_covered_ratio');
    }
  });

  it('retains category defaults and a MRT default absent from the five candidate summaries', () => {
    expect(Object.keys(published.route_options!)).toEqual(['best_transit', 'bus', 'mrt_lrt']);
    expect(Object.keys(geometry.route_options)).toEqual(['best_transit', 'bus', 'mrt_lrt']);
    const mrt = published.route_options!.mrt_lrt!;
    expect(mrt.best_node).toMatchObject({
      type: 'mrt_lrt_exit', name: 'BAYFRONT MRT STATION Exit E',
      station: 'BAYFRONT MRT STATION', exit: 'Exit E', routed_m: 293.6,
    });
    expect(mrt.paths).toMatchObject({
      shortest_m: 293.6, sheltered_m: 308.4, covered_ratio: 0.241, shortest_covered_ratio: 0,
    });
    expect(mrt.exposure_gaps?.map(gap => gap.len_m)).toEqual([135.8, 98.2]);
    expect(published.candidates!.some(candidate => candidate.node_name === mrt.best_node!.name)).toBe(false);
    expect(geometry.route_options.mrt_lrt.shortest.length).toBeGreaterThan(0);
    expect(geometry.route_options.mrt_lrt.sheltered.length).toBeGreaterThan(0);
  });

  it('exposes the same bus destination at default, category and candidate levels for later deduplication', () => {
    const candidate = published.candidates!.find(option => option.node_id === 'bus:03509')!;
    expect(candidate.node_id).toBe(`bus:${published.best_node!.exit}`);
    expect(candidate.node_name).toBe(published.best_node!.name);
    expect(published.route_options!.best_transit!.best_node).toEqual(published.best_node);
    expect(published.route_options!.bus!.best_node).toEqual(published.best_node);
    expect(published.route_options!.bus!.paths).toEqual(published.paths);
    expect(candidate.paths.sheltered_m).toBe(published.paths!.sheltered_m);
    expect(candidate.paths.covered_ratio).toBe(published.paths!.covered_ratio);
    expect(geometry.candidates['bus:03509'].sheltered).toBe(geometry.sheltered);
  });

  it('preserves original default score gaps instead of replacing them with geometry fragments', () => {
    expect(published.exposure_gaps?.map(gap => gap.len_m)).toEqual([16.3, 20.2]);
    expect(published.exposure_gaps?.map(gap => gap.location)).toEqual([
      { lat: 1.282693, lon: 103.859975 },
      { lat: 1.283142, lon: 103.860115 },
    ]);
    expect(published.route_options!.bus!.exposure_gaps).toEqual(published.exposure_gaps);
    expect(geometry.exposure_gaps.map(gap => gap.len_m)).toEqual([16.3, 11, 9.1]);
    const fragments = geometry.candidates['bus:03509'].exposure_gaps;
    expect(fragments.map(gap => gap.len_m)).toEqual([16.3, 11, 9.1]);
    expect(published.exposure_gaps!.reduce((sum, gap) => sum + gap.len_m, 0)).toBeCloseTo(36.5, 10);
    expect(fragments.reduce((sum, gap) => sum + gap.len_m, 0)).toBeCloseTo(36.4, 10);
    expect(Math.max(...published.exposure_gaps!.map(gap => gap.len_m))).toBe(20.2);
    expect(Math.max(...fragments.map(gap => gap.len_m))).toBe(16.3);
  });

  it('retains alternate geometry fragments and their part indexes without synthesizing logical gaps', () => {
    const fragments = geometry.candidates['mrt:21678'].exposure_gaps;
    expect(fragments.map(gap => gap.len_m)).toEqual([43.3, 50.3, 16.3]);
    expect(fragments.map(gap => gap.part_index)).toEqual([0, 1, 2]);
    expect(fragments.every(gap => gap.geom.length > 0)).toBe(true);
    expect(fragments.every(gap => !Object.hasOwn(gap, 'location'))).toBe(true);
  });

  it('preserves the actual unrouted candidate despite positive distances and a geometry reference', () => {
    expect(unrouted.state).toBe('SCORED_PARTIAL');
    expect(unrouted.best_node).toMatchObject({ routed_m: null, straight_line_m: 222.5 });
    expect(unrouted.candidates).toHaveLength(1);
    expect(unrouted.candidates![0]).toMatchObject({
      node_id: 'bus:03539', direct_distance_m: 222.5,
      geometry_ref: '018990_bus:03539',
      route_trust: 'direct_bus_fallback_unrouted',
      routing_type: 'direct_bus_fallback_unrouted', state: 'SCORED_PARTIAL',
      paths: { shortest_m: 222.5, sheltered_m: 222.5, covered_ratio: null, shade_ratio: null },
    });
    expect(unrouted.provenance).toHaveProperty(
      'direct_bus_fallback.geometry', 'straight_line_origin_to_bus_stop_not_pedestrian_route',
    );
  });

  it('distinguishes missing metrics from true zero coverage without inventing availability', () => {
    expect(published.candidates!.find(candidate => candidate.node_id === 'mrt:21624')!.paths.covered_ratio).toBe(0);
    expect(unrouted.candidates![0].paths.covered_ratio).toBeNull();
    expect(unrouted.paths).not.toHaveProperty('covered_ratio');
    expect(unrouted.exposure_gaps).toEqual([]);
    expect(unrouted.route_options!.mrt_lrt!.paths).toBeNull();
    expect(unrouted.route_options!.mrt_lrt!.exposure_gaps).toBeNull();
    expect(missing.paths).toBeNull();
    expect(missing.exposure_gaps).toBeNull();
  });

  it('retains the missing-evidence reason and an honestly empty filtered geometry index', () => {
    expect(missing.state).toBe('NO_TRANSIT_IN_RANGE');
    expect(missing.best_node).toBeNull();
    expect(missing.total).toBeNull();
    expect(missing.subscores).toBeNull();
    expect(missing).not.toHaveProperty('candidates');
    expect(missing).not.toHaveProperty('route_options');
    expect(missing.provenance).toHaveProperty('reason', 'all_numeric_transit_candidates_rejected_by_bus_route_trust_gate');
    expect(missing.provenance).toHaveProperty('untrusted_bus_routes.reason_counts.dominant_unrouted_bus_endpoint_snap', 1);
    expect(fixture['geom/postal-prefix/079.json']).toEqual({});
  });

  it('keeps legacy record provenance separate from candidate trust and geometry evidence', () => {
    for (const row of records) {
      expect(row.data_as_of).toBe('2026-08-01T21:49:20.977890+00:00');
      expect(row.provenance).toHaveProperty('source_hashes');
      expect(row.provenance).toHaveProperty('scoring_fingerprints');
      expect(row.provenance).not.toHaveProperty('scoring_fingerprint_digest');
      expect(row.provenance).not.toHaveProperty('scoring_input_digest');
      expect(row.provenance).not.toHaveProperty('network_digest');
      for (const candidate of row.candidates ?? []) {
        expect(candidate).not.toHaveProperty('provenance');
        expect(candidate).not.toHaveProperty('total');
        expect(candidate).not.toHaveProperty('subscores');
      }
    }
  });

  it('documents reductions and omits route segments without deleting route or gap geometry', () => {
    for (const option of [geometry, ...Object.values(geometry.route_options), ...Object.values(geometry.candidates)]) {
      expect(option).not.toHaveProperty('route_segments');
      expect(option.sheltered.length).toBeGreaterThan(0);
      expect(Array.isArray(option.exposure_gaps)).toBe(true);
    }
    expect(provenance.reduction.some(note => note.includes('Omit route_segments'))).toBe(true);
    expect(provenance.observations.defaultScoreGapLengths).toEqual([16.3, 20.2]);
    expect(provenance.observations.sameCandidateGeometryGapLengths).toEqual([16.3, 11, 9.1]);
    expect(provenance.observations.categoryMrtDefaultAppearsInRetainedCandidates).toBe(false);
  });
});
