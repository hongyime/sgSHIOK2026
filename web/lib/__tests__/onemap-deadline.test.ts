import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as routeGet } from "../../app/api/onemap-route/route";
import { GET as searchGet } from "../../app/api/onemap-search/route";
import { getOneMapToken, resetOneMapTokenCacheForTest } from "../../app/api/onemap";

const handlers = [
  { name: "route", get: routeGet, url: "onemap-route?startLat=1.28&startLng=103.86&endLat=1.281&endLng=103.861", body: { route_geometry: "abc", route_summary: { total_distance: 10 } } },
  { name: "search", get: searchGet, url: "onemap-search?searchVal=018956", body: { found: 1, results: [{ POSTAL: "018956" }] } },
];
let requestId = 0;
function request(url: string, signal?: AbortSignal) {
  return new Request(`https://example.test/api/${url}`, { signal, headers: { "x-real-ip": `deadline-${++requestId}` } }) as never;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function watch(promise: Promise<Response>) {
  const result: { response?: Response } = {};
  void promise.then((response) => { result.response = response; });
  return result;
}
function noStore(response: Response) {
  for (const key of ["cache-control", "cdn-cache-control", "vercel-cdn-cache-control"]) {
    expect(response.headers.get(key)).toBe("no-store");
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("ONEMAP_EMAIL", "");
  vi.stubEnv("ONEMAP_PASSWORD", "");
  resetOneMapTokenCacheForTest();
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetOneMapTokenCacheForTest();
});

describe.each(handlers)("OneMap $name total provider deadline", ({ get, url, body }) => {
  it.each(["headers", "body", "auth headers", "auth body"])("bounds stalled %s even when transport ignores abort", async (phase) => {
    if (phase.startsWith("auth")) {
      vi.stubEnv("ONEMAP_EMAIL", "fixture@example.test");
      vi.stubEnv("ONEMAP_PASSWORD", "fixture-only");
    }
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) => phase.endsWith("headers")
      ? new Promise<Response>(() => {})
      : Promise.resolve({ ok: true, status: 200, json: () => new Promise(() => {}) } as Response));
    vi.stubGlobal("fetch", fetchMock);
    const observed = watch(get(request(url)));
    await vi.advanceTimersByTimeAsync(9_999);
    expect(observed.response).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(observed.response?.status).toBe(504);
    noStore(observed.response!);
    expect(await observed.response!.json()).toMatchObject({ code: "provider_timeout" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does no provider work for a disconnected caller", async () => {
    const caller = new AbortController();
    caller.abort();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await get(request(url, caller.signal));
    expect(response.status).toBe(499);
    noStore(response);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("aborts provider work immediately on caller disconnect", async () => {
    const caller = new AbortController();
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    const observed = watch(get(request(url, caller.signal)));
    await vi.advanceTimersByTimeAsync(0);
    caller.abort();
    await vi.advanceTimersByTimeAsync(0);
    expect(observed.response?.status).toBe(499);
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps successful caching and removes deadline/listener after completion", async () => {
    const caller = new AbortController();
    const req = request(url, caller.signal) as Request;
    const remove = vi.spyOn(req.signal, "removeEventListener");
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(Response.json(body)));
    vi.stubGlobal("fetch", fetchMock);
    const response = await get(req as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=604800");
    expect(vi.getTimerCount()).toBe(0);
    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
    const providerSignal = fetchMock.mock.calls[0][1]?.signal;
    expect(providerSignal?.aborted).toBe(false);
    caller.abort();
    expect(providerSignal?.aborted).toBe(false);
  });

  it("does not cache a late token or begin routing/search after timeout", async () => {
    vi.stubEnv("ONEMAP_EMAIL", "fixture@example.test");
    vi.stubEnv("ONEMAP_PASSWORD", "fixture-only");
    const late = deferred<{ access_token: string }>();
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: () => late.promise });
    vi.stubGlobal("fetch", fetchMock);
    const observed = watch(get(request(url)));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(observed.response?.status).toBe(504);
    late.resolve({ access_token: "late-token" });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValueOnce(Response.json({ access_token: "fresh-token" }));
    expect(await getOneMapToken("fixture")).toBe("fresh-token");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("uses the original deadline across auth and the single 401 retry", async () => {
    vi.stubEnv("ONEMAP_EMAIL", "fixture@example.test");
    vi.stubEnv("ONEMAP_PASSWORD", "fixture-only");
    const first = deferred<Response>();
    const retry = deferred<Response>();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ access_token: "token1" }))
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce(Response.json({ access_token: "token2" }))
      .mockImplementationOnce(() => retry.promise);
    vi.stubGlobal("fetch", fetchMock);
    const observed = watch(get(request(url)));
    await vi.advanceTimersByTimeAsync(8_000);
    first.resolve(new Response(null, { status: 401 }));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(observed.response?.status).toBe(504);
    const signals = fetchMock.mock.calls.map((call) => call[1].signal);
    expect(new Set(signals).size).toBe(1);
    expect(signals[0].aborted).toBe(true);
    retry.resolve(new Response(null, { status: 401 }));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("marks transient upstream failures noncacheable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    const response = await get(request(url));
    expect(response.status).toBe(503);
    noStore(response);
  });

  it("cancels unconsumed upstream error bodies without waiting for cleanup", async () => {
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: "Unavailable", body: { cancel } }));
    const response = await get(request(url));
    expect(response.status).toBe(503);
    expect(cancel).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not consume a late response or retry a late 401", async () => {
    const late = deferred<Response>();
    const fetchMock = vi.fn(() => late.promise);
    vi.stubGlobal("fetch", fetchMock);
    const observed = watch(get(request(url)));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(observed.response?.status).toBe(504);
    const json = vi.fn();
    late.resolve({ status: 401, json } as unknown as Response);
    await vi.advanceTimersByTimeAsync(0);
    expect(json).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
