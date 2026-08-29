# P964 Vercel App Shell Cache

Date: 2026-08-29
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Command Output

```text
C:\sgSHIOK2026
Prawn-E14
c1bd12e18431fcf448889fbd5870c161f0ee6362
```

```text
c1bd12e18431fcf448889fbd5870c161f0ee6362	refs/heads/main
```

## Change

Increased the browser cache on `/` from 300 seconds to 3600 seconds, with stale-while-revalidate from 3600 seconds to 21600 seconds, to reduce repeat app-shell requests from returning visitors once the current main branch is deployed.

This does not reduce Vercel Edge Requests that reach Vercel's edge, and it does not affect live production until the owner performs an explicit deployment.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  21 passed (21)
   Start at  20:34:36
   Duration  1.16s (transform 206ms, setup 0ms, import 262ms, tests 81ms, environment 0ms)
```

```text
repo_integrity=ok
exit_code=0
```

```text
exit_code=1
```

## FINDINGS

1. Vercel Edge Request pressure cannot be fully solved by CDN cache headers because cached requests still count when they reach Vercel's edge; this change targets browser-side repeat requests to avoid some edge hits entirely.
2. The latest request-reduction commits on main remain non-live until an owner-approved Vercel deployment occurs.

## DISAGREEMENTS

1. None.
