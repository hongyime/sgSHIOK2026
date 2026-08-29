# P949 Vercel API CDN Cache Headers

## Working Root And Host

```text
pwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Goal

Make successful OneMap proxy responses explicitly cacheable by Vercel's CDN, not only by browsers.

## Vercel Documentation Check

```text
Source: https://vercel.com/docs/caching/cache-control-headers

Cache-Control: s-maxage=60

Source: https://vercel.com/docs/caching/cdn-cache

response.setHeader('Cache-Control', 'public, s-maxage=1');

Source: https://vercel.com/docs/caching/cache-control-headers

response.setHeader('Vercel-CDN-Cache-Control', 'max-age=3600');
response.setHeader('CDN-Cache-Control', 'max-age=60');
response.setHeader('Cache-Control', 'max-age=10');
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs onemap-api-security onemap-search

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  9 passed (9)
   Start at  19:03:27
   Duration  8.11s (transform 411ms, setup 0ms, import 3.63s, tests 414ms, environment 1ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  182 passed (182)
   Start at  19:04:05
   Duration  105.92s (transform 7.52s, setup 0ms, import 10.53s, tests 73.99s, environment 11ms)
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

1. P943 used browser-facing `Cache-Control: max-age=...` headers for successful OneMap proxy responses, and the live response showed Vercel serving `cache-control=public, max-age=86400`.
2. Vercel's CDN documentation names `s-maxage`, `CDN-Cache-Control`, and `Vercel-CDN-Cache-Control` as the stronger CDN-specific controls for function responses.
3. Successful OneMap search responses now send short browser caching plus 1-day CDN/Vercel CDN caching.
4. Successful OneMap walking-route preview responses now send 1-day browser caching plus 7-day CDN/Vercel CDN caching.
5. No scoring, export, rescore, subset run, ingest, network build, dependency install, deploy, protected payload write, or locked-weight change was performed for this change.

## DISAGREEMENTS

1. P943 was directionally useful but incomplete for Vercel quota pressure because it did not explicitly separate browser cache from Vercel CDN cache.
