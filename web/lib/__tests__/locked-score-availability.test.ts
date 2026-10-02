import { formatLockedScoreAvailabilityLine } from "../locked-score-availability";
import type { Manifest } from "../types";

function manifestWithCounts(
  recordCount: number,
  scored: number,
  extraCounts: Record<string, number> = {}
): Manifest {
  return {
    generated_at: "2026-08-05T00:00:00Z",
    data_as_of: "2026-08-05T00:00:00Z",
    provenance: {
      record_count: recordCount,
      state_counts: {
        SCORED: scored,
        ...extraCounts,
      },
    },
  };
}

function manifestWithCoverage(
  recordCount: number,
  coverage: Record<string, number | string | null>
): Manifest {
  return {
    generated_at: "2026-10-02T00:00:00Z",
    data_as_of: "2026-10-02T00:00:00Z",
    provenance: {
      record_count: recordCount,
      state_counts: { SCORED: 1 },
      locked_score_coverage: coverage,
    },
  };
}

describe("locked score availability copy", () => {
  it("formats the live-bundle availability disclosure from manifest counts", () => {
    expect(
      formatLockedScoreAvailabilityLine(
        manifestWithCounts(124443, 95157, {
          SCORED_PARTIAL: 18983,
          NO_TRANSIT_IN_RANGE: 9827,
          NOT_YET_SCORED: 476,
        })
      )
    ).toBe(
      "Locked-score coverage: 95,157 of 124,443 June 2020 address-list records have full locked scores; 29,286 address-list records (23.5%, roughly a quarter) missing full scores: 18,983 with partial shelter-map evidence, 9,827 beyond the 1.2 km locked transit range, and 476 without published locked scores."
    );
  });

  it("uses a percentage when the non-full share is not near a quarter", () => {
    expect(
      formatLockedScoreAvailabilityLine(
        manifestWithCounts(1000, 900, {
          SCORED_PARTIAL: 80,
          NO_TRANSIT_IN_RANGE: 15,
          NOT_YET_SCORED: 5,
        })
      )
    ).toBe(
      "Locked-score coverage: 900 of 1,000 June 2020 address-list records have full locked scores; 100 address-list records (10%) missing full scores: 80 with partial shelter-map evidence, 15 beyond the 1.2 km locked transit range, and 5 without published locked scores."
    );
  });

  it("falls back to the generic non-full copy when state counts are incomplete", () => {
    expect(formatLockedScoreAvailabilityLine(manifestWithCounts(1000, 900))).toBe(
      "Locked-score coverage: 900 of 1,000 June 2020 address-list records have full locked scores; 100 address-list records (10%) missing full scores."
    );
  });

  it("prefers the manifest locked_score_coverage block and names no-bus-stop records as full", () => {
    expect(
      formatLockedScoreAvailabilityLine(
        manifestWithCoverage(124443, {
          full_locked_score: 95000,
          scored: 57299,
          bus_none_in_range: 37701,
          partial_other: 27715,
          no_transit_in_range: 1252,
          not_yet_scored: 476,
          bus_stop_candidate_radius_m: 300,
        })
      )
    ).toBe(
      "Locked-score coverage: 95,000 of 124,443 June 2020 address-list records have full locked scores (37,701 of them have no bus stop within 300 m, so the bus term is 0); 29,443 address-list records (23.7%, roughly a quarter) missing full scores: 27,715 with partial shelter-map evidence, 1,252 beyond the 1.2 km locked transit range, and 476 without published locked scores."
    );
  });

  it("omits the disclosure when locked_score_coverage is internally inconsistent", () => {
    expect(
      formatLockedScoreAvailabilityLine(
        manifestWithCoverage(1000, { full_locked_score: 2000, partial_other: 0, no_transit_in_range: 0, not_yet_scored: 0 })
      )
    ).toBeNull();
  });

  it("omits the disclosure when bundle counts are unavailable", () => {
    expect(formatLockedScoreAvailabilityLine(null)).toBeNull();
    expect(
      formatLockedScoreAvailabilityLine({
        generated_at: "2026-08-05T00:00:00Z",
        data_as_of: null,
        provenance: {},
      })
    ).toBeNull();
  });
});
