import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
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
