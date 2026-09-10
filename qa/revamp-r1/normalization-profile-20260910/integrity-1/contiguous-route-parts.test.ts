import { describe, expect, it } from 'vitest';
import { createContiguousPartMatcher } from '../contiguous-route-parts';
import type { LatLng } from '../polyline';

const a: LatLng = [1.3, 103.8], b: LatLng = [1.301, 103.801], c: LatLng = [1.302, 103.802];
describe('exact contiguous route-part matcher', () => {
  it('matches forward and reversed contiguous slices', () => {
    const match = createContiguousPartMatcher([[a, b, c]]);
    expect(match([a, b])).toBe(true); expect(match([c, b])).toBe(true);
  });
  it('rejects skipped vertices, foreign coordinates and cross-part bridges', () => {
    expect(createContiguousPartMatcher([[a, b, c]])([a, c])).toBe(false);
    expect(createContiguousPartMatcher([[a, b], [c]])([b, c])).toBe(false);
    expect(createContiguousPartMatcher([[a, b]])([a, [b[0] + 0.00001, b[1]]])).toBe(false);
  });
  it('keeps every possible start when routes repeat coordinates', () => {
    const match = createContiguousPartMatcher([[a, b, a, b, c]]);
    expect(match([a, b, c])).toBe(true); expect(match([c, b, a])).toBe(true);
    expect(match([a, b, a, b, a])).toBe(false);
  });
  it('keeps parts separate even when their endpoints coincide', () => {
    expect(createContiguousPartMatcher([[a, b], [b, c]])([a, b, c])).toBe(false);
  });
  it('does not mutate readonly sources or query arrays', () => {
    const part = Object.freeze([Object.freeze([...a] as LatLng), Object.freeze([...b] as LatLng)]);
    const parts = Object.freeze([part]);
    const query = Object.freeze([part[1], part[0]]);
    expect(createContiguousPartMatcher(parts)(query)).toBe(true);
    expect(parts).toEqual([[a, b]]); expect(query).toEqual([b, a]);
  });
  it('does not share an index across routes with different points', () => {
    const first = createContiguousPartMatcher([[a, b]]), second = createContiguousPartMatcher([[a, c]]);
    expect(first([a, b])).toBe(true); expect(second([a, b])).toBe(false);
  });
  it('preserves signed-zero coordinate equality and empty matching boundaries', () => {
    expect(createContiguousPartMatcher([[[-0, 0], b]])([[0, -0], b])).toBe(true);
    expect(createContiguousPartMatcher([])([])).toBe(false);
    expect(createContiguousPartMatcher([[]])([])).toBe(true);
    expect(createContiguousPartMatcher([[]])([a])).toBe(false);
  });
  it('does not rescan unrelated vertices for every segment', () => {
    let accesses = 0;
    const points = Array.from({ length: 1024 }, (_, i): LatLng => new Proxy([i, i + 1] as LatLng, {
      get(target, key, receiver) { if (key === '0' || key === '1') accesses++; return Reflect.get(target, key, receiver); },
    }));
    const match = createContiguousPartMatcher([points]);
    for (let i = 1; i < points.length; i++) expect(match([[i - 1, i], [i, i + 1]])).toBe(true);
    expect(accesses).toBeLessThan(20000);
  });
});
