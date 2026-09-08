import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readPublishedFixture } from "./fixtures/published-data";

vi.mock("h3-js", () => ({
  gridDisk: (cell: string) => [cell],
  latLngToCell: () => "route-cell",
}));

const base = "/data/generated/";
const cachedOptions = { cache: "only-if-cached", mode: "same-origin" };
const manifest = readPublishedFixture("manifest.json");

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", "content-encoding": "gzip" },
  });
}

describe("cached alternate-format recovery", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", base);
    vi.stubGlobal("window", { location: { href: "https://shiok.test/", origin: "https://shiok.test" } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each(["503", "network rejection"])("loads unchanged published scores from cached JSON after gzip %s", async (failure) => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input).slice(base.length);
      if (path.endsWith(".gz")) {
        expect(options).toEqual({ cache: "force-cache" });
        if (failure === "network rejection") throw new TypeError("Failed to fetch");
        return response(null, 503);
      }
      expect(options).toEqual(cachedOptions);
      return response(readPublishedFixture(path));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchScoreForPostal } = await import("../data");
    const prefix = readPublishedFixture<Record<string, string[]>>("scores/prefix-index.json");
    const shard = prefix["018"][0];
    const records = readPublishedFixture<Array<{ postal: string }>>(`scores/${shard}.json`);
    const expected = records.find((record) => record.postal === "018956");
    expect(expected).toBeDefined();
    await expect(fetchScoreForPostal("018956")).resolves.toEqual(expected);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      `${base}scores/prefix-index.json.gz`, `${base}scores/prefix-index.json`,
      `${base}scores/${shard}.json.gz`, `${base}scores/${shard}.json`,
    ]);
  });

  it("preserves the original HTTP failure on a cache miss, then permits a clean retry", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(null, 503))
      .mockResolvedValueOnce(response(null, 504))
      .mockResolvedValueOnce(response(manifest));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest } = await import("../data");
    await expect(fetchManifest()).rejects.toThrow("manifest.json.gz fetch failed: 503");
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${base}manifest.json`, cachedOptions);
    await expect(fetchManifest()).resolves.toEqual(manifest);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("preserves the original network failure when the cache-only fetch rejects", async () => {
    const original = new TypeError("origin unavailable");
    const fetchMock = vi.fn().mockRejectedValueOnce(original).mockRejectedValueOnce(new TypeError("cache miss"));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest } = await import("../data");
    await expect(fetchManifest()).rejects.toBe(original);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("preserves cancellation without probing the cache", async () => {
    const failure = new DOMException("cancelled", "AbortError");
    const fetchMock = vi.fn().mockRejectedValue(failure);
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest } = await import("../data");
    await expect(fetchManifest()).rejects.toBe(failure);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retains the original error when a malformed configured URL prevents cache eligibility", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "https://[invalid/");
    const failure = new TypeError("invalid request URL");
    const fetchMock = vi.fn().mockRejectedValue(failure);
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest } = await import("../data");
    await expect(fetchManifest()).rejects.toBe(failure);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([400, 401, 403, 429])("does not mask HTTP %i with a cache fallback", async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(response(null, status));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest } = await import("../data");
    await expect(fetchManifest()).rejects.toThrow(`manifest.json.gz fetch failed: ${status}`);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not conceal malformed successful gzip JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("not-json", { headers: { "content-encoding": "gzip" } }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest } = await import("../data");
    await expect(fetchManifest()).rejects.toBeInstanceOf(SyntaxError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not conceal malformed successful gzip bytes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("not-gzip"));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest } = await import("../data");
    await expect(fetchManifest()).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces corrupt cached plain JSON without starting another request", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response(null, 503)).mockResolvedValueOnce(new Response("not-json"));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest } = await import("../data");
    await expect(fetchManifest()).rejects.toBeInstanceOf(SyntaxError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not use browser cache-only semantics on the server", async () => {
    vi.stubGlobal("window", undefined);
    const fetchMock = vi.fn().mockResolvedValue(response(null, 503));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest } = await import("../data");
    await expect(fetchManifest()).rejects.toThrow("manifest.json.gz fetch failed: 503");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not probe a cross-origin plain artifact", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "https://other.test/data/generated/");
    const fetchMock = vi.fn().mockResolvedValue(response(null, 503));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest } = await import("../data");
    await expect(fetchManifest()).rejects.toThrow("manifest.json.gz fetch failed: 503");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not probe plain JSON for compressed-only transit shards", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(null, 503));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchTransitPoisForGeom } = await import("../data");
    await expect(fetchTransitPoisForGeom({ postal: "018956", shortest: "??", sheltered: "??", exposure_gaps: [] }))
      .resolves.toMatchObject({ features: [] });
    expect(fetchMock.mock.calls).toEqual([[`${base}transit/h3/route-cell.json.gz`, { cache: "force-cache" }]]);
  });

  it("does not probe compressed-only transit JSON after network rejection", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchTransitPoisForGeom } = await import("../data");
    await expect(fetchTransitPoisForGeom({ postal: "018956", shortest: "??", sheltered: "??", exposure_gaps: [] }))
      .resolves.toMatchObject({ features: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent score artifact recovery without the manifest promise cache", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
      const path = String(input).slice(base.length);
      if (path.endsWith(".gz")) return response(null, 503);
      expect(options).toEqual(cachedOptions);
      await new Promise((resolve) => setTimeout(resolve, 5));
      return response(readPublishedFixture(path));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchScoreForPostal } = await import("../data");
    const results = await Promise.all([fetchScoreForPostal("018956"), fetchScoreForPostal("018956")]);
    expect(results[0]).toBe(results[1]);
    expect(results[0]?.postal).toBe("018956");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("deduplicates concurrent reads through the cache fallback", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response(null, 502)).mockResolvedValueOnce(response(manifest));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest } = await import("../data");
    const results = await Promise.all([fetchManifest(), fetchManifest(), fetchManifest()]);
    expect(results).toEqual([manifest, manifest, manifest]);
    expect(results[0]).toBe(results[1]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
