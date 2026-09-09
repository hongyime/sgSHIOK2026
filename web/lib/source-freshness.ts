export interface FreshnessDate {
  iso: string;
  label: string;
  milliseconds: number;
  precision: 'date' | 'instant';
}

// Date-only values retain calendar precision; timestamps must state their zone.
export function parseFreshnessDate(value: unknown): FreshnessDate | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(\.\d{1,9})?(Z|[+-]\d{2}:\d{2}))?$/.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , zone] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) return null;
  const timestamp = hourText !== undefined;
  if (timestamp && (Number(hourText) > 23 || Number(minuteText) > 59 || Number(secondText) > 59)) return null;
  if (zone && zone !== 'Z') {
    const hours = Number(zone.slice(1, 3)), minutes = Number(zone.slice(4, 6));
    if (hours > 14 || minutes > 59 || (hours === 14 && minutes !== 0)) return null;
  }
  const milliseconds = Date.parse(timestamp ? value : `${value}T00:00:00Z`);
  if (!Number.isFinite(milliseconds)) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(timestamp ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const } : {}),
    timeZone: timestamp ? 'Asia/Singapore' : 'UTC',
  }).formatToParts(milliseconds);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? '';
  const label = `${part('day')} ${part('month')} ${part('year')}`
    + (timestamp ? `, ${part('hour')}:${part('minute')} SGT` : '');
  return { iso: timestamp ? new Date(milliseconds).toISOString() : value, label, milliseconds,
    precision: timestamp ? 'instant' : 'date' };
}

export interface SourceFreshnessInput {
  updatedAt: unknown;
  checkedAt: unknown;
  staleAfterDays: number | null;
}

export function sourceFreshnessAtCheck(record: SourceFreshnessInput): {
  updatedAt: FreshnessDate | null;
  checkedAt: FreshnessDate | null;
  status: 'stale' | 'within-threshold-at-check' | 'unknown';
} {
  const updatedAt = parseFreshnessDate(record.updatedAt);
  const checkedAt = parseFreshnessDate(record.checkedAt);
  const threshold = record.staleAfterDays;
  let status: 'stale' | 'within-threshold-at-check' | 'unknown' = 'unknown';
  if (updatedAt?.precision === 'instant' && checkedAt?.precision === 'instant'
    && checkedAt.milliseconds >= updatedAt.milliseconds
    && typeof threshold === 'number' && Number.isFinite(threshold) && threshold > 0) {
    status = (checkedAt.milliseconds - updatedAt.milliseconds) / 86_400_000 > threshold
      ? 'stale' : 'within-threshold-at-check';
  }
  return { updatedAt, checkedAt, status };
}

// Historical facts, not a new check. Dates/hashes: tracked raw/manifest.json;
// thresholds: pipeline/config/sources.yaml via quarterly=120d, weekly=30d policy.
// Check receipt: qa/verification/P1023-browser-source-age-snapshot.md.
// These three hashes also match the frozen bundle's manifest source_hashes.
// fetchedAt is kept as supporting metadata; it is NEVER a publisher update date.
export const RECORDED_SOURCE_FRESHNESS = {
  bundle: 'generated_20260805_prefer_scored_routed',
  checkedAt: '2026-08-29T17:23:22.780137+00:00',
  checkKind: 'manifest-only',
  // No publication timestamp is recorded in the pinned or frozen manifest.
  releasedAt: null,
  sources: [
    {
      id: 'covered_linkway', label: 'Covered Linkway',
      updatedAt: '2026-03-06T08:24:22Z', fetchedAt: '2026-08-25T12:34:12.393459+00:00',
      staleAfterDays: 120,
      sourceHash: 'd943fe2a992ad50c449c40484e0c642da480598b17f6008907c7b253d87b19ee',
    },
    {
      id: 'mrt_lrt_exits', label: 'MRT/LRT exits',
      updatedAt: '2026-07-19T02:06:46Z', fetchedAt: '2026-07-26T14:37:41.957656+00:00',
      staleAfterDays: 120,
      sourceHash: 'a7eaa90f30991dc0ac4aa970d704123ce3ec9e60c82b42c32a32e74be7dc0327',
    },
    {
      id: 'bus_stops', label: 'Bus Stops',
      updatedAt: null, fetchedAt: '2026-07-31T03:51:10.200150+00:00',
      staleAfterDays: 30,
      sourceHash: '0362ab970c661de6b322a3372c9ab980faf49805921891a7a1da260687a16a4a',
    },
  ],
} as const;
