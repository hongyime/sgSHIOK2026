# P983 OneMap Search Browser Cache

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
6643a7633b06f97471775e83991d237a9d1b8076
6643a7633b06f97471775e83991d237a9d1b8076	refs/heads/main
```

## Change

Successful OneMap search proxy responses now use a one-hour browser cache while keeping the existing one-day CDN cache. Errors, throttles, and invalid requests remain uncached.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs onemap-api-security

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  21:46:14
   Duration  5.45s (transform 353ms, setup 0ms, import 4.02s, tests 378ms, environment 1ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. Successful OneMap search responses already had a one-day Vercel CDN cache, but browser cache was only five minutes.
2. A one-hour browser cache reduces repeat same-address `/api/onemap-search` requests from returning users without changing the proxy response shape or caching errors.
3. Vercel runtime logs available through the connector grouped only `/` over the last 24 hours and last 7 days, so they do not expose the static/Edge request paths driving the dashboard quota.

## DISAGREEMENTS

1. None.
