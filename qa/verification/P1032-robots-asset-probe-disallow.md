# P1032 robots asset probe disallow

## Guard

```text
Prawn-E14
C:\sgSHIOK2026
2382adf19e8299cbe36c308d8e669d6b5d895b4e
2382adf19e8299cbe36c308d8e669d6b5d895b4e	refs/heads/main
```

## Change

```text
General robots.txt rules now disallow non-content asset probe paths:
/favicon.ico
/apple-touch-icon.png
/apple-touch-icon-precomposed.png
/site.webmanifest
/manifest.json

The root app shell remains allowed.
The existing non-user crawler blocklist still disallows all paths for listed crawler user agents.
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  29 passed (29)
   Start at  02:10:43
   Duration  1.87s (transform 337ms, setup 0ms, import 422ms, tests 125ms, environment 1ms)
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

1. `robots.txt` still allowed conventional icon and manifest probe paths to general crawlers even though those URLs are non-content assets.
2. This is a polite-crawler reduction only, not a hard quota stop, and it is not live until the owner performs an explicit Vercel deployment.

## DISAGREEMENTS

1. None.
