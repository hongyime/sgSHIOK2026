import { DEFAULT_DATA_BASE, normalizeDataBase } from "../data";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "fs";
import { join } from "path";
import dataBundle from "../../data-bundle.json";
import manifestFixture from "./fixtures/published-manifest-20261002.json";
import fixtureProvenance from "./fixtures/published-manifest-20261002.provenance.json";

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

  it("keeps pinned first-load metadata aligned with the recorded manifest fixture", () => {
    const fixtureBytes = readFileSync(join(__dirname, "fixtures/published-manifest-20261002.json"));

    expect(dataBundle.bundle).toBe(fixtureProvenance.bundle);
    expect(dataBundle.bundle).toBe(manifestFixture.bundle);
    expect(createHash("sha256").update(fixtureBytes).digest("hex")).toBe(fixtureProvenance.fixtureSha256);
    expect(dataBundle.generated_at).toBe(manifestFixture.generated_at);
    expect(dataBundle.data_as_of).toBe(manifestFixture.data_as_of);
    expect(dataBundle.provenance).toEqual(manifestFixture.provenance);
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
