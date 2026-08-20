import { formatScoreCoverageLine } from "../score-coverage";
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

describe("score coverage copy", () => {
  it("formats the live-bundle availability disclosure from manifest counts", () => {
    expect(
      formatScoreCoverageLine(
        manifestWithCounts(124443, 95157, {
          SCORED_PARTIAL: 18983,
          NO_TRANSIT_IN_RANGE: 9827,
          NOT_YET_SCORED: 476,
        })
      )
    ).toBe(
      "Locked score availability: 95,157 full scores out of 124,443; 29,286 records (roughly a quarter) do not show a full score: 18,983 with partial shelter-map evidence, 9,827 beyond current transit range, and 476 awaiting scoring."
    );
  });

  it("uses a percentage when the non-full share is not near a quarter", () => {
    expect(
      formatScoreCoverageLine(
        manifestWithCounts(1000, 900, {
          SCORED_PARTIAL: 80,
          NO_TRANSIT_IN_RANGE: 15,
          NOT_YET_SCORED: 5,
        })
      )
    ).toBe(
      "Locked score availability: 900 full scores out of 1,000; 100 records (10%) do not show a full score: 80 with partial shelter-map evidence, 15 beyond current transit range, and 5 awaiting scoring."
    );
  });

  it("falls back to the generic non-full copy when state counts are incomplete", () => {
    expect(formatScoreCoverageLine(manifestWithCounts(1000, 900))).toBe(
      "Locked score availability: 900 full scores out of 1,000; 100 records (10%) do not show a full score."
    );
  });

  it("omits the disclosure when bundle counts are unavailable", () => {
    expect(formatScoreCoverageLine(null)).toBeNull();
    expect(
      formatScoreCoverageLine({
        generated_at: "2026-08-05T00:00:00Z",
        data_as_of: null,
        provenance: {},
      })
    ).toBeNull();
  });
});
