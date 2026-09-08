import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { encodePolyline } from '../polyline';
import {
  normalizePublishedTransitOptions,
  type MetricCapability,
  type PublishedTransitCategory,
  type PublishedTransitNormalizationInput,
  type PublishedTransitOption,
} from '../published-transit-options';
import fixture from './fixtures/published-options.json';

// Synthetic mutations deliberately violate the JSON boundary, not the typed producer API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mutable = Record<string, any>;
vi.mock('node:fs', () => { throw new Error('Normalizer must not read files'); });
vi.mock('node:fs/promises', () => { throw new Error('Normalizer must not read files'); });
vi.mock('fs', () => { throw new Error('Normalizer must not read files'); });
vi.mock('fs/promises', () => { throw new Error('Normalizer must not read files'); });

const bundle = 'generated_20260805_prefer_scored_routed';
const records = fixture['scores/DOWNTOWN_CORE_PART_001.json'];
const realGeom = fixture['geom/h3/886520db39fffff.json'][0];
const clone = <T>(v: T): T => structuredClone(v);
const line = encodePolyline([[1.3, 103.8], [1.301, 103.801]]);
const otherLine = encodePolyline([[1.3, 103.8], [1.302, 103.802]]);
const baseTypes = ['sheltered', 'shortest_fallback', 'shortest_due_to_detour'];
const typesFor = (category: PublishedTransitCategory) => [...baseTypes, ...baseTypes.map(base => `${base}_with_${category === 'bus' ? 'bus_stop' : 'mrt_lrt_exit'}_access_connector`)];
function freeze(value: unknown): void {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return;
  Object.values(value).forEach(freeze);
  Object.freeze(value);
}
function input(category: PublishedTransitCategory = 'bus', postal = '018956'): PublishedTransitNormalizationInput {
  return {
    bundle, postal, category,
    score: clone(records.find(row => row.postal === postal)),
    geometry: postal === '018956' ? clone(realGeom) : null,
    scoreContext: { bundle, postal }, geometryContext: { bundle, postal },
  };
}
function score(i: PublishedTransitNormalizationInput): Mutable { return i.score as Mutable; }
function geom(i: PublishedTransitNormalizationInput): Mutable { return i.geometry as Mutable; }
function run(i: PublishedTransitNormalizationInput) {
  const before = clone(i);
  freeze(i);
  const result = normalizePublishedTransitOptions(i);
  expect(i).toEqual(before);
  expect(fetch).not.toHaveBeenCalled();
  return result;
}
function key(category: PublishedTransitCategory, role: string, id?: string) {
  return JSON.stringify(['pw', 1, bundle, '018956', category, role, ...(id ? [id] : [])]);
}
function defaultOption(result: ReturnType<typeof run>): PublishedTransitOption {
  const found = result.options.find(option => JSON.parse(option.key)[5] === 'default');
  if (!found) throw new Error('Default missing');
  return found;
}
function candidateOnly(category: PublishedTransitCategory = 'bus'): PublishedTransitNormalizationInput {
  const i = input(category);
  const row = score(i);
  row.candidates = [clone(row.candidates.find((c: Mutable) => c.node_id === (category === 'bus' ? 'bus:03509' : 'mrt:21624')))];
  delete row.route_options;
  // Keep a legitimate other-category top default, excluding it from this pool.
  row.best_node = { type: category === 'bus' ? 'mrt_lrt_exit' : 'bus_stop' };
  return i;
}
function defaultOnly(category: PublishedTransitCategory = 'bus'): PublishedTransitNormalizationInput {
  const i = input(category);
  score(i).candidates = [];
  score(i).best_node = { type: category === 'bus' ? 'mrt_lrt_exit' : 'bus_stop' };
  return i;
}
function one(i: PublishedTransitNormalizationInput): PublishedTransitOption {
  const result = run(i);
  expect(result.options).toHaveLength(1);
  return result.options[0];
}
function normalizedSurface(result: ReturnType<typeof run>) {
  return { ...result, options: result.options.map(option => ({ ...option,
    selectedSource: option.selectedSource.selectionRef,
    sources: option.sources.map(source => source.selectionRef),
  })) };
}
function value(m: MetricCapability): number | null { return m.status === 'valid' ? m.value : null; }
function setCandidateGeometry(i: PublishedTransitNormalizationInput, patch: Mutable): void {
  const id = score(i).candidates[0].node_id;
  Object.assign(geom(i).candidates[id], patch);
}
beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })));
afterEach(() => vi.unstubAllGlobals());

describe('T04 real evidence and stable source identity', () => {
  it('N01 keeps the full three-bus/three-MRT pool without winner roles', () => {
    for (const category of ['bus', 'mrt_lrt'] as const) {
      const result = run(input(category));
      expect(result.contextStatus).toBe('valid');
      expect(result.options).toHaveLength(3);
      for (const option of result.options) {
        expect(option.classification).toBe('routed');
        expect(option.geometry.sheltered.status).toBe('complete');
        expect(option.distanceRankable).toBe(true);
        expect(option.coverageRankable).toBe(true);
        expect(option).not.toHaveProperty('winner');
        expect(option).not.toHaveProperty('roles');
      }
    }
  });
  it('N02 keeps exact versioned default keys, aliases and separate source locators', () => {
    const bus = defaultOption(run(input()));
    expect(bus.key).toBe(key('bus', 'default'));
    expect(bus.aliases).toEqual(['bus:03509']);
    expect(bus.selectionRef).toEqual({ kind: 'category_default', category: 'bus' });
    expect(bus.sources.map(source => source.selectionRef.kind)).toEqual(['category_default', 'top_default', 'candidate']);
    const mrt = defaultOption(run(input('mrt_lrt')));
    expect(mrt.key).toBe(key('mrt_lrt', 'default'));
    expect(mrt.aliases).toEqual([]);
    expect(mrt.name).toBe('BAYFRONT MRT STATION Exit E');
    expect(mrt.selectionRef).toEqual({ kind: 'category_default', category: 'mrt_lrt' });
    expect(run(input()).options.find(o => o.aliases.includes('bus:03511'))?.key).toBe(key('bus', 'candidate', 'bus:03511'));
  });
  it('N03 preserves whole default logical gaps, not fragment-derived longest/total', () => {
    const option = defaultOption(run(input()));
    expect(option.gaps.sheltered.logical.entries.map(g => value(g.length))).toEqual([16.3, 20.2]);
    expect(value(option.gaps.sheltered.logical.total_m)).toBe(36.5);
    expect(value(option.gaps.sheltered.logical.longest_m)).toBe(20.2);
    expect(option.gaps.sheltered.fragments.entries.map(g => value(g.length))).toEqual([16.3, 11, 9.1]);
    expect(option.diagnostics.join(' ')).not.toContain('conflict');
  });
  it('N04 does not promote real positive-distance/ref unrouted evidence or invent range reasons', () => {
    const result = run(input('bus', '018990'));
    const option = defaultOption(result);
    expect(option.status).toBe('published_unrouted');
    expect(value(option.metrics.sheltered_m)).toBe(222.5);
    expect(option.retainable).toBe(false);
    expect(option.gaps.sheltered.logical.total_m.status).toBe('missing');
    const missing = run(input('bus', '079908'));
    expect(missing.options.every(o => !o.retainable)).toBe(true);
    expect(missing.contextProvenance).toHaveProperty('reason', 'all_numeric_transit_candidates_rejected_by_bus_route_trust_gate');
    expect(missing.options.some(o => o.diagnostics.some(d => d.includes('outside_range')))).toBe(false);
  });
});

describe('T04 source-backed routing/category matrix (synthetic mutations)', () => {
  for (const category of ['bus', 'mrt_lrt'] as const) {
    const nodeType = category === 'bus' ? 'bus_stop' : 'mrt_lrt_exit';
    for (const suffix of ['', '_with_access_connector']) for (const type of typesFor(category)) for (const state of ['SCORED', 'SCORED_PARTIAL']) {
      it(`N05 accepts ${category} graph_routed_${nodeType}${suffix} / ${type} / ${state}`, () => {
        const i = candidateOnly(category);
        Object.assign(score(i).candidates[0], { route_trust: `graph_routed_${nodeType}${suffix}`, routing_type: type, state });
        const option = one(i);
        expect(option.classification).toBe('routed');
        expect(option.distanceRankable && option.coverageRankable).toBe(true);
      });
    }
    for (const type of typesFor(category)) it(`N06 accepts default ${category} / ${type} without candidate trust`, () => {
      const i = defaultOnly(category);
      score(i).route_options[category].paths.routing_type = type;
      const option = one(i);
      expect(option.classification).toBe('routed');
      expect(option.retainable).toBe(true);
    });
    for (const kind of ['default', 'candidate']) it(`N07 preserves path-bearing NO_TRANSIT_IN_RANGE ${category} ${kind}`, () => {
      const i = kind === 'candidate' ? candidateOnly(category) : defaultOnly(category);
      const row = kind === 'candidate' ? score(i).candidates[0] : score(i).route_options[category];
      row.state = 'NO_TRANSIT_IN_RANGE';
      row.provenance = { reason: 'no_transit_within_configured_routed_distance' };
      const option = one(i);
      expect(option.retainable).toBe(true);
      expect(option.diagnostics).toContain('scoring_eligibility_unavailable');
      expect(option.selectedSource.raw).toHaveProperty('provenance.reason', 'no_transit_within_configured_routed_distance');
    });
  }
  for (const field of ['route_trust', 'routing_type']) for (const v of [undefined, null, '', 'graph_routed', 'unlisted', 'sheltered_with_mrt_lrt_exit_access_connector']) {
    it(`N08 does not guess bus ${field}=${String(v)}`, () => {
      const i = candidateOnly(); score(i).candidates[0][field] = v;
      expect(one(i).status).toBe('trust_unclassified');
    });
  }
  for (const category of ['bus', 'mrt_lrt'] as const) for (const state of ['NOT_YET_SCORED', 'UNKNOWN', null, 12]) {
    it(`N08 rejects candidate ${category} state=${state}`, () => {
      const i = candidateOnly(category); score(i).candidates[0].state = state;
      const option = one(i);
      expect(option.retainable).toBe(false);
      if (state !== 'NOT_YET_SCORED') expect(option.diagnostics).toContain('state_invalid');
    });
  }
  for (const kind of ['default', 'candidate']) for (const state of [['SCORED'], { toString: 0 }, {}, null, 12]) it(`N08 ${kind} rejects malformed state ${JSON.stringify(state)} without coercion`, () => {
    const i = kind === 'candidate' ? candidateOnly() : defaultOnly();
    const row = kind === 'candidate' ? score(i).candidates[0] : score(i).route_options.bus;
    row.state = state;
    const option = one(i);
    expect(option.diagnostics).toContain('state_invalid');
    expect(option.retainable).toBe(false);
  });
  for (const kind of ['default', 'candidate']) it(`N08 direct/unrouted ${kind} still diagnoses malformed state`, () => {
    const i = kind === 'candidate' ? candidateOnly() : defaultOnly();
    const row = kind === 'candidate' ? score(i).candidates[0] : score(i).route_options.bus;
    row.state = ['SCORED'];
    if (kind === 'candidate') { row.route_trust = 'direct_bus_fallback_unrouted'; row.routing_type = 'direct_bus_fallback_unrouted'; }
    else row.paths.routing_type = 'direct_bus_fallback_unrouted';
    const option = one(i);
    expect(option.diagnostics).toContain('state_invalid');
    expect(option.retainable).toBe(false);
  });
  for (const distance of [undefined, null, '81.2', NaN, Infinity, -1, 0]) it(`N08 supported default with all distances ${String(distance)} keeps independent coverage`, () => {
    const i = defaultOnly(); const row = score(i).route_options.bus;
    row.best_node.routed_m = distance; row.paths.shortest_m = distance; row.paths.sheltered_m = distance;
    const option = one(i);
    expect(option.classification).toBe('routed');
    expect(option.coverageRankable).toBe(true);
    expect(option.distanceRankable).toBe(false);
    expect(option.retainable).toBe(true);
    for (const field of ['routed_m', 'shortest_m', 'sheltered_m'] as const) expect(option.metrics[field].status).toBe(distance == null ? 'missing' : 'invalid');
  });
  for (const field of ['route_trust', 'routing_type']) it(`N09 quarantines contradictory direct/graph ${field}`, () => {
    const i = candidateOnly(); score(i).candidates[0][field] = 'direct_bus_fallback_unrouted';
    const option = one(i);
    expect(option.status).toBe('evidence_conflict');
    expect(option.diagnostics).toContain('routing_trust_conflict');
    expect(option.retainable).toBe(false);
  });
  for (const marker of ['paths', 'source', 'routing_type', 'string', 'authoritative']) it(`N09 global ${marker} preview veto includes retained candidates`, () => {
    const i = input();
    if (marker === 'paths') score(i).paths.routing_type = 'live_onemap_preview';
    else if (marker === 'string') score(i).provenance = 'live_onemap_preview';
    else score(i).provenance = marker === 'authoritative' ? { authoritative_score: false } : { [marker]: 'live_onemap_preview' };
    const result = run(i);
    expect(result.contextStatus).toBe('preview_only');
    expect(result.options.every(o => o.status === 'preview_only' && !o.retainable)).toBe(true);
  });
});

describe('T04 identity, aliases, precedence and quarantine (synthetic mutations)', () => {
  const contextMutations: [string, (i: Mutable) => void][] = [
    ['numeric postal', i => { i.postal = 18956; }], ['padded bundle', i => { i.bundle += ' '; }],
    ['empty bundle', i => { i.bundle = ''; }], ['unknown category', i => { i.category = 'best_transit'; }],
    ['wrong score bundle', i => { i.scoreContext.bundle = 'other'; }], ['wrong geometry bundle', i => { i.geometryContext.bundle = 'other'; }],
    ['wrong score postal', i => { i.score.postal = '018990'; }], ['wrong geom postal', i => { i.geometry.postal = '018990'; }],
    ['missing score context', i => { delete i.scoreContext; }], ['missing geometry context', i => { delete i.geometryContext; }],
    ['wrong source postal', i => { i.geometryContext.postal = '018990'; }], ['padded postal', i => { i.postal = '018956 '; }],
  ];
  for (const [name, mutate] of contextMutations) it(`N10 rejects ${name}`, () => {
    const i = input(); mutate(i);
    expect(run(i)).toMatchObject({ contextStatus: 'invalid', options: [], diagnostics: ['source_context_invalid'] });
  });
  for (const id of ['mrt:03509', 'bus:', 'bus: ', ' bus:03509', 'bus:03509\n', 'bus:\x7f', 3509, null]) it(`N10 rejects candidate ID ${JSON.stringify(id)}`, () => {
    const i = candidateOnly(); score(i).candidates[0].node_id = id;
    const result = run(i);
    expect(result.options).toHaveLength(0);
    expect(result.rejectedSources[0].reasons).toEqual(['identity_invalid']);
  });
  it('N10 does not coerce unknown node types or lose leading zero / opaque suffix identity', () => {
    const invalid = candidateOnly(); score(invalid).candidates[0].node_type = 'mrt_station';
    expect(run(invalid).rejectedSources).toHaveLength(1);
    expect(one(candidateOnly()).aliases).toEqual(['bus:03509']);
    const i = candidateOnly();
    score(i).candidates[0].node_id = 'bus:opaque:part';
    score(i).candidates[0].geometry_ref = '018956_bus:opaque:part';
    geom(i).candidates['bus:opaque:part'] = geom(i).candidates['bus:03509'];
    expect(one(i).key).toBe(key('bus', 'candidate', 'bus:opaque:part'));
  });
  it('N10 wrong-category default is invalid and cannot supply a bus alias', () => {
    const i = input(); score(i).route_options.bus.best_node.type = 'mrt_lrt_exit';
    const result = run(i);
    expect(defaultOption(result)).toMatchObject({ status: 'identity_invalid', aliases: [], retainable: false });
    expect(result.options.find(o => o.key === key('bus', 'top-default'))?.retainable).toBe(true);
  });
  it('N10 invalid category with no valid top cannot absorb a candidate under the default key', () => {
    const i = input();
    score(i).best_node = null;
    score(i).route_options.bus.best_node.type = 'mrt_lrt_exit';
    score(i).candidates = [score(i).candidates.find((c: Mutable) => c.node_id === 'bus:03509')];
    const result = run(i);
    expect(result.options).toHaveLength(2);
    expect(defaultOption(result)).toMatchObject({ status: 'identity_invalid', aliases: [], retainable: false });
    const candidate = result.options.find(o => o.key === key('bus', 'candidate', 'bus:03509'));
    expect(candidate).toMatchObject({ retainable: true, selectionRef: { kind: 'candidate', nodeId: 'bus:03509' } });
  });
  it('N11 optional POI arrival/order/labels cannot participate in normalization', () => {
    const i = input();
    const before = run(i);
    const unrelatedPois = [{ id: 'bus:03509', name: 'temporary' }];
    unrelatedPois.reverse(); unrelatedPois[0].name = 'late metadata'; unrelatedPois.push({ id: 'mrt:21624', name: 'other' });
    expect(run(i)).toEqual(before);
    expect(Object.keys(i)).not.toContain('pois');
  });
  it('N12 keeps fallback default key when category absent; retains distinct top when category unusable', () => {
    const fallback = input(); delete score(fallback).route_options.bus;
    expect(defaultOption(run(fallback)).selectionRef).toEqual({ kind: 'top_default' });
    const i = input();
    score(i).route_options.bus = null;
    const result = run(i);
    expect(defaultOption(result).retainable).toBe(false);
    const top = result.options.find(o => o.key === key('bus', 'top-default'))!;
    expect(top.selectionRef).toEqual({ kind: 'top_default' });
    expect(top.retainable).toBe(true);
  });
  function aliasInput(): PublishedTransitNormalizationInput {
    const i = input('mrt_lrt');
    score(i).candidates = [score(i).candidates.find((c: Mutable) => c.node_id === 'mrt:21624')];
    const c = score(i).candidates[0];
    const d = score(i).route_options.mrt_lrt;
    d.best_node.name = c.node_name; d.best_node.routed_m = c.paths.shortest_m;
    Object.assign(d.paths, c.paths);
    geom(i).route_options.mrt_lrt = clone(geom(i).candidates[c.node_id]);
    return i;
  }
  it('N13 aliases one exact MRT name+complete geometry, but not different geometry or station-only name', () => {
    const matched = defaultOption(run(aliasInput()));
    expect(matched.aliases).toEqual(['mrt:21624']);
    for (const mutation of ['geometry', 'name']) {
      const i = aliasInput();
      if (mutation === 'geometry') geom(i).route_options.mrt_lrt.sheltered_parts = [otherLine];
      else score(i).route_options.mrt_lrt.best_node.name = 'BAYFRONT MRT STATION';
      expect(defaultOption(run(i)).aliases).toEqual([]);
    }
  });
  it('N13 rejects ambiguous weak aliases and never merges two distinct known candidate IDs', () => {
    const i = aliasInput();
    const c = clone(score(i).candidates[0]); c.node_id = 'mrt:second'; c.geometry_ref = '018956_mrt:second';
    score(i).candidates.push(c); geom(i).candidates[c.node_id] = clone(geom(i).candidates['mrt:21624']);
    const result = run(i);
    expect(result.options).toHaveLength(3);
    expect(defaultOption(result).diagnostics).toContain('alias_ambiguous');
    expect(defaultOption(result).aliases).toEqual([]);
  });
  it('N13 a conflicting strong bus alias vetoes equal name/geometry matching', () => {
    const i = input(); score(i).route_options.bus.best_node.exit = '99999';
    const result = run(i);
    expect(defaultOption(result).aliases).toEqual(['bus:99999']);
    expect(result.options.find(o => o.key === key('bus', 'top-default'))?.aliases).toEqual(['bus:03509']);
  });
  for (const coverage of [null, 1.2, '0.551']) it(`N14 category coverage ${coverage} never filled from candidate`, () => {
    const i = input(); score(i).route_options.bus.paths.covered_ratio = coverage;
    const option = defaultOption(run(i));
    expect(option.selectionRef).toEqual({ kind: 'category_default', category: 'bus' });
    expect(option.metrics.covered_ratio.status).toBe(coverage === null ? 'missing' : 'invalid');
    expect(option.distanceRankable).toBe(true);
    expect(option.coverageRankable).toBe(false);
    expect(value(option.gaps.sheltered.logical.longest_m)).toBe(20.2);
  });
  it('N15 missing default geometry chooses a complete candidate whole record without borrowing logical gaps', () => {
    const i = input(); delete geom(i).route_options.bus;
    geom(i).sheltered_parts = []; geom(i).sheltered = null;
    const option = defaultOption(run(i));
    expect(option.key).toBe(key('bus', 'default'));
    expect(option.selectionRef).toEqual({ kind: 'candidate', nodeId: 'bus:03509' });
    expect(option.retainable).toBe(true);
    expect(option.gaps.sheltered.logical.reasons).toEqual(['logical_gaps_not_published']);
    expect(option.metrics.covered_m.status).toBe('missing');
  });
  for (const mutation of ['shortest_m', 'sheltered_m', 'covered_ratio', 'geometry', 'classification']) it(`N16 same-identity valid ${mutation} conflict quarantines, permutation stable`, () => {
    const i = input();
    const c = score(i).candidates.find((row: Mutable) => row.node_id === 'bus:03509');
    if (mutation === 'geometry') geom(i).candidates[c.node_id].sheltered_parts = [otherLine];
    else if (mutation === 'classification') { c.route_trust = 'direct_bus_fallback_unrouted'; c.routing_type = 'direct_bus_fallback_unrouted'; }
    else c.paths[mutation] += 0.1;
    const reversed = clone(i); score(reversed).candidates.reverse();
    const result = run(i);
    expect(normalizedSurface(run(reversed))).toEqual(normalizedSurface(result));
    expect(result.options.flatMap(o => o.sources).find(s => s.selectionRef.kind === 'top_default')?.raw).toBe(i.score);
    const option = defaultOption(result);
    expect(option.status).toBe('evidence_conflict');
    expect(option.distanceRankable || option.coverageRankable || option.retainable).toBe(false);
    expect(option.selectionRef.kind).toBe('category_default');
  });
  it('N16 default routed_m disagreement is local evidence conflict', () => {
    const i = defaultOnly(); score(i).route_options.bus.best_node.routed_m = 82;
    expect(one(i).diagnostics).toContain('default_routed_distance_conflict');
    expect(one(i).status).toBe('evidence_conflict');
  });
  it('N16 same-role missing-versus-known duplicates quarantine rather than select by array order', () => {
    const i = candidateOnly(); const c = clone(score(i).candidates[0]); c.paths.covered_ratio = null; score(i).candidates.push(c);
    const reverse = clone(i); score(reverse).candidates.reverse();
    expect(one(i).diagnostics).toContain('duplicate_representation_conflict');
    expect(run(reverse)).toEqual(run(i));
  });
  it('N17 malformed duplicate reference is rejected before precedence, not a valid-default poison', () => {
    const i = input(); const c = clone(score(i).candidates.find((row: Mutable) => row.node_id === 'bus:03509'));
    c.geometry_ref = 'wrong'; c.paths.sheltered_m = 999; score(i).candidates.push(c);
    const option = defaultOption(run(i));
    expect(option.retainable).toBe(true);
    expect(option.diagnostics).toContain('sheltered:geometry_reference_mismatch');
    expect(option.diagnostics.join(' ')).not.toContain('conflict');
  });
  it('N17 an unclassified alternative does not poison known routed default evidence', () => {
    const i = input(); const c = score(i).candidates.find((row: Mutable) => row.node_id === 'bus:03509');
    c.route_trust = 'unknown'; c.paths.sheltered_m = 999;
    const option = defaultOption(run(i));
    expect(option.retainable).toBe(true);
    expect(value(option.metrics.sheltered_m)).toBe(81.2);
  });
  for (const withDefault of [false, true]) for (const unsupported of ['trust', 'state']) it(`N17 unsupported duplicate ${unsupported}, default=${withDefault}, cannot assert a conflict`, () => {
    const i = withDefault ? input() : candidateOnly();
    const c = clone(score(i).candidates.find((row: Mutable) => row.node_id === 'bus:03509'));
    if (unsupported === 'trust') c.route_trust = 'unknown'; else c.state = ['SCORED'];
    c.paths.sheltered_m = 999;
    score(i).candidates.push(c);
    const reverse = clone(i); score(reverse).candidates.reverse();
    const result = run(i);
    expect(normalizedSurface(run(reverse))).toEqual(normalizedSurface(result));
    const option = result.options.find(o => o.aliases.includes('bus:03509'))!;
    expect(option.retainable).toBe(true);
    expect(option.diagnostics).toContain('trust_unclassified');
    expect(option.diagnostics.join(' ')).not.toContain('conflict');
    expect(value(option.metrics.sheltered_m)).toBe(81.2);
  });
  it('N17 cosmetic same-role duplicates collapse deterministically as whole evidence', () => {
    const i = candidateOnly(); const c = clone(score(i).candidates[0]); c.node_name = 'ZZ label'; c.provenance = { note: 'cosmetic only' }; score(i).candidates.push(c);
    const reverse = clone(i); score(reverse).candidates.reverse();
    expect(run(reverse)).toEqual(run(i));
    expect(one(i).retainable).toBe(true);
    expect(one(i).name).toBe('Bayfront Stn Exit B/MBS');
  });
  for (const invalid of ['state', 'future-trust', 'not-yet-scored']) {
    it(`N17 unsupported direct/graph duplicate ${invalid} cannot quarantine a valid walk`, () => {
      const i = input();
      const duplicate = clone(score(i).candidates.find((c: Mutable) => c.node_id === 'bus:03509'));
      duplicate.routing_type = 'direct_bus_fallback_unrouted';
      if (invalid === 'state') duplicate.state = ['SCORED'];
      if (invalid === 'future-trust') duplicate.route_trust = 'graph_routed_future';
      if (invalid === 'not-yet-scored') duplicate.state = 'NOT_YET_SCORED';
      score(i).candidates.push(duplicate);
      const option = defaultOption(run(i));
      expect(option.retainable).toBe(true);
      expect(option.diagnostics).toContain('trust_unclassified');
      expect(option.diagnostics.join(' ')).not.toContain('conflict');
      expect(value(option.metrics.sheltered_m)).toBe(81.2);
    });
  }
});

describe('T04 independent numeric capabilities (synthetic boundaries)', () => {
  const fields = ['shortest_m', 'sheltered_m', 'covered_ratio', 'shortest_covered_ratio', 'covered_m', 'direct_distance_m', 'routed_m'] as const;
  const invalids = [undefined, null, '2', true, false, {}, [], NaN, Infinity, -Infinity, -1];
  for (const field of fields) for (const [index, v] of invalids.entries()) it(`N18 ${field} boundary ${index}=${String(v)}`, () => {
    const i = defaultOnly(); const row = score(i).route_options.bus;
    if (field === 'direct_distance_m') row.best_node.straight_line_m = v;
    else if (field === 'routed_m') row.best_node.routed_m = v;
    else row.paths[field] = v;
    const capability = one(i).metrics[field];
    expect(capability.status).toBe(v == null ? 'missing' : 'invalid');
    expect(capability).not.toHaveProperty('value');
    if (typeof v === 'number' && !Number.isFinite(v)) expect(capability).toHaveProperty('reason', 'metric_nonfinite');
  });
  for (const field of ['shortest_m', 'sheltered_m', 'routed_m'] as const) it(`N18 zero ${field} is not an established zero walk`, () => {
    const i = defaultOnly(); const row = score(i).route_options.bus;
    if (field === 'routed_m') row.best_node.routed_m = 0; else row.paths[field] = 0;
    expect(one(i).metrics[field]).toMatchObject({ status: 'invalid', reason: 'zero_walk_length_unestablished' });
  });
  for (const field of ['covered_ratio', 'shortest_covered_ratio'] as const) for (const v of [0, -0, 1, -0.001, 1.001]) it(`N18 ${field} closed unit boundary ${v}`, () => {
    const i = defaultOnly(); score(i).route_options.bus.paths[field] = v;
    const capability = one(i).metrics[field];
    expect(capability.status).toBe(v >= 0 && v <= 1 ? 'valid' : 'invalid');
    if (capability.status === 'valid') expect(Object.is(capability.value, v)).toBe(true);
  });
  it('N18 preserves raw unrounded numbers and valid nonnegative zero lengths', () => {
    const i = defaultOnly(); const row = score(i).route_options.bus;
    row.paths.covered_m = 0; row.best_node.straight_line_m = 0; row.paths.covered_ratio = 0.551123456789;
    const option = one(i);
    expect(value(option.metrics.covered_m)).toBe(0);
    expect(value(option.metrics.direct_distance_m)).toBe(0);
    expect(value(option.metrics.covered_ratio)).toBe(0.551123456789);
  });
  it('N19 missing sheltered distance never filled from shortest/direct/covered_m, valid ratio survives', () => {
    const i = defaultOnly(); score(i).route_options.bus.paths.sheltered_m = null;
    const option = one(i);
    expect(option.metrics.sheltered_m.status).toBe('missing');
    expect(option.distanceRankable).toBe(false);
    expect(option.coverageRankable).toBe(true);
    expect(option.retainable).toBe(true);
    expect(value(option.metrics.shortest_m)).toBe(81.2);
    expect(value(option.metrics.direct_distance_m)).toBe(56.3);
  });
});

describe('T04 geometry is paired, strict, multipart and independently optional', () => {
  for (const mutation of ['null', 'absent', 'wrong', 'missing-entry']) it(`N20 candidate geometry ${mutation}`, () => {
    const i = candidateOnly(); const c = score(i).candidates[0];
    if (mutation === 'null') c.geometry_ref = null;
    if (mutation === 'absent') delete c.geometry_ref;
    if (mutation === 'wrong') c.geometry_ref = '018990_bus:03509';
    if (mutation === 'missing-entry') delete geom(i).candidates[c.node_id];
    const option = one(i);
    expect(option.retainable).toBe(false);
    expect(option.geometry.sheltered.reasons).toEqual([mutation === 'wrong' ? 'geometry_reference_mismatch' : mutation === 'missing-entry' ? 'geometry_missing' : 'geometry_reference_missing']);
  });
  const invalidPolylines = [
    ['alphabet-low', '!!!!'], ['alphabet-high', '\u007f???'], ['unterminated', '_'], ['overflow', '~~~~~~F???'],
    ['too-many-groups', '_______?'], ['odd-coordinate-count', '???'], ['out-of-range-lat', encodePolyline([[91, 103], [91.1, 103.1]])],
    ['out-of-range-lon', encodePolyline([[1, 181], [1.1, 181.1]])], ['degenerate', encodePolyline([[1, 103], [1, 103]])],
    ['single-point', encodePolyline([[1, 103]])], ['empty', ''],
  ];
  for (const [name, encoded] of invalidPolylines) it(`N21 rejects strict polyline ${name}`, () => {
    const i = candidateOnly(); setCandidateGeometry(i, { sheltered_parts: [encoded] });
    const option = one(i);
    expect(option.geometry.sheltered.status).toBe('invalid');
    expect(option.geometry.sheltered.signature).toBeNull();
    expect(option.retainable).toBe(false);
    expect(option.geometry.sheltered.reasons).toEqual([['degenerate', 'single-point'].includes(name) ? 'geometry_degenerate' : 'geometry_part_invalid']);
  });
  it('N21 valid boundary/repeated-position polylines retain all original coordinates', () => {
    const i = candidateOnly(); const encoded = encodePolyline([[-90, -180], [-90, -180], [90, 180]]);
    setCandidateGeometry(i, { sheltered_parts: [encoded] });
    const g = one(i).geometry.sheltered;
    expect(g.status).toBe('complete');
    expect(g.parts[0].points).toEqual([[-90, -180], [-90, -180], [90, 180]]);
    expect(g.signature).toBe(JSON.stringify([encoded]));
  });
  it('N22 partial multipart preserves valid indices without falling back to flattened geometry', () => {
    const i = candidateOnly(); setCandidateGeometry(i, { sheltered_parts: [line, 42, otherLine], sheltered: line });
    const option = one(i);
    expect(option.geometry.sheltered.status).toBe('partial');
    expect(option.geometry.sheltered.parts.map(p => p.sourceIndex)).toEqual([0, 2]);
    expect(option.geometry.sheltered.invalidPartIndices).toEqual([1]);
    expect(option.geometry.sheltered.signature).toBeNull();
    expect(option.retainable).toBe(false);
  });
  it('N22 all invalid parts retain no renderable geometry, despite valid flattened line', () => {
    const i = candidateOnly(); setCandidateGeometry(i, { sheltered_parts: [null, '_'], sheltered: line });
    expect(one(i).geometry.sheltered).toMatchObject({ status: 'invalid', parts: [], invalidPartIndices: [0, 1] });
  });
  for (const parts of [undefined, null, []]) it(`N23 absent/null/empty parts fallback ${JSON.stringify(parts)}`, () => {
    const i = candidateOnly(); setCandidateGeometry(i, { sheltered_parts: parts, sheltered: line });
    expect(one(i).geometry.sheltered.signature).toBe(JSON.stringify([line]));
  });
  for (const parts of ['', {}, 0]) it(`N23 present non-array parts reject ${JSON.stringify(parts)}`, () => {
    const i = candidateOnly(); setCandidateGeometry(i, { sheltered_parts: parts, sheltered: line });
    expect(one(i).geometry.sheltered.reasons).toEqual(['geometry_schema_invalid']);
  });
  it('N23 empty flattened route is missing with no authoritative parts, not malformed', () => {
    const i = candidateOnly(); setCandidateGeometry(i, { sheltered_parts: [], sheltered: '' });
    expect(one(i).geometry.sheltered).toMatchObject({ status: 'missing', reasons: ['geometry_missing'] });
  });
  it('N23 unused malformed flat line warns, complete authoritative parts survive', () => {
    const i = candidateOnly(); setCandidateGeometry(i, { sheltered_parts: [line], sheltered: '_' });
    const option = one(i);
    expect(option.geometry.sheltered.status).toBe('complete');
    expect(option.geometry.sheltered.reasons).toEqual(['unused_geometry_invalid']);
    expect(option.retainable).toBe(true);
  });
  it('N24 optional malformed segments and fragment geometry do not poison main geometry or score gaps', () => {
    const i = defaultOnly();
    geom(i).route_options.bus.route_segments = { sheltered: [{ geom: '_', len_m: 1, is_covered: true }] };
    geom(i).route_options.bus.exposure_gaps[0].geom = '_';
    const option = one(i);
    expect(option.retainable).toBe(true);
    expect(option.geometry.routeSegmentsAvailable).toBe(false);
    expect(option.geometry).not.toHaveProperty('route_segments');
    expect(option.geometry.sheltered).not.toHaveProperty('route_segments');
    expect(option.diagnostics).toContain('optional_route_segments_invalid');
    expect(value(option.gaps.sheltered.logical.longest_m)).toBe(20.2);
    expect(option.gaps.sheltered.fragments.status).toBe('partial');
    expect(option.gaps.sheltered.fragments.entries[0].highlightable).toBe(false);
  });
  it('N24 T06 enables validated optional segments only with exact full-base association', () => {
    const i = candidateOnly();
    const source = geom(i).candidates['bus:03509'];
    // Synthetic segments reuse real base parts; these len_m values are not claimed as published.
    source.route_segments = { sheltered: source.sheltered_parts.map((encoded: string) => ({ geom: encoded, len_m: 1, is_covered: true })) };
    const option = one(i);
    expect(option.geometry.routeSegmentsAvailable).toBe(true);
    expect(option.geometry.routeSegments.sheltered.status).toBe('complete');
    expect(option.geometry).not.toHaveProperty('route_segments');
    expect(option.diagnostics).not.toContain('optional_route_segments_invalid');
    expect(option.selectedSource.rawGeometry).toHaveProperty('route_segments');
  });
});

describe('T06 optional segment capability (synthetic segments, no scoring)', () => {
  function segmentedInput() {
    const i = candidateOnly();
    setCandidateGeometry(i, {
      shortest_parts: [line, otherLine], sheltered_parts: [line, otherLine],
      route_segments: {
        shortest: [{ geom: line, len_m: 0, is_covered: false }, { geom: otherLine, len_m: 2.125, is_covered: true }],
        sheltered: [{ geom: line, len_m: 0, is_covered: false }, { geom: otherLine, len_m: 2.125, is_covered: true }],
      },
    });
    return i;
  }
  function shelteredSegments(i: PublishedTransitNormalizationInput): Mutable[] { return geom(i).candidates['bus:03509'].route_segments.sheltered; }
  for (const field of ['geom', 'len_m', 'is_covered', 'part_index', 'source_class', 'source_layer', 'synth_class', 'confidence', 'source_summary']) {
    const invalids = field === 'geom' ? [null, 1, '_', '!!!!'] : field === 'len_m' ? [undefined, null, '1', -1, NaN, Infinity]
      : field === 'is_covered' ? [undefined, null, 'true', 0, 1] : field === 'part_index' ? [null, '0', -1, 0.5, Infinity] : [null, 1, {}, []];
    for (const [index, bad] of invalids.entries()) it(`T06 rejects invalid optional segment ${field} case ${index} without poisoning the route`, () => {
      const i = segmentedInput(); shelteredSegments(i)[0][field] = bad;
      const option = one(i);
      expect(option.retainable).toBe(true);
      expect(option.geometry.sheltered.status).toBe('complete');
      expect(option.geometry.routeSegments.sheltered).toMatchObject({ status: 'invalid', segments: [] });
      expect(option.geometry.routeSegments.shortest.status).toBe('complete');
      expect(option.geometry.routeSegmentsAvailable).toBe(true);
      expect(option.diagnostics).toContain('optional_route_segments_invalid');
    });
  }
  it('T06 allowlists segment metadata and treats source part_index as local, not a base-part index', () => {
    const i = segmentedInput();
    Object.assign(shelteredSegments(i)[0], { part_index: 999, source_class: 'osm_covered', source_layer: 'source', synth_class: '', confidence: 'observed', source_summary: 'source:1', unknown: 'drop', geometry: 'drop' });
    const result = one(i).geometry.routeSegments.sheltered;
    expect(result.status).toBe('complete');
    expect(result.segments[0]).toEqual({ geom: line, len_m: 0, is_covered: false, source_class: 'osm_covered', source_layer: 'source', synth_class: '', confidence: 'observed', source_summary: 'source:1' });
    expect(result.segments[1].len_m).toBe(2.125);
  });
  for (const mutation of ['incomplete', 'overlap', 'unrelated', 'bridge', 'cross-variant']) it(`T06 ${mutation} optional segments cannot replace good base parts`, () => {
    const i = segmentedInput();
    const source = geom(i).candidates['bus:03509'];
    if (mutation === 'incomplete') source.route_segments.sheltered.pop();
    if (mutation === 'overlap') source.route_segments.sheltered.push(clone(source.route_segments.sheltered[0]));
    if (mutation === 'unrelated') source.route_segments.sheltered[0].geom = encodePolyline([[1, 104], [1.1, 104.1]]);
    if (mutation === 'bridge') source.route_segments.sheltered = [{ geom: encodePolyline([[1.301, 103.801], [1.3, 103.8], [1.302, 103.802]]), len_m: 1, is_covered: true }];
    if (mutation === 'cross-variant') { source.shortest_parts = [encodePolyline([[1, 104], [1.1, 104.1]])]; source.route_segments.shortest = clone(source.route_segments.sheltered); }
    const option = one(i);
    expect(option.retainable).toBe(true);
    const capability = option.geometry.routeSegments[mutation === 'cross-variant' ? 'shortest' : 'sheltered'];
    expect(capability.status).toBe('invalid');
    expect(capability.segments).toEqual([]);
    expect(capability.reasons).toEqual([mutation === 'incomplete' ? 'optional_route_segments_incomplete' : 'optional_route_segments_path_mismatch']);
  });
  it('T06 matches exact contiguous pieces in either direction without depending on segment list order', () => {
    const i = segmentedInput();
    const source = geom(i).candidates['bus:03509'];
    source.sheltered_parts = [encodePolyline([[1.3, 103.8], [1.301, 103.801], [1.302, 103.802]])];
    source.route_segments.sheltered = [
      { geom: encodePolyline([[1.302, 103.802], [1.301, 103.801]]), len_m: 1, is_covered: true },
      { geom: encodePolyline([[1.3, 103.8], [1.3, 103.8], [1.301, 103.801]]), len_m: 2, is_covered: false },
    ];
    expect(one(i).geometry.routeSegments.sheltered.status).toBe('complete');
  });
  it('T06 repeated edges keep valid full coloring for either segment order', () => {
    const a: [number, number] = [1.3, 103.8];
    const b: [number, number] = [1.301, 103.801];
    const c: [number, number] = [1.302, 103.802];
    for (const reverse of [false, true]) {
      const i = segmentedInput(); const source = geom(i).candidates['bus:03509'];
      source.sheltered_parts = [encodePolyline([a, b, a, b, c])];
      source.route_segments.sheltered = [
        { geom: encodePolyline([a, b]), len_m: 1, is_covered: true },
        { geom: encodePolyline([a, b, a]), len_m: 2, is_covered: false },
        { geom: encodePolyline([b, c]), len_m: 1, is_covered: true },
      ];
      if (reverse) source.route_segments.sheltered.reverse();
      expect(one(i).geometry.routeSegments.sheltered.status).toBe('complete');
    }
  });
  it('T06 partial base geometry cannot be replaced with an otherwise valid segment list', () => {
    const i = segmentedInput(); geom(i).candidates['bus:03509'].sheltered_parts[1] = '_';
    const option = one(i);
    expect(option.geometry.sheltered.status).toBe('partial');
    expect(option.geometry.routeSegments.sheltered).toMatchObject({ status: 'unavailable', segments: [], reasons: ['optional_route_segments_base_incomplete'] });
    expect(option.geometry.routeSegments.shortest.status).toBe('complete');
  });
  for (const raw of [undefined, null, [], {}, '', false]) it(`T06 segment container boundary ${JSON.stringify(raw)}`, () => {
    const i = segmentedInput(); geom(i).candidates['bus:03509'].route_segments = raw;
    const option = one(i);
    expect(option.retainable).toBe(true);
    expect(option.geometry.routeSegments.sheltered.status).toBe(raw == null || (raw && !Array.isArray(raw) && typeof raw === 'object') ? 'missing' : 'invalid');
  });
  for (const raw of [undefined, null, [], {}, '']) it(`T06 segment list boundary ${JSON.stringify(raw)}`, () => {
    const i = segmentedInput(); geom(i).candidates['bus:03509'].route_segments.sheltered = raw;
    const capability = one(i).geometry.routeSegments.sheltered;
    expect(capability.status).toBe(raw == null || Array.isArray(raw) ? 'missing' : 'invalid');
    expect(capability.segments).toEqual([]);
  });
});

describe('T04 gap capabilities are not interchangeable (synthetic except N27)', () => {
  for (const direction of ['forward', 'reverse', 'repeated']) it(`T06 fragment exact contiguous ${direction} portion keeps source length and label`, () => {
    const i = defaultOnly(); const source = geom(i).route_options.bus;
    const a: [number, number] = [1.3, 103.8];
    const b: [number, number] = [1.301, 103.801];
    const c: [number, number] = [1.302, 103.802];
    source.sheltered_parts = [encodePolyline([a, b, c])];
    source.exposure_gaps = [{ geom: encodePolyline(direction === 'forward' ? [b, c] : direction === 'reverse' ? [c, b] : [b, b, c]), len_m: 0.125, label: 'Synthetic gap', part_index: 999 }];
    const o = one(i);
    expect(o.gaps.sheltered.fragments.status).toBe('complete');
    expect(o.gaps.sheltered.fragments.entries[0]).toMatchObject({ highlightable: true, length: { status: 'valid', value: 0.125 }, label: 'Synthetic gap', partIndex: 999 });
    expect(value(o.gaps.sheltered.logical.total_m)).toBe(36.5);
    expect(value(o.gaps.sheltered.logical.longest_m)).toBe(20.2);
  });
  for (const mutation of ['foreign', 'bridge', 'skipped-vertex', 'shifted-grid']) it(`T06 ${mutation} fragment is diagnostic only, not a walk metric or map highlight`, () => {
    const i = defaultOnly(); const source = geom(i).route_options.bus;
    const a: [number, number] = [1.3, 103.8];
    const b: [number, number] = [1.301, 103.801];
    const c: [number, number] = [1.302, 103.802];
    source.sheltered_parts = [encodePolyline([a, b, c])];
    let points: [number, number][] = [[89, 170], [89.1, 170.1]];
    if (mutation === 'bridge') { source.sheltered_parts = [encodePolyline([a, b]), encodePolyline([b, c])]; points = [a, b, c]; }
    if (mutation === 'skipped-vertex') points = [a, c];
    if (mutation === 'shifted-grid') points = [[1.30001, 103.8], [1.30101, 103.801]];
    source.exposure_gaps = [{ geom: encodePolyline(points), len_m: 12.345, label: 'Synthetic gap' }];
    const o = one(i);
    expect(o.gaps.sheltered.fragments.entries[0]).toMatchObject({ highlightable: false, length: { status: 'valid', value: 12.345 }, reasons: ['gap_fragment_path_mismatch'] });
    expect(o.diagnostics).toContain('gap_fragment_path_mismatch');
    expect(o.gaps.sheltered.fragments.status).toBe('partial');
    expect(value(o.gaps.sheltered.logical.total_m)).toBe(36.5);
    expect(o.retainable).toBe(true);
  });
  it('T06 fragments on surviving partial-base pieces remain usable without lending validity to missing parts', () => {
    const i = defaultOnly(); const source = geom(i).route_options.bus;
    source.sheltered_parts = [line, '_'];
    source.exposure_gaps = [{ geom: line, len_m: 0, label: 'Surviving' }, { geom: otherLine, len_m: 2, label: 'Unmatched' }];
    const o = one(i);
    expect(o.geometry.sheltered.status).toBe('partial');
    expect(o.gaps.sheltered.fragments.entries.map(entry => entry.highlightable)).toEqual([true, false]);
    expect(o.gaps.sheltered.fragments.entries[1].reasons).toEqual(['gap_fragment_path_mismatch']);
    expect(value(o.gaps.sheltered.logical.longest_m)).toBe(20.2);
  });
  it('T06 no sheltered base makes otherwise valid fragments unavailable for highlighting', () => {
    const i = defaultOnly(); const source = geom(i).route_options.bus;
    source.sheltered_parts = []; source.sheltered = '';
    const o = one(i);
    expect(o.gaps.sheltered.fragments.entries.every(entry => !entry.highlightable)).toBe(true);
    expect(o.gaps.sheltered.fragments.reasons).toContain('gap_fragment_path_unavailable');
    expect(value(o.gaps.sheltered.logical.total_m)).toBe(36.5);
  });
  for (const gaps of [undefined, null, {}, 'gaps']) it(`N25 missing/malformed logical list ${JSON.stringify(gaps)}`, () => {
    const i = defaultOnly(); score(i).route_options.bus.exposure_gaps = gaps;
    const logical = one(i).gaps.sheltered.logical;
    expect(logical.status).toBe(gaps == null ? 'missing' : 'invalid');
    expect(logical.total_m.status).toBe('missing');
  });
  it('N25 routed empty list establishes zero; unrouted empty does not', () => {
    const i = defaultOnly(); score(i).route_options.bus.exposure_gaps = [];
    expect(value(one(i).gaps.sheltered.logical.total_m)).toBe(0);
    const u = input('bus', '018990');
    expect(defaultOption(run(u)).gaps.sheltered.logical.total_m.status).toBe('missing');
  });
  for (const v of [undefined, null, '1', false, {}, [], NaN, Infinity, -Infinity, -1]) it(`N25 invalid logical length ${String(v)}`, () => {
    const i = defaultOnly(); score(i).route_options.bus.exposure_gaps[0].len_m = v;
    const logical = one(i).gaps.sheltered.logical;
    expect(logical.status).toBe('partial');
    expect(logical.total_m.status).toBe('missing');
    expect(logical.longest_m.status).toBe('missing');
    expect(logical.reasons).toContain('logical_gap_length_invalid');
    expect(value(logical.entries[1].length)).toBe(20.2);
  });
  it('N25 zero logical length is valid rounded source evidence', () => {
    const i = defaultOnly(); score(i).route_options.bus.exposure_gaps = [{ len_m: 0 }];
    expect(one(i).gaps.sheltered.logical).toMatchObject({ status: 'complete', total_m: { status: 'valid', value: 0 }, longest_m: { status: 'valid', value: 0 } });
  });
  for (const location of [undefined, null, {}, { lat: '1', lon: 103 }, { lat: NaN, lon: 103 }, { lat: 1, lon: Infinity }, { lat: 91, lon: 103 }, { lat: 1, lon: 181 }]) it(`N26 invalid/missing anchor ${JSON.stringify(location)} preserves length`, () => {
    const i = defaultOnly(); score(i).route_options.bus.exposure_gaps[0].location = location;
    const logical = one(i).gaps.sheltered.logical;
    expect(value(logical.total_m)).toBe(36.5);
    expect(logical.entries[0].anchor).toBeNull();
    expect(logical.entries[0].anchorReason).toBe(location == null ? 'gap_anchor_missing' : 'gap_anchor_invalid');
  });
  for (const index of [null, -1, 0.5, '0', NaN, Infinity]) it(`N26 invalid fragment index ${String(index)} disables only its highlight`, () => {
    const i = defaultOnly(); geom(i).route_options.bus.exposure_gaps[0].part_index = index;
    const option = one(i);
    expect(option.retainable).toBe(true);
    expect(option.gaps.sheltered.fragments.entries[0].highlightable).toBe(false);
    expect(option.gaps.sheltered.fragments.entries[0].partIndex).toBeNull();
    expect(value(option.gaps.sheltered.logical.total_m)).toBe(36.5);
  });
  for (const v of [undefined, null, '1', false, {}, [], NaN, Infinity, -Infinity, -1]) it(`N26 invalid fragment length ${String(v)} cannot be highlighted`, () => {
    const i = candidateOnly(); geom(i).candidates['bus:03509'].exposure_gaps[0].len_m = v;
    const option = one(i);
    expect(option.retainable).toBe(true);
    expect(option.gaps.sheltered.fragments.entries[0].highlightable).toBe(false);
    expect(option.gaps.sheltered.fragments.entries[0].reasons).toContain('gap_fragment_length_invalid');
  });
  it('N26 nonnegative source part index is metadata, never a join to the logical list', () => {
    const i = defaultOnly(); geom(i).route_options.bus.exposure_gaps[0].part_index = 999;
    const option = one(i);
    expect(option.gaps.sheltered.fragments.entries[0]).toMatchObject({ partIndex: 999, highlightable: true });
    expect(option.gaps.sheltered.logical.entries).toHaveLength(2);
  });
  it('N26 zero fragment length remains valid source rounding, not a logical gap', () => {
    const i = candidateOnly();
    const id = score(i).candidates[0].node_id;
    geom(i).candidates[id].exposure_gaps[0].len_m = 0;
    const option = one(i);
    const fragment = option.gaps.sheltered.fragments.entries[0];
    expect(fragment.length).toMatchObject({ status: 'valid', value: 0 });
    expect(fragment.highlightable).toBe(true);
    expect(option.gaps.sheltered.logical.total_m.status).toBe('missing');
  });
  it('N27 real Exit D exposes fragments only; shortest never borrows sheltered gaps', () => {
    const option = run(input('mrt_lrt')).options.find(o => o.aliases.includes('mrt:21678'))!;
    expect(option.gaps.sheltered.logical.reasons).toEqual(['logical_gaps_not_published']);
    expect(option.gaps.sheltered.fragments.entries.map(g => value(g.length))).toEqual([43.3, 50.3, 16.3]);
    expect(option.gaps.sheltered.fragments.entries.map(g => g.partIndex)).toEqual([0, 1, 2]);
    expect(option.gaps.shortest.logical.total_m.status).toBe('missing');
    expect(option.gaps.shortest.fragments.status).toBe('unavailable');
    expect(option.gaps.sheltered.fragments).not.toHaveProperty('longest_m');
  });
  it('N28 legacy digests/composite/rejected warnings are not route vetoes or invented candidate provenance', () => {
    const i = candidateOnly();
    score(i).total = null; score(i).subscores = null;
    score(i).provenance = { untrusted_subscores: ['bus'], reason: 'rejected_alternative', scoring_fingerprints: { legacy: 'retained' } };
    const option = one(i);
    expect(option.retainable).toBe(true);
    expect(option.selectedSource.raw).not.toHaveProperty('provenance');
    expect(option.selectedSource.raw).not.toHaveProperty('total');
    expect(option.selectedSource.raw).not.toHaveProperty('subscores');
    expect(option.selectedSource.raw).not.toHaveProperty('scoring_fingerprint_digest');
  });
  it('N29 deep-frozen real fixtures remain identical and normalization uses no network/filesystem', () => {
    const before = JSON.stringify(fixture);
    freeze(fixture);
    for (const row of records) for (const category of ['bus', 'mrt_lrt'] as const) {
      const i = input(category, row.postal); i.score = row; i.geometry = row.postal === '018956' ? realGeom : null;
      run(i);
    }
    expect(JSON.stringify(fixture)).toBe(before);
  });
});
