# P1026 weekly OneMap browser cache

## Guard

```text
Prawn-E14
C:\sgSHIOK2026
deb8298f0706f1adc2150222a41331c7cfab9d92
deb8298f0706f1adc2150222a41331c7cfab9d92	refs/heads/main
```

## Change

```text
OneMap search and live walking-preview browser caches now persist successful responses for 604_800_000 ms instead of 86_400_000 ms.
Failures remain uncached.
The change reduces repeat /api/onemap-search and /api/onemap-route requests across browser restarts after the owner deploys current main.
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs onemap-search.test.ts route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  18 passed (18)
   Start at  01:45:47
   Duration  2.53s (transform 808ms, setup 0ms, import 287ms, tests 915ms, environment 1ms)
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

1. Successful OneMap browser caches were still one day while successful route-preview CDN caching is one week; extending the client cache to one week reduces avoidable repeat Edge/API requests without changing score data or pipeline inputs.
2. The change is source-side only and is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
