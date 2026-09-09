import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readPublishedFixture } from "./fixtures/published-data";

vi.mock("h3-js", () => ({ gridDisk: (cell: string) => [cell], latLngToCell: () => "route-cell" }));

const base = "/data/generated/";
const cachedOptions = { cache: "only-if-cached", mode: "same-origin" };
const manifest = readPublishedFixture("manifest.json");
const prefix = readPublishedFixture<Record<string, string[]>>("scores/prefix-index.json");
const scoreShard = prefix["018"][0];
const geometryIndex = readPublishedFixture<Record<string, string>>("geom/postal-prefix/018.json");
const geometryShard = geometryIndex["018956"];

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", "content-encoding": "gzip" } });
}

async function rejected(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(() => { throw new Error("Expected rejection"); }, (error) => error);
}

async function reader() {
  const data = await import("../data");
  const { getArtifactFailure } = await import("../artifact-failure");
  return { ...data, getArtifactFailure };
}

describe("artifact diagnostics at actual reader boundaries", () => {
  let now: number;
  beforeEach(() => {
    now = 100;
    vi.stubGlobal("performance", { now: () => now });
    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", base);
    vi.stubGlobal("window", { location: { href: "https://shiok.test/", origin: "https://shiok.test" } });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each([401, 403, 429])("reports HTTP %i without probing a plain fallback", async (status) => {
    const fetchMock = vi.fn(async () => { now += 12; return response(null, status); });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    const error = await rejected(fetchManifest());
    expect(getArtifactFailure(error)).toEqual({ stage: "artifact-fetch", reason: "http", artifactRole: "manifest", httpStatus: status, elapsedMs: 12 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retains the gzip HTTP status and timing when a slower cache-only miss follows", async () => {
    const fetchMock = vi.fn().mockImplementationOnce(async () => { now += 10; return response(null, 503); })
      .mockImplementationOnce(async () => { now += 80; return response(null, 504); });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    const error = await rejected(fetchManifest());
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("manifest.json.gz fetch failed: 503");
    expect(getArtifactFailure(error)).toEqual({ stage: "artifact-fetch", reason: "http", artifactRole: "manifest", httpStatus: 503, elapsedMs: 10 });
    expect(fetchMock.mock.calls).toEqual([[`${base}manifest.json.gz`, { cache: "force-cache" }], [`${base}manifest.json`, cachedOptions]]);
  });

  it.each(["cache rejection", "cache miss", "malformed base", "server", "cross origin"])("preserves original network error identity after %s", async (scenario) => {
    const original = Object.freeze(new TypeError("sensitive URL/postal/path"));
    if (scenario === "malformed base") vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "https://[invalid/");
    if (scenario === "cross origin") vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "https://other.test/data/");
    if (scenario === "server") vi.stubGlobal("window", undefined);
    const fetchMock = vi.fn().mockImplementationOnce(async () => { now += 9; throw original; })
      .mockImplementationOnce(async () => { now += 30; if (scenario === "cache rejection") throw new Error("cache failure"); return response(null, 504); });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    expect(await rejected(fetchManifest())).toBe(original);
    expect(getArtifactFailure(original)).toEqual({ stage: "artifact-fetch", reason: "network", artifactRole: "manifest", httpStatus: null, elapsedMs: 9 });
    expect(JSON.stringify(getArtifactFailure(original))).not.toMatch(/sensitive|URL|postal|path/);
    expect(fetchMock).toHaveBeenCalledTimes(scenario.startsWith("cache") ? 2 : 1);
  });

  it.each(["gzip", "plain"])("does not turn %s fetch cancellation into an artifact failure", async (format) => {
    const original = new DOMException("cancelled", "AbortError");
    const fetchMock = vi.fn();
    if (format === "plain") fetchMock.mockResolvedValueOnce(response(null, 404));
    fetchMock.mockRejectedValueOnce(original);
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    expect(await rejected(fetchManifest())).toBe(original);
    expect(getArtifactFailure(original)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(format === "plain" ? 2 : 1);
  });

  it.each(["gzip fetch", "plain fetch", "decode"])("preserves a frozen error with a throwing name getter at the %s boundary", async (boundary) => {
    const original = new Error("private original failure");
    Object.defineProperty(original, "name", { get() { throw new Error("name getter failed"); } });
    Object.freeze(original);
    const fetchMock = vi.fn();
    if (boundary === "decode") {
      const broken = response(null);
      vi.spyOn(broken, "json").mockRejectedValue(original);
      fetchMock.mockResolvedValueOnce(broken);
    } else {
      if (boundary === "plain fetch") fetchMock.mockResolvedValueOnce(response(null, 404));
      fetchMock.mockRejectedValueOnce(original);
      if (boundary === "gzip fetch") fetchMock.mockResolvedValueOnce(response(null, 504));
    }
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    expect(await rejected(fetchManifest()) === original).toBe(true);
    expect(getArtifactFailure(original)).toEqual({
      stage: boundary === "decode" ? "artifact-decode" : "artifact-fetch",
      reason: boundary === "decode" ? "error" : "network", artifactRole: "manifest",
      httpStatus: boundary === "decode" ? 200 : null, elapsedMs: 0,
    });
    expect(fetchMock).toHaveBeenCalledTimes(boundary === "decode" ? 1 : 2);
  });

  it.each(["fetch", "decode"])("does not replace a %s rejection if diagnostic timing throws", async (boundary) => {
    const original = Object.freeze(new TypeError("original failure"));
    const fail = async () => {
      vi.stubGlobal("performance", { now() { throw new Error("diagnostic clock failed"); } });
      throw original;
    };
    const fetchMock = vi.fn();
    if (boundary === "decode") {
      const broken = response(null);
      vi.spyOn(broken, "json").mockImplementation(fail);
      fetchMock.mockResolvedValueOnce(broken);
    } else {
      fetchMock.mockImplementationOnce(fail).mockResolvedValueOnce(response(null, 504));
    }
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    expect(await rejected(fetchManifest())).toBe(original);
    expect(getArtifactFailure(original)).toEqual({
      stage: boundary === "decode" ? "artifact-decode" : "artifact-fetch",
      reason: boundary === "decode" ? "error" : "network", artifactRole: "manifest",
      httpStatus: boundary === "decode" ? 200 : null, elapsedMs: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(boundary === "decode" ? 1 : 2);
  });

  it.each(["gzip", "plain"])("still loads successful %s data when the initial clock read throws", async (format) => {
    vi.stubGlobal("performance", { now() { throw new Error("clock unavailable"); } });
    const fetchMock = vi.fn();
    if (format === "plain") fetchMock.mockResolvedValueOnce(response(null, 404));
    fetchMock.mockResolvedValueOnce(response(manifest));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    const result = await fetchManifest();
    expect(result).toEqual(manifest);
    expect(getArtifactFailure(result)).toBeNull();
    expect(fetchMock.mock.calls).toEqual(format === "plain"
      ? [[`${base}manifest.json.gz`, { cache: "force-cache" }], [`${base}manifest.json`, { cache: "force-cache" }]]
      : [[`${base}manifest.json.gz`, { cache: "force-cache" }]]);
  });

  it.each([503, "network"])("decodes successful cached plain recovery after %s even if the clock then throws", async (failure) => {
    const original = new TypeError("offline");
    const fetchMock = vi.fn().mockImplementationOnce(async () => {
      vi.stubGlobal("performance", { now() { throw new Error("clock unavailable"); } });
      if (failure === "network") throw original;
      return response(null, failure);
    }).mockResolvedValueOnce(response(manifest));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    const result = await fetchManifest();
    expect(result).toEqual(manifest);
    expect(getArtifactFailure(result)).toBeNull();
    if (failure === "network") expect(getArtifactFailure(original)).toEqual({
      stage: "artifact-fetch", reason: "network", artifactRole: "manifest", httpStatus: null, elapsedMs: null,
    });
    expect(fetchMock.mock.calls).toEqual([[`${base}manifest.json.gz`, { cache: "force-cache" }], [`${base}manifest.json`, cachedOptions]]);
  });

  it.each(["http", "decode"])("retains %s failure details with unavailable timing from the start", async (boundary) => {
    vi.stubGlobal("performance", { now() { throw new Error("clock unavailable"); } });
    const original = Object.freeze(new SyntaxError("original parse failure"));
    const broken = response(null);
    vi.spyOn(broken, "json").mockRejectedValue(original);
    const fetchMock = vi.fn().mockResolvedValue(boundary === "http" ? response(null, 403) : broken);
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    const error = await rejected(fetchManifest());
    if (boundary === "decode") expect(error).toBe(original);
    expect(getArtifactFailure(error)).toEqual({
      stage: boundary === "decode" ? "artifact-decode" : "artifact-fetch",
      reason: boundary === "decode" ? "error" : "http", artifactRole: "manifest",
      httpStatus: boundary === "decode" ? 200 : 403, elapsedMs: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not invent elapsed time when the clock recovers after a missing start", async () => {
    vi.stubGlobal("performance", { now: vi.fn().mockImplementationOnce(() => { throw new Error("no start"); }).mockReturnValue(150) });
    const fetchMock = vi.fn().mockResolvedValue(response(null, 403));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    expect(getArtifactFailure(await rejected(fetchManifest()))).toEqual({
      stage: "artifact-fetch", reason: "http", artifactRole: "manifest", httpStatus: 403, elapsedMs: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("preserves cancellation and avoids fallback even when the clock is unavailable", async () => {
    vi.stubGlobal("performance", { now() { throw new Error("clock unavailable"); } });
    const original = new DOMException("cancelled", "AbortError");
    const fetchMock = vi.fn().mockRejectedValue(original);
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    expect(await rejected(fetchManifest())).toBe(original);
    expect(getArtifactFailure(original)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([503, "network"])("successful cached recovery after %s has no returned failure and retains published values", async (failure) => {
    const original = new TypeError("offline");
    const fetchMock = vi.fn().mockImplementationOnce(async () => { if (failure === "network") throw original; return response(null, failure); })
      .mockResolvedValueOnce(response(manifest));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    const result = await fetchManifest();
    expect(result).toEqual(manifest);
    expect(getArtifactFailure(result)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps gzip404 then online plain success unchanged", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response(null, 404)).mockResolvedValueOnce(response(manifest));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    const result = await fetchManifest();
    expect(result).toEqual(manifest);
    expect(getArtifactFailure(result)).toBeNull();
    expect(fetchMock.mock.calls).toEqual([[`${base}manifest.json.gz`, { cache: "force-cache" }], [`${base}manifest.json`, { cache: "force-cache" }]]);
  });

  it.each(["http", "network"])("records the final plain %s failure after gzip404 with its own timing", async (reason) => {
    const original = new TypeError("plain network failed");
    const fetchMock = vi.fn().mockImplementationOnce(async () => { now += 70; return response(null, 404); })
      .mockImplementationOnce(async () => { now += 14; if (reason === "network") throw original; return response(null, 502); });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    const error = await rejected(fetchManifest());
    if (reason === "network") expect(error).toBe(original);
    expect(getArtifactFailure(error)).toEqual({ stage: "artifact-fetch", reason, artifactRole: "manifest", httpStatus: reason === "http" ? 502 : null, elapsedMs: 14 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each(["gzip", "plain", "cached plain"])("records %s JSON rejection as decode rather than fetch", async (format) => {
    const original = new SyntaxError("sensitive JSON contents");
    const broken = response(null);
    vi.spyOn(broken, "json").mockImplementation(async () => { now += 8; throw original; });
    const fetchMock = vi.fn();
    if (format !== "gzip") fetchMock.mockImplementationOnce(async () => { now += 40; return response(null, format === "plain" ? 404 : 503); });
    fetchMock.mockImplementationOnce(async () => { now += 17; return broken; });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    expect(await rejected(fetchManifest())).toBe(original);
    expect(getArtifactFailure(original)).toEqual({ stage: "artifact-decode", reason: "error", artifactRole: "manifest", httpStatus: 200, elapsedMs: 8 });
    expect(fetchMock).toHaveBeenCalledTimes(format === "gzip" ? 1 : 2);
  });

  it("classifies corrupt gzip bytes as decode error without requesting a plain artifact", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("not-gzip"));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    const error = await rejected(fetchManifest());
    expect(getArtifactFailure(error)).toEqual({ stage: "artifact-decode", reason: "error", artifactRole: "manifest", httpStatus: 200, elapsedMs: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["decoder", "body", "body and decoder"])("distinguishes missing gzip %s without changing the rejection message", async (missing) => {
    if (missing !== "body") vi.stubGlobal("DecompressionStream", undefined);
    const fetchMock = vi.fn().mockResolvedValue(new Response(missing === "decoder" ? "gzip-bytes" : null));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    const error = await rejected(fetchManifest());
    expect((error as Error).message).toBe("gzip data fetch is unsupported for manifest.json.gz");
    expect(getArtifactFailure(error)).toEqual({ stage: "artifact-decode", reason: missing === "decoder" ? "unsupported" : "error", artifactRole: "manifest", httpStatus: 200, elapsedMs: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("preserves decode cancellation without diagnostics or recovery requests", async () => {
    const original = new DOMException("cancelled", "AbortError");
    const broken = response(null);
    vi.spyOn(broken, "json").mockRejectedValue(original);
    const fetchMock = vi.fn().mockResolvedValue(broken);
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    expect(await rejected(fetchManifest())).toBe(original);
    expect(getArtifactFailure(original)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([3_600_000, -3_600_000])("uses monotonic timing despite wall-clock adjustment %i", async (adjustment) => {
    const wall = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    vi.stubGlobal("fetch", vi.fn(async () => { wall.mockReturnValue(1_000_000 + adjustment); now += 25; return response(null, 401); }));
    const { fetchManifest, getArtifactFailure } = await reader();
    expect(getArtifactFailure(await rejected(fetchManifest()))?.elapsedMs).toBe(25);
  });

  it.each([
    ["score index", "scores/index.json", "score-index"],
    ["score shard", `scores/${scoreShard}.json`, "score-shard"],
    ["geometry prefix index", "geom/postal-prefix/018.json", "geometry-index"],
    ["geometry postal index", "geom/postal-index.json", "geometry-index"],
    ["geometry H3 index", "geom/index.json", "geometry-index"],
    ["geometry shard", `geom/h3/${geometryShard}.json`, "geometry-shard"],
  ])("reduces actual %s path to a safe role", async (name, failedPath, artifactRole) => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input).slice(base.length).replace(/\.gz$/, "");
      if (path === failedPath) return response(null, 403);
      if (name === "score index" || name === "geometry postal index" || name === "geometry H3 index") return response(null, 404);
      return response(readPublishedFixture(path));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchScoreForPostal, fetchGeomForPostal, getArtifactFailure } = await reader();
    const operation = name.startsWith("score") ? fetchScoreForPostal("018956") : fetchGeomForPostal("018956", 1.29, 103.85);
    const error = await rejected(operation);
    expect(getArtifactFailure(error)).toEqual({ stage: "artifact-fetch", reason: "http", artifactRole, httpStatus: 403, elapsedMs: 0 });
    expect(JSON.stringify(getArtifactFailure(error))).not.toMatch(/018956|018\.json|route-cell|\.json|\/data\//);
  });

  it("attaches a score-prefix role while keeping that optional failure silent", async () => {
    const original = new TypeError("prefix failed");
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("prefix-index")) throw original;
      return response({});
    });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchScoreForPostal, getArtifactFailure } = await reader();
    await expect(fetchScoreForPostal("018956")).resolves.toBeNull();
    expect(getArtifactFailure(original)?.artifactRole).toBe("score-index");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each(["pois", "shard"])("preserves optional transit %s behavior while tagging a caught network failure", async (kind) => {
    const original = new TypeError("transit failed");
    const fetchMock = vi.fn().mockRejectedValue(original);
    vi.stubGlobal("fetch", fetchMock);
    const { fetchTransitPois, fetchTransitPoisForGeom, getArtifactFailure } = await reader();
    const operation = kind === "pois" ? fetchTransitPois() : fetchTransitPoisForGeom({ postal: "018956", shortest: "??", sheltered: "??", exposure_gaps: [] });
    await expect(operation).resolves.toEqual({ type: "FeatureCollection", features: [] });
    expect(getArtifactFailure(original)?.artifactRole).toBe("transit");
    expect(fetchMock).toHaveBeenCalledTimes(kind === "pois" ? 2 : 1);
  });

  it("keeps missing optional geometry missing, not a surfaced artifact failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(null, 404));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchGeomForPostal } = await reader();
    await expect(fetchGeomForPostal("018956")).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("shares the same annotated error across concurrent requests and retries normally afterwards", async () => {
    const original = new TypeError("private network failure");
    const fetchMock = vi.fn().mockRejectedValueOnce(original).mockResolvedValueOnce(response(null, 504)).mockResolvedValueOnce(response(manifest));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchManifest, getArtifactFailure } = await reader();
    const results = await Promise.allSettled([fetchManifest(), fetchManifest()]);
    expect(results).toEqual([{ status: "rejected", reason: original }, { status: "rejected", reason: original }]);
    expect(getArtifactFailure(original)?.reason).toBe("network");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(fetchManifest()).resolves.toEqual(manifest);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
