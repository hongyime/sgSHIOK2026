import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  normalizePublishedTransitOptions,
  type PublishedTransitCategory,
  type PublishedTransitNormalizationInput,
  type PublishedTransitNormalizationResult,
} from '../published-transit-options';
import fixture from './fixtures/published-options.json';
import { buildComparisonRow } from '../comparison';
import { walkMetrics } from '../../components/walk-summary';

vi.mock('node:fs', () => { throw new Error('Comparison must not read files'); });
vi.mock('node:fs/promises', () => { throw new Error('Comparison must not read files'); });
vi.mock('fs', () => { throw new Error('Comparison must not read files'); });
vi.mock('fs/promises', () => { throw new Error('Comparison must not read files'); });

// Malformed cases are explicit in-memory mutations of the reduced real records.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mutable = Record<string, any>;
const bundle = 'generated_20260805_prefer_scored_routed';
const records = fixture['scores/DOWNTOWN_CORE_PART_001.json'];
const realGeometry = fixture['geom/h3/886520db39fffff.json'][0];
const emptyMetrics = { distance: null, coverage: null, uncovered: null, longest: null };
const busMetrics = { distance: 81.2, coverage: 55, uncovered: 36.5, longest: 20.2 };
const mrtMetrics = { distance: 308.4, coverage: 24, uncovered: 234, longest: 135.8 };
type Metrics = { [Key in keyof typeof busMetrics]: number | null };

function input(category: PublishedTransitCategory = 'bus', postal = '018956'): PublishedTransitNormalizationInput {
  return {
    bundle, postal, category,
    score: structuredClone(records.find(row => row.postal === postal)),
    geometry: postal === '018956' ? structuredClone(realGeometry) : null,
    scoreContext: { bundle, postal }, geometryContext: { bundle, postal },
  };
}
const score = (value: PublishedTransitNormalizationInput): Mutable => value.score as Mutable;
const geometry = (value: PublishedTransitNormalizationInput): Mutable => value.geometry as Mutable;
const pool = (value: PublishedTransitNormalizationInput): PublishedTransitNormalizationResult => normalizePublishedTransitOptions(value);
function freeze(value: unknown): void {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return;
  Object.values(value).forEach(freeze);
  Object.freeze(value);
}
function row(value: PublishedTransitNormalizationInput) {
  const before = structuredClone(value);
  freeze(value);
  const result = buildComparisonRow(value);
  expect(value).toEqual(before);
  return result;
}
function declared(value: PublishedTransitNormalizationInput) {
  const found = pool(value).options.find(option => option.sources.some(source =>
    source.selectionRef.kind === 'category_default' && source.selectionRef.category === value.category));
  expect(found).toBeDefined();
  return found!;
}

function withoutCategoryGeometry(promoteCandidate = false): PublishedTransitNormalizationInput {
  const value = input();
  delete geometry(value).route_options.bus;
  // Keep the real category default's metrics/gaps, but make fallback ownership observable.
  if (promoteCandidate) score(value).state = 'NOT_YET_SCORED';
  else score(value).exposure_gaps = null;
  return value;
}

function withoutCategoryDeclaration(category: PublishedTransitCategory): PublishedTransitNormalizationInput {
  const value = input(category);
  delete score(value).route_options[category];
  delete geometry(value).route_options[category];
  return value;
}

const unavailableDeclarations: { name: string; mutate: (value: PublishedTransitNormalizationInput) => void }[] = [
  { name: 'synthetic null category declaration', mutate: value => { score(value).route_options.bus = null; } },
  { name: 'synthetic empty category declaration', mutate: value => { score(value).route_options.bus = {}; } },
  { name: 'synthetic malformed array category declaration', mutate: value => { score(value).route_options.bus = []; } },
  { name: 'synthetic invalid category state with usable aliases', mutate: value => { score(value).route_options.bus.state = 'UNRECOGNIZED'; } },
  { name: 'synthetic declared-default/candidate distance conflict', mutate: value => { score(value).route_options.bus.paths.sheltered_m += 1; } },
];

const incompleteLogicalGaps: { name: string; value: unknown; expected: Metrics }[] = [
  { name: 'missing logical gap list', value: undefined, expected: { ...busMetrics, uncovered: null, longest: null } },
  { name: 'null logical gap list', value: null, expected: { ...busMetrics, uncovered: null, longest: null } },
  { name: 'explicit empty logical gap list', value: [], expected: { ...busMetrics, uncovered: 0, longest: 0 } },
  { name: 'synthetic invalid logical length', value: [{ len_m: 16.3 }, { len_m: '20.2' }], expected: { ...busMetrics, uncovered: null, longest: null } },
];

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Comparison must not fetch'); }));
});
afterEach(() => {
  expect(fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

describe('T08 C03/C04: declared category-default sheltered comparison', () => {
  it.each([
    ['bus', busMetrics], ['mrt_lrt', mrtMetrics],
  ] as const)('real %s default has the same four metrics as WalkSummary, without losing precision', (category, metrics) => {
    const value = input(category), selected = declared(value);
    expect(selected.selectedSource.selectionRef).toEqual({ kind: 'category_default', category });
    const result = row(value);
    expect(result.metrics).toEqual(metrics);
    expect(result.metrics).toEqual(walkMetrics(null, false, selected));
    expect(result.availability).toBe('available');
    expect(result.reason).toBeNull();
  });

  it('pins bundle/postal/category/policy and does not fabricate a candidate id, full score or state', () => {
    const result = row(input());
    expect(result).toMatchObject({ bundle, postal: '018956', category: 'bus', routeVariant: 'sheltered',
      policy: 'category_default_sheltered_v1', destination: 'Bayfront Stn Exit B/MBS',
      selectionRef: { kind: 'category_default', category: 'bus' } });
    expect(result.optionKey).toBe(JSON.stringify(['pw', 1, bundle, '018956', 'bus', 'default']));
    expect(result.selectionRef).not.toHaveProperty('nodeId');
    expect(result).not.toHaveProperty('state');
    expect(result).not.toHaveProperty('total');
    expect(result).not.toHaveProperty('subscores');
  });

  it('keeps 36.5/20.2 logical totals distinct from the three mapped fragment lengths', () => {
    const value = input(), result = row(value);
    const fragments = geometry(value).route_options.bus.exposure_gaps;
    expect(fragments.map((gap: Mutable) => gap.len_m)).toEqual([16.3, 11, 9.1]);
    expect(fragments.reduce((total: number, gap: Mutable) => total + gap.len_m, 0)).toBeCloseTo(36.4, 10);
    expect(result.metrics.uncovered).toBe(36.5);
    expect(result.metrics.longest).toBe(20.2);
    expect(result.evidence.logicalGapStatus).toBe('complete');
    expect(result.evidence.metricCapabilities?.uncovered).toMatchObject({ status: 'valid', sourceField: 'exposure_gaps', value: 36.5 });
  });

  it('uses real MRT Exit E rather than the shorter Exit D candidate or a current inspector choice', () => {
    const value = input('mrt_lrt');
    expect(score(value).candidates.find((candidate: Mutable) => candidate.node_id === 'mrt:21624').paths.sheltered_m).toBe(109.2);
    Object.assign(value, { chosenStopId: 'mrt:21624', routeMode: 'shortest', currentKey: 'mrt:21624' });
    const result = row(value);
    expect(result.destination).toBe('BAYFRONT MRT STATION Exit E');
    expect(result.selectionRef).toEqual({ kind: 'category_default', category: 'mrt_lrt' });
    expect(result.metrics).toEqual(mrtMetrics);
  });

  it('synthetic decimal distance is not rounded before presentation and raw coverage remains traceable', () => {
    const value = input('mrt_lrt');
    score(value).route_options.mrt_lrt.paths.sheltered_m = 308.456789;
    const result = row(value);
    expect(result.metrics.distance).toBe(308.456789);
    expect(result.evidence.metricCapabilities?.distance).toMatchObject({ status: 'valid', value: 308.456789 });
    expect(result.metrics.coverage).toBe(24);
    expect(result.evidence.metricCapabilities?.coverage).toMatchObject({ status: 'valid', value: 0.241 });
  });

  it.each(['bus', 'mrt_lrt'] as const)('real %s measurements remain useful with no geometry', category => {
    const value = input(category); value.geometry = null;
    const result = row(value);
    expect(result.metrics).toEqual(category === 'bus' ? busMetrics : mrtMetrics);
    expect(result).toMatchObject({ availability: 'partial', reason: 'geometry_incomplete',
      selectionRef: { kind: 'category_default', category } });
    expect(result.evidence.geometryStatus).toBe('missing');
    expect(result.evidence.logicalGapStatus).toBe('complete');
  });

  it.each([false, true])('missing declared bus geometry cannot borrow promoted alternate evidence; candidate=%s', promoteCandidate => {
    const value = withoutCategoryGeometry(promoteCandidate);
    const promoted = declared(value);
    expect(promoted.selectedSource.selectionRef.kind).toBe(promoteCandidate ? 'candidate' : 'top_default');
    expect(promoted.geometry.sheltered.status).toBe('complete');
    expect(walkMetrics(null, false, promoted).uncovered).toBeNull();
    const result = row(value);
    expect(result.selectionRef).toEqual({ kind: 'category_default', category: 'bus' });
    expect(result.optionKey).toBe(JSON.stringify(['pw', 1, bundle, '018956', 'bus', 'default']));
    expect(result.metrics).toEqual(busMetrics);
    expect(result.evidence.geometryStatus).toBe('missing');
    expect(result.evidence.logicalGapStatus).toBe('complete');
    expect(result).toMatchObject({ availability: 'partial', reason: 'geometry_incomplete' });
  });

  it.each(unavailableDeclarations)('$name remains unavailable despite usable top/candidate alternatives', ({ name, mutate }) => {
    const value = input(); mutate(value);
    if (name.includes('invalid category state')) {
      expect(declared(value).selectedSource.selectionRef.kind).toBe('top_default');
    }
    const result = row(value);
    expect(result.availability).toBe('unavailable');
    expect(result.metrics).toEqual(emptyMetrics);
    expect(result.reason).toBe(name.includes('conflict') ? 'evidence_conflict' : 'default_invalid');
    expect(result.selectionRef?.kind).not.toBe('candidate');
    expect(result.selectionRef?.kind).not.toBe('top_default');
    if (name.includes('conflict')) {
      expect(result.evidence.optionStatus).toBe('evidence_conflict');
      expect(result.evidence.diagnostics).toContain('evidence_conflict:sheltered_m');
    }
  });

  it('synthetic partial declared geometry cannot hide a positive metric contradiction with intact same-stop aliases', () => {
    const value = input();
    score(value).route_options.bus.paths.sheltered_m += 1;
    const route = geometry(value).route_options.bus;
    route.sheltered_parts = [route.sheltered_parts[0], '_'];
    const promoted = declared(value);
    // The core normalizer excludes partial geometry from alias conflict comparison.
    expect(promoted.classification).toBe('routed');
    expect(promoted.selectedSource.selectionRef.kind).toBe('top_default');
    expect(promoted.metrics.sheltered_m).toMatchObject({ status: 'valid', value: 81.2 });
    const result = row(value);
    expect(result).toMatchObject({ availability: 'unavailable', reason: 'evidence_conflict', metrics: emptyMetrics });
  });

  it.each(['covered_ratio', 'shortest_m'] as const)('synthetic partial declaration still exposes conflicting %s against intact aliases', metric => {
    const value = input();
    const source = score(value).route_options.bus;
    if (metric === 'covered_ratio') source.paths.covered_ratio = 0.601;
    else {
      source.paths.shortest_m += 1;
      source.best_node.routed_m += 1;
      expect(source.paths.shortest_m).toBe(source.best_node.routed_m);
    }
    const route = geometry(value).route_options.bus;
    route.sheltered_parts = [route.sheltered_parts[0], '_'];
    const promoted = declared(value);
    expect(promoted.classification).toBe('routed');
    expect(promoted.selectedSource.selectionRef.kind).toBe('top_default');
    const result = row(value);
    expect(result).toMatchObject({ availability: 'unavailable', reason: 'evidence_conflict', metrics: emptyMetrics });
    expect(result.evidence.diagnostics).toContain(`comparison_evidence_conflict:${metric}`);
  });

  it('synthetic partial candidate contradiction is checked even when the complete declared default stays selected', () => {
    const value = input();
    const candidate = score(value).candidates.find((item: Mutable) => item.node_id === 'bus:03509');
    candidate.paths.sheltered_m += 1;
    const route = geometry(value).candidates['bus:03509'];
    route.sheltered_parts = [route.sheltered_parts[0], '_'];
    const selected = declared(value);
    expect(selected.classification).toBe('routed');
    expect(selected.selectedSource.selectionRef).toEqual({ kind: 'category_default', category: 'bus' });
    expect(selected.geometry.sheltered.status).toBe('complete');
    const result = row(value);
    expect(result).toMatchObject({ availability: 'unavailable', reason: 'evidence_conflict', metrics: emptyMetrics });
    expect(result.evidence.diagnostics).toContain('comparison_evidence_conflict:sheltered_m');
  });

  it('synthetic agreeing partial candidate remains nonblocking for the complete declared default', () => {
    const value = input();
    const route = geometry(value).candidates['bus:03509'];
    route.sheltered_parts = [route.sheltered_parts[0], '_'];
    expect(declared(value).selectedSource.selectionRef).toEqual({ kind: 'category_default', category: 'bus' });
    const result = row(value);
    expect(result).toMatchObject({ availability: 'available', reason: null, metrics: busMetrics,
      selectionRef: { kind: 'category_default', category: 'bus' } });
    expect(result.evidence.optionStatus).toBe('published_routed');
    expect(result.evidence.diagnostics.some(reason => reason.startsWith('evidence_conflict'))).toBe(false);
  });

  it.each(['bad-reference', 'unsupported-trust', 'invalid-geometry'] as const)('synthetic %s candidate cannot assert a metric contradiction against a valid declaration', mutation => {
    const value = input();
    const candidate = score(value).candidates.find((item: Mutable) => item.node_id === 'bus:03509');
    candidate.paths.sheltered_m = 999;
    if (mutation === 'bad-reference') candidate.geometry_ref = '018990_bus:03509';
    if (mutation === 'unsupported-trust') candidate.route_trust = 'unknown';
    if (mutation === 'invalid-geometry') geometry(value).candidates['bus:03509'].sheltered_parts = ['_'];
    const result = row(value);
    expect(result).toMatchObject({ availability: 'available', reason: null, metrics: busMetrics,
      selectionRef: { kind: 'category_default', category: 'bus' } });
    expect(result.evidence.optionStatus).toBe('published_routed');
  });

  it('allows same-category top fallback only when the bus declaration is absent', () => {
    const result = row(withoutCategoryDeclaration('bus'));
    expect(result.selectionRef).toEqual({ kind: 'top_default' });
    expect(result.metrics).toEqual(busMetrics);
    expect(result.availability).toBe('available');
  });

  it('synthetic bus-only record cannot become an MRT comparison row', () => {
    const value = withoutCategoryDeclaration('mrt_lrt');
    score(value).candidates = score(value).candidates.filter((candidate: Mutable) => candidate.node_type === 'bus_stop');
    const result = row(value);
    expect(result).toMatchObject({ category: 'mrt_lrt', availability: 'unavailable', reason: 'default_missing',
      optionKey: null, selectionRef: null, destination: null, metrics: emptyMetrics });
  });

  it('MRT candidates alone do not supply a missing declared or same-category top default', () => {
    const value = withoutCategoryDeclaration('mrt_lrt');
    expect(pool(value).options.some(option => option.category === 'mrt_lrt' && option.retainable)).toBe(true);
    expect(row(value)).toMatchObject({ availability: 'unavailable', reason: 'default_missing', metrics: emptyMetrics, selectionRef: null });
  });

  it('synthetic malformed route_options container is not interpreted as no declaration', () => {
    const value = input(); score(value).route_options = [];
    const result = row(value);
    expect(result).toMatchObject({ availability: 'unavailable', reason: 'default_invalid', metrics: emptyMetrics, selectionRef: null });
    expect(result.evidence.diagnostics).toContain('route_options_invalid');
  });

  it.each(['score-postal', 'geometry-postal', 'bundle'] as const)('rejects synthetic source context mismatch: %s', mismatch => {
    const value = input();
    if (mismatch === 'score-postal') value.scoreContext.postal = '018990';
    if (mismatch === 'geometry-postal') geometry(value).postal = '018990';
    if (mismatch === 'bundle') value.geometryContext.bundle = 'other-bundle';
    const result = row(value);
    expect(result).toMatchObject({ availability: 'unavailable', reason: 'context_invalid', metrics: emptyMetrics,
      optionKey: null, selectionRef: null, destination: null });
    expect(result.evidence.contextStatus).toBe('invalid');
    expect(result.evidence.provenanceRefs).toEqual([]);
  });

  it('synthetic live-preview context cannot inherit real published category metrics', () => {
    const value = input();
    score(value).provenance = { source: 'live_onemap_preview', authoritative_score: false };
    const result = row(value);
    expect(result).toMatchObject({ availability: 'unavailable', reason: 'preview_only', metrics: emptyMetrics,
      optionKey: null, selectionRef: null, destination: null });
    expect(result.evidence.contextStatus).toBe('preview_only');
    expect(result.evidence.provenanceRefs).toEqual([]);
  });

  it('real 018990 direct-bus evidence cannot be presented as a verified sheltered walk', () => {
    const result = row(input('bus', '018990'));
    expect(result).toMatchObject({ availability: 'unavailable', reason: 'default_unrouted', metrics: emptyMetrics });
    expect(result.notice).toBe('Straight-line estimate; no verified walk.');
    expect(result.evidence.optionStatus).toBe('published_unrouted');
  });

  it('real 079908 missing evidence remains unavailable without a fabricated default destination/state', () => {
    const value = input('mrt_lrt', '079908');
    expect(score(value).provenance.reason).toBe('all_numeric_transit_candidates_rejected_by_bus_route_trust_gate');
    const result = row(value);
    expect(result.availability).toBe('unavailable');
    expect(result.metrics).toEqual(emptyMetrics);
    expect(result.destination).toBeNull();
    expect(result).not.toHaveProperty('state');
    expect(result.selectionRef?.kind).not.toBe('candidate');
  });

  it.each(incompleteLogicalGaps)('$name preserves missing versus zero without borrowing top gaps', ({ value: gaps, expected }) => {
    const value = input();
    score(value).route_options.bus.exposure_gaps = structuredClone(gaps);
    const result = row(value);
    expect(result.metrics).toEqual(expected);
    expect(result.selectionRef).toEqual({ kind: 'category_default', category: 'bus' });
    expect(result.availability).toBe(Array.isArray(gaps) && gaps.length === 0 ? 'available' : 'partial');
    expect(result.evidence.geometryStatus).toBe('complete');
  });

  it('candidate array order cannot change the declared default or its metadata', () => {
    const value = input('mrt_lrt'), reordered = structuredClone(value);
    score(reordered).candidates.reverse();
    expect(row(reordered)).toEqual(row(value));
  });

  it('synthetic missing declared destination does not acquire the matching candidate name/id', () => {
    const value = input(); score(value).route_options.bus.best_node.name = null;
    const result = row(value);
    expect(result).toMatchObject({ availability: 'partial', reason: 'destination_missing', destination: null, metrics: busMetrics,
      selectionRef: { kind: 'category_default', category: 'bus' } });
    expect(result.selectionRef).not.toHaveProperty('nodeId');
  });

  it('synthetic missing distance retains independently known coverage and logical gaps', () => {
    const value = input('mrt_lrt');
    delete score(value).route_options.mrt_lrt.paths.sheltered_m;
    const result = row(value);
    expect(result.metrics).toEqual({ ...mrtMetrics, distance: null });
    expect(result).toMatchObject({ availability: 'partial', reason: 'metrics_incomplete' });
    expect(result.evidence.metricCapabilities?.distance.status).toBe('missing');
  });

  it('synthetic supported route with all four metrics absent is unavailable, not zero-valued', () => {
    const value = input('mrt_lrt'), route = score(value).route_options.mrt_lrt;
    delete route.paths.sheltered_m; delete route.paths.covered_ratio; route.exposure_gaps = null;
    const result = row(value);
    expect(result).toMatchObject({ availability: 'unavailable', reason: 'metrics_unavailable', metrics: emptyMetrics });
    expect(result.evidence.geometryStatus).toBe('complete');
  });

  it('reads only supplied frozen evidence and keeps rejected candidates from erasing a valid declaration', () => {
    const value = input(), beforeFixture = JSON.stringify(fixture);
    score(value).candidates.push({ node_id: 'bad', node_type: 'unknown', paths: { sheltered_m: 1 } });
    expect(pool(value).rejectedSources).toHaveLength(1);
    freeze(value);
    const result = row(value);
    expect(result.metrics).toEqual(busMetrics);
    expect(JSON.stringify(fixture)).toBe(beforeFixture);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('provenance references name supplied context/declaration fields, not invented candidate or row provenance', () => {
    const value = input();
    expect(row(structuredClone(value)).evidence.provenanceRefs).toEqual(['provenance']);
    score(value).route_options.bus.provenance = { source: 'synthetic-category-receipt', marker: 'test-only' };
    const result = row(value);
    expect(result.evidence.provenanceRefs).toEqual(['provenance', 'route_options.bus.provenance']);
    expect(result).not.toHaveProperty('provenance');
    expect(result.evidence).not.toHaveProperty('scoring_fingerprints');
  });

  it('missing shortest geometry does not demote complete declared sheltered evidence', () => {
    const value = input('mrt_lrt');
    geometry(value).route_options.mrt_lrt.shortest = '';
    geometry(value).route_options.mrt_lrt.shortest_parts = [];
    const result = row(value);
    expect(result).toMatchObject({ availability: 'available', reason: null, metrics: mrtMetrics, routeVariant: 'sheltered' });
    expect(result.evidence.geometryStatus).toBe('complete');
  });
});
