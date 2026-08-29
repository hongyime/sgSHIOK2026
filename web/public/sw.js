const CACHE_NAME = "sgshiok-static-v1";
const CACHEABLE_EXACT_PATHS = new Set([
  "/",
  "/icon.svg",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/robots.txt",
  "/sitemap.xml",
  "/site.webmanifest",
  "/manifest.json",
]);
const CACHEABLE_PREFIXES = ["/_next/static/", "/data/"];
const CACHE_MAX_AGE_MS = new Map([
  ["/", 604_800_000],
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

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isCacheableRequest(request)) return;
  const cacheKey = request.mode === "navigate" ? "/" : request;

  event.respondWith(
    caches.match(cacheKey).then((cached) => {
      if (cached && isFreshEnough(cached, cacheMaxAgeMs(cacheKey))) return cached;
      return fetchAndCache(cacheKey);
    }),
  );
});
