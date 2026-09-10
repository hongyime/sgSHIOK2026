const CACHE_NAME = "sgshiok-static-v1";
const SHELL_CACHE_NAME = "sgshiok-shell-v2";
const SHELL_CACHE_KEY = new URL("/", self.location.origin).href;
const inFlight = new Map();
let navigationSequence = 0;
let latestSuccessfulNavigation = 0;
let shellWrite = Promise.resolve();
const CACHEABLE_EXACT_PATHS = new Set([
  "/icon.svg",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/robots.txt",
  "/sitemap.xml",
  "/site.webmanifest",
  "/manifest.json",
]);
const CACHEABLE_PREFIXES = ["/_next/static/", "/data/", "/maplibre/6.1.0/", "/maplibre/6.4.1/"];
const CACHE_MAX_AGE_MS = new Map([
  ["/robots.txt", 604_800_000],
  ["/sitemap.xml", 604_800_000],
  ["/site.webmanifest", 604_800_000],
  ["/manifest.json", 604_800_000],
]);

function isCacheableRequest(request) {
  if (request.method !== "GET") return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  if (request.headers.has("RSC") || request.headers.has("Next-Router-Prefetch") ||
      request.headers.get("Purpose") === "prefetch" || request.headers.get("Sec-Purpose")?.includes("prefetch") || url.searchParams.has("_rsc") ||
      request.headers.has("Range")) return false;
  if (url.pathname === "/") return request.mode === "navigate";

  return CACHEABLE_EXACT_PATHS.has(url.pathname) || CACHEABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

function cacheMaxAgeMs(request) {
  const url = new URL(request.url, self.location.origin);
  if (CACHEABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return Infinity;
  if (
    url.pathname === "/icon.svg" ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/apple-touch-icon.png" ||
    url.pathname === "/apple-touch-icon-precomposed.png"
  ) {
    return Infinity;
  }
  return CACHE_MAX_AGE_MS.get(url.pathname) ?? 0;
}

function isFreshEnough(response, maxAgeMs) {
  if (maxAgeMs === Infinity) return true;
  const cachedAt = Date.parse(response.headers.get("date") || "");
  if (!Number.isFinite(cachedAt)) return false;
  return Date.now() - cachedAt < maxAgeMs;
}

async function readCache(name, key) {
  try {
    return await (await caches.open(name)).match(key);
  } catch {
    return undefined;
  }
}

async function writeCache(name, key, response) {
  try {
    await (await caches.open(name)).put(key, response);
  } catch {
    // Storage/quota failures must never turn a successful fetch into an error.
  }
}

function canStore(response) {
  return response.status === 200 && !/\b(no-store|private)\b/i.test(response.headers.get("Cache-Control") || "");
}

async function navigationResponse(event) {
  const sequence = ++navigationSequence;
  const controller = new AbortController();
  let settled = false;
  const fallback = readCache(SHELL_CACHE_NAME, SHELL_CACHE_KEY);
  const timer = setTimeout(() => {
    // A slow first visit must not be aborted when there is nothing to show offline.
    void fallback.then(cached => { if (cached && !settled) controller.abort(); });
  }, 10000);
  try {
    const response = await fetch(event.request, { cache: "no-cache", signal: controller.signal });
    if (response.ok) {
      if (canStore(response) && response.headers.get("Content-Type")?.includes("text/html")) {
        const copy = response.clone();
        latestSuccessfulNavigation = Math.max(latestSuccessfulNavigation, sequence);
        // Serialize shell writes so a slow previous navigation cannot overwrite a newer one.
        shellWrite = shellWrite.then(() => sequence === latestSuccessfulNavigation
          ? writeCache(SHELL_CACHE_NAME, SHELL_CACHE_KEY, copy) : undefined);
        event.waitUntil(shellWrite);
      }
      return response;
    }
    return (await fallback) || response;
  } catch (error) {
    const cached = await fallback;
    if (cached) return cached;
    throw error;
  } finally {
    settled = true;
    clearTimeout(timer);
  }
}

async function assetResponse(event) {
  const request = event.request;
  const cached = await readCache(CACHE_NAME, request);
  if (cached && isFreshEnough(cached, cacheMaxAgeMs(request))) return cached;
  const key = `${request.cache === "only-if-cached" ? "cache-only" : "network-allowed"}:${request.url}`;
  let pending = inFlight.get(key);
  if (!pending) {
    pending = fetch(request).then(response => {
      if (canStore(response)) event.waitUntil(writeCache(CACHE_NAME, request, response.clone()));
      return response;
    }).finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  try {
    const response = (await pending).clone();
    return !response.ok && cached ? cached : response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      // Keep immutable assets used by already-open tabs and leave unrelated applications alone.
      .then((keys) => Promise.all(keys.filter((key) => key === "sgshiok-shell-v1").map((key) => caches.delete(key))))
      .catch(() => undefined)
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isCacheableRequest(request)) return;
  event.respondWith(request.mode === "navigate" ? navigationResponse(event) : assetResponse(event));
});
