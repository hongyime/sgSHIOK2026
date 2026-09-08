import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.useRealTimers());

const ORIGIN = "https://shiok.test";
const workerSource = readFileSync(resolve(__dirname, "../../public/sw.js"), "utf8");
type CacheInput = Request | string;
type Fault = "throw" | "reject";
type Operation = "open" | "match" | "put";
type WorkerEvent = {
  request?: Request;
  respondWith: (response: Promise<Response>) => void;
  waitUntil: (work: Promise<unknown>) => void;
};

function urlOf(input: CacheInput) {
  return new URL(typeof input === "string" ? input : input.url, ORIGIN).href;
}

function html(release: string) {
  return new Response(`<html><script src="/_next/static/${release}/app.js"></script>${release}</html>`, {
    headers: { "content-type": "text/html", date: new Date().toUTCString() },
  });
}

function navigation(path = "/") {
  const request = new Request(new URL(path, ORIGIN));
  // Node forbids constructing mode=navigate; all other Request behavior is native.
  Object.defineProperty(request, "mode", { value: "navigate" });
  return request;
}

function deferred() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

function createWorker() {
  const stores = new Map<string, Map<string, Response>>();
  const faults = new Map<Operation, Fault>();
  const reads: string[] = [];
  const opened: string[] = [];
  const deleted: string[] = [];
  const networkCalls: Request[] = [];
  const browserHttpCache = new Map<string, Response>();
  const listeners = new Map<string, (event: WorkerEvent) => void>();
  const lifetime: Promise<unknown>[] = [];
  const controls = {
    fetch: async (_request: Request): Promise<Response> => html("A"),
    putGate: undefined as Promise<void> | undefined,
    matchGate: undefined as Promise<void> | undefined,
  };
  let claims = 0;
  let originEnumerations = 0;

  function operation<T>(name: Operation, run: () => T | Promise<T>): Promise<T> {
    if (faults.get(name) === "throw") throw new Error(`${name}: synchronous storage failure`);
    if (faults.get(name) === "reject") {
      return Promise.reject(new DOMException(`${name}: storage unavailable`, "QuotaExceededError"));
    }
    return Promise.resolve(run());
  }

  function cache(name: string) {
    if (!stores.has(name)) stores.set(name, new Map());
    const entries = stores.get(name)!;
    return {
      match(input: CacheInput) {
        reads.push(name);
        return operation("match", async () => {
          if (controls.matchGate) await controls.matchGate;
          return entries.get(urlOf(input))?.clone();
        });
      },
      put(input: CacheInput, response: Response) {
        return operation("put", async () => {
          const snapshot = response.clone();
          if (controls.putGate) await controls.putGate;
          entries.set(urlOf(input), snapshot);
        });
      },
      keys() { return Promise.resolve([...entries.keys()].map((url) => new Request(url))); },
    };
  }

  const cacheStorage = {
    open(name: string) {
      opened.push(name);
      return operation("open", () => cache(name));
    },
    match(input: CacheInput, options?: { cacheName?: string }) {
      return operation("match", async () => {
        const names = options?.cacheName ? [options.cacheName] : [...stores.keys()];
        for (const name of names) {
          const response = await cache(name).match(input);
          if (response) return response;
        }
        return undefined;
      });
    },
    keys() { originEnumerations += 1; return Promise.resolve([...stores.keys()]); },
    delete(name: string) { deleted.push(name); return Promise.resolve(stores.delete(name)); },
  };

  runInNewContext(workerSource, {
    URL, Request, Response, Headers, DOMException, AbortController, setTimeout, clearTimeout, console,
    caches: cacheStorage,
    self: {
      location: { origin: ORIGIN },
      addEventListener: (name: string, listener: (event: WorkerEvent) => void) => listeners.set(name, listener),
      skipWaiting: () => Promise.resolve(),
      clients: { claim: () => { claims += 1; return Promise.resolve(); } },
    },
    fetch: async (input: CacheInput, init?: RequestInit) => {
      const request = new Request(typeof input === "string" ? urlOf(input) : input, init);
      networkCalls.push(request);
      const staleBrowserResponse = browserHttpCache.get(request.url);
      if (staleBrowserResponse && !["no-store", "reload", "no-cache"].includes(request.cache)) {
        return staleBrowserResponse.clone();
      }
      return controls.fetch(request);
    },
  }, { filename: "web/public/sw.js" });

  function dispatch(name: string, request?: Request) {
    let response: Promise<Response> | undefined;
    const track = (work: Promise<unknown>) => {
      const promise = Promise.resolve(work);
      void promise.catch(() => undefined);
      lifetime.push(promise);
    };
    listeners.get(name)?.({
      request,
      waitUntil: track,
      respondWith: (work) => {
        response = Promise.resolve(work);
        void response.catch(() => undefined);
      },
    });
    return { response };
  }

  return {
    controls, faults, reads, opened, deleted, networkCalls, browserHttpCache, stores,
    get claims() { return claims; },
    get originEnumerations() { return originEnumerations; },
    dispatch,
    async request(request: Request) {
      const event = dispatch("fetch", request);
      if (!event.response) throw new Error(`Expected worker interception: ${request.url}`);
      return event.response;
    },
    async settle() {
      const outcomes = await Promise.allSettled(lifetime);
      const failures = outcomes.filter((outcome) => outcome.status === "rejected");
      expect(failures, "optional cache work must not reject event lifetime").toEqual([]);
    },
    seed(name: string, path: string, response: Response) {
      if (!stores.has(name)) stores.set(name, new Map());
      stores.get(name)!.set(urlOf(path), response.clone());
    },
  };
}

describe("service worker release behavior (executed worker, synthetic transport)", () => {
  it("replaces cached A HTML with online B, bypasses browser HTTP cache, then falls back to B offline", async () => {
    const worker = createWorker();
    expect(await (await worker.request(navigation())).text()).toContain("static/A/app.js");
    await worker.settle();
    worker.browserHttpCache.set(`${ORIGIN}/`, html("A"));
    worker.controls.fetch = async () => html("B");

    expect(await (await worker.request(navigation())).text()).toContain("static/B/app.js");
    expect(worker.networkCalls).toHaveLength(2);
    expect(["no-store", "reload", "no-cache"]).toContain(worker.networkCalls[1].cache);
    await worker.settle();
    worker.browserHttpCache.clear();
    worker.controls.fetch = async () => { throw new TypeError("offline"); };
    expect(await (await worker.request(navigation())).text()).toContain("static/B/app.js");
    await worker.settle();
  });

  it("serves current shared-postal HTML online and preserves it for offline revisit", async () => {
    const worker = createWorker();
    const request = navigation("/?postal=018956");
    expect(await (await worker.request(request)).text()).toContain("static/A/app.js");
    await worker.settle();
    worker.controls.fetch = async () => html("B");
    expect(await (await worker.request(request)).text()).toContain("static/B/app.js");
    expect(worker.networkCalls.every((call) => call.url === request.url)).toBe(true);
    await worker.settle();
    expect([...worker.stores.values()].flatMap((entries) => [...entries.keys()]).some((url) => url.includes("postal="))).toBe(false);
    worker.controls.fetch = async () => { throw new TypeError("offline"); };
    expect(await (await worker.request(request)).text()).toContain("static/B/app.js");
  });

  it.each([404, 503])("retains successful HTML when navigation returns HTTP %s", async (status) => {
    const worker = createWorker();
    await worker.request(navigation());
    await worker.settle();
    worker.controls.fetch = async () => new Response("failed release", { status });
    const failure = await worker.request(navigation());
    expect(worker.networkCalls).toHaveLength(2);
    // A non-OK network response may be returned or replaced with cached HTML;
    // neither policy may overwrite the last successful offline document.
    if (failure.ok) expect(await failure.text()).toContain("static/A/app.js");
    else expect(failure.status).toBe(status);
    await worker.settle();
    worker.controls.fetch = async () => { throw new TypeError("offline"); };
    expect(await (await worker.request(navigation())).text()).toContain("static/A/app.js");
  });

  it("does not conceal a first navigation's non-OK response when no fallback exists", async () => {
    const worker = createWorker();
    worker.controls.fetch = async () => new Response("unavailable", { status: 503 });
    const response = await worker.request(navigation());
    expect(response.status).toBe(503);
    expect(await response.text()).toBe("unavailable");
    await worker.settle();
    expect([...worker.stores.values()].every((entries) => entries.size === 0)).toBe(true);
  });

  it("new HTML requests the new chunk when old release chunks have disappeared", async () => {
    const worker = createWorker();
    await worker.request(navigation());
    await worker.settle();
    worker.controls.fetch = async (request) => {
      const path = new URL(request.url).pathname;
      if (path === "/") return html("B");
      if (path === "/_next/static/B/app.js") return new Response("window.release = 'B';");
      return new Response("old chunk removed", { status: 404 });
    };
    const document = await (await worker.request(navigation())).text();
    const chunkPath = /src="([^"]+)"/.exec(document)?.[1];
    expect(chunkPath).toBe("/_next/static/B/app.js");
    const chunk = await worker.request(new Request(new URL(chunkPath!, ORIGIN)));
    expect(chunk.status).toBe(200);
    expect(await chunk.text()).toContain("release = 'B'");
    expect(worker.networkCalls.some((request) => request.url.includes("/static/A/"))).toBe(false);
  });

  it.each(["open", "match", "put"] as const)("a rejected %s cannot replace successful online HTML with a failure", async (operation) => {
    const worker = createWorker();
    worker.controls.fetch = async () => html("B");
    worker.faults.set(operation, "reject");
    expect(await (await worker.request(navigation())).text()).toContain("static/B/app.js");
    await worker.settle();
  });

  it.each(["open", "match", "put"] as const)("a synchronous %s failure cannot break successful online HTML", async (operation) => {
    const worker = createWorker();
    worker.controls.fetch = async () => html("B");
    worker.faults.set(operation, "throw");
    expect(await (await worker.request(navigation())).text()).toContain("static/B/app.js");
    await worker.settle();
  });

  it.each(["/data/version-A/scores/01.json", "/_next/static/build-A/app.js"])("keeps unchanged immutable %s cache-first", async (path) => {
    const worker = createWorker();
    worker.controls.fetch = async () => new Response("immutable A", { headers: { date: "Mon, 01 Jan 2001 00:00:00 GMT" } });
    const request = new Request(new URL(path, ORIGIN));
    expect(await (await worker.request(request)).text()).toBe("immutable A");
    await worker.settle();
    worker.controls.fetch = async () => { throw new Error("immutable cache hit must not fetch"); };
    expect(await (await worker.request(request)).text()).toBe("immutable A");
    expect(worker.networkCalls).toHaveLength(1);
  });

  it.each(["open", "match", "put"] as const)("optional immutable cache %s rejection does not lose a network chunk", async (operation) => {
    const worker = createWorker();
    worker.controls.fetch = async () => new Response("current chunk");
    worker.faults.set(operation, "reject");
    expect(await (await worker.request(new Request(`${ORIGIN}/_next/static/B/app.js`))).text()).toBe("current chunk");
    await worker.settle();
  });

  it.each([
    ["API", "/api/onemap?postal=018956", {}],
    ["external", "https://tiles.example.test/data/tile.json", {}],
    ["POST", "/data/version-A/item.json", { method: "POST", body: "test" }],
    ["RSC header", "/", { headers: { RSC: "1" } }],
    ["RSC query", "/?_rsc=abc", {}],
    ["Next router prefetch", "/", { headers: { "Next-Router-Prefetch": "1" } }],
    ["Purpose prefetch", "/", { headers: { Purpose: "prefetch" } }],
    ["Sec-Purpose prefetch", "/", { headers: { "Sec-Purpose": "prefetch;prerender" } }],
    ["Sec-Purpose asset prefetch", "/_next/static/A/map.js", { headers: { "Sec-Purpose": "prefetch;prerender" } }],
    ["Range asset", "/_next/static/A/map.js", { headers: { Range: "bytes=0-5" } }],
  ] as [string, string, RequestInit][])("leaves %s requests to the browser without touching any cache", (_name, path, init) => {
    const worker = createWorker();
    const request = new Request(new URL(path, ORIGIN), init);
    expect(worker.dispatch("fetch", request).response).toBeUndefined();
    expect(worker.opened).toEqual([]);
    expect(worker.reads).toEqual([]);
    expect(worker.networkCalls).toEqual([]);
    expect(worker.originEnumerations).toBe(0);
  });

  it("never searches an unrelated origin cache for HTML or chunks", async () => {
    const worker = createWorker();
    worker.seed("another-app-v1", "/", html("FOREIGN"));
    worker.seed("another-app-v1", "/_next/static/B/app.js", new Response("foreign chunk"));
    worker.controls.fetch = async (request) => new URL(request.url).pathname === "/" ? html("B") : new Response("own chunk");
    expect(await (await worker.request(navigation())).text()).toContain("static/B/app.js");
    expect(await (await worker.request(new Request(`${ORIGIN}/_next/static/B/app.js`))).text()).toBe("own chunk");
    expect(worker.reads).not.toContain("another-app-v1");
    expect(worker.opened).not.toContain("another-app-v1");
    expect(worker.originEnumerations).toBe(0);
  });

  it("activation preserves existing immutable, foreign and unknown/future caches", async () => {
    const worker = createWorker();
    const keep = ["sgshiok-static-v1", "other-app-v1", "sgshiok-static-v999", "sgshiok-shell-v999", "sgshiok-owner-notes", "sgshiok-unrelated-tool"];
    for (const name of keep) worker.seed(name, "/", html(name));
    worker.dispatch("activate");
    await worker.settle();
    for (const name of keep) expect(worker.stores.has(name), name).toBe(true);
    expect(worker.deleted).toEqual([]);
    expect(worker.claims).toBe(1);
  });

  it("uses the existing immutable cache without consulting its obsolete root HTML", async () => {
    const worker = createWorker();
    worker.seed("sgshiok-static-v1", "/", html("STALE-A"));
    worker.seed("sgshiok-static-v1", "/_next/static/A/app.js", new Response("old tab chunk"));
    worker.controls.fetch = async (request) => {
      if (new URL(request.url).pathname === "/") return html("B");
      throw new Error("old chunk is no longer on the server");
    };
    expect(await (await worker.request(navigation())).text()).toContain("static/B/app.js");
    expect(worker.reads).not.toContain("sgshiok-static-v1");
    expect(await (await worker.request(new Request(`${ORIGIN}/_next/static/A/app.js`))).text()).toBe("old tab chunk");
    expect(worker.networkCalls).toHaveLength(1);
    await worker.settle();
    expect(await worker.stores.get("sgshiok-static-v1")!.get(`${ORIGIN}/`)!.clone().text()).toContain("STALE-A");
  });

  it("overlapping chunk cache writes retain each response without consuming its body", async () => {
    const worker = createWorker();
    const gate = deferred();
    worker.controls.putGate = gate.promise;
    worker.controls.fetch = async (request) => new Response(new URL(request.url).pathname);
    const paths = ["/_next/static/B/app.js", "/_next/static/B/map.js"];
    const responses = paths.map((path) => worker.request(new Request(new URL(path, ORIGIN))));
    // Hold cache work across both requests, then let writes finish in the same turn.
    await Promise.resolve();
    await Promise.resolve();
    gate.release();
    expect(await Promise.all(responses.map(async (response) => (await response).text()))).toEqual(paths);
    await worker.settle();
    worker.controls.fetch = async () => { throw new Error("cached concurrent chunks must survive offline"); };
    for (const path of paths) {
      expect(await (await worker.request(new Request(new URL(path, ORIGIN)))).text()).toBe(path);
    }
    expect(worker.networkCalls).toHaveLength(2);
  });

  it("a slow earlier navigation cannot replace the latest offline shell", async () => {
    const worker = createWorker();
    const earlier = deferred();
    worker.controls.fetch = async (request) => {
      if (new URL(request.url).search === "?postal=018956") {
        await earlier.promise;
        return html("A");
      }
      return html("B");
    };
    const old = worker.request(navigation("/?postal=018956"));
    expect(await (await worker.request(navigation())).text()).toContain("static/B/app.js");
    earlier.release();
    expect(await (await old).text()).toContain("static/A/app.js");
    await worker.settle();
    worker.controls.fetch = async () => { throw new TypeError("offline"); };
    expect(await (await worker.request(navigation())).text()).toContain("static/B/app.js");
  });

  it("preserves an earlier success when the newer concurrent navigation fails", async () => {
    const worker = createWorker();
    const gate = deferred();
    worker.controls.fetch = async (request) => {
      if (new URL(request.url).search) { await gate.promise; return html("A"); }
      return new Response("failed B", { status: 503 });
    };
    const older = worker.request(navigation("/?postal=018956"));
    expect((await worker.request(navigation())).status).toBe(503);
    gate.release();
    await older;
    await worker.settle();
    worker.controls.fetch = async () => { throw new TypeError("offline"); };
    expect(await (await worker.request(navigation())).text()).toContain("static/A/app.js");
  });

  it.each([false, true])("only aborts a slow navigation when offline HTML exists: %s", async (cached) => {
    vi.useFakeTimers();
    const worker = createWorker();
    if (cached) {
      await worker.request(navigation());
      await worker.settle();
    }
    const gate = deferred();
    let signal!: AbortSignal;
    worker.controls.fetch = request => {
      signal = request.signal;
      return new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(new DOMException("Timeout", "AbortError")));
        void gate.promise.then(() => resolve(html("B")));
      });
    };
    const response = worker.request(navigation());
    await vi.advanceTimersByTimeAsync(10001);
    expect(signal.aborted).toBe(cached);
    gate.release();
    expect(await (await response).text()).toContain(cached ? "static/A/app.js" : "static/B/app.js");
    await worker.settle();
  });

  it.each(["private", "no-store"])("never stores %s HTML as the shared offline shell", async (policy) => {
    const worker = createWorker();
    worker.controls.fetch = async () => new Response("private document", {
      headers: { "Content-Type": "text/html", "Cache-Control": policy },
    });
    expect(await (await worker.request(navigation())).text()).toBe("private document");
    await worker.settle();
    expect([...worker.stores.values()].every(entries => entries.size === 0)).toBe(true);
  });

  it("a timeout queued behind cache lookup cannot abort a returned network body", async () => {
    vi.useFakeTimers();
    const worker = createWorker();
    await worker.request(navigation());
    await worker.settle();
    const cacheRead = deferred(), networkHeaders = deferred();
    worker.controls.matchGate = cacheRead.promise;
    let signal!: AbortSignal;
    worker.controls.fetch = async request => {
      signal = request.signal;
      await networkHeaders.promise;
      return html("B");
    };
    const request = worker.request(navigation());
    await vi.advanceTimersByTimeAsync(10001);
    networkHeaders.release();
    const response = await request;
    expect(signal.aborted).toBe(false);
    cacheRead.release();
    await vi.advanceTimersByTimeAsync(1);
    expect(signal.aborted).toBe(false);
    expect(await response.text()).toContain("static/B/app.js");
    await worker.settle();
  });

  it("deduplicates simultaneous immutable reads without consuming either response", async () => {
    const worker = createWorker();
    const gate = deferred();
    worker.controls.fetch = async () => { await gate.promise; return new Response("same chunk"); };
    const request = new Request(`${ORIGIN}/_next/static/B/map.js`);
    const first = worker.request(request);
    const second = worker.request(request);
    gate.release();
    expect(await Promise.all([first, second].map(async response => (await response).text()))).toEqual(["same chunk", "same chunk"]);
    expect(worker.networkCalls).toHaveLength(1);
    await worker.settle();
  });
});
