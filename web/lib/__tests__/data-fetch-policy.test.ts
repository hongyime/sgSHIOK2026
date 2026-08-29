import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("h3-js", () => ({
  gridDisk: (cell: string) => [cell],
  latLngToCell: () => "route-cell",
}));

function jsonResponse(ok: boolean, payload?: unknown): Response {
  return {
    ok,
    status: ok ? 200 : 404,
    json: async () => payload,
    headers: { get: () => "gzip" },
  } as unknown as Response;
}

function requestedUrls(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls.map(([input]) => String(input));
}

describe("data fetch compression policy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("does not spend failed gzip probes on uncompressed score artifacts", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "/data/generated/");
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/scores/prefix-index.json")) {
        return jsonResponse(true, { "560": ["ANG_MO_KIO"] });
      }
      if (url.endsWith("/scores/ANG_MO_KIO.json")) {
        return jsonResponse(true, [{ postal: "560234", total: 87 }]);
      }
      return jsonResponse(false);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchScoreForPostal } = await import("../data");
    await expect(fetchScoreForPostal("560234")).resolves.toEqual({ postal: "560234", total: 87 });

    expect(requestedUrls(fetchMock)).toEqual([
      "/data/generated/scores/prefix-index.json",
      "/data/generated/scores/ANG_MO_KIO.json",
    ]);
    expect(requestedUrls(fetchMock).some((url) => url.endsWith(".json.gz"))).toBe(false);
  });

  it("deduplicates concurrent manifest fetches", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "/data/generated/");
    let calls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      calls += 1;
      expect(String(input)).toBe("/data/generated/manifest.json.gz");
      await new Promise((resolve) => setTimeout(resolve, 10));
      return jsonResponse(true, { generated_at: "2026-08-29T00:00:00Z" });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchManifest } = await import("../data");
    const [first, second, third] = await Promise.all([
      fetchManifest(),
      fetchManifest(),
      fetchManifest(),
    ]);
    const fourth = await fetchManifest();

    expect(first).toBe(second);
    expect(second).toBe(third);
    expect(third).toBe(fourth);
    expect(calls).toBe(1);
  });

  it("does not spend failed gzip probes on uncompressed geometry shards resolved by postal prefix", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "/data/generated/");
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/geom/postal-prefix/560.json.gz")) {
        return jsonResponse(true, { "560234": "postal-child" });
      }
      if (url.endsWith("/geom/h3/postal-child.json")) {
        return jsonResponse(true, [{ postal: "560234", shortest: "abc", sheltered: "def" }]);
      }
      return jsonResponse(false);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchGeomForPostal } = await import("../data");
    await expect(fetchGeomForPostal("560234", 1.37, 103.84)).resolves.toEqual({
      postal: "560234",
      shortest: "abc",
      sheltered: "def",
    });

    expect(requestedUrls(fetchMock)).toEqual([
      "/data/generated/geom/postal-prefix/560.json.gz",
      "/data/generated/geom/h3/postal-child.json",
    ]);
    expect(requestedUrls(fetchMock)).not.toContain("/data/generated/geom/h3/postal-child.json.gz");
  });

  it("still loads compressed transit route shards where the bundle provides them", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "/data/generated/");
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/transit/h3/route-cell.json.gz")) {
        return jsonResponse(true, {
          type: "FeatureCollection",
          features: [{ type: "Feature", geometry: null, properties: { id: "12345" } }],
        });
      }
      return jsonResponse(false);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchTransitPoisForGeom } = await import("../data");
    const pois = await fetchTransitPoisForGeom({
      postal: "560234",
      shortest: "??",
      sheltered: "??",
      exposure_gaps: [],
    });

    expect(pois.features).toHaveLength(1);
    expect(requestedUrls(fetchMock)).toEqual(["/data/generated/transit/h3/route-cell.json.gz"]);
  });
});
