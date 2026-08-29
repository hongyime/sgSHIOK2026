import { afterEach, describe, expect, it, vi } from "vitest";

function jsonResponse(ok: boolean, payload?: unknown): Response {
  return {
    ok,
    status: ok ? 200 : 404,
    json: async () => payload,
  } as Response;
}

function bareUrl(input: RequestInfo | URL): string {
  return String(input).split("?")[0];
}

describe("fetchScoreForPostal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses the score prefix index before falling back to the full score index", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "/data/generated/");
    const scoreRecord = {
      postal: "560234",
      state: "SCORED",
      total: 72,
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = bareUrl(input);
      if (url.endsWith("/scores/prefix-index.json")) {
        return jsonResponse(true, { "560": ["ANG_MO_KIO_PART_001"] });
      }
      if (url.endsWith("/scores/ANG_MO_KIO_PART_001.json")) {
        return jsonResponse(true, [scoreRecord]);
      }
      return jsonResponse(false);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchScoreForPostal } = await import("../data");

    await expect(fetchScoreForPostal("560234")).resolves.toEqual(scoreRecord);
    expect(fetchMock).toHaveBeenCalledWith(
      "/data/generated/scores/prefix-index.json",
      { cache: "force-cache" }
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/data/generated/scores/index.json",
      { cache: "force-cache" }
    );
  });

  it("falls back to the full score index when the score prefix index is stale", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "/data/generated/");
    const scoreRecord = {
      postal: "560234",
      state: "SCORED",
      total: 72,
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = bareUrl(input);
      if (url.endsWith("/scores/prefix-index.json")) {
        return jsonResponse(true, { "560": ["STALE_AREA"] });
      }
      if (url.endsWith("/scores/STALE_AREA.json")) {
        return jsonResponse(true, [{ ...scoreRecord, postal: "560999" }]);
      }
      if (url.endsWith("/scores/index.json")) {
        return jsonResponse(true, { STALE_AREA: ["560999"], ANG_MO_KIO: ["560234"] });
      }
      if (url.endsWith("/scores/ANG_MO_KIO.json")) {
        return jsonResponse(true, [scoreRecord]);
      }
      return jsonResponse(false);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchScoreForPostal } = await import("../data");

    await expect(fetchScoreForPostal("560234")).resolves.toEqual(scoreRecord);
    expect(fetchMock).toHaveBeenCalledWith(
      "/data/generated/scores/prefix-index.json",
      { cache: "force-cache" }
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/data/generated/scores/STALE_AREA.json",
      { cache: "force-cache" }
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/data/generated/scores/index.json",
      { cache: "force-cache" }
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/data/generated/scores/ANG_MO_KIO.json",
      { cache: "force-cache" }
    );
  });

  it("reuses cached score shards when loading nearby-address rankings", async () => {
    vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "/data/generated/");
    const primaryRecord = {
      postal: "560234",
      state: "SCORED",
      total: 72,
      subscores: { rain: 80 },
    };
    const siblingRecord = {
      postal: "560235",
      state: "SCORED",
      total: 70,
      subscores: { rain: 78 },
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = bareUrl(input);
      if (url.endsWith("/scores/prefix-index.json")) {
        return jsonResponse(true, { "560": ["ANG_MO_KIO_PART_001"] });
      }
      if (url.endsWith("/scores/ANG_MO_KIO_PART_001.json")) {
        return jsonResponse(true, [primaryRecord]);
      }
      if (url.endsWith("/scores/index.json")) {
        return jsonResponse(true, {
          ANG_MO_KIO_PART_001: ["560234"],
          ANG_MO_KIO_PART_002: ["560235"],
        });
      }
      if (url.endsWith("/scores/ANG_MO_KIO_PART_002.json")) {
        return jsonResponse(true, [siblingRecord]);
      }
      return jsonResponse(false);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchRankRecordsForPostalArea, fetchScoreForPostal } = await import("../data");

    await expect(fetchScoreForPostal("560234")).resolves.toEqual(primaryRecord);
    await expect(fetchRankRecordsForPostalArea("560234")).resolves.toEqual([
      { postal: "560234", total: 72, subscores: { rain: 80 } },
      { postal: "560235", total: 70, subscores: { rain: 78 } },
    ]);

    const partOneFetches = fetchMock.mock.calls.filter(([input]) =>
      bareUrl(input).endsWith("/scores/ANG_MO_KIO_PART_001.json")
    );
    expect(partOneFetches).toHaveLength(1);
  });
});
