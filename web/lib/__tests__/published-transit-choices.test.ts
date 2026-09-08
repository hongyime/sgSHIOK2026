import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { selectPublishedTransitChoices } from '../published-transit-choices';
import {
  normalizePublishedTransitOptions,
  type PublishedTransitCategory,
  type PublishedTransitNormalizationInput,
  type PublishedTransitNormalizationResult,
  type PublishedTransitOption,
} from '../published-transit-options';
import fixture from './fixtures/published-options.json';

// Synthetic mutations exercise policy boundaries, not additional published observations.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mutable = Record<string, any>;
vi.mock('node:fs', () => { throw new Error('Choices must not read files'); });
vi.mock('node:fs/promises', () => { throw new Error('Choices must not read files'); });
vi.mock('fs', () => { throw new Error('Choices must not read files'); });
vi.mock('fs/promises', () => { throw new Error('Choices must not read files'); });
vi.mock('../data', () => { throw new Error('Choices must not retrieve artifacts'); });

const bundle = 'generated_20260805_prefer_scored_routed';
const postal = '018956';
const records = fixture['scores/DOWNTOWN_CORE_PART_001.json'];
const realGeometry = fixture['geom/h3/886520db39fffff.json'][0];
const clone = <T>(value: T): T => structuredClone(value);

function freeze(value: unknown): void {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return;
  Object.values(value).forEach(freeze);
  Object.freeze(value);
}

function input(category: PublishedTransitCategory = 'bus'): PublishedTransitNormalizationInput {
  return {
    bundle, postal, category,
    score: clone(records.find(row => row.postal === postal)), geometry: clone(realGeometry),
    scoreContext: { bundle, postal }, geometryContext: { bundle, postal },
  };
}
const score = (i: PublishedTransitNormalizationInput): Mutable => i.score as Mutable;
const geom = (i: PublishedTransitNormalizationInput): Mutable => i.geometry as Mutable;

function normalize(i: PublishedTransitNormalizationInput): PublishedTransitNormalizationResult {
  const before = clone(i);
  freeze(i);
  const result = normalizePublishedTransitOptions(i);
  expect(i).toEqual(before);
  expect(fetch).not.toHaveBeenCalled();
  return result;
}

function select(pool: PublishedTransitNormalizationResult, category: PublishedTransitCategory = 'bus', current?: string | null) {
  const before = clone(pool);
  freeze(pool);
  const result = selectPublishedTransitChoices(pool, category, current);
  expect(pool).toEqual(before);
  expect(fetch).not.toHaveBeenCalled();
  expect(result.choices.length).toBeLessThanOrEqual(3);
  expect(new Set(result.choices.map(choice => choice.option.key)).size).toBe(result.choices.length);
  for (const choice of result.choices) {
    expect(choice.option.category).toBe(category);
    expect(choice.option.retainable).toBe(true);
    expect(choice.option).toBe(pool.options.find(option => option.key === choice.option.key));
    expect(new Set(choice.roles).size).toBe(choice.roles.length);
  }
  return result;
}

function summary(result: ReturnType<typeof select>) {
  return {
    choices: result.choices.map(({ option, roles }) => ({ key: option.key, roles })),
    defaultKey: result.defaultKey, selectedKey: result.selectedKey,
  };
}

function key(category: PublishedTransitCategory, role: 'default' | 'candidate', id?: string): string {
  return JSON.stringify(['pw', 1, bundle, postal, category, role, ...(id === undefined ? [] : [id])]);
}

function optionByAlias(pool: PublishedTransitNormalizationResult, alias: string): PublishedTransitOption {
  const option = pool.options.find(entry => entry.aliases.includes(alias));
  if (!option) throw new Error(`Missing fixture option ${alias}`);
  return option;
}

function winner(result: ReturnType<typeof select>, role: 'shortest' | 'most_covered' | 'current' | 'default') {
  const matches = result.choices.filter(choice => choice.roles.includes(role));
  expect(matches.length).toBeLessThanOrEqual(1);
  return matches[0]?.option;
}

interface SyntheticMetrics { distance: unknown; coverage: unknown; shortest?: unknown }
interface SyntheticCandidate extends SyntheticMetrics { id: string }

// Keep real geometry/trust shapes; replace only labelled synthetic identities/metrics.
// T04, not a test classifier, derives every ranking/retention capability.
function syntheticPool(candidates: SyntheticCandidate[], defaultMetrics?: SyntheticMetrics): PublishedTransitNormalizationResult {
  const i = input();
  const row = score(i);
  const geometry = geom(i);
  const candidateTemplate = clone(row.candidates.find((candidate: Mutable) => candidate.node_id === 'bus:03509'));
  const geometryTemplate = clone(geometry.candidates['bus:03509']);
  const defaultTemplate = clone(row.route_options.bus);
  const defaultGeometry = clone(geometry.route_options.bus);
  row.best_node = { type: 'mrt_lrt_exit' };
  row.route_options = {};
  geometry.route_options = {};
  geometry.candidates = {};
  row.candidates = candidates.map(spec => {
    const candidate = clone(candidateTemplate);
    candidate.node_id = spec.id;
    candidate.node_name = `Synthetic ${spec.id}`;
    candidate.geometry_ref = `${postal}_${spec.id}`;
    candidate.paths.shortest_m = spec.shortest === undefined ? spec.distance : spec.shortest;
    candidate.paths.sheltered_m = spec.distance;
    candidate.paths.covered_ratio = spec.coverage;
    geometry.candidates[spec.id] = clone(geometryTemplate);
    return candidate;
  });
  if (defaultMetrics) {
    defaultTemplate.best_node.name = 'Synthetic category default';
    defaultTemplate.best_node.exit = '90000';
    defaultTemplate.best_node.routed_m = defaultMetrics.distance;
    defaultTemplate.paths.shortest_m = defaultMetrics.distance;
    defaultTemplate.paths.sheltered_m = defaultMetrics.distance;
    defaultTemplate.paths.covered_ratio = defaultMetrics.coverage;
    row.route_options.bus = defaultTemplate;
    geometry.route_options.bus = defaultGeometry;
  }
  return normalize(i);
}

function permutations<T>(values: T[]): T[][] {
  if (values.length === 0) return [[]];
  return values.flatMap((value, i) => permutations(values.filter((_, j) => i !== j)).map(rest => [value, ...rest]));
}

beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected selector request'); })));
afterEach(() => vi.unstubAllGlobals());

describe('T05 real published choices and role identity', () => {
  it('R01 bus default is one shortest/covered/current choice, without arbitrary fillers', () => {
    const pool = normalize(input());
    expect(pool.options).toHaveLength(3);
    expect(summary(select(pool))).toEqual({
      choices: [{ key: key('bus', 'default'), roles: ['shortest', 'most_covered', 'current'] }],
      defaultKey: key('bus', 'default'), selectedKey: key('bus', 'default'),
    });
  });

  it('R01 MRT C wins distance and category-default Exit E wins coverage despite no candidate ID', () => {
    const pool = normalize(input('mrt_lrt'));
    const result = select(pool, 'mrt_lrt');
    expect(summary(result)).toEqual({
      choices: [
        { key: key('mrt_lrt', 'candidate', 'mrt:21624'), roles: ['shortest'] },
        { key: key('mrt_lrt', 'default'), roles: ['most_covered', 'current'] },
      ],
      defaultKey: key('mrt_lrt', 'default'), selectedKey: key('mrt_lrt', 'default'),
    });
    expect(result.choices[1].option.aliases).toEqual([]);
    expect(result.choices[1].option.selectionRef).toEqual({ kind: 'category_default', category: 'mrt_lrt' });
    expect(result.choices[1].option.name).toBe('BAYFRONT MRT STATION Exit E');
  });

  it('R02 current MRT D is retained third, without replacing C or E', () => {
    const pool = normalize(input('mrt_lrt'));
    const current = optionByAlias(pool, 'mrt:21678');
    expect(summary(select(pool, 'mrt_lrt', current.key))).toEqual({
      choices: [
        { key: key('mrt_lrt', 'candidate', 'mrt:21624'), roles: ['shortest'] },
        { key: key('mrt_lrt', 'default'), roles: ['most_covered'] },
        { key: current.key, roles: ['current'] },
      ],
      defaultKey: key('mrt_lrt', 'default'), selectedKey: current.key,
    });
  });

  it('R02 bus:03511 stays current beside the single dual-role default', () => {
    const pool = normalize(input());
    const current = optionByAlias(pool, 'bus:03511');
    expect(summary(select(pool, 'bus', current.key))).toEqual({
      choices: [
        { key: key('bus', 'default'), roles: ['shortest', 'most_covered'] },
        { key: current.key, roles: ['current'] },
      ],
      defaultKey: key('bus', 'default'), selectedKey: current.key,
    });
  });

  it('R02 category filtering does not allow the other category into winners or current', () => {
    const bus = normalize(input());
    const mrt = normalize(input('mrt_lrt'));
    const mixed = { ...bus, options: [...mrt.options, ...bus.options] };
    const busResult = select(mixed, 'bus', key('mrt_lrt', 'candidate', 'mrt:21678'));
    expect(busResult.selectedKey).toBeNull();
    expect(winner(busResult, 'current')).toBeUndefined();
    expect(busResult.defaultKey).toBe(key('bus', 'default'));
    expect(summary(select(mixed, 'mrt_lrt'))).toEqual(summary(select(mrt, 'mrt_lrt')));
  });

  it('R01 explicit null suppresses current, while omitted and undefined choose the declared default', () => {
    const pool = normalize(input());
    expect(summary(select(pool, 'bus', undefined))).toEqual(summary(select(pool)));
    const none = select(pool, 'bus', null);
    expect(none.selectedKey).toBeNull();
    expect(none.defaultKey).toBe(key('bus', 'default'));
    expect(none.choices[0].roles).toEqual(['shortest', 'most_covered']);
    expect(winner(none, 'current')).toBeUndefined();
  });
});

describe('T05 bounded roles, ties and ordering (synthetic metrics)', () => {
  const fourWay = () => syntheticPool([
    { id: 'bus:A', distance: 10, coverage: 0.1 },
    { id: 'bus:B', distance: 20, coverage: 0.9 },
    { id: 'bus:C', distance: 30, coverage: 0.3 },
  ], { distance: 90, coverage: 0.4 });

  it('R03 does not displace current for a fourth default, but retains the reset key', () => {
    const pool = fourWay();
    const current = optionByAlias(pool, 'bus:C');
    expect(summary(select(pool, 'bus', current.key))).toEqual({
      choices: [
        { key: key('bus', 'candidate', 'bus:A'), roles: ['shortest'] },
        { key: key('bus', 'candidate', 'bus:B'), roles: ['most_covered'] },
        { key: current.key, roles: ['current'] },
      ],
      defaultKey: key('bus', 'default'), selectedKey: current.key,
    });
  });

  it('R03 uses the eligible default as the third fallback only when current is explicitly absent', () => {
    const result = select(fourWay(), 'bus', null);
    expect(result.choices.map(choice => choice.roles)).toEqual([['shortest'], ['most_covered'], ['default']]);
    expect(result.choices[2].option.key).toBe(result.defaultKey);
    expect(result.selectedKey).toBeNull();
  });

  it('R03 omitted current adds the same third default with current, not duplicate default, role', () => {
    const result = select(fourWay());
    expect(result.choices.map(choice => choice.roles)).toEqual([['shortest'], ['most_covered'], ['current']]);
    expect(result.selectedKey).toBe(result.defaultKey);
  });

  it('R03 current winner merges its role and leaves a slot for the default', () => {
    const pool = fourWay();
    const result = select(pool, 'bus', optionByAlias(pool, 'bus:A').key);
    expect(result.choices.map(choice => choice.roles)).toEqual([['shortest', 'current'], ['most_covered'], ['default']]);
  });

  it('R04 equal shown distance prefers higher measured coverage', () => {
    const result = select(syntheticPool([
      { id: 'bus:A', distance: 10, coverage: 0.1 },
      { id: 'bus:Z', distance: 10, coverage: 0.8 },
    ]), 'bus', null);
    expect(winner(result, 'shortest')?.key).toBe(key('bus', 'candidate', 'bus:Z'));
    expect(result.choices).toHaveLength(1);
    expect(result.choices[0].roles).toEqual(['shortest', 'most_covered']);
  });

  it('R04 equal coverage prefers shorter shown distance', () => {
    const result = select(syntheticPool([
      { id: 'bus:A', distance: 20, coverage: 0.8 },
      { id: 'bus:Z', distance: 10, coverage: 0.8 },
    ]), 'bus', null);
    expect(winner(result, 'most_covered')?.key).toBe(key('bus', 'candidate', 'bus:Z'));
    expect(result.choices).toHaveLength(1);
  });

  it('R04 final ties use canonical code-unit keys rather than locale/display-name ordering', () => {
    const specs = [
      { id: 'bus:a', distance: 10, coverage: 0.5 },
      { id: 'bus:Z', distance: 10, coverage: 0.5 },
      { id: 'bus:\u00e9', distance: 10, coverage: 0.5 },
    ];
    for (const shuffled of permutations(specs)) {
      const pool = syntheticPool(shuffled);
      for (const options of permutations(pool.options)) {
        const result = select({ ...pool, options }, 'bus', null);
        expect(result.choices).toHaveLength(1);
        expect(result.choices[0].option.key).toBe(key('bus', 'candidate', 'bus:Z'));
        expect(result.choices[0].roles).toEqual(['shortest', 'most_covered']);
      }
    }
  });

  it('R04 all normalized input permutations preserve exact choices, role order and reset/current keys', () => {
    const pool = fourWay();
    const current = optionByAlias(pool, 'bus:C').key;
    const expected = select(pool, 'bus', current);
    for (const options of permutations(pool.options)) {
      expect(select({ ...pool, options }, 'bus', current)).toEqual(expected);
    }
  });

  it('R04 compares sheltered_m, not shortest variant or direct displacement', () => {
    const pool = syntheticPool([
      { id: 'bus:A', distance: 20, shortest: 1, coverage: 0.3 },
      { id: 'bus:B', distance: 10, shortest: 9, coverage: 0.3 },
    ]);
    const result = select(pool, 'bus', null);
    expect(winner(result, 'shortest')?.key).toBe(key('bus', 'candidate', 'bus:B'));
    expect(pool.options.every(option => option.metrics.direct_distance_m.status === 'valid')).toBe(true);
  });
});

describe('T05 independent missing/invalid/zero metric eligibility', () => {
  const unavailableCoverage = [undefined, null, '0.9', false, NaN, Infinity, -Infinity, -0.1, 1.1];
  for (const [index, coverage] of unavailableCoverage.entries()) {
    it(`R05 unavailable coverage case ${index} never becomes a coverage winner or suppresses shortest`, () => {
      const pool = syntheticPool([
        { id: 'bus:A', distance: 10, coverage },
        { id: 'bus:B', distance: 20, coverage: 0.2 },
      ]);
      const result = select(pool, 'bus', null);
      expect(winner(result, 'shortest')?.key).toBe(key('bus', 'candidate', 'bus:A'));
      expect(winner(result, 'most_covered')?.key).toBe(key('bus', 'candidate', 'bus:B'));
    });
  }

  it('R05 all unavailable coverage yields no coverage role and no arbitrary second choice', () => {
    const result = select(syntheticPool([
      { id: 'bus:A', distance: 10, coverage: null },
      { id: 'bus:B', distance: 20, coverage: NaN },
    ]), 'bus', null);
    expect(result.choices).toHaveLength(1);
    expect(result.choices[0].roles).toEqual(['shortest']);
    expect(winner(result, 'most_covered')).toBeUndefined();
  });

  it('R05 real measured zero-coverage MRT C/D still produce a most-covered winner', () => {
    const all = normalize(input('mrt_lrt'));
    // Deliberately restrict this normalized test pool to its two real measured-zero options.
    const pool = { ...all, options: all.options.filter(option => option.aliases.some(id => ['mrt:21624', 'mrt:21678'].includes(id))) };
    expect(pool.options).toHaveLength(2);
    const result = select(pool, 'mrt_lrt', null);
    expect(result.choices).toHaveLength(1);
    expect(result.choices[0].option.key).toBe(key('mrt_lrt', 'candidate', 'mrt:21624'));
    expect(result.choices[0].roles).toEqual(['shortest', 'most_covered']);
    expect(result.choices[0].option.metrics.covered_ratio).toMatchObject({ status: 'valid', value: 0 });
  });

  it('R05 known zero outranks unavailable coverage on a distance tie, even with a later key', () => {
    const result = select(syntheticPool([
      { id: 'bus:A', distance: 10, coverage: null },
      { id: 'bus:Z', distance: 10, coverage: 0 },
    ]), 'bus', null);
    expect(winner(result, 'shortest')?.key).toBe(key('bus', 'candidate', 'bus:Z'));
  });

  const unavailableDistance = [undefined, null, '10', false, NaN, Infinity, -Infinity, -1, 0];
  for (const [index, distance] of unavailableDistance.entries()) {
    it(`R06 unavailable distance case ${index} never wins shortest but valid coverage remains eligible`, () => {
      const pool = syntheticPool([
        { id: 'bus:A', distance, coverage: 0.9 },
        { id: 'bus:B', distance: 20, coverage: 0.1 },
      ]);
      const result = select(pool, 'bus', null);
      expect(winner(result, 'shortest')?.key).toBe(key('bus', 'candidate', 'bus:B'));
      expect(winner(result, 'most_covered')?.key).toBe(key('bus', 'candidate', 'bus:A'));
    });
  }

  it('R06 coverage ties prefer known positive distance over unavailable distance', () => {
    const result = select(syntheticPool([
      { id: 'bus:A', distance: null, coverage: 0.5 },
      { id: 'bus:Z', distance: 10, coverage: 0.5 },
    ]), 'bus', null);
    expect(result.choices).toHaveLength(1);
    expect(winner(result, 'most_covered')?.key).toBe(key('bus', 'candidate', 'bus:Z'));
  });

  it('R06 all distances unavailable yields coverage only, without substituting another distance', () => {
    const result = select(syntheticPool([
      { id: 'bus:A', distance: null, coverage: 0.2 },
      { id: 'bus:B', distance: 0, coverage: 0.9 },
    ]), 'bus', null);
    expect(result.choices).toHaveLength(1);
    expect(result.choices[0].roles).toEqual(['most_covered']);
    expect(result.choices[0].option.metrics.sheltered_m.status).toBe('invalid');
  });

  for (const disabled of ['distanceRankable', 'coverageRankable'] as const) {
    it(`R05/R06 respects disabled normalized ${disabled} even when a numeric field is valid`, () => {
      const pool = clone(syntheticPool([{ id: 'bus:A', distance: 10, coverage: 0.5 }]));
      pool.options[0][disabled] = false;
      const result = select(pool, 'bus', null);
      expect(result.choices[0].roles).toEqual([disabled === 'distanceRankable' ? 'most_covered' : 'shortest']);
    });
  }
});

describe('T05 current selection, context and reset availability', () => {
  const staleKeys = [
    'unknown-option',
    JSON.stringify(['pw', 1, 'other-bundle', postal, 'bus', 'default']),
    JSON.stringify(['pw', 1, bundle, '018990', 'bus', 'default']),
    key('mrt_lrt', 'candidate', 'mrt:21678'),
  ];
  for (const [index, current] of staleKeys.entries()) {
    it(`R07 invalid/stale/wrong-context current ${index} adds no current and does not silently select default`, () => {
      const result = select(normalize(input()), 'bus', current);
      expect(result.selectedKey).toBeNull();
      expect(winner(result, 'current')).toBeUndefined();
      expect(result.defaultKey).toBe(key('bus', 'default'));
    });
  }

  for (const contextStatus of ['invalid', 'preview_only'] as const) {
    it(`R07 ${contextStatus} context suppresses even retained options and reset/current keys`, () => {
      const pool = { ...normalize(input()), contextStatus };
      expect(select(pool)).toEqual({ choices: [], defaultKey: null, selectedKey: null });
    });
  }

  for (const defect of ['partial-geometry', 'missing-geometry', 'wrong-reference', 'unrouted', 'unclassified', 'preview', 'quarantined']) {
    it(`R07 actual normalizer excludes ${defect} current without suppressing valid default`, () => {
      const i = input();
      const candidate = score(i).candidates.find((entry: Mutable) => entry.node_id === 'bus:03511');
      if (defect === 'partial-geometry') geom(i).candidates[candidate.node_id].sheltered_parts.push('_');
      if (defect === 'missing-geometry') delete geom(i).candidates[candidate.node_id];
      if (defect === 'wrong-reference') candidate.geometry_ref = 'other';
      if (defect === 'unrouted') candidate.routing_type = candidate.route_trust = 'direct_bus_fallback_unrouted';
      if (defect === 'unclassified') candidate.route_trust = 'unsupported';
      if (defect === 'preview') candidate.routing_type = 'live_onemap_preview';
      if (defect === 'quarantined') {
        const duplicate = clone(candidate); duplicate.paths.sheltered_m += 1; score(i).candidates.push(duplicate);
      }
      const pool = normalize(i);
      const unavailable = optionByAlias(pool, 'bus:03511');
      expect(unavailable.retainable).toBe(false);
      const result = select(pool, 'bus', unavailable.key);
      expect(result.selectedKey).toBeNull();
      expect(result.choices.map(choice => choice.option.key)).toEqual([key('bus', 'default')]);
      expect(result.choices[0].roles).toEqual(['shortest', 'most_covered']);
    });
  }

  it('R07 retains a valid current with both winner metrics missing', () => {
    const pool = syntheticPool([
      { id: 'bus:A', distance: 10, coverage: 0.8 },
      { id: 'bus:B', distance: null, coverage: null },
    ]);
    const current = optionByAlias(pool, 'bus:B');
    const result = select(pool, 'bus', current.key);
    expect(result.choices.map(choice => choice.roles)).toEqual([['shortest', 'most_covered'], ['current']]);
    expect(result.selectedKey).toBe(current.key);
  });

  it('R08 unavailable category default retains reset ownership over a usable distinct top default', () => {
    const i = input(); score(i).route_options.bus = null;
    const pool = normalize(i);
    const result = select(pool);
    expect(result.defaultKey).toBe(key('bus', 'default'));
    expect(result.selectedKey).toBeNull();
    expect(result.choices).toHaveLength(1);
    expect(result.choices[0].option.selectionRef).toEqual({ kind: 'top_default' });
    expect(result.choices[0].option.key).not.toBe(result.defaultKey);
    expect(result.choices[0].roles).toEqual(['shortest', 'most_covered']);
  });

  it('R08 source locators identify default even when its chosen whole representation is a candidate', () => {
    const i = input();
    delete geom(i).route_options.bus;
    geom(i).sheltered_parts = []; geom(i).sheltered = null;
    const pool = normalize(i);
    const result = select(pool);
    expect(result.defaultKey).toBe(key('bus', 'default'));
    expect(result.selectedKey).toBe(result.defaultKey);
    expect(result.choices[0].option.selectionRef).toEqual({ kind: 'candidate', nodeId: 'bus:03509' });
    expect(result.choices[0].option.sources.some(source => source.selectionRef.kind === 'category_default')).toBe(true);
  });

  it('R08 absent category default falls back to the top-default source locator', () => {
    const i = input(); delete score(i).route_options.bus;
    const result = select(normalize(i));
    expect(result.defaultKey).toBe(key('bus', 'default'));
    expect(result.selectedKey).toBe(result.defaultKey);
    expect(result.choices[0].option.selectionRef).toEqual({ kind: 'top_default' });
  });

  it('R08 unavailable geometry yields no choices but preserves the declared reset key', () => {
    const i = input(); i.geometry = null;
    expect(select(normalize(i))).toEqual({ choices: [], defaultKey: key('bus', 'default'), selectedKey: null });
  });

  it('R08 empty or other-category-only pools have no reset/current or arbitrary filler', () => {
    const pool = normalize(input());
    expect(select({ ...pool, options: [] })).toEqual({ choices: [], defaultKey: null, selectedKey: null });
    expect(select(pool, 'mrt_lrt')).toEqual({ choices: [], defaultKey: null, selectedKey: null });
  });

  it('R08 one candidate occupies one choice, not three duplicate winner roles', () => {
    const pool = syntheticPool([{ id: 'bus:A', distance: 10, coverage: 0 }]);
    const current = optionByAlias(pool, 'bus:A');
    const result = select(pool, 'bus', current.key);
    expect(result.choices).toHaveLength(1);
    expect(result.choices[0].roles).toEqual(['shortest', 'most_covered', 'current']);
    expect(result.defaultKey).toBeNull();
  });

  for (const category of ['bus', 'mrt_lrt'] as const) {
    it(`R08 missing candidate list preserves real ${category} default evidence`, () => {
      const i = input(category); delete score(i).candidates;
      const result = select(normalize(i), category);
      expect(result.choices).toHaveLength(1);
      expect(result.choices[0].option.key).toBe(key(category, 'default'));
      expect(result.choices[0].roles).toEqual(['shortest', 'most_covered', 'current']);
    });
  }

  it('R08 metric-less default is current when omitted and fallback-only when explicitly null', () => {
    const pool = syntheticPool([], { distance: null, coverage: null });
    const current = select(pool);
    expect(current.choices[0].roles).toEqual(['current']);
    expect(current.selectedKey).toBe(current.defaultKey);
    const none = select(pool, 'bus', null);
    expect(none.choices[0].roles).toEqual(['default']);
    expect(none.selectedKey).toBeNull();
  });
});

describe('T05 full precision and side-effect boundary', () => {
  it('R09 rounded distance labels do not let higher coverage overturn the truly shorter route', () => {
    const pool = syntheticPool([
      { id: 'bus:A', distance: 10.049, coverage: 0.9 },
      { id: 'bus:Z', distance: 10.041, coverage: 0.1 },
    ]);
    expect((10.049).toFixed(1)).toBe((10.041).toFixed(1));
    const result = select(pool, 'bus', null);
    expect(winner(result, 'shortest')?.key).toBe(key('bus', 'candidate', 'bus:Z'));
    expect(winner(result, 'shortest')?.metrics.sheltered_m).toMatchObject({ status: 'valid', value: 10.041 });
  });

  it('R09 rounded coverage labels do not let shorter distance overturn truly greater coverage', () => {
    const pool = syntheticPool([
      { id: 'bus:A', distance: 10, coverage: 0.501041 },
      { id: 'bus:Z', distance: 20, coverage: 0.501049 },
    ]);
    expect((0.501041).toFixed(3)).toBe((0.501049).toFixed(3));
    const result = select(pool, 'bus', null);
    expect(winner(result, 'most_covered')?.key).toBe(key('bus', 'candidate', 'bus:Z'));
    expect(winner(result, 'most_covered')?.metrics.covered_ratio).toMatchObject({ status: 'valid', value: 0.501049 });
  });

  it('R10 repeated selection preserves frozen original numeric/gap evidence and exact option objects', () => {
    const i = input();
    const original = clone(i);
    const pool = normalize(i);
    const result = select(pool);
    const option = result.choices[0].option;
    expect(option.gaps.sheltered.logical.total_m).toMatchObject({ status: 'valid', value: 36.5 });
    expect(option.gaps.sheltered.logical.longest_m).toMatchObject({ status: 'valid', value: 20.2 });
    expect(option.gaps.sheltered.fragments.entries.map(entry => entry.length.status === 'valid' ? entry.length.value : null)).toEqual([16.3, 11, 9.1]);
    expect(select(pool)).toEqual(result);
    expect(i).toEqual(original);
    expect(option.selectedSource.raw).toBe((i.score as Mutable).route_options.bus);
  });

  it('R10 selector never reads raw evidence, geometry, labels, aliases or provenance to make choices', () => {
    const pool = normalize(input());
    const expected = summary(select(pool));
    const forbidden = () => { throw new Error('Selector crossed normalized capability boundary'); };
    const guarded = {
      ...pool,
      options: pool.options.map(original => {
        const source = (entry: PublishedTransitOption['selectedSource']) => Object.freeze({
          selectionRef: entry.selectionRef, get raw(): unknown { return forbidden(); },
          get rawGeometry(): unknown { return forbidden(); },
        });
        const option = { ...original, selectedSource: source(original.selectedSource), sources: original.sources.map(source) };
        for (const field of ['geometry', 'gaps', 'name', 'aliases', 'state', 'classification', 'status', 'diagnostics']) {
          Object.defineProperty(option, field, { get: forbidden });
        }
        return Object.freeze(option);
      }),
    };
    Object.defineProperty(guarded, 'contextProvenance', { get: forbidden });
    Object.freeze(guarded.options); Object.freeze(guarded);
    // Do not use the snapshot helper: reading raw diagnostic evidence is forbidden in this test.
    const result = selectPublishedTransitChoices(guarded, 'bus');
    expect(summary(result)).toEqual(expected);
    expect(result.choices[0].option).toBe(guarded.options.find(option => option.key === result.choices[0].option.key));
    expect(fetch).not.toHaveBeenCalled();
  });
});
