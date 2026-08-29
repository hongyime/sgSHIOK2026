import type { Manifest } from "./types";

function manifestObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function stateCount(value: unknown, state: string): number | null {
  const counts = manifestObject(value);
  const count = counts?.[state];
  return typeof count === "number" && Number.isFinite(count) ? count : null;
}

function formatWholeNumber(value: number): string {
  return new Intl.NumberFormat("en-SG").format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-SG", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value * 100);
}

function lockedScoreAvailabilityBreakdown(stateCounts: unknown, notFull: number): string | null {
  const partial = stateCount(stateCounts, "SCORED_PARTIAL");
  const noTransit = stateCount(stateCounts, "NO_TRANSIT_IN_RANGE");
  const notYet = stateCount(stateCounts, "NOT_YET_SCORED");
  if (
    partial === null ||
    noTransit === null ||
    notYet === null ||
    partial < 0 ||
    noTransit < 0 ||
    notYet < 0 ||
    partial + noTransit + notYet !== notFull
  ) {
    return null;
  }
  return `${formatWholeNumber(partial)} with partial shelter-map evidence, ${formatWholeNumber(
    noTransit
  )} beyond the 1.2 km locked transit range, and ${formatWholeNumber(notYet)} without published locked scores`;
}

export function formatLockedScoreAvailabilityLine(manifest: Manifest | null): string | null {
  const provenance = manifestObject(manifest?.provenance);
  if (!provenance) return null;
  const recordCount = provenance?.record_count;
  if (typeof recordCount !== "number" || !Number.isFinite(recordCount) || recordCount <= 0) {
    return null;
  }
  const scored = stateCount(provenance.state_counts, "SCORED");
  if (scored === null || scored < 0 || scored > recordCount) return null;
  const notFull = recordCount - scored;
  const pct = notFull / recordCount;
  const pctText =
    pct >= 0.22 && pct <= 0.28
      ? `${formatPercent(pct)}%, roughly a quarter`
      : `${Math.round(pct * 100)}%`;
  const breakdown = lockedScoreAvailabilityBreakdown(provenance.state_counts, notFull);
  const nonFullText = breakdown
    ? `missing full scores: ${breakdown}`
    : "missing full scores";
  return `Full locked scores: ${formatWholeNumber(scored)} of ${formatWholeNumber(recordCount)} June 2020 address-list records; ${formatWholeNumber(
    notFull
  )} address-list records (${pctText}) ${nonFullText}.`;
}
