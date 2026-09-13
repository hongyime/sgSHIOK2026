import { describe, expect, it } from 'vitest';
import { shortestSavedWalk } from '../walk-default';
import { normalizePublishedSelection } from '../published-walk-selection';
import type { PublishedWalkSelection } from '../published-walk-selection';
import fixture from './fixtures/published-options.json';
const bundle = 'generated_20260805_prefer_scored_routed';
function selection(): PublishedWalkSelection {
  return structuredClone({ result: { POSTAL:'018956', BUILDING:'Postal 018956', ROAD_NAME:'', LATITUDE:'', LONGITUDE:'', SEARCHVAL:'S018956' },
    score:fixture['scores/DOWNTOWN_CORE_PART_001.json'].find(r=>r.postal==='018956'), geom:fixture['geom/h3/886520db39fffff.json'][0] }) as unknown as PublishedWalkSelection;
}
describe('shortest usable saved walk default', () => {
  it('chooses by actual walk length across both categories without mutating evidence', () => {
    const s=selection(), before=structuredClone(s);
    const selected=shortestSavedWalk(s,bundle)!;
    const pool=['bus','mrt_lrt'].flatMap(category=>normalizePublishedSelection(s,category as 'bus'|'mrt_lrt',bundle).options);
    const distances=pool.filter(o=>o.retainable).flatMap(o=>[
      ...(o.geometry.shortest.status==='complete'&&o.metrics.shortest_m.status==='valid'?[o.metrics.shortest_m.value]:[]),
      ...(o.geometry.sheltered.status==='complete'&&o.metrics.sheltered_m.status==='valid'?[o.metrics.sheltered_m.value]:[]),
    ]);
    expect(selected.distance).toBe(Math.min(...distances));
    expect(selected.option.category).toBe('bus');
    expect(s).toEqual(before);
  });
  it('finds the shortest usable MRT candidate instead of blindly using the category default', () => {
    const selected=shortestSavedWalk(selection(),bundle,'mrt_lrt')!;
    expect(selected.option.category).toBe('mrt_lrt');
    expect(selected.distance).toBeLessThan(308.4);
    expect(selected.option.classification).toBe('routed');
  });
  it('does not choose a short number when its geometry is missing', () => {
    const s=selection(); s.geom=null;
    expect(shortestSavedWalk(s,bundle)).toBeNull();
  });
  it('does not turn absence into zero distance or borrow an unrelated category', () => {
    const s=selection(); delete s.score!.route_options!.mrt_lrt;
    s.score!.candidates=s.score!.candidates!.filter(c=>c.node_type!=='mrt_lrt_exit');
    expect(shortestSavedWalk(s,bundle,'mrt_lrt')).toBeNull();
    expect(shortestSavedWalk(s,bundle,'bus')).not.toBeNull();
  });
  it('is stable under repeated normalization and ignores non-authoritative previews', () => {
    const s=selection();
    expect(shortestSavedWalk(s,bundle)).toEqual(shortestSavedWalk(s,bundle));
    s.score!.provenance={source:'live_onemap_preview',authoritative_score:false};
    expect(shortestSavedWalk(s,bundle)).toBeNull();
  });
});
