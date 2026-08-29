# P942 Vercel edge request cache mitigation

## Working root

```text
pwd=C:\sgSHIOK2026
hostname=PRAWN-E14
head=0ec4c3d
0ec4c3d7b919c90a9704335475432ed99552d627	refs/heads/main
repo_integrity=ok
repo_integrity_exit=0
```

## Evidence path ignore check

```text
exit_code=1
```

## Live deployed headers before this commit

```text
URL https://sgshiok.vercel.app/
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, must-revalidate, max-age=0
Content-Disposition: inline
Content-Length: 15464
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://www.onemap.gov.sg https://*.onemap.gov.sg; font-src 'self' data:; connect-src 'self' https://www.onemap.gov.sg https://*.onemap.gov.sg; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Content-Type: text/html; charset=utf-8
Date: Sat, 29 Aug 2026 10:03:03 GMT
ETag: "652e167d4e521b31060efb7b63899de0"
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
X-Content-Type-Options: nosniff
X-Matched-Path: /
X-Nextjs-Prerender: 1
X-Nextjs-Stale-Time: 300
X-Vercel-Cache: PRERENDER
X-Vercel-Id: sin1::sqnmq-1787997782104-39a6171a6a31

URL https://sgshiok.vercel.app/data/generated_20260805_prefer_scored_routed/manifest.json
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, must-revalidate, max-age=0
Content-Disposition: inline; filename="manifest.json"
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://www.onemap.gov.sg https://*.onemap.gov.sg; font-src 'self' data:; connect-src 'self' https://www.onemap.gov.sg https://*.onemap.gov.sg; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Content-Type: application/json; charset=utf-8
Date: Sat, 29 Aug 2026 10:03:04 GMT
ETag: W/"2575ab7463a61051a2f79287ec5fa69c"
Last-Modified: Sat, 29 Aug 2026 10:03:04 GMT
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Matched-Path: /data/generated_20260805_prefer_scored_routed/manifest.json
X-Vercel-Cache: MISS
X-Vercel-Id: sin1::67glw-1787997784037-cfb5f233068b

URL https://sgshiok.vercel.app/data/lamp_posts_v1/manifest.json
ERROR Response status code does not indicate success: 404 (Not Found).
```

## Local static bundle gzip count

```text
gz_count=1085
```

## Build helper side effect observed before the no-overwrite guard

```text
recent_count=1085
recent_bytes=1521178
```

```text
Algorithm Hash                                                             Path
--------- ----                                                             ----
SHA256    7108E66E70628F3211883402FC753C2F5809DB5A822D6A2415F6AE6459A1070E C:\sgSHIOK2026\web\public\data\generated_20260805_prefer_scored_routed\manifest.json


Algorithm Hash                                                             Path
--------- ----                                                             ----
SHA256    4DEBA7215639F6BA8BE7CD2E8D85F0DD0C35071942B93C1A5C1278E80B1BD642 C:\sgSHIOK2026\web\public\data\generated_20260805_prefer_scored_routed\manifest.json.gz
```

## No remaining per-load cache busters

```text
rg_exit=1
```

## Cacheable fetch and header search

```text
C:\sgSHIOK2026\web\next.config.js:47:            key: "Cache-Control",
C:\sgSHIOK2026\web\next.config.js:48:            value: "public, max-age=31536000, immutable",
C:\sgSHIOK2026\web\lib\data.ts:31:const DATA_FETCH_OPTIONS: RequestInit = { cache: "force-cache" };
C:\sgSHIOK2026\web\lib\data.ts:33:function dataUrl(path: string): string {
C:\sgSHIOK2026\web\lib\data.ts:51:  const gzRes = await fetch(dataUrl(gzPath), DATA_FETCH_OPTIONS);
C:\sgSHIOK2026\web\lib\data.ts:54:  const res = await fetch(dataUrl(path), DATA_FETCH_OPTIONS);
C:\sgSHIOK2026\web\lib\lamp-overlay.ts:6:const LAMP_OVERLAY_FETCH_OPTIONS: RequestInit = { cache: "force-cache" };
C:\sgSHIOK2026\web\lib\lamp-overlay.ts:69:function lampOverlayUrl(path: string, base = LAMP_OVERLAY_BASE): string {
C:\sgSHIOK2026\web\lib\lamp-overlay.ts:101:    const res = await fetch(lampOverlayUrl("manifest.json", base), LAMP_OVERLAY_FETCH_OPTIONS);
C:\sgSHIOK2026\web\lib\lamp-overlay.ts:136:    const res = await fetch(lampOverlayUrl(tile.path, base), LAMP_OVERLAY_FETCH_OPTIONS);
```

## Full web tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  24 passed (24)
      Tests  177 passed (177)
   Start at  18:17:27
   Duration  57.80s (transform 2.94s, setup 0ms, import 5.58s, tests 24.85s, environment 18ms)
```

## ensure-data-bundle syntax check

```text
```

## Diff check

```text
warning: in the working copy of 'web/lib/data.ts', CRLF will be replaced by LF the next time Git touches it
```

## Repository integrity

```text
repo_integrity=ok
exit_code=0
```

## weights.yaml diff

```text
```

## FINDINGS

1. Static bundle and lamp overlay fetches used per-page-load query strings plus cache: "no-store", defeating browser reuse for immutable versioned data files.
2. The live deployed data response before this commit used Cache-Control: public, must-revalidate, max-age=0 and returned X-Vercel-Cache: MISS for manifest.json, so repeat visits could keep hitting Vercel's edge network.
3. Running npm --prefix web run build before inspecting ensure-data-bundle.mjs rewrote 1,085 existing gzip/derived files under web/public/data/generated_20260805_prefer_scored_routed, totaling 1,521,178 bytes. That violated the protected-payload write rule. I did not revert, delete, move, or further mutate those files; I fixed the build helper so future builds skip existing gzip/derived artifacts.

## DISAGREEMENTS

1. None.
