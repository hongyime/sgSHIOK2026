# P960 Vercel Favicon Probe

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Intent

Reduce repeat browser and crawler probes for `/favicon.ico` by routing them to the cacheable SVG app icon.

## Commands

```text
PS C:\sgSHIOK2026> Test-Path -LiteralPath C:\sgSHIOK2026\web\app\favicon.ico; Test-Path -LiteralPath C:\sgSHIOK2026\web\public\favicon.ico
False
False
```

```text
PS C:\sgSHIOK2026> npm --prefix C:\sgSHIOK2026\web test -- deployment
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  21 passed (21)
   Start at  20:11:55
   Duration  6.57s (transform 941ms, setup 0ms, import 1.09s, tests 193ms, environment 39ms)
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

1. Neither `web/app/favicon.ico` nor `web/public/favicon.ico` exists, so clients that probe `/favicon.ico` would not reach the cacheable `/icon.svg` asset.
2. `layout.tsx` now explicitly declares `/icon.svg` as the site icon, and `next.config.js` permanently redirects `/favicon.ico` to `/icon.svg`.
3. This reduces default favicon probe waste only after current `main` is explicitly deployed.

## DISAGREEMENTS

1. None.
