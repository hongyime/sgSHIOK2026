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
  const coverage = manifestObject(provenance.locked_score_coverage);
  if (coverage) return formatFromCoverage(coverage, recordCount);
  const scored = stateCount(provenance.state_counts, "SCORED");
  if (scored === null || scored < 0 || scored > recordCount) return null;
  const notFull = recordCount - scored;
  const breakdown = lockedScoreAvailabilityBreakdown(provenance.state_counts, notFull);
  return composeLine(scored, recordCount, notFull, breakdown, null);
}

/**
 * Newer bundles carry `locked_score_coverage` (pipeline.export.locked_score_coverage):
 * full = SCORED + SCORED_PARTIAL whose only null subscore is bus (no bus stop within
 * the candidate radius). Those records have a complete total under the locked
 * weights, so they count as full here; the bus-stop fact is disclosed in-line.
 * decisions.md 2026-10-02.
 */
function formatFromCoverage(coverage: Record<string, unknown>, recordCount: number): string | null {
  const full = stateCount(coverage, "full_locked_score");
  const busNone = stateCount(coverage, "bus_none_in_range");
  const partialOther = stateCount(coverage, "partial_other");
  const noTransit = stateCount(coverage, "no_transit_in_range");
  const notYet = stateCount(coverage, "not_yet_scored");
  if (full === null || full < 0 || full > recordCount) return null;
  const notFull = recordCount - full;
  let breakdown: string | null = null;
  if (
    partialOther !== null &&
    noTransit !== null &&
    notYet !== null &&
    partialOther >= 0 &&
    noTransit >= 0 &&
    notYet >= 0 &&
    partialOther + noTransit + notYet === notFull
  ) {
    breakdown = `${formatWholeNumber(partialOther)} with partial shelter-map evidence, ${formatWholeNumber(
      noTransit
    )} beyond the 1.2 km locked transit range, and ${formatWholeNumber(notYet)} without published locked scores`;
  } else if (notFull > 0) {
    return null;
  }
  let busNote: string | null = null;
  if (busNone !== null && busNone > 0 && busNone <= full) {
    const radius = coverage.bus_stop_candidate_radius_m;
    const radiusText =
      typeof radius === "number" && Number.isFinite(radius) && radius > 0
        ? `${formatWholeNumber(Math.round(radius))} m`
        : "the bus-stop search radius";
    busNote = `${formatWholeNumber(busNone)} of them have no bus stop within ${radiusText}, so the bus term is 0`;
  }
  return composeLine(full, recordCount, notFull, breakdown, busNote);
}

function composeLine(
  full: number,
  recordCount: number,
  notFull: number,
  breakdown: string | null,
  busNote: string | null
): string {
  const pct = notFull / recordCount;
  const pctText =
    pct >= 0.22 && pct <= 0.28
      ? `${formatPercent(pct)}%, roughly a quarter`
      : `${Math.round(pct * 100)}%`;
  const nonFullText = breakdown ? `missing full scores: ${breakdown}` : "missing full scores";
  const fullClause = `${formatWholeNumber(full)} of ${formatWholeNumber(
    recordCount
  )} June 2020 address-list records have full locked scores${busNote ? ` (${busNote})` : ""}`;
  return `Locked-score coverage: ${fullClause}; ${formatWholeNumber(notFull)} address-list records (${pctText}) ${nonFullText}.`;
}
