# P1027 service worker day cache

## Guard

```text
Prawn-E14
C:\sgSHIOK2026
b3b5540e75e4cc77c344e0b48712f47f39b0f6d1
b3b5540e75e4cc77c344e0b48712f47f39b0f6d1	refs/heads/main
```

## Change

```text
/sw.js now uses Cache-Control: public, max-age=86400, stale-while-revalidate=604800.
The previous header was Cache-Control: public, max-age=3600, stale-while-revalidate=86400.
This reduces repeat service-worker script revalidation from returning browsers while keeping update propagation bounded to one day.
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  27 passed (27)
   Start at  01:50:19
   Duration  2.10s (transform 332ms, setup 0ms, import 404ms, tests 128ms, environment 14ms)
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

1. `/sw.js` still revalidated hourly even though it is a stable deployment source and the app shell already tolerates longer bounded caching; one-day caching is a better quota tradeoff.
2. This is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
