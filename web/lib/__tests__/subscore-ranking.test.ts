import { RANK_METRIC_OPTIONS, rankScoreRecords } from "../subscore-ranking";
import type { ScoreRecord } from "../types";

function score(postal: string, total: number, rain: number, access: number): ScoreRecord {
  return {
    postal,
    state: "SCORED",
    total,
    subscores: { rain, access, bus: 50, heat: 40, crossing: 70 },
    best_node: null,
    paths: null,
    exposure_gaps: null,
    data_as_of: null,
    provenance: "",
  };
}

describe("planning-area evidence ranking", () => {
  it("labels rank options by evidence view and locked-score detail", () => {
    expect(RANK_METRIC_OPTIONS).toEqual([
      { id: "overall", label: "Overall locked score" },
      { id: "rain", label: "Covered-walkway evidence" },
      { id: "access", label: "Walk-distance evidence" },
      { id: "bus", label: "Bus service support" },
      { id: "heat", label: "Heat estimate" },
      { id: "crossing", label: "Crossing friction" },
    ]);
  });

  it("sorts by authoritative total for the overall view", () => {
    const ranked = rankScoreRecords(
      [score("100002", 80, 10, 50), score("100001", 90, 20, 40)],
      "overall"
    );

    expect(ranked.map((item) => item.postal)).toEqual(["100001", "100002"]);
    expect(ranked[0]?.value).toBe(90);
  });

  it("sorts by one evidence metric without changing stored totals", () => {
    const ranked = rankScoreRecords(
      [score("100002", 80, 10, 50), score("100001", 90, 20, 40)],
      "access"
    );

    expect(ranked.map((item) => item.postal)).toEqual(["100002", "100001"]);
    expect(ranked.map((item) => item.total)).toEqual([80, 90]);
  });

  it("uses postal code as a deterministic tie-breaker", () => {
    const ranked = rankScoreRecords(
      [score("100002", 80, 10, 50), score("100001", 80, 20, 40)],
      "overall"
    );

    expect(ranked.map((item) => item.postal)).toEqual(["100001", "100002"]);
  });
});
