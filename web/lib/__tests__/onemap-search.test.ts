import {
  createOneMapSearchClient,
  normalizeOneMapSearchQuery,
  shouldQueryOneMap,
} from "../onemap-search";

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function storageFixture(initial?: Record<string, string>) {
  const values = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    get length() {
      return values.size;
    },
    values,
  };
}

describe("OneMap search client", () => {
  it("normalizes free-text queries for cache keys", () => {
    expect(normalizeOneMapSearchQuery("  mayflower   mrt ")).toBe("MAYFLOWER MRT");
    expect(shouldQueryOneMap("am")).toBe(false);
    expect(shouldQueryOneMap("amk")).toBe(true);
  });

  it("does not call the backend for short free-text queries", async () => {
    let calls = 0;
    const client = createOneMapSearchClient({
      storage: null,
      fetcher: async () => {
        calls += 1;
        return response({ found: 1, results: [] });
      },
    });

    const payload = await client.search("am");

    expect(payload).toEqual({ found: 0, results: [] });
    expect(calls).toBe(0);
  });

  it("caches repeated normalized searches so three submits make one backend call", async () => {
    let calls = 0;
    const client = createOneMapSearchClient({
      storage: null,
      fetcher: async (input) => {
        calls += 1;
        expect(String(input)).toBe("/api/onemap-search?searchVal=MAYFLOWER%20MRT");
        return response({
          found: 1,
          results: [{ POSTAL: "560234", BUILDING: "Mayflower", ROAD_NAME: "", LATITUDE: "1.37", LONGITUDE: "103.84", SEARCHVAL: "MAYFLOWER MRT" }],
        });
      },
    });

    const first = await client.search("Mayflower MRT");
    const second = await client.search(" mayflower   mrt ");
    const third = await client.search("MAYFLOWER MRT");

    expect(first.results[0]?.POSTAL).toBe("560234");
    expect(second).toBe(first);
    expect(third).toBe(first);
    expect(calls).toBe(1);
  });

  it("deduplicates concurrent identical requests", async () => {
    let calls = 0;
    const client = createOneMapSearchClient({
      storage: null,
      fetcher: async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return response({ found: 0, results: [] });
      },
    });

    await Promise.all([client.search("bishan mrt"), client.search("BISHAN   MRT")]);

    expect(calls).toBe(1);
  });

  it("reuses successful searches across client instances for one week", async () => {
    let calls = 0;
    const storage = storageFixture();
    const fetcher = async () => {
      calls += 1;
      return response({
        found: 1,
        results: [{ POSTAL: "560234", BUILDING: "Mayflower", ROAD_NAME: "", LATITUDE: "1.37", LONGITUDE: "103.84", SEARCHVAL: "MAYFLOWER MRT" }],
      });
    };

    const firstClient = createOneMapSearchClient({ storage, fetcher, nowMs: () => 1_000 });
    const secondClient = createOneMapSearchClient({ storage, fetcher, nowMs: () => 1_000 + 60_000 });

    const first = await firstClient.search("Mayflower MRT");
    const second = await secondClient.search("mayflower mrt");

    expect(first.results[0]?.POSTAL).toBe("560234");
    expect(second.results[0]?.POSTAL).toBe("560234");
    expect(calls).toBe(1);
  });

  it("refreshes stale persisted searches after one week", async () => {
    let calls = 0;
    const stalePayload = {
      cached_at: 1_000,
      payload: { found: 1, results: [{ POSTAL: "000000" }] },
    };
    const storage = storageFixture({
      "shiok:onemap-search:v2:MAYFLOWER MRT": JSON.stringify(stalePayload),
    });
    const client = createOneMapSearchClient({
      storage,
      nowMs: () => 1_000 + 604_800_001,
      fetcher: async () => {
        calls += 1;
        return response({
          found: 1,
          results: [{ POSTAL: "560234", BUILDING: "Mayflower", ROAD_NAME: "", LATITUDE: "1.37", LONGITUDE: "103.84", SEARCHVAL: "MAYFLOWER MRT" }],
        });
      },
    });

    const payload = await client.search("Mayflower MRT");

    expect(payload.results[0]?.POSTAL).toBe("560234");
    expect(calls).toBe(1);
  });

  it("caps persisted searches and prunes stale entries before writing", async () => {
    const initial: Record<string, string> = {
      unrelated: "keep",
      "shiok:onemap-search:v2:STALE": JSON.stringify({
        cached_at: 1_000,
        payload: { found: 1, results: [{ POSTAL: "000000" }] },
      }),
    };
    for (let index = 0; index < 50; index += 1) {
      initial[`shiok:onemap-search:v2:QUERY ${index}`] = JSON.stringify({
        cached_at: 10_000 + index,
        payload: { found: 1, results: [{ POSTAL: `${100000 + index}` }] },
      });
    }
    const storage = storageFixture(initial);
    const client = createOneMapSearchClient({
      storage,
      nowMs: () => 1_000 + 604_800_001,
      fetcher: async () =>
        response({
          found: 1,
          results: [{ POSTAL: "560234", BUILDING: "Mayflower", ROAD_NAME: "", LATITUDE: "1.37", LONGITUDE: "103.84", SEARCHVAL: "MAYFLOWER MRT" }],
        }),
    });

    await client.search("Mayflower MRT");

    const cacheKeys = Array.from(storage.values.keys()).filter((key) => key.startsWith("shiok:onemap-search:v2:"));
    expect(cacheKeys).toHaveLength(50);
    expect(storage.values.has("shiok:onemap-search:v2:STALE")).toBe(false);
    expect(storage.values.has("shiok:onemap-search:v2:QUERY 0")).toBe(false);
    expect(storage.values.has("shiok:onemap-search:v2:MAYFLOWER MRT")).toBe(true);
    expect(storage.values.has("unrelated")).toBe(true);
  });
});
