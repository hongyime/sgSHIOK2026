# P959 Vercel Query Crawler Control

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Intent

Reduce crawler amplification of duplicate app-shell URLs by discouraging query-string crawl variants while keeping shared links functional for users.

## Commands

```text
PS C:\sgSHIOK2026> npm --prefix C:\sgSHIOK2026\web test -- deployment
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  20 passed (20)
   Start at  20:06:48
   Duration  2.93s (transform 795ms, setup 0ms, import 958ms, tests 113ms, environment 1ms)
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

1. The app writes shared links with query parameters such as `?postal=` and `?stop=`, but those URLs serve the same client app shell for crawlers.
2. `robots.ts` now disallows `/*?*`, keeping user shared links functional while telling polite crawlers not to enumerate query variants.
3. `layout.tsx` now declares the canonical URL as `https://sgshiok.vercel.app/`, reinforcing that query variants are not distinct crawler targets.
4. This only helps after the owner explicitly deploys current `main`.

## DISAGREEMENTS

1. None.
