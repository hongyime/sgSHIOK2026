# P1031 service worker icon probe cache

## Guard

```text
Prawn-E14
C:\sgSHIOK2026
e20710246b5958c162ff8ef697b6932a904242e6
e20710246b5958c162ff8ef697b6932a904242e6	refs/heads/main
```

## Change

```text
The service worker now treats /favicon.ico, /apple-touch-icon.png, and /apple-touch-icon-precomposed.png as exact cacheable paths.
Those probe paths resolve to /icon.svg through Next rewrites and already have immutable HTTP cache headers.
The service worker now treats those icon probe paths as indefinitely fresh after a successful first fetch, matching /icon.svg.
```

## Initial Focused Web Test

```text
 ❯ lib/__tests__/deployment.test.ts (29 tests | 1 failed) 637ms
     × bounds service-worker freshness for stable non-hashed URLs 180ms

 FAIL  lib/__tests__/deployment.test.ts > deployment packaging > bounds service-worker freshness for stable non-hashed URLs
AssertionError: expected 'const CACHE_NAME = "sgshiok-static-v1…' to contain 'if (url.pathname === "/icon.svg") ret…'

 Test Files  1 failed (1)
      Tests  1 failed | 28 passed (29)
   Start at  02:05:57
   Duration  4.64s (transform 828ms, setup 0ms, import 1.02s, tests 637ms, environment 2ms)
```

## Corrected Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  29 passed (29)
   Start at  02:06:47
   Duration  1.87s (transform 300ms, setup 0ms, import 368ms, tests 110ms, environment 1ms)
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

1. P1029 made conventional icon probe paths server-cacheable, but the service worker still did not cache those request URLs after the first successful probe.
2. The first focused test failure was a stale source-string assertion for the old one-line `/icon.svg` freshness check, not a behavior failure; the assertion now matches the multi-line condition covering all icon probe paths.
3. This is source-side only and is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
