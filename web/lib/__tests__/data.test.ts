import type { Manifest, PostalGeom, ScoreRecord, ScoreState } from "../types";
import { readPublishedFixture as readJson } from "./fixtures/published-data";
import { formatLockedScoreAvailabilityLine } from "../locked-score-availability";

describe("pinned published data fixtures (reduced sample, not a full bundle audit)", () => {
  it("preserves global manifest metadata and the explicitly sampled indexes", () => {
    const manifest = readJson<Manifest>("manifest.json");
    const scoreIndex = readJson<Record<string, string[]>>("scores/index.json");
    const geomPostalIndex = readJson<Record<string, string>>("geom/postal-index.json");

    expect(manifest.provenance).toEqual(
      expect.objectContaining({ record_count: 124443 })
    );
    expect(manifest.provenance.state_counts).toEqual({
      NO_TRANSIT_IN_RANGE: 9827,
      NOT_YET_SCORED: 476,
      SCORED: 95157,
      SCORED_PARTIAL: 18983,
    });
    expect(
      Object.values(manifest.provenance.state_counts).reduce((total, count) => total + count, 0)
    ).toBe(manifest.provenance.record_count);
    expect(formatLockedScoreAvailabilityLine(manifest)).toBe(
      "Locked-score coverage: 95,157 of 124,443 June 2020 address-list records have full locked scores; 29,286 address-list records (23.5%, roughly a quarter) missing full scores: 18,983 with partial shelter-map evidence, 9,827 beyond the 1.2 km locked transit range, and 476 without published locked scores."
    );
    expect(Object.values(scoreIndex).flat().sort()).toEqual(["018956", "018990", "079908", "560234"]);
    expect(Object.keys(geomPostalIndex).sort()).toEqual(["018956", "560234"]);
  }, 60000);

  it("score shards conform to the public score record shape", () => {
    const scoreIndex = readJson<Record<string, string[]>>("scores/index.json");
    const VALID_STATES: ScoreState[] = [
      "SCORED",
      "SCORED_PARTIAL",
      "NOT_YET_SCORED",
      "NO_TRANSIT_IN_RANGE",
    ];
    const shard = Object.keys(scoreIndex).find((key) => scoreIndex[key].includes("560234"));
    expect(shard).toBeTruthy();
    const records = readJson<ScoreRecord[]>(`scores/${shard}.json`);
    const record = records.find((item) => item.postal === "560234");

    expect(record).toBeTruthy();
    expect(VALID_STATES).toContain(record!.state);
    expect(record!.state).toBe("SCORED");
    expect(record!.subscores).toEqual(
      expect.objectContaining({
        access: expect.any(Number),
        bus: expect.any(Number),
        rain: expect.any(Number),
        heat: expect.any(Number),
        crossing: expect.any(Number),
      })
    );
  });

  it("score prefix index matches the score shard index", () => {
    const scoreIndex = readJson<Record<string, string[]>>("scores/index.json");
    const scorePrefixIndex = readJson<Record<string, string[]>>("scores/prefix-index.json");
    const expectedPrefixIndex: Record<string, string[]> = {};
    for (const [shard, postals] of Object.entries(scoreIndex)) {
      for (const postal of postals) {
        const prefix = postal.slice(0, 3);
        expectedPrefixIndex[prefix] ??= [];
        if (!expectedPrefixIndex[prefix].includes(shard)) {
          expectedPrefixIndex[prefix].push(shard);
        }
      }
    }
    for (const shards of Object.values(expectedPrefixIndex)) {
      shards.sort();
    }

    expect(scorePrefixIndex).toEqual(
      Object.fromEntries(Object.entries(expectedPrefixIndex).sort())
    );
  });

  it("geometry postal prefix shards match the full postal index", () => {
    const geomPostalIndex = readJson<Record<string, string>>("geom/postal-index.json");
    const expectedPrefixIndex: Record<string, Record<string, string>> = {};
    for (const [postal, shard] of Object.entries(geomPostalIndex)) {
      const prefix = postal.slice(0, 3);
      expectedPrefixIndex[prefix] ??= {};
      expectedPrefixIndex[prefix][postal] = shard;
    }

    for (const [prefix, expected] of Object.entries(expectedPrefixIndex)) {
      const prefixIndex = readJson<Record<string, string>>(
        `geom/postal-prefix/${prefix}.json`
      );
      expect(prefixIndex).toEqual(expected);
    }
  }, 15000);

  it("postal geometry index resolves a route shard", () => {
    const geomPostalIndex = readJson<Record<string, string>>("geom/postal-index.json");
    const shard = geomPostalIndex["560234"];
    expect(shard).toBeTruthy();
    const records = readJson<PostalGeom[]>(`geom/h3/${shard}.json`);
    const geom = records.find((item) => item.postal === "560234");

    expect(geom).toBeTruthy();
    expect(typeof geom!.shortest).toBe("string");
    expect(typeof geom!.sheltered).toBe("string");
    expect(Array.isArray(geom!.exposure_gaps)).toBe(true);
  });
});
