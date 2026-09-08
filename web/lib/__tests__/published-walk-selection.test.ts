import { describe, expect, it } from 'vitest';
import type { PostalGeom, ScoreRecord } from '../types';
import {
  normalizePublishedSelection, publishedDefault, publishedOptionForStop,
  publishedSelectionView, publishedChoiceTarget,
} from '../published-walk-selection';
import { selectPublishedTransitChoices } from '../published-transit-choices';
import fixture from './fixtures/published-options.json';

const score = fixture['scores/DOWNTOWN_CORE_PART_001.json'].find(row => row.postal === '018956') as ScoreRecord;
const geom = fixture['geom/h3/886520db39fffff.json'][0] as PostalGeom;
const original = { result: { POSTAL: score.postal, SEARCHVAL: 'Postal 018956', LATITUDE: '', LONGITUDE: '' }, score, geom };
const bundle = '/data/published-fixture/';
const pool = (category: 'bus' | 'mrt_lrt') => normalizePublishedSelection(original, category, bundle);

describe('T06 published selection ownership', () => {
  it('keeps original candidate geometry across category/default/candidate changes', () => {
    const before = JSON.stringify(original);
    const mrt = pool('mrt_lrt');
    const categoryDefault = publishedDefault(mrt, 'mrt_lrt')!;
    const first = publishedSelectionView(original, categoryDefault);
    expect(first.publishedOption).toBe(categoryDefault);
    expect(first.score?.paths).toBe(score.route_options!.mrt_lrt!.paths);
    const candidate = publishedOptionForStop(mrt, 'mrt:21624')!;
    const second = publishedSelectionView(original, candidate);
    expect(second.geom?.sheltered_parts).toEqual(geom.candidates!['mrt:21624'].sheltered_parts);
    const bus = publishedSelectionView(original, publishedDefault(pool('bus'), 'bus'));
    expect(bus.score?.best_node?.type).toBe('bus_stop');
    const third = publishedSelectionView(original, publishedOptionForStop(pool('mrt_lrt'), 'mrt:21624'));
    expect(third).toEqual(second);
    expect(JSON.stringify(original)).toBe(before);
  });

  it('does not invent a candidate full score, default state or candidate provenance', () => {
    const chosen = publishedSelectionView(original, publishedOptionForStop(pool('mrt_lrt'), 'mrt:21678'));
    expect(chosen.score).toBeNull();
    expect(chosen.publishedOption?.metrics.sheltered_m).toMatchObject({ status: 'valid', value: 110 });
    expect(chosen.publishedOption?.gaps.sheltered.logical.total_m.status).not.toBe('valid');
    expect(chosen.geom?.exposure_gaps.length).toBeGreaterThan(0);
    expect(chosen.publishedOption?.selectedSource.selectionRef).toEqual({ kind: 'candidate', nodeId: 'mrt:21678' });
    expect(score.total).not.toBeNull();
  });

  it('canonicalizes a default alias without a fabricated stop token', () => {
    const defaultBus = publishedOptionForStop(pool('bus'), 'bus:03509')!;
    expect(publishedChoiceTarget(defaultBus)).toEqual({ mode: 'bus', stopId: null });
    const defaultMrt = publishedDefault(pool('mrt_lrt'), 'mrt_lrt')!;
    expect(defaultMrt.selectionRef.kind).toBe('category_default');
    expect(publishedChoiceTarget(defaultMrt)).toEqual({ mode: 'mrt_lrt', stopId: null });
    expect(publishedChoiceTarget(publishedOptionForStop(pool('mrt_lrt'), 'mrt:21624')!))
      .toEqual({ mode: 'mrt_lrt', stopId: 'mrt:21624' });
  });

  it('uses the top-default source for best-transit without borrowing an MRT default', () => {
    const top = publishedDefault(pool('bus'), 'best_transit')!;
    expect(top.sources.some(source => source.selectionRef.kind === 'top_default')).toBe(true);
    expect(publishedDefault(pool('mrt_lrt'), 'best_transit')).toBeNull();
  });

  it('does not let a different postal supply geometry', () => {
    const mismatched = { ...original, geom: { ...geom, postal: '018990' } };
    const invalid = normalizePublishedSelection(mismatched, 'bus', bundle);
    expect(invalid.contextStatus).toBe('invalid');
    expect(publishedDefault(invalid, 'bus')).toBeNull();
    expect(publishedOptionForStop(invalid, 'bus:03509')).toBeNull();
  });

  it('retains a default measurement while geometry is loading without drawing a substitute', () => {
    const loading = { ...original, geom: null };
    const result = normalizePublishedSelection(loading, 'bus', bundle);
    const option = publishedDefault(result, 'bus');
    expect(option?.metrics.sheltered_m).toMatchObject({ status: 'valid', value: 81.2 });
    const view = publishedSelectionView(loading, option);
    expect(view.geom).toBeNull();
    expect(view.score?.paths).toBe(score.route_options!.bus!.paths);
    expect(selectPublishedTransitChoices(result, 'bus').choices).toEqual([]);
  });

  it('unknown and cross-category stop IDs cannot use a valid route accidentally', () => {
    expect(publishedOptionForStop(pool('bus'), 'mrt:21624')).toBeNull();
    expect(publishedOptionForStop(pool('mrt_lrt'), 'bus:03509')).toBeNull();
    expect(publishedOptionForStop(pool('bus'), 'unknown')).toBeNull();
    expect(publishedOptionForStop(pool('bus'), null)).toBeNull();
    expect(publishedSelectionView(original, null)).toEqual({ result: original.result, score: null, geom: null, publishedOption: null });
  });

  it('missing candidate coverage does not inherit the category default measurement', () => {
    const changed = structuredClone(original);
    changed.score.candidates!.find(row => row.node_id === 'mrt:21624')!.paths.covered_ratio = null;
    const changedPool = normalizePublishedSelection(changed, 'mrt_lrt', bundle);
    const option = publishedOptionForStop(changedPool, 'mrt:21624')!;
    const view = publishedSelectionView(changed, option);
    expect(view.publishedOption?.metrics.covered_ratio.status).toBe('missing');
    expect(view.publishedOption?.metrics.covered_m.status).toBe('missing');
    expect(view.score).toBeNull();
  });

  it('a partial category payload cannot inherit the top default score or provenance', () => {
    const changed = structuredClone(original);
    const category = changed.score.route_options!.mrt_lrt!;
    delete (category as Partial<typeof category>).total;
    delete (category as Partial<typeof category>).subscores;
    const result = normalizePublishedSelection(changed, 'mrt_lrt', bundle);
    const view = publishedSelectionView(changed, publishedDefault(result, 'mrt_lrt'));
    expect(view.score?.total).toBeNull();
    expect(view.score?.subscores).toBeNull();
    expect(view.score?.provenance).toEqual({ source: 'published_category_view', category: 'mrt_lrt', context_provenance: score.provenance });
    expect(view.score?.paths).toBe(category.paths);
    expect(view.score?.best_node).toBe(category.best_node);
    expect(view.score?.provenance).not.toBe(score.provenance);
  });
});
