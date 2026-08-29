# P975 Route Preview URL Normalization

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
280bd36aa8ce0642f5c16eeff508c62bdf50dc26
280bd36aa8ce0642f5c16eeff508c62bdf50dc26	refs/heads/main
```

## Change

The live OneMap route-preview URL now uses the same six-decimal coordinate normalization as the route-preview cache key. This reduces avoidable `/api/onemap-route` URL variants caused by tiny floating-point differences, making browser/CDN caches more likely to hit for the same preview.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  21:16:37
   Duration  1.45s (transform 586ms, setup 0ms, import 195ms, tests 549ms, environment 0ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. The route-preview cache key already normalized coordinates to six decimals, but the request URL still used raw floating-point values.
2. Aligning the URL with the cache key reduces Vercel Edge-request pressure by collapsing tiny coordinate-string variants for the same selected preview route.

## DISAGREEMENTS

1. None.
