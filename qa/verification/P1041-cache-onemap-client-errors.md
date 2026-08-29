# P1041 cache OneMap client errors

Date: 2026-08-30
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Intent

Reduce repeat malformed OneMap API probes by making deterministic 400 responses briefly cacheable for five minutes.
Success responses were already weekly cacheable. Throttles, upstream errors, no-route responses, and server errors remain uncached.

## git state before change

```text
PWD
C:\sgSHIOK2026
HOST
Prawn-E14
HEAD
9aeeff2530555dbaa56e11e01e0f192e3e093603
ORIGIN_MAIN
9aeeff2530555dbaa56e11e01e0f192e3e093603	refs/heads/main
```

## diff

```diff
diff --git a/web/app/api/onemap-route/route.ts b/web/app/api/onemap-route/route.ts
index 0f5610c..815a0a2 100644
--- a/web/app/api/onemap-route/route.ts
+++ b/web/app/api/onemap-route/route.ts
@@ -15,6 +15,11 @@ const ROUTE_CACHE_HEADERS = {
   "CDN-Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
   "Vercel-CDN-Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
 };
+const CLIENT_ERROR_CACHE_HEADERS = {
+  "Cache-Control": "public, max-age=300",
+  "CDN-Cache-Control": "public, s-maxage=300",
+  "Vercel-CDN-Cache-Control": "public, s-maxage=300",
+};
 
 const SINGAPORE_BOUNDS = {
   minLat: 1.15,
@@ -33,7 +38,7 @@ export async function GET(request: NextRequest) {
   if (!startLatStr || !startLngStr || !endLatStr || !endLngStr) {
     return NextResponse.json(
       { ok: false, error: "Missing required coordinate parameters (startLat, startLng, endLat, endLng)" },
-      { status: 400 }
+      { status: 400, headers: CLIENT_ERROR_CACHE_HEADERS }
     );
   }
 
@@ -50,7 +55,7 @@ export async function GET(request: NextRequest) {
   ) {
     return NextResponse.json(
       { ok: false, error: "Coordinates must be valid numbers" },
-      { status: 400 }
+      { status: 400, headers: CLIENT_ERROR_CACHE_HEADERS }
     );
   }
 
@@ -67,7 +72,7 @@ export async function GET(request: NextRequest) {
   ) {
     return NextResponse.json(
       { ok: false, error: "Coordinates outside Singapore bounding box" },
-      { status: 400 }
+      { status: 400, headers: CLIENT_ERROR_CACHE_HEADERS }
     );
   }
 
diff --git a/web/app/api/onemap-search/route.ts b/web/app/api/onemap-search/route.ts
index 454a527..254ddca 100644
--- a/web/app/api/onemap-search/route.ts
+++ b/web/app/api/onemap-search/route.ts
@@ -15,13 +15,21 @@ const SEARCH_CACHE_HEADERS = {
   "CDN-Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
   "Vercel-CDN-Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
 };
+const CLIENT_ERROR_CACHE_HEADERS = {
+  "Cache-Control": "public, max-age=300",
+  "CDN-Cache-Control": "public, s-maxage=300",
+  "Vercel-CDN-Cache-Control": "public, s-maxage=300",
+};
 
 export async function GET(request: NextRequest) {
   const { searchParams } = new URL(request.url);
   const searchVal = searchParams.get("searchVal");
 
   if (!searchVal) {
-    return NextResponse.json({ error: "Missing searchVal query parameter" }, { status: 400 });
+    return NextResponse.json(
+      { error: "Missing searchVal query parameter" },
+      { status: 400, headers: CLIENT_ERROR_CACHE_HEADERS }
+    );
   }
 
   const throttle = checkThrottle(ipThrottleMap, parseClientIp(request.headers), MAX_REQ_PER_MINUTE);
diff --git a/web/lib/__tests__/onemap-api-security.test.ts b/web/lib/__tests__/onemap-api-security.test.ts
index 2e15591..0d89ca3 100644
--- a/web/lib/__tests__/onemap-api-security.test.ts
+++ b/web/lib/__tests__/onemap-api-security.test.ts
@@ -96,6 +96,45 @@ describe("OneMap API security helpers", () => {
     }
   });
 
+  it("briefly caches deterministic OneMap search client errors", async () => {
+    const request = new Request("https://example.test/api/onemap-search", {
+      headers: { "x-real-ip": "203.0.113.221" },
+    });
+    const response = await searchGet(request as never);
+
+    expect(response.status).toBe(400);
+    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
+    expect(response.headers.get("cdn-cache-control")).toBe("public, s-maxage=300");
+    expect(response.headers.get("vercel-cdn-cache-control")).toBe("public, s-maxage=300");
+  });
+
+  it("briefly caches deterministic OneMap route client errors", async () => {
+    const missing = await routeGet(
+      new Request("https://example.test/api/onemap-route?startLat=1.37", {
+        headers: { "x-real-ip": "203.0.113.222" },
+      }) as never
+    );
+    const invalid = await routeGet(
+      new Request(
+        "https://example.test/api/onemap-route?startLat=nope&startLng=103.84&endLat=1.371&endLng=103.841",
+        { headers: { "x-real-ip": "203.0.113.223" } }
+      ) as never
+    );
+    const outOfBounds = await routeGet(
+      new Request(
+        "https://example.test/api/onemap-route?startLat=48.858&startLng=2.294&endLat=1.371&endLng=103.841",
+        { headers: { "x-real-ip": "203.0.113.224" } }
+      ) as never
+    );
+
+    for (const response of [missing, invalid, outOfBounds]) {
+      expect(response.status).toBe(400);
+      expect(response.headers.get("cache-control")).toBe("public, max-age=300");
+      expect(response.headers.get("cdn-cache-control")).toBe("public, s-maxage=300");
+      expect(response.headers.get("vercel-cdn-cache-control")).toBe("public, s-maxage=300");
+    }
+  });
+
   it("rate limits spoofed forwarded prefixes at the actual search route", async () => {
     const originalFetch = globalThis.fetch;
     globalThis.fetch = (async () =>
```

## focused web test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs onemap-api-security.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  02:58:54
   Duration  2.78s (transform 248ms, setup 0ms, import 1.99s, tests 225ms, environment 0ms)
```

## repository guard

```text
repo_integrity=ok
EXIT_CODE=0
```

## locked weights check

```text
EXIT_CODE=0
```

## Findings

1. Deterministic malformed OneMap API requests were still uncached. Repeated missing search parameters, incomplete route coordinates, non-numeric route coordinates, and out-of-bounds route coordinates could repeatedly execute the API route.
2. The fix deliberately leaves throttles, upstream errors, no-route geometry responses, and server exceptions uncached so transient failures remain retryable and do not poison caches.
3. This is a source-side reduction only. It is not live until the owner deploys current main to Vercel.

## Disagreements

1. None.
