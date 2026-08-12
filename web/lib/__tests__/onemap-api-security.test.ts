import { describe, expect, it } from "vitest";

import { GET as searchGet } from "../../app/api/onemap-search/route";
import {
  checkThrottle,
  parseClientIp,
  type ThrottleRecord,
} from "../../app/api/onemap";

describe("OneMap API security helpers", () => {
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
