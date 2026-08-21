import type { Manifest, PostalGeom, ScoreRecord, ScoreState } from "../types";
import dataBundle from "../../data-bundle.json";
import { existsSync, readFileSync } from "fs";
import { gunzipSync } from "zlib";
import { join } from "path";
import { formatLockedScoreAvailabilityLine } from "../locked-score-availability";

const DATA_DIR = join(__dirname, "../../public/data", dataBundle.bundle);

function readJson<T>(rel: string): T {
  const plain = join(DATA_DIR, rel);
  if (existsSync(plain)) {
    return JSON.parse(readFileSync(plain, "utf-8")) as T;
  }
  return JSON.parse(gunzipSync(readFileSync(`${plain}.gz`)).toString("utf-8")) as T;
}

describe("generated data bundle", () => {
  it("has the expected manifest and indexes", () => {
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
      "Locked score availability: 95,157 full locked scores out of 124,443; 29,286 records (23.5%, roughly a quarter) do not show a full locked score: 18,983 with partial shelter-map evidence, 9,827 beyond locked transit range, and 476 awaiting scoring."
    );
    expect(Object.keys(scoreIndex).length).toBeGreaterThan(50);
    expect(Object.keys(geomPostalIndex).length).toBe(
      manifest.provenance.state_counts.SCORED +
        manifest.provenance.state_counts.SCORED_PARTIAL
    );
  });

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
