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
      expect.stringMatching(/^\/data\/generated\/scores\/prefix-index\.json\?v=/),
      { cache: "no-store" }
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringMatching(/^\/data\/generated\/scores\/index\.json\?v=/),
      { cache: "no-store" }
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
      expect.stringMatching(/^\/data\/generated\/scores\/prefix-index\.json\?v=/),
      { cache: "no-store" }
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/data\/generated\/scores\/STALE_AREA\.json\?v=/),
      { cache: "no-store" }
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/data\/generated\/scores\/index\.json\?v=/),
      { cache: "no-store" }
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/data\/generated\/scores\/ANG_MO_KIO\.json\?v=/),
      { cache: "no-store" }
    );
  });
});
