import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  publishedExposureSections,
  resolveMappedExposureFocus,
  type PublishedExposureSections,
} from '../published-exposure-sections';
import {
  normalizePublishedTransitOptions,
  type PublishedTransitCategory,
  type PublishedTransitOption,
} from '../published-transit-options';
import { decodePolyline, encodePolyline } from '../polyline';
import fixture from './fixtures/published-options.json';

vi.mock('node:fs', () => { throw new Error('Exposure sections must not read files'); });
vi.mock('node:fs/promises', () => { throw new Error('Exposure sections must not read files'); });

const bundle = 'generated_20260805_prefer_scored_routed';
const records = fixture['scores/DOWNTOWN_CORE_PART_001.json'];
const geometry = fixture['geom/h3/886520db39fffff.json'][0];
// Deliberate boundary mutations below operate on copies of the portable fixture.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mutable = Record<string, any>;
type Mode = 'shiokest' | 'shortest' | 'both';

function input(category: PublishedTransitCategory = 'bus', postal = '018956') {
  return {
    bundle, postal, category,
    score: structuredClone(records.find(record => record.postal === postal)) as unknown as Mutable,
    geometry: postal === '018956' ? structuredClone(geometry) as Mutable : null,
    scoreContext: { bundle, postal }, geometryContext: { bundle, postal },
  };
}

function isolatedInput() {
  const value = input();
  value.score.best_node = null;
  value.score.candidates = [];
  return value;
}

function option(value = input(), alias?: string): PublishedTransitOption {
  const pool = normalizePublishedTransitOptions(value);
  const result = alias ? pool.options.find(row => row.aliases.includes(alias))
    : pool.options.find(row => row.sources.some(source => source.selectionRef.kind === 'category_default'));
  if (!result) throw new Error('Fixture did not produce the required option');
  return result;
}

function freeze(value: unknown): void {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return;
  Object.values(value).forEach(freeze);
  Object.freeze(value);
}

function model(value: PublishedTransitOption | null = option(), mode: Mode = 'shiokest') {
  const before = structuredClone(value);
  freeze(value);
  const result = publishedExposureSections(value, mode);
  expect(value).toEqual(before);
  expect(fetch).not.toHaveBeenCalled();
  return result;
}

function selection(value: PublishedExposureSections) {
  expect(value.sections.length).toBeGreaterThan(0);
  return { contextKey: value.contextKey, sectionKey: value.sections[0].key };
}

function lengths(value: PublishedExposureSections) {
  return value.sections.map(section => section.lengthM).sort((a, b) => a - b);
}

function identities(value: PublishedExposureSections) {
  return value.sections.map(section => [section.encoded, section.lengthM, section.key])
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })));
afterEach(() => vi.unstubAllGlobals());

describe('T07 real mapped sections remain distinct from logical gaps', () => {
  it('keeps the three real bus fragments, not a reconstructed two-gap list', () => {
    const original = input();
    const before = structuredClone(original);
    freeze(original);
    const chosen = option(original);
    const result = model(chosen);
    expect(result.status).toBe('available');
    expect(result.sections).toHaveLength(3);
    expect(lengths(result)).toEqual([9.1, 11, 16.3]);
    expect(result.sections.reduce((sum, section) => sum + section.lengthM, 0)).toBeCloseTo(16.3 + 11 + 9.1);
    expect(chosen.gaps.sheltered.logical.entries.map(entry => entry.length.status === 'valid' ? entry.length.value : null)).toEqual([16.3, 20.2]);
    expect(chosen.gaps.sheltered.logical.longest_m).toMatchObject({ status: 'valid', value: 20.2 });
    expect(result).not.toHaveProperty('longest_m');
    expect(result).not.toHaveProperty('total_m');
    for (const section of result.sections) {
      expect(section.key).toEqual(expect.any(String));
      expect(section.key.length).toBeGreaterThan(0);
      expect(section.points).toEqual(decodePolyline(section.encoded));
    }
    expect(original).toEqual(before);
  });

  it('uses the real Exit D candidate fragments without borrowing default metrics or logical gaps', () => {
    const chosen = option(input('mrt_lrt'), 'mrt:21678');
    const before = structuredClone(chosen);
    const defaultBefore = structuredClone(records[0]);
    const result = model(chosen);
    expect(result.status).toBe('available');
    expect(lengths(result)).toEqual([16.3, 43.3, 50.3]);
    expect(result.sections.map(section => section.encoded).sort())
      .toEqual(geometry.candidates['mrt:21678'].exposure_gaps.map(gap => gap.geom).sort());
    expect(chosen.gaps.sheltered.logical.reasons).toEqual(['logical_gaps_not_published']);
    expect(chosen.gaps.sheltered.logical.total_m.status).not.toBe('valid');
    expect(chosen.metrics.sheltered_m).toMatchObject({ status: 'valid', value: 110 });
    expect(chosen).toEqual(before);
    expect(records[0]).toEqual(defaultBefore);
    expect(result).not.toHaveProperty('score');
    expect(result).not.toHaveProperty('provenance');
  });

  it('both mode exposes the same sheltered pieces with a distinct focus context', () => {
    const chosen = option();
    const sheltered = model(chosen);
    const both = model(chosen, 'both');
    expect(both.status).toBe('available');
    expect(lengths(both)).toEqual(lengths(sheltered));
    expect(both.sections.map(section => section.encoded).sort()).toEqual(sheltered.sections.map(section => section.encoded).sort());
    expect(both.contextKey).not.toBe(sheltered.contextKey);
    expect(resolveMappedExposureFocus(both, selection(sheltered))).toBeNull();
  });
});

describe('T07 content identity, deduplication and source ownership', () => {
  it('exact duplicates do not create extra sections or change an existing focus context', () => {
    const value = isolatedInput();
    const baseline = model(option(structuredClone(value)));
    const gaps = value.geometry!.route_options.bus.exposure_gaps;
    gaps.push(structuredClone(gaps[0]), { ...gaps[0], label: 'Synthetic duplicate label', part_index: 901 });
    const result = model(option(value));
    expect(result.sections).toHaveLength(3);
    expect(identities(result)).toEqual(identities(baseline));
    expect(result.contextKey).toBe(baseline.contextKey);
  });

  it('fragment order, labels and non-authoritative part indices cannot become section identity', () => {
    const value = isolatedInput();
    const baseline = model(option(structuredClone(value)));
    value.geometry!.route_options.bus.exposure_gaps.reverse();
    value.geometry!.route_options.bus.exposure_gaps.forEach((gap: Mutable, index: number) => {
      gap.label = `Synthetic renamed section ${index}`;
      gap.part_index = 800 + index;
    });
    const result = model(option(value));
    expect(identities(result)).toEqual(identities(baseline));
    expect(result.contextKey).toBe(baseline.contextKey);
    expect(resolveMappedExposureFocus(result, selection(baseline))).not.toBeNull();
  });

  it('same coordinates with a different recorded length are not exact duplicates', () => {
    const value = isolatedInput();
    const gaps = value.geometry!.route_options.bus.exposure_gaps;
    gaps.push({ ...gaps[0], len_m: 17.7 });
    const result = model(option(value));
    const sameLine = result.sections.filter(section => section.encoded === gaps[0].geom);
    expect(sameLine).toHaveLength(2);
    expect(new Set(sameLine.map(section => section.key)).size).toBe(2);
    expect(lengths(result)).toEqual([9.1, 11, 16.3, 17.7]);
  });

  it.each(['base geometry', 'fragment geometry', 'length', 'selected source', 'option key'] as const)(
    '%s changes invalidate a previously selected section even if another piece survives', change => {
      const baselineOption = option(isolatedInput());
      const baseline = model(baselineOption);
      const next = structuredClone(baselineOption);
      if (change === 'base geometry') {
        const points = decodePolyline(encodePolyline([[1.28, 103.85], [1.281, 103.851]]));
        next.geometry.sheltered.parts.push({ sourceIndex: 700, encoded: encodePolyline(points), points });
        next.geometry.sheltered.signature = JSON.stringify(next.geometry.sheltered.parts.map(part => part.encoded));
      } else if (change === 'fragment geometry') {
        const points = next.geometry.sheltered.parts[1].points.slice(0, 2);
        const fragment = next.gaps.sheltered.fragments.entries[2];
        fragment.points = points;
        fragment.encoded = encodePolyline(points);
      } else if (change === 'length') {
        next.gaps.sheltered.fragments.entries[1].length = { status: 'valid', value: 11.5, sourceField: 'synthetic.length' };
      } else if (change === 'selected source') {
        next.selectedSource.selectionRef = { kind: 'top_default' };
      } else {
        const key = JSON.parse(next.key);
        key[2] = 'synthetic_other_immutable_bundle';
        next.key = JSON.stringify(key);
      }
      const changed = model(next);
      expect(changed.sections.length).toBeGreaterThan(0);
      expect(changed.contextKey).not.toBe(baseline.contextKey);
      expect(resolveMappedExposureFocus(changed, selection(baseline))).toBeNull();
    },
  );

  it('does not inspect raw diagnostic evidence to construct a map section', () => {
    const chosen = option();
    const fail = () => { throw new Error('Raw diagnostic source read'); };
    const guarded: PublishedTransitOption = {
      ...chosen,
      selectedSource: { selectionRef: chosen.selectedSource.selectionRef, get raw() { return fail(); }, get rawGeometry() { return fail(); } },
      sources: [],
    };
    const result = publishedExposureSections(guarded, 'shiokest');
    expect(lengths(result)).toEqual([9.1, 11, 16.3]);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('T07 mapped sections reject unsafe fragments without changing measurements', () => {
  it.each(['foreign', 'malformed', 'cross-part', 'shifted', 'negative length', 'nonfinite length'] as const)(
    'excludes a %s fragment while preserving the two valid pieces', mutation => {
      const value = isolatedInput();
      const baseline = option(value);
      const raw = value.geometry!.route_options.bus;
      const gap = raw.exposure_gaps[0];
      if (mutation === 'foreign') gap.geom = encodePolyline([[89, 170], [89.1, 170.1]]);
      else if (mutation === 'malformed') gap.geom = '_';
      else if (mutation === 'cross-part') {
        const left = decodePolyline(raw.sheltered_parts[0]);
        const right = decodePolyline(raw.sheltered_parts[2]);
        gap.geom = encodePolyline([left[left.length - 1], right[0]]);
      } else if (mutation === 'shifted') gap.geom = encodePolyline(decodePolyline(gap.geom).map(([lat, lon]) => [lat + 0.00001, lon]));
      else if (mutation === 'negative length') gap.len_m = -1;
      else gap.len_m = Infinity;
      const chosen = option(value);
      expect(chosen.gaps.sheltered.fragments.entries[0].highlightable).toBe(false);
      const result = model(chosen);
      expect(result.status).toBe('partial');
      expect(lengths(result)).toEqual([9.1, 11]);
      expect(chosen.metrics).toEqual(baseline.metrics);
      expect(chosen.gaps.sheltered.logical).toEqual(baseline.gaps.sheltered.logical);
    },
  );

  it.each(['shiokest', 'both'] as const)('partial shortest geometry does not suppress sheltered sections in %s mode', mode => {
    const value = isolatedInput();
    value.geometry!.route_options.bus.shortest_parts[1] = '_';
    const chosen = option(value);
    expect(chosen.geometry.shortest.status).toBe('partial');
    expect(chosen.geometry.sheltered.status).toBe('complete');
    const result = model(chosen, mode);
    expect(lengths(result)).toEqual([9.1, 11, 16.3]);
    expect(resolveMappedExposureFocus(result, selection(result))?.kind).toBe('mapped-section');
  });

  it('partial sheltered geometry includes only fragments on surviving route parts', () => {
    const value = isolatedInput();
    value.geometry!.route_options.bus.sheltered_parts[0] = '_';
    const chosen = option(value);
    expect(chosen.geometry.sheltered.status).toBe('partial');
    expect(chosen.gaps.sheltered.fragments.entries[0].highlightable).toBe(false);
    const result = model(chosen);
    expect(result.status).toBe('partial');
    expect(lengths(result)).toEqual([9.1, 11]);
    expect(chosen.gaps.sheltered.logical.longest_m).toMatchObject({ status: 'valid', value: 20.2 });
  });

  it('complete empty fragment evidence is empty, not a fabricated covered-walk claim', () => {
    const value = isolatedInput();
    value.geometry!.route_options.bus.exposure_gaps = [];
    const chosen = option(value);
    const result = model(chosen);
    expect(result.status).toBe('empty');
    expect(result.sections).toEqual([]);
    expect(chosen.gaps.sheltered.logical.longest_m).toMatchObject({ status: 'valid', value: 20.2 });
    expect(resolveMappedExposureFocus(result, { contextKey: result.contextKey, sectionKey: 'missing' })).toBeNull();
  });

  it('missing fragment evidence is unavailable rather than an empty complete list', () => {
    const value = isolatedInput();
    delete value.geometry!.route_options.bus.exposure_gaps;
    const result = model(option(value));
    expect(result.status).toBe('unavailable');
    expect(result.sections).toEqual([]);
  });

  it('missing sheltered geometry cannot borrow the shortest route for exposure', () => {
    const value = isolatedInput();
    value.geometry!.route_options.bus.sheltered = '';
    value.geometry!.route_options.bus.sheltered_parts = [];
    const chosen = option(value);
    expect(chosen.geometry.shortest.status).toBe('complete');
    expect(model(chosen).sections).toEqual([]);
  });
});

describe('T07 unavailable contexts and synchronous focus resolution', () => {
  it('shortest never borrows sheltered section evidence', () => {
    const chosen = option();
    const previous = model(chosen);
    const result = model(chosen, 'shortest');
    expect(result.status).toBe('unavailable');
    expect(result.sections).toEqual([]);
    expect(resolveMappedExposureFocus(result, selection(previous))).toBeNull();
  });

  it.each(['preview', 'unrouted', 'unclassified', 'conflict'] as const)('rejects %s even with otherwise valid fragments', classification => {
    const chosen = option();
    chosen.classification = classification;
    const result = model(chosen);
    expect(result.status).toBe('unavailable');
    expect(result.sections).toEqual([]);
  });

  it.each(['018990', '079908'])('does not manufacture sections for real unavailable fixture %s', postal => {
    const pool = normalizePublishedTransitOptions(input('bus', postal));
    for (const chosen of pool.options) expect(model(chosen).sections).toEqual([]);
    expect(model(null).status).toBe('unavailable');
    expect(model(null).sections).toEqual([]);
  });

  it('resolves exactly the selected section and preserves frozen input', () => {
    const result = model();
    const chosen = result.sections[1];
    const selected = { contextKey: result.contextKey, sectionKey: chosen.key };
    const before = structuredClone(result);
    freeze(result); freeze(selected);
    const focus = resolveMappedExposureFocus(result, selected);
    expect(focus).toMatchObject({ kind: 'mapped-section', contextKey: result.contextKey, key: chosen.key,
      encoded: chosen.encoded, points: chosen.points, lengthM: chosen.lengthM });
    expect(result).toEqual(before);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects null selection, unknown section, stale context and another option without fallback', () => {
    const result = model();
    const other = model(option(input('mrt_lrt'), 'mrt:21678'));
    expect(resolveMappedExposureFocus(result, null)).toBeNull();
    expect(resolveMappedExposureFocus(result, { contextKey: result.contextKey, sectionKey: 'unknown' })).toBeNull();
    expect(resolveMappedExposureFocus(result, { contextKey: 'stale', sectionKey: result.sections[0].key })).toBeNull();
    expect(resolveMappedExposureFocus(other, selection(result))).toBeNull();
    expect(resolveMappedExposureFocus(model(null), selection(result))).toBeNull();
  });
});
