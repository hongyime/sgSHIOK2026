# P957 Vercel Icon Cache

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Intent

Reduce repeat browser and crawler Edge/CDN requests by caching the app icon route explicitly.

## Commands

```text
PS C:\sgSHIOK2026> npm --prefix C:\sgSHIOK2026\web test -- deployment
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  18 passed (18)
   Start at  19:57:20
   Duration  519ms (transform 88ms, setup 0ms, import 110ms, tests 28ms, environment 0ms)
```

```text
PS C:\sgSHIOK2026> python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
PS C:\sgSHIOK2026> git -C C:\sgSHIOK2026 diff -- pipeline/config/weights.yaml
```

## FINDINGS

1. `/icon.svg` was another browser/crawler request surface without an explicit cache header. It now uses `public, max-age=31536000, immutable`.
2. This reduces repeat icon validation only after the owner deploys current `main`; production is not changed by this commit alone.

## DISAGREEMENTS

1. None.
