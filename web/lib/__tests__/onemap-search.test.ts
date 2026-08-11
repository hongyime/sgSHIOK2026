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
});
