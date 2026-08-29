# P1030 webmanifest probe cache

## Guard

```text
Prawn-E14
C:\sgSHIOK2026
d6e413341fcd17765641c3035ef21e17a1ef0e43
d6e413341fcd17765641c3035ef21e17a1ef0e43	refs/heads/main
```

## Change

```text
Added web/public/site.webmanifest as a minimal static manifest probe target.
/manifest.json rewrites to /site.webmanifest.
/site.webmanifest and /manifest.json use Cache-Control: public, max-age=604800, stale-while-revalidate=2592000.
/site.webmanifest and /manifest.json use X-Robots-Tag: noindex, nofollow, noarchive.
The app shell still does not link a manifest, so this does not add a normal page-load request.
The service worker includes both manifest probe paths in its bounded one-week static cache list.
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  29 passed (29)
   Start at  02:01:52
   Duration  1.15s (transform 185ms, setup 0ms, import 230ms, tests 85ms, environment 0ms)
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

1. Conventional `/site.webmanifest` and `/manifest.json` probe paths had no static target; scanners or clients probing them would get misses instead of bounded cacheable responses.
2. The manifest remains unlinked from the app shell, so this handles probes without adding a new routine page-load request.
3. This is source-side only and is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
