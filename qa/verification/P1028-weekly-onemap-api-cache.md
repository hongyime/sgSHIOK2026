# P1028 weekly OneMap API cache

## Guard

```text
Prawn-E14
C:\sgSHIOK2026
568482e40df30cfbe173dbed55f3bb025a2827c3
568482e40df30cfbe173dbed55f3bb025a2827c3	refs/heads/main
```

## Change

```text
Successful /api/onemap-search responses now use Cache-Control: public, max-age=604800.
Successful /api/onemap-search responses now use CDN-Cache-Control: public, s-maxage=604800, stale-while-revalidate=2592000.
Successful /api/onemap-route responses now use Cache-Control: public, max-age=604800.
Errors, throttles, missing parameters, invalid coordinates, and missing-route responses remain uncached.
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs onemap-api-security.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  01:53:38
   Duration  3.73s (transform 240ms, setup 0ms, import 2.87s, tests 243ms, environment 0ms)
```

## Repo Integrity

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Locked Weights Check

```text
weights_diff_exit=0
```

## FINDINGS

1. Successful OneMap API response headers still expired browser caches after one day even though P1026 made the persisted browser-side result caches one week; aligning the headers reduces repeat browser requests when local storage is unavailable or cleared.
2. This is source-side only and is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
