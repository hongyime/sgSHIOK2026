import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizePublishedTransitOptions, type PublishedTransitCategory, type PublishedTransitOption } from '../published-transit-options';
import { publishedOptionGeometry } from '../published-walk-view';
import { postalGeomToRouteGeoJson } from '../route-geojson';
import { decodePolyline, encodePolyline } from '../polyline';
import fixture from './fixtures/published-options.json';

vi.mock('node:fs', () => { throw new Error('Adapter must not read files'); });
vi.mock('node:fs/promises', () => { throw new Error('Adapter must not read files'); });
const bundle = 'generated_20260805_prefer_scored_routed';
const records = fixture['scores/DOWNTOWN_CORE_PART_001.json'];
const rawGeometry = fixture['geom/h3/886520db39fffff.json'][0];
// Mutable JSON is used only to label deliberate synthetic boundary cases below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mutable = Record<string, any>;
function input(category: PublishedTransitCategory = 'bus', postal = '018956') {
  return { bundle, postal, category, score: structuredClone(records.find(row => row.postal === postal)) as unknown as Mutable,
    geometry: postal === '018956' ? structuredClone(rawGeometry) as Mutable : null,
    scoreContext: { bundle, postal }, geometryContext: { bundle, postal } };
}
function freeze(value: unknown): void {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return;
  Object.values(value).forEach(freeze); Object.freeze(value);
}
function option(i = input(), alias?: string) {
  const result = normalizePublishedTransitOptions(i);
  const found = alias ? result.options.find(o => o.aliases.includes(alias)) : result.options.find(o => o.sources.some(s => s.selectionRef.kind === 'category_default'));
  if (!found) throw new Error('Missing test option');
  return found;
}
function view(o: PublishedTransitOption, postal = '018956') {
  const before = structuredClone(o); freeze(o);
  const result = publishedOptionGeometry(postal, o);
  expect(o).toEqual(before); expect(fetch).not.toHaveBeenCalled();
  return result;
}
beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })));
afterEach(() => vi.unstubAllGlobals());

describe('publishedOptionGeometry real selected evidence', () => {
  for (const category of ['bus', 'mrt_lrt'] as const) it(`preserves ${category} default multipart route coordinates without flattening or source mutation`, () => {
    const o = option(input(category));
    const g = view(o)!;
    expect(g.postal).toBe('018956');
    expect(g.sheltered_parts).toEqual(o.geometry.sheltered.parts.map(p => p.encoded));
    expect(g.shortest_parts).toEqual(o.geometry.shortest.parts.map(p => p.encoded));
    expect(g.sheltered).toBe(g.sheltered_parts!.length === 1 ? g.sheltered_parts![0] : '');
    const rendered = postalGeomToRouteGeoJson(g);
    expect(rendered.sheltered.features.map(f => f.geometry.coordinates)).toEqual(o.geometry.sheltered.parts.map(p => p.points.map(([lat, lon]) => [lon, lat])));
    expect(g).not.toHaveProperty('candidates'); expect(g).not.toHaveProperty('route_options');
    expect(g).not.toHaveProperty('route_segments');
  });
  it('preserves the selected default logical list separately from its three map fragments', () => {
    const o = option(); const g = view(o)!;
    expect(g.exposure_gaps.map(gap => gap.len_m)).toEqual([16.3, 11, 9.1]);
    expect(o.gaps.sheltered.logical.entries.map(gap => gap.length.status === 'valid' ? gap.length.value : null)).toEqual([16.3, 20.2]);
    expect(o.gaps.sheltered.logical.longest_m).toMatchObject({ status: 'valid', value: 20.2 });
    expect(g.exposure_gaps.map(gap => gap.label)).toEqual(rawGeometry.route_options.bus.exposure_gaps.map(gap => gap.label));
  });
  it('uses Exit D candidate geometry and fragments, not category Exit E or inherited default gaps', () => {
    const o = option(input('mrt_lrt'), 'mrt:21678'); const g = view(o)!;
    expect(g.sheltered_parts).toEqual(rawGeometry.candidates['mrt:21678'].sheltered_parts);
    expect(g.exposure_gaps.map(gap => gap.len_m)).toEqual([43.3, 50.3, 16.3]);
    expect(o.gaps.sheltered.logical.reasons).toEqual(['logical_gaps_not_published']);
    expect(o.gaps.shortest.fragments.status).toBe('unavailable');
    expect(g).not.toHaveProperty('total'); expect(g).not.toHaveProperty('provenance');
  });
  for (const postal of ['018990', '079908']) it(`returns no fabricated map geometry for real fixture ${postal}`, () => {
    const i = input('bus', postal);
    const pool = normalizePublishedTransitOptions(i);
    expect(pool.options.every(o => publishedOptionGeometry(postal, o) === null)).toBe(true);
  });
  it('rejects mismatched postal instead of relabelling a validated option', () => {
    const o = option();
    expect(view(o, '018990')).toBeNull();
    expect(view(o, '18956')).toBeNull();
    expect(view(o, '018956 ')).toBeNull();
  });
  it('never reads raw score/geometry from diagnostic sources', () => {
    const o = option();
    const forbidden = () => { throw new Error('Raw source accessed by renderer adapter'); };
    const guarded: PublishedTransitOption = { ...o,
      selectedSource: { selectionRef: o.selectedSource.selectionRef, get raw() { return forbidden(); }, get rawGeometry() { return forbidden(); } },
      sources: [],
    };
    expect(publishedOptionGeometry('018956', guarded)?.sheltered_parts).toEqual(o.geometry.sheltered.parts.map(p => p.encoded));
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('publishedOptionGeometry synthetic detail and partial-route boundaries', () => {
  for (const classification of ['conflict', 'unclassified', 'unrouted', 'preview'] as const) it(`rejects-nonrouted ${classification} default despite valid base geometry`, () => {
    const i = input(); i.score.candidates = []; i.score.best_node = null;
    const row = i.score.route_options.bus;
    if (classification === 'conflict') row.paths.shortest_m += 1;
    if (classification === 'unclassified') row.paths.routing_type = 'unsupported_synthetic';
    if (classification === 'unrouted') row.paths.routing_type = 'direct_bus_fallback_unrouted';
    if (classification === 'preview') i.score.provenance = { source: 'live_onemap_preview', authoritative_score: false };
    const o = option(i);
    expect(o.classification).toBe(classification);
    expect(o.geometry.sheltered.status).toBe('complete');
    expect(view(o) === null).toBe(true);
    const guarded = { ...o, get geometry(): PublishedTransitOption['geometry'] { throw new Error('Rejected option geometry accessed'); } };
    expect(publishedOptionGeometry('018956', guarded)).toBeNull();
  });
  function withSegments() {
    const i = input();
    const g = i.geometry!.route_options.bus;
    // Explicit synthetic coloring over real route coordinates, not published segment claims.
    g.route_segments = { sheltered: g.sheltered_parts.map((encoded: string, index: number) => ({ geom: encoded, len_m: 10.125 + index, is_covered: index === 1, source_class: index === 1 ? 'osm_covered' : 'exposed', source_summary: 'synthetic_test:1' })) };
    return i;
  }
  it('preserves validated covered/exposed coloring and exact metadata through the actual renderer', () => {
    const i = withSegments(); const o = option(i); const g = view(o)!;
    expect(g.route_segments?.sheltered).toEqual(o.geometry.routeSegments.sheltered.segments);
    expect(g.route_segments?.sheltered).not.toBe(o.geometry.routeSegments.sheltered.segments);
    const rendered = postalGeomToRouteGeoJson(g);
    expect(rendered.sheltered.features.map(f => f.properties.is_covered)).toEqual([0, 1, 0]);
    expect(rendered.sheltered.features.map(f => f.properties.len_m)).toEqual([10.125, 11.125, 12.125]);
    expect(rendered.sheltered.features[1].properties.source_class).toBe('osm_covered');
  });
  it('invalid optional segments cannot suppress or inflate the base route', () => {
    const i = withSegments(); i.geometry!.route_options.bus.route_segments.sheltered[0].geom = encodePolyline([[89, 170], [89.1, 170.1]]);
    const o = option(i); const g = view(o)!;
    expect(g.route_segments).toBeUndefined();
    const actual = postalGeomToRouteGeoJson(g);
    const base = postalGeomToRouteGeoJson({ ...g, route_segments: undefined });
    expect(actual).toEqual(base);
    expect(actual.sheltered.features).toHaveLength(3);
    expect(o.retainable).toBe(true);
  });
  it('partial default base retains valid parts, suppresses incomplete coloring, and stays visibly partial in capabilities', () => {
    const i = withSegments();
    // Avoid complete same-destination fallback sources for this synthetic partial default.
    i.score.candidates = []; i.score.best_node = null;
    i.geometry!.route_options.bus.sheltered_parts[1] = '_';
    const o = option(i); const g = view(o)!;
    expect(o.retainable).toBe(false);
    expect(o.geometry.sheltered.status).toBe('partial');
    expect(g.sheltered_parts).toHaveLength(2);
    expect(g.sheltered).toBe('');
    expect(g.route_segments?.sheltered).toBeUndefined();
    expect(postalGeomToRouteGeoJson(g).sheltered.features).toHaveLength(2);
  });
  it('keeps shortest-only geometry without borrowing sheltered fragments or distances', () => {
    const i = input(); i.score.candidates = []; i.score.best_node = null;
    i.geometry!.route_options.bus.sheltered_parts = []; i.geometry!.route_options.bus.sheltered = '';
    const o = option(i); const g = view(o)!;
    expect(g.sheltered_parts).toEqual([]); expect(g.sheltered).toBe('');
    expect(g.exposure_gaps).toEqual([]);
    expect(postalGeomToRouteGeoJson(g).shortest.features).toHaveLength(3);
  });
  it('invalid fragment encoding/length/index cannot reach map features or bounds', () => {
    for (const mutation of ['encoding', 'length', 'index']) {
      const i = input(); const gap = i.geometry!.route_options.bus.exposure_gaps[0];
      if (mutation === 'encoding') gap.geom = '_';
      else if (mutation === 'length') gap.len_m = NaN;
      else gap.part_index = '0';
      const o = option(i); const g = view(o)!;
      expect(g.exposure_gaps).toHaveLength(2);
      expect(g.exposure_gaps.map(g => g.len_m)).toEqual([11, 9.1]);
      expect(postalGeomToRouteGeoJson(g).exposureGaps.features).toHaveLength(2);
      expect(o.gaps.sheltered.logical.longest_m).toMatchObject({ status: 'valid', value: 20.2 });
    }
  });
  it('foreign-fragment valid distant coordinates cannot contaminate map bounds or logical metrics', () => {
    const baseline = option(); const original = postalGeomToRouteGeoJson(view(baseline)!);
    const i = input();
    i.geometry!.route_options.bus.exposure_gaps[0].geom = encodePolyline([[89, 170], [89.1, 170.1]]);
    const o = option(i); const g = view(o)!;
    expect(postalGeomToRouteGeoJson(g).bounds).toEqual(original.bounds);
    expect(g.exposure_gaps).toHaveLength(2);
    expect(o.gaps.sheltered.fragments.entries[0]).toMatchObject({ highlightable: false, reasons: ['gap_fragment_path_mismatch'] });
    expect(o.diagnostics).toContain('gap_fragment_path_mismatch');
    expect(o.metrics).toEqual(baseline.metrics);
    expect(o.gaps.sheltered.logical).toEqual(baseline.gaps.sheltered.logical);
    expect(o.retainable).toBe(true);
  });
  it('foreign-fragment one precision-grid shift is not silently snapped onto the selected path', () => {
    const i = input(); const source = i.geometry!.route_options.bus.exposure_gaps[0];
    source.geom = encodePolyline(decodePolyline(source.geom).map(([lat, lon]) => [lat + 0.00001, lon]));
    const o = option(i); const g = view(o)!;
    expect(g.exposure_gaps).toHaveLength(2);
    expect(o.gaps.sheltered.fragments.entries[0].reasons).toContain('gap_fragment_path_mismatch');
    expect(o.gaps.sheltered.logical.longest_m).toMatchObject({ status: 'valid', value: 20.2 });
  });
  it('copies output arrays and objects so a consumer cannot mutate normalized/source evidence', () => {
    const o = option(withSegments()); const before = structuredClone(o); const g = view(o)!;
    g.sheltered_parts!.pop(); g.exposure_gaps[0].len_m = 999; g.route_segments!.sheltered![0].source_class = 'edited';
    expect(o).toEqual(before);
  });
  it('a single validated part supplies its flat fallback with the same decoded coordinates', () => {
    const i = input(); i.score.candidates = []; i.score.best_node = null;
    const encoded = i.geometry!.route_options.bus.sheltered_parts[0];
    i.geometry!.route_options.bus.sheltered_parts = [encoded];
    const g = view(option(i))!;
    expect(g.sheltered).toBe(encoded);
    expect(postalGeomToRouteGeoJson(g).sheltered.features[0].geometry.coordinates).toEqual(decodePolyline(encoded).map(([lat, lon]) => [lon, lat]));
  });
});
