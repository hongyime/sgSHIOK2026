import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));

import { shouldFetchRankRecords } from "../../app/page";
import { rankScoreRecords, type RankableScoreRecord } from "../subscore-ranking";

describe("rank view payload contract", () => {
  it("does not fetch area ranks until the rank panel is opened", () => {
    expect(
      shouldFetchRankRecords({
        rankPanelOpen: false,
        postal: "460001",
        hasSubscores: true,
      })
    ).toBe(false);
    expect(
      shouldFetchRankRecords({
        rankPanelOpen: true,
        postal: "460001",
        hasSubscores: true,
      })
    ).toBe(true);
  });

  it("ranks compact projected records without route geometry or provenance", () => {
    const records: RankableScoreRecord[] = [
      { postal: "460001", total: 88, subscores: { rain: 40, access: 90, bus: 100, heat: 50, crossing: 80 } },
      { postal: "460002", total: 82, subscores: { rain: 95, access: 50, bus: 20, heat: 70, crossing: 60 } },
    ];

    const ranked = rankScoreRecords(records, "rain", 2);

    expect(ranked.map((item) => item.postal)).toEqual(["460002", "460001"]);
    expect(ranked.map((item) => item.total)).toEqual([82, 88]);
  });
});
