import { DEFAULT_DATA_BASE, normalizeDataBase } from "../data";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import dataBundle from "../../data-bundle.json";

describe("normalizeDataBase", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to generated data", () => {
    expect(normalizeDataBase()).toBe(DEFAULT_DATA_BASE);
    expect(normalizeDataBase("")).toBe(DEFAULT_DATA_BASE);
    expect(normalizeDataBase("   ")).toBe(DEFAULT_DATA_BASE);
  });

  it("documents the pinned published data bundle instead of a latest bundle", () => {
    const source = readFileSync(join(__dirname, "../data.ts"), "utf-8");

    expect(source).toContain(
      "Defaults to the pinned published static shelter-map bundle in web/data-bundle.json."
    );
    expect(source).not.toContain("Defaults to the latest validated static shelter-map bundle.");
  });

  it("keeps pinned first-load metadata aligned with the active manifest", () => {
    const manifest = JSON.parse(
      readFileSync(
        join(__dirname, "../../public/data", dataBundle.bundle, "manifest.json"),
        "utf-8"
      )
    );

    expect(dataBundle.generated_at).toBe(manifest.generated_at);
    expect(dataBundle.data_as_of).toBe(manifest.data_as_of);
    expect(dataBundle.provenance.record_count).toBe(manifest.provenance.record_count);
    expect(dataBundle.provenance.state_counts).toEqual(manifest.provenance.state_counts);
  });

  it("normalizes relative and absolute paths", () => {
    expect(normalizeDataBase("data")).toBe("/data/");
    expect(normalizeDataBase("/data")).toBe("/data/");
    expect(normalizeDataBase("/data/generated/")).toBe("/data/generated/");
  });

  it("preserves absolute URLs while ensuring a trailing slash", () => {
    expect(normalizeDataBase("https://example.test/data")).toBe("https://example.test/data/");
  });
});
