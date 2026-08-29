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
      "Full locked scores: 95,157 of 124,443 June 2020 address-list records; 29,286 address-list records (23.5%, roughly a quarter) missing full scores: 18,983 with partial shelter-map evidence, 9,827 beyond the 1.2 km locked transit range, and 476 awaiting scoring."
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
      "Full locked scores: 900 of 1,000 June 2020 address-list records; 100 address-list records (10%) missing full scores: 80 with partial shelter-map evidence, 15 beyond the 1.2 km locked transit range, and 5 awaiting scoring."
    );
  });

  it("falls back to the generic non-full copy when state counts are incomplete", () => {
    expect(formatLockedScoreAvailabilityLine(manifestWithCounts(1000, 900))).toBe(
      "Full locked scores: 900 of 1,000 June 2020 address-list records; 100 address-list records (10%) missing full scores."
    );
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
