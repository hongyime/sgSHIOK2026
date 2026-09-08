import { describe, it, expect } from 'vitest';
import { selectionForChosenStop } from '../../app/page';
import { walkMetrics } from '../../components/walk-summary';
import { postalGeomToRouteGeoJson } from '../route-geojson';
import type { ScoreRecord, PostalGeom } from '../types';
import { readPublishedFixture as read } from './fixtures/published-data';
const records=read<ScoreRecord[]>('scores/DOWNTOWN_CORE_PART_001.json');
describe('Round 1 real immutable record regression', () => {
  it('W01/W13: displayed live walk metrics match the published record', () => {
    const r=records.find(r=>r.postal==='018956')!;
    const before=JSON.stringify(r);const m=walkMetrics(r);
    expect(r.state).toBe('SCORED');expect(m.distance).toBe(r.paths!.sheltered_m);
    expect(m.coverage).toBe(Math.round(r.paths!.covered_ratio!*100));
    expect(m.uncovered).toBe(r.exposure_gaps!.reduce((sum,g)=>sum+g.len_m,0));
    expect(m.longest).toBe(Math.max(...r.exposure_gaps!.map(g=>g.len_m)));
    expect(JSON.stringify(r)).toBe(before);
  });
  it('W02: real partial record preserves its straight-line estimate without calling it a walk', () => {
    const r=records.find(r=>r.postal==='018990')!;
    const before=JSON.stringify(r);
    expect(r.state).toBe('SCORED_PARTIAL');
    expect(r.paths!.routing_type).toBe('direct_bus_fallback_unrouted');
    expect(r.paths!.sheltered_m).toBe(222.5);
    expect(walkMetrics(r)).toEqual({ distance: null, coverage: null, uncovered: null, longest: null });
    expect(Object.values(r.subscores!).some(v=>v===null)).toBe(true);
    expect(JSON.stringify(r)).toBe(before);
  });
  it('W03: real missing-route record is unavailable, never a zero-length walk', () => {
    const r=records.find(r=>r.postal==='079908')!;
    expect(r.paths).toBeNull();expect(walkMetrics(r).distance).toBeNull();
    const prefix=read<Record<string,string>>('geom/postal-prefix/079.json');
    const geom=prefix[r.postal]?read<PostalGeom[]>(`geom/h3/${prefix[r.postal]}.json`).find(g=>g.postal===r.postal):null;
    expect(geom ? postalGeomToRouteGeoJson(geom).sheltered.features.length : 0).toBe(0);
  });
});


describe('Selected published candidate evidence', () => {
  const score=records.find(r=>r.postal==='018956')!;
  const geom=read<PostalGeom[]>('geom/h3/886520db39fffff.json').find(g=>g.postal==='018956')!;
  const selection={result:{POSTAL:'018956',SEARCHVAL:'Published record',LATITUDE:'1.28',LONGITUDE:'103.86'},score,geom};
  it('W13: alternate stop keeps map fragments separate and does not inherit a locked score', () => {
    const before=JSON.stringify(selection);
    const chosen=selectionForChosenStop(selection,'mrt:21678',[],{type:'FeatureCollection',features:[]},null)!;
    expect(chosen.geom!.exposure_gaps.map(g => g.len_m)).toEqual(geom.candidates!['mrt:21678'].exposure_gaps.map(g => g.len_m));
    expect(walkMetrics(chosen.score, false, chosen.publishedOption).distance).toBe(110);
    expect(walkMetrics(chosen.score, false, chosen.publishedOption).uncovered).toBeNull();
    expect(chosen.score).toBeNull();
    expect(chosen.publishedOption!.metrics.shortest_covered_ratio.status).toBe('missing');
    expect(JSON.stringify(selection)).toBe(before);
  });
  it('W02/W13: missing candidate coverage remains unavailable', () => {
    const partial=structuredClone(selection);
    partial.score.candidates!.find(c=>c.node_id==='mrt:21678')!.paths.covered_ratio=null;
    const chosen=selectionForChosenStop(partial,'mrt:21678',[],{type:'FeatureCollection',features:[]},null)!;
    expect(walkMetrics(chosen.score, false, chosen.publishedOption).coverage).toBeNull();
    expect(chosen.publishedOption!.metrics.covered_m.status).toBe('missing');
    expect(chosen.score).toBeNull();
  });
  it('W12: a published candidate wins over a cached preview for the same stop', () => {
    const preview = { ...selection, score: { ...score, paths: { ...score.paths!, routing_type: 'live_onemap_preview', sheltered_m: 999 } } };
    const chosen = selectionForChosenStop(selection, 'mrt:21678', [], { type: 'FeatureCollection', features: [] }, null, { 'mrt:21678': preview })!;
    expect(chosen.publishedOption?.metrics.sheltered_m).toMatchObject({ status: 'valid', value: 110 });
    expect(chosen).not.toBe(preview);
  });
  it('W12: unknown target never synthesizes a direct walking route', () => {
    const chosen = selectionForChosenStop(selection, 'unknown', [], { type: 'FeatureCollection', features: [] }, { lat: 1.28, lng: 103.86 });
    expect(chosen).toBe(selection);
  });
});
