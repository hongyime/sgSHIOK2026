import { describe, expect, it } from "vitest";

import { GET as routeGet } from "../../app/api/onemap-route/route";
import { GET as searchGet } from "../../app/api/onemap-search/route";
import {
  checkThrottle,
  parseClientIp,
  type ThrottleRecord,
} from "../../app/api/onemap";

describe("OneMap API security helpers", () => {
  it("marks successful OneMap search proxy responses cacheable", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          found: 1,
          results: [
            {
              POSTAL: "560231",
              BUILDING: "Example",
              ROAD_NAME: "",
              LATITUDE: "1.37",
              LONGITUDE: "103.84",
              SEARCHVAL: "EXAMPLE",
            },
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )) as typeof fetch;

    try {
      const request = new Request("https://example.test/api/onemap-search?searchVal=560231", {
        headers: { "x-real-ip": "203.0.113.211" },
      });
      const response = await searchGet(request as never);

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("public, max-age=604800");
      expect(response.headers.get("cdn-cache-control")).toBe("public, s-maxage=604800, stale-while-revalidate=2592000");
      expect(response.headers.get("vercel-cdn-cache-control")).toBe(
        "public, s-maxage=604800, stale-while-revalidate=2592000"
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("marks successful OneMap route proxy responses cacheable", async () => {
    const originalFetch = globalThis.fetch;
    const originalEmail = process.env.ONEMAP_EMAIL;
    const originalPassword = process.env.ONEMAP_PASSWORD;
    delete process.env.ONEMAP_EMAIL;
    delete process.env.ONEMAP_PASSWORD;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          route_geometry: "u|qxAcm}xR??",
          route_summary: { total_distance: 42, total_time: 60 },
          status_message: "Found route",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )) as typeof fetch;

    try {
      const request = new Request(
        "https://example.test/api/onemap-route?startLat=1.37&startLng=103.84&endLat=1.371&endLng=103.841",
        { headers: { "x-real-ip": "203.0.113.212" } }
      );
      const response = await routeGet(request as never);

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("public, max-age=604800");
      expect(response.headers.get("cdn-cache-control")).toBe("public, s-maxage=604800, stale-while-revalidate=2592000");
      expect(response.headers.get("vercel-cdn-cache-control")).toBe(
        "public, s-maxage=604800, stale-while-revalidate=2592000"
      );
    } finally {
      if (originalEmail === undefined) {
        delete process.env.ONEMAP_EMAIL;
      } else {
        process.env.ONEMAP_EMAIL = originalEmail;
      }
      if (originalPassword === undefined) {
        delete process.env.ONEMAP_PASSWORD;
      } else {
        process.env.ONEMAP_PASSWORD = originalPassword;
      }
      globalThis.fetch = originalFetch;
    }
  });

  it("rate limits spoofed forwarded prefixes at the actual search route", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ found: 0, results: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as typeof fetch;

    try {
      let lastStatus = 0;
      for (let index = 0; index < 31; index += 1) {
        const request = new Request("https://example.test/api/onemap-search?searchVal=560231", {
          headers: {
            "x-forwarded-for": `198.51.100.${index}, 203.0.113.44`,
          },
        });
        const response = await searchGet(request as never);
        lastStatus = response.status;
      }

      expect(lastStatus).toBe(429);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses the trusted final forwarded IP so spoofed prefixes share one throttle bucket", () => {
    const first = new Headers({ "x-forwarded-for": "198.51.100.7, 203.0.113.9" });
    const second = new Headers({ "x-forwarded-for": "198.51.100.8, 203.0.113.9" });

    expect(parseClientIp(first)).toBe("203.0.113.9");
    expect(parseClientIp(second)).toBe("203.0.113.9");

    const buckets = new Map<string, ThrottleRecord>();
    expect(checkThrottle(buckets, parseClientIp(first), 1, 1_000).limited).toBe(false);
    expect(checkThrottle(buckets, parseClientIp(second), 1, 1_001).limited).toBe(true);
    expect(buckets.size).toBe(1);
  });

  it("evicts expired and least-recent throttle buckets so distinct keys cannot grow unbounded", () => {
    const buckets = new Map<string, ThrottleRecord>();
    for (let index = 0; index < 2_100; index += 1) {
      checkThrottle(buckets, `203.0.113.${index}`, 30, 10_000 + index);
    }

    expect(buckets.size).toBeLessThanOrEqual(2_000);

    checkThrottle(buckets, "198.51.100.1", 30, 90_000);
    expect(buckets.size).toBe(1);
  });
});
