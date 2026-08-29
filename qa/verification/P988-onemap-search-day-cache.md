# P988 OneMap Search Day Cache

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
e57c32eeffe37064d1251277491c590b2d9e9477
e57c32eeffe37064d1251277491c590b2d9e9477	refs/heads/main
```

## Change

Successful OneMap search proxy responses now use a one-day browser cache, matching the route-preview browser cache. The existing one-day Vercel CDN cache remains unchanged, and errors, throttles, missing parameters, and upstream failures remain uncached.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs onemap-api-security

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  22:11:41
   Duration  2.26s (transform 182ms, setup 0ms, import 1.33s, tests 265ms, environment 0ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
weights_diff_exit=0
```

## FINDINGS

1. OneMap search results were already CDN-cacheable for one day, but returning browsers still revalidated after one hour.
2. Raising successful search responses to a one-day browser cache reduces repeat `/api/onemap-search` requests for same-address lookups during the quota incident.
3. This is a deliberate freshness tradeoff: a newly added or corrected OneMap address may be hidden from a returning browser for up to one day unless the user hard-refreshes or changes the query.

## DISAGREEMENTS

1. None.
