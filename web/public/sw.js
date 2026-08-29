const CACHE_NAME = "sgshiok-static-v1";
const CACHEABLE_EXACT_PATHS = new Set(["/", "/icon.svg", "/robots.txt", "/sitemap.xml"]);
const CACHEABLE_PREFIXES = ["/_next/static/", "/data/"];

function isCacheableRequest(request) {
  if (request.method !== "GET") return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;

  return CACHEABLE_EXACT_PATHS.has(url.pathname) || CACHEABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
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
      if (cached) return cached;
      return fetchAndCache(cacheKey);
    }),
  );
});
