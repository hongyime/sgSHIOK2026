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

export function formatScoreCoverageLine(manifest: Manifest | null): string | null {
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
  const pctText = pct >= 0.22 && pct <= 0.28 ? "roughly a quarter" : `${Math.round(pct * 100)}%`;
  return `Score coverage: ${formatWholeNumber(scored)} full scores out of ${formatWholeNumber(
    recordCount
  )}; ${formatWholeNumber(notFull)} records (${pctText}) do not render a full score.`;
}
