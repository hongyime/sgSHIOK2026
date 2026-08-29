# P943 Vercel OneMap API Cache

## Working Root And Host

```text
pwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Goal

Reduce avoidable Vercel Edge/CDN request pressure without scoring, exporting, rescoring, ingesting, rebuilding inputs, deploying, or mutating protected data.

## Request Surface Search

```text
C:\sgSHIOK2026\web\app\page.tsx:2078:    fetch(url)
C:\sgSHIOK2026\web\lib\data.ts:51:  const gzRes = await fetch(dataUrl(gzPath), DATA_FETCH_OPTIONS);
C:\sgSHIOK2026\web\lib\data.ts:54:  const res = await fetch(dataUrl(path), DATA_FETCH_OPTIONS);
C:\sgSHIOK2026\web\lib\lamp-overlay.ts:101:    const res = await fetch(lampOverlayUrl("manifest.json", base), LAMP_OVERLAY_FETCH_OPTIONS);
C:\sgSHIOK2026\web\lib\lamp-overlay.ts:136:    const res = await fetch(lampOverlayUrl(tile.path, base), LAMP_OVERLAY_FETCH_OPTIONS);
C:\sgSHIOK2026\web\app\api\onemap.ts:99:    const res = await fetch("https://www.onemap.gov.sg/api/auth/post/getToken", {
C:\sgSHIOK2026\web\app\api\onemap-route\route.ts:86:    let response = await fetch(routeUrl, { headers });
C:\sgSHIOK2026\web\app\api\onemap-route\route.ts:94:        response = await fetch(routeUrl, { headers });
C:\sgSHIOK2026\web\app\api\onemap-search\route.ts:41:    let response = await fetch(searchUrl, { headers });
C:\sgSHIOK2026\web\app\api\onemap-search\route.ts:49:        response = await fetch(searchUrl, { headers });
C:\sgSHIOK2026\web\app\page.tsx:2075:    const url = `/api/onemap-route?startLat=${originLatLng.lat}&startLng=${originLatLng.lng}&endLat=${stopLat}&endLng=${stopLng}`;
C:\sgSHIOK2026\web\app\api\onemap.ts:99:    const res = await fetch("https://www.onemap.gov.sg/api/auth/post/getToken", {
C:\sgSHIOK2026\web\lib\onemap-search.ts:93:      const res = await fetcher(`/api/onemap-search?searchVal=${encodeURIComponent(key)}`);
C:\sgSHIOK2026\web\app\api\onemap-search\route.ts:31:  const searchUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
C:\sgSHIOK2026\web\app\api\onemap-route\route.ts:78:  const routeUrl = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${startLat},${startLng}&end=${endLat},${endLng}&routeType=walk`;
C:\sgSHIOK2026\web\lib\__tests__\onemap-api-security.test.ts:3:import { GET as searchGet } from "../../app/api/onemap-search/route";
C:\sgSHIOK2026\web\lib\__tests__\onemap-api-security.test.ts:8:} from "../../app/api/onemap";
C:\sgSHIOK2026\web\lib\__tests__\onemap-api-security.test.ts:22:        const request = new Request("https://example.test/api/onemap-search?searchVal=560231", {
C:\sgSHIOK2026\web\lib\__tests__\onemap-search.test.ts:43:        expect(String(input)).toBe("/api/onemap-search?searchVal=MAYFLOWER%20MRT");
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs onemap-api-security onemap-search

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  9 passed (9)
   Start at  18:28:01
   Duration  6.37s (transform 691ms, setup 0ms, import 1.44s, tests 1.08s, environment 3ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  179 passed (179)
   Start at  18:28:31
   Duration  30.76s (transform 2.08s, setup 0ms, import 4.11s, tests 10.11s, environment 15ms)
```

## Repository Integrity

```text
repo_integrity=ok
exit_code=0
```

## Locked Weights Diff

```text
```

## Diff Check

```text
```

## FINDINGS

1. Successful OneMap search proxy responses previously had no cache header, so repeat browser sessions had no HTTP-level cache signal beyond the in-session client cache.
2. Successful OneMap walking-route preview responses previously had no cache header, so repeat requests for the same coordinate pair could hit Vercel and OneMap again.
3. Search responses are now cacheable for 1 day with 7 days stale-while-revalidate; route preview responses are now cacheable for 7 days with 30 days stale-while-revalidate.
4. Errors, throttles, invalid parameters, and out-of-bounds coordinate responses remain uncached.
5. No scoring, export, rescore, subset run, ingest, network build, dependency install, deploy, protected payload write, or locked-weight change was performed for this change.

## DISAGREEMENTS

1. This reduces repeat request pressure after deployment, but it does not make first-time visits free and does not bypass Vercel's Edge/CDN request accounting.
