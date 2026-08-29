# P985 App Shell Day Cache

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
98fc8d348feb0344555954d58bc21d5c9d5d228c
98fc8d348feb0344555954d58bc21d5c9d5d228c	refs/heads/main
```

## Change

The app-shell route `/` now sends `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` instead of a one-hour browser cache. This reduces repeat Edge requests from returning browsers for the single-page app shell after the owner deploys current `main`.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  21 passed (21)
   Start at  21:59:34
   Duration  2.08s (transform 369ms, setup 0ms, import 466ms, tests 143ms, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
weights_diff_exit=0
```

## FINDINGS

1. The app shell was still allowed to revalidate after one hour, which is short for a manually deployed static client app during a Vercel Edge-request quota incident.
2. A one-day browser cache is a stronger free-tier request reduction for repeat visits to `/`.
3. This is a deliberate freshness tradeoff: after a manual deployment, some returning browsers may keep the previous app shell for up to one day unless they hard-refresh.

## DISAGREEMENTS

1. None.
