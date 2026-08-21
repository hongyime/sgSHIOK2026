import type { Subscores } from "./types";

export type RankMetric = "overall" | keyof Subscores;

export const RANK_METRIC_OPTIONS: Array<{ id: RankMetric; label: string }> = [
  { id: "overall", label: "Locked SHIOK score" },
  { id: "rain", label: "Rain shelter" },
  { id: "access", label: "Transit access" },
  { id: "bus", label: "Bus-service evidence" },
  { id: "heat", label: "Heat proxy" },
  { id: "crossing", label: "Crossing friction" },
];

export interface RankedScoreRecord {
  postal: string;
  rank: number;
  value: number;
  total: number | null;
}

export interface RankableScoreRecord {
  postal: string;
  total: number | null;
  subscores: Subscores | null;
}

function metricValue(record: RankableScoreRecord, metric: RankMetric): number | null {
  if (metric === "overall") return record.total;
  return record.subscores?.[metric] ?? null;
}

export function rankScoreRecords(
  records: RankableScoreRecord[],
  metric: RankMetric,
  limit = 5
): RankedScoreRecord[] {
  return records
    .map((record) => ({ record, value: metricValue(record, metric) }))
    .filter((item): item is { record: RankableScoreRecord; value: number } => typeof item.value === "number")
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.record.postal.localeCompare(b.record.postal);
    })
    .slice(0, limit)
    .map((item, index) => ({
      postal: item.record.postal,
      rank: index + 1,
      value: item.value,
      total: item.record.total,
    }));
}
