import { describe, expect, it, vi } from 'vitest';
import {
  parseFreshnessDate, sourceFreshnessAtCheck, RECORDED_SOURCE_FRESHNESS,
} from '../source-freshness';
import bundle from '../../data-bundle.json';

describe('recorded freshness dates', () => {
  it.each([
    [null], [undefined], [''], [0], [new Date('2026-08-05')], [{}],
    ['2026-02-29'], ['2026-02-30T00:00:00Z'], ['2026-04-31'], ['1900-02-29'],
    ['0000-01-01'], ['2026-13-01'], ['2026-00-01'], ['2026-01-00'],
    ['2026-08-05T24:00:00Z'], ['2026-08-05T23:60:00Z'], ['2026-08-05T23:59:60Z'],
    ['2026-08-05T14:00:00'], ['2026-08-05 14:00:00'], ['08/05/2026'],
    ['2026-08-05T14:00:00+08:60'], ['2026-08-05T14:00:00+25:00'],
    ['2026-08-05T14:00:00Z<script>'], ['2026-03'],
  ])('keeps invalid or ambiguous input %j unknown', value => {
    expect(parseFreshnessDate(value)).toBeNull();
  });

  it('retains date-only calendar precision without inventing a check time', () => {
    expect(parseFreshnessDate('2000-02-29')).toMatchObject({ iso: '2000-02-29', label: '29 Feb 2000' });
    expect(parseFreshnessDate('2024-02-29')).toMatchObject({ iso: '2024-02-29', label: '29 Feb 2024' });
  });

  it('normalizes equivalent explicit zones and microseconds to Singapore time', () => {
    const utc = parseFreshnessDate('2026-08-01T21:49:20.977890+00:00');
    const sgt = parseFreshnessDate('2026-08-02T05:49:20.97789+08:00');
    expect(utc).toEqual(sgt);
    expect(utc).toMatchObject({ label: '2 Aug 2026, 05:49 SGT' });
    expect(parseFreshnessDate('2026-08-01T16:49:20.977890-05:00')).toEqual(utc);
  });

  it('handles timezone shifts across a calendar year without depending on the host zone', () => {
    expect(parseFreshnessDate('2025-12-31T20:00:00Z')?.label).toBe('1 Jan 2026, 04:00 SGT');
    expect(parseFreshnessDate('2026-01-01T00:00:00+14:00')?.label).toBe('31 Dec 2025, 18:00 SGT');
  });
});

describe('source age is not check recency', () => {
  const old = { updatedAt: '2026-03-06T08:24:22Z', checkedAt: '2026-08-29T17:23:22.780137+00:00', staleAfterDays: 120 };
  it('an old source checked again later stays stale with the same update date', () => {
    const first = sourceFreshnessAtCheck(old);
    const later = sourceFreshnessAtCheck({ ...old, checkedAt: '2026-09-09T08:00:00Z' });
    expect(first.status).toBe('stale');
    expect(later.status).toBe('stale');
    expect(later.updatedAt).toEqual(first.updatedAt);
    expect(later.checkedAt).not.toEqual(first.checkedAt);
  });

  it('does not substitute fetched_at or checkedAt for missing publisher update metadata', () => {
    const bus = RECORDED_SOURCE_FRESHNESS.sources.find(source => source.id === 'bus_stops')!;
    expect(bus.fetchedAt).toBe('2026-07-31T03:51:10.200150+00:00');
    const result = sourceFreshnessAtCheck({ ...bus, checkedAt: RECORDED_SOURCE_FRESHNESS.checkedAt });
    expect(result.updatedAt).toBeNull();
    expect(result.checkedAt).not.toBeNull();
    expect(result.status).toBe('unknown');
  });

  it.each([null, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])('does not invent a stale threshold from %s', staleAfterDays => {
    expect(sourceFreshnessAtCheck({ ...old, staleAfterDays }).status).toBe('unknown');
  });

  it.each([null, '2026-02-30', '2026-03-01T00:00:00Z'])(
    'keeps freshness unknown when the check is missing, invalid or before the update: %j', checkedAt => {
      expect(sourceFreshnessAtCheck({ ...old, checkedAt }).status).toBe('unknown');
    },
  );

  it('uses the existing strict greater-than day threshold and real instants', () => {
    const record = { updatedAt: '2026-07-01T00:00:00+08:00', staleAfterDays: 30 };
    expect(sourceFreshnessAtCheck({ ...record, checkedAt: '2026-07-30T16:00:00Z' }).status).toBe('within-threshold-at-check');
    expect(sourceFreshnessAtCheck({ ...record, checkedAt: '2026-07-30T16:00:00.001Z' }).status).toBe('stale');
  });

  it.each([
    { updatedAt: '2026-07-01', checkedAt: '2026-07-31T00:00:00Z' },
    { updatedAt: '2026-07-01T00:00:00Z', checkedAt: '2026-07-31' },
  ])('does not invent midnight precision for an exact freshness threshold: %j', dates => {
    const result = sourceFreshnessAtCheck({ ...dates, staleAfterDays: 30 });
    expect(result.updatedAt).not.toBeNull();
    expect(result.checkedAt).not.toBeNull();
    expect(result.status).toBe('unknown');
  });

  it('does not call fetch or the present-day clock to reinterpret a static check', () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('No network permitted'));
    const now = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('No live clock permitted'); });
    try {
      expect(sourceFreshnessAtCheck(old).status).toBe('stale');
      expect(fetch).not.toHaveBeenCalled();
      expect(now).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); now.mockRestore(); }
  });
});

describe('currently recorded metadata, not a new freshness baseline', () => {
  it('pins the historical manifest-only check and does not manufacture a release timestamp', () => {
    expect(RECORDED_SOURCE_FRESHNESS.bundle).toBe(bundle.bundle);
    expect(RECORDED_SOURCE_FRESHNESS.checkedAt).toBe('2026-08-29T17:23:22.780137+00:00');
    expect(RECORDED_SOURCE_FRESHNESS.checkKind).toBe('manifest-only');
    expect(RECORDED_SOURCE_FRESHNESS.releasedAt).toBeNull();
    expect(parseFreshnessDate(bundle.generated_at)?.label).toBe('5 Aug 2026, 22:00 SGT');
    expect(parseFreshnessDate(bundle.data_as_of)?.label).toBe('2 Aug 2026, 05:49 SGT');
    expect(parseFreshnessDate(RECORDED_SOURCE_FRESHNESS.checkedAt)?.label).toBe('30 Aug 2026, 01:23 SGT');
  });

  it('uses recorded publisher dates for shelter and exits, and unknown for bus stops', () => {
    expect(RECORDED_SOURCE_FRESHNESS.sources.map(source => [source.id, source.updatedAt, source.sourceHash])).toEqual([
      ['covered_linkway', '2026-03-06T08:24:22Z', 'd943fe2a992ad50c449c40484e0c642da480598b17f6008907c7b253d87b19ee'],
      ['mrt_lrt_exits', '2026-07-19T02:06:46Z', 'a7eaa90f30991dc0ac4aa970d704123ce3ec9e60c82b42c32a32e74be7dc0327'],
      ['bus_stops', null, '0362ab970c661de6b322a3372c9ab980faf49805921891a7a1da260687a16a4a'],
    ]);
    expect(RECORDED_SOURCE_FRESHNESS.sources.map(source => sourceFreshnessAtCheck({
      ...source, checkedAt: RECORDED_SOURCE_FRESHNESS.checkedAt,
    }).status)).toEqual(['stale', 'within-threshold-at-check', 'unknown']);
  });
});
