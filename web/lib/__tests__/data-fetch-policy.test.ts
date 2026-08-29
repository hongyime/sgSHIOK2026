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

  it("does not spend failed gzip probes on uncompressed geometry route shards", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "/data/generated/");
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/geom/h3/route-cell.json")) {
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

    expect(requestedUrls(fetchMock)).toEqual(["/data/generated/geom/h3/route-cell.json"]);
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
