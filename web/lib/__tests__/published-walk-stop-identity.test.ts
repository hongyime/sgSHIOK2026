import { describe, expect, it } from 'vitest';
import type { PostalGeom, ScoreRecord, TransitPoiCollection } from '../types';
import { normalizePublishedSelection, publishedChoiceTarget, publishedDefault, publishedOptionForStop, publishedSelectionView } from '../published-walk-selection';
import fixture from './fixtures/published-options.json';

const score = fixture['scores/DOWNTOWN_CORE_PART_001.json'].find(row => row.postal === '018956') as ScoreRecord;
const geom = fixture['geom/h3/886520db39fffff.json'][0] as PostalGeom;
const original = { result: { POSTAL: '018956', SEARCHVAL: 'Public 018956', LATITUDE: '1.282640', LONGITUDE: '103.860030' }, score, geom };
const origin = { lat: 1.282640, lng: 103.860030 };
// Public POI fields from the pinned 886520db39fffff transit shard.
const pois: TransitPoiCollection = { type: 'FeatureCollection', features: [{
  type: 'Feature', geometry: { type: 'Point', coordinates: [103.858441, 1.28110464] },
  properties: { id: 'mrt:21677', kind: 'mrt_exit', name: 'BAYFRONT MRT STATION Exit E', station: 'BAYFRONT MRT STATION', exit: 'Exit E' },
}] };
const pool = () => normalizePublishedSelection(original, 'mrt_lrt', 'public-fixture');

describe('Saved Exit E identity', () => {
  it('binds the unique public POI to its existing default without changing evidence', () => {
    const normalized = pool();
    const before = JSON.stringify({ original, normalized, pois });
    const option = publishedOptionForStop(normalized, 'mrt:21677', pois, origin);
    expect(option).toBe(publishedDefault(normalized, 'mrt_lrt'));
    expect(option?.aliases).toEqual([]);
    expect(publishedChoiceTarget(option!)).toEqual({ mode: 'mrt_lrt', stopId: null });
    const view = publishedSelectionView(original, option);
    expect(view.score?.paths).toBe(score.route_options!.mrt_lrt!.paths);
    expect(view.geom?.sheltered_parts).toEqual(geom.route_options!.mrt_lrt!.sheltered_parts);
    expect(option?.metrics.shortest_m).toMatchObject({ status: 'valid', value: 293.6 });
    expect(option?.metrics.sheltered_m).toMatchObject({ status: 'valid', value: 308.4 });
    expect(JSON.stringify({ original, normalized, pois })).toBe(before);
  });

  it.each(['name', 'station', 'exit'] as const)('rejects wrong or absent %s', field => {
    for (const value of ['wrong', '']) {
      const changed = structuredClone(pois);
      changed.features[0].properties[field] = value;
      expect(publishedOptionForStop(pool(), 'mrt:21677', changed, origin)).toBeNull();
    }
  });

  it.each([
    [103.85845, 1.28110464], [103.858441, 1.28112],
    [103.860030, 1.282640], [103.85992, 1.28274],
    [Number.NaN, 1.28110464], [103.858441, Number.POSITIVE_INFINITY],
    [1.28110464, 103.858441],
  ])('rejects wrong coordinates %s, %s, including origin and route junctions', (lng, lat) => {
    const changed = structuredClone(pois);
    changed.features[0].geometry.coordinates = [lng, lat];
    expect(publishedOptionForStop(pool(), 'mrt:21677', changed, origin)).toBeNull();
  });

  it('rejects duplicate IDs and ambiguous station/exit identities regardless of name or coordinates', () => {
    for (const mutate of [
      () => {},
      (row: TransitPoiCollection['features'][number]) => { row.properties.id = 'mrt:other'; },
      (row: TransitPoiCollection['features'][number]) => { row.properties.id = 'mrt:other'; row.properties.name = 'wrong'; row.geometry.coordinates = [103.8, 1.3]; },
      (row: TransitPoiCollection['features'][number]) => { row.properties.station = 'wrong'; },
    ]) {
      const changed = structuredClone(pois);
      const duplicate = structuredClone(changed.features[0]);
      mutate(duplicate);
      changed.features.push(duplicate);
      expect(publishedOptionForStop(pool(), 'mrt:21677', changed, origin)).toBeNull();
    }
  });

  it('requires exit kind, point geometry, origin, and loaded POIs', () => {
    for (const kind of ['mrt_station', 'bus_stop'] as const) {
      const changed = structuredClone(pois);
      changed.features[0].properties.kind = kind;
      expect(publishedOptionForStop(pool(), 'mrt:21677', changed, origin)).toBeNull();
    }
    const wrongGeometry = structuredClone(pois);
    Object.assign(wrongGeometry.features[0].geometry, { type: 'LineString' });
    expect(publishedOptionForStop(pool(), 'mrt:21677', wrongGeometry, origin)).toBeNull();
    expect(publishedOptionForStop(pool(), 'mrt:21677', pois)).toBeNull();
    expect(publishedOptionForStop(pool(), 'mrt:21677', pois, { lat: 0, lng: 0 })).toBeNull();
    expect(publishedOptionForStop(pool(), 'mrt:21677')).toBeNull();
    expect(publishedOptionForStop(pool(), 'mrt:21677', { type: 'FeatureCollection', features: [] }, origin)).toBeNull();
  });

  it('rejects unknown IDs, wrong categories and mismatched postal geometry', () => {
    expect(publishedOptionForStop(pool(), 'unknown', pois, origin)).toBeNull();
    expect(publishedOptionForStop(pool(), 'bus:03419', pois, origin)).toBeNull();
    expect(publishedOptionForStop(normalizePublishedSelection(original, 'bus', 'public-fixture'), 'mrt:21677', pois, origin)).toBeNull();
    const wrongPostal = { ...original, geom: { ...geom, postal: '018990' } };
    expect(publishedOptionForStop(normalizePublishedSelection(wrongPostal, 'mrt_lrt', 'public-fixture'), 'mrt:21677', pois, origin)).toBeNull();
  });

  it('rejects partial, ambiguous or conflicting saved endpoints and non-retainable options', () => {
    const normalized = pool();
    const option = publishedDefault(normalized, 'mrt_lrt')!;
    option.geometry.shortest.parts = normalized.options.find(row => row.aliases.includes('mrt:21624'))!.geometry.shortest.parts;
    expect(publishedOptionForStop(normalized, 'mrt:21677', pois, origin)).toBeNull();
    for (const status of ['invalid', 'partial'] as const) {
      const changed = pool();
      publishedDefault(changed, 'mrt_lrt')!.geometry.sheltered.status = status;
      expect(publishedOptionForStop(changed, 'mrt:21677', pois, origin)).toBeNull();
    }
    const ambiguous = pool();
    ambiguous.options.push({ ...publishedDefault(ambiguous, 'mrt_lrt')!, key: 'another-default' });
    expect(publishedOptionForStop(ambiguous, 'mrt:21677', pois, origin)).toBeNull();
    const conflict = pool();
    publishedDefault(conflict, 'mrt_lrt')!.retainable = false;
    expect(publishedOptionForStop(conflict, 'mrt:21677', pois, origin)).toBeNull();
  });

  it('preserves explicit candidate aliases without POIs or default identity inference', () => {
    for (const row of score.candidates!) {
      const category = row.node_type === 'bus_stop' ? 'bus' : 'mrt_lrt';
      const normalized = normalizePublishedSelection(original, category, 'public-fixture');
      expect(publishedOptionForStop(normalized, row.node_id, pois, origin)).toBe(publishedOptionForStop(normalized, row.node_id));
    }
    const conflict = pool();
    const candidate = conflict.options.find(row => row.aliases.includes('mrt:21624'))!;
    candidate.aliases = ['mrt:21677'];
    candidate.retainable = false;
    expect(publishedOptionForStop(conflict, 'mrt:21677', pois, origin)).toBeNull();
  });

  it('rejects a disconnected closed cycle even when the two outer endpoints still match', () => {
    const normalized = pool();
    publishedDefault(normalized, 'mrt_lrt')!.geometry.sheltered.parts.push({
      sourceIndex: 99, encoded: 'synthetic-disconnected-cycle',
      points: [[1.3, 103.8], [1.3001, 103.8001], [1.3002, 103.8], [1.3, 103.8]],
    });
    expect(publishedOptionForStop(normalized, 'mrt:21677', pois, origin)).toBeNull();
  });

  it.each([{ points: [] }, { points: null }, { points: [[1.3]] }, { points: [[1.3, 103.8], [Number.NaN, 103.8]] }])('rejects malformed part points without throwing: %j', ({ points }) => {
    const normalized = pool();
    Object.assign(publishedDefault(normalized, 'mrt_lrt')!.geometry.sheltered.parts[0], { points });
    expect(() => publishedOptionForStop(normalized, 'mrt:21677', pois, origin)).not.toThrow();
    expect(publishedOptionForStop(normalized, 'mrt:21677', pois, origin)).toBeNull();
  });
});
