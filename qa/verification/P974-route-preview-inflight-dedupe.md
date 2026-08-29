# P974 Route Preview In-Flight Dedupe

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
41147cb26a07a6bcbb908476063c9fc0e4a3bbce
41147cb26a07a6bcbb908476063c9fc0e4a3bbce	refs/heads/main
```

## Change

Added an in-flight request map for live OneMap route previews. Successful previews were already persisted in sessionStorage; this change also deduplicates duplicate effect runs for the same preview cache key while the first network request is still pending.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  21:10:35
   Duration  2.68s (transform 1.13s, setup 0ms, import 399ms, tests 961ms, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. Live route previews already had successful sessionStorage caching but did not explicitly dedupe duplicate in-flight fetches for the same preview key.
2. This reduces avoidable `/api/onemap-route` requests from repeated effect runs without changing score, route, or export behavior.

## DISAGREEMENTS

1. None.
