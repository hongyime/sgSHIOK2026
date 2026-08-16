import { formatScoreCoverageLine } from "../score-coverage";
import type { Manifest } from "../types";

function manifestWithCounts(recordCount: number, scored: number): Manifest {
  return {
    generated_at: "2026-08-05T00:00:00Z",
    data_as_of: "2026-08-05T00:00:00Z",
    provenance: {
      record_count: recordCount,
      state_counts: {
        SCORED: scored,
      },
    },
  };
}

describe("score coverage copy", () => {
  it("formats the live-bundle availability disclosure from manifest counts", () => {
    expect(formatScoreCoverageLine(manifestWithCounts(124443, 95157))).toBe(
      "Score coverage: 95,157 full scores out of 124,443; 29,286 records (roughly a quarter) do not render a full score."
    );
  });

  it("uses a percentage when the non-full share is not near a quarter", () => {
    expect(formatScoreCoverageLine(manifestWithCounts(1000, 900))).toBe(
      "Score coverage: 900 full scores out of 1,000; 100 records (10%) do not render a full score."
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
