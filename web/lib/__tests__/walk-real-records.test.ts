import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { selectionForChosenStop } from '../../app/page';
import { walkMetrics } from '../../components/walk-summary';
import { postalGeomToRouteGeoJson } from '../route-geojson';
import type { ScoreRecord, PostalGeom } from '../types';
import bundle from '../../data-bundle.json';

function read<T>(path: string): T {
  const file=`public/data/${bundle.bundle}/${path}`;
  return JSON.parse(existsSync(file)?readFileSync(file,'utf8'):gunzipSync(readFileSync(file+'.gz')).toString('utf8'));
}
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
  it('W02: real partial record preserves its available walk and missing terms', () => {
    const r=records.find(r=>r.postal==='018990')!;
    const before=JSON.stringify(r);
    expect(r.state).toBe('SCORED_PARTIAL');expect(walkMetrics(r).distance).toBe(r.paths!.sheltered_m);
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
  it('W13: alternate stop uses its own gaps and retains the locked score', () => {
    const before=JSON.stringify(selection);
    const chosen=selectionForChosenStop(selection,'mrt:21678',[],{type:'FeatureCollection',features:[]},null)!;
    expect(chosen.score!.exposure_gaps).toEqual(geom.candidates!['mrt:21678'].exposure_gaps);
    expect(walkMetrics(chosen.score).distance).toBe(110);
    expect(walkMetrics(chosen.score).uncovered).not.toBe(walkMetrics(score).uncovered);
    expect(chosen.score!.total).toBe(score.total);
    expect(chosen.score!.paths!.shortest_covered_ratio).toBeUndefined();
    expect(JSON.stringify(selection)).toBe(before);
  });
  it('W02/W13: missing candidate coverage remains unavailable', () => {
    const partial=structuredClone(selection);
    partial.score.candidates!.find(c=>c.node_id==='mrt:21678')!.paths.covered_ratio=null;
    const chosen=selectionForChosenStop(partial,'mrt:21678',[],{type:'FeatureCollection',features:[]},null)!;
    expect(walkMetrics(chosen.score).coverage).toBeNull();
    expect(chosen.score!.paths!.covered_m).toBeUndefined();
  });
});
