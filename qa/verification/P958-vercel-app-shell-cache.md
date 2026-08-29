# P958 Vercel App Shell Cache

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Intent

Reduce repeat Edge/CDN requests for the static app shell by caching `/` briefly in the browser.

## Commands

```text
PS C:\sgSHIOK2026> npm --prefix C:\sgSHIOK2026\web test -- deployment
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  19 passed (19)
   Start at  20:00:57
   Duration  2.06s (transform 314ms, setup 0ms, import 385ms, tests 143ms, environment 1ms)
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

1. The app shell route `/` can be cached briefly because it is a static client app shell and does not depend on request cookies or server headers.
2. `/` now uses `public, max-age=300, stale-while-revalidate=3600`, reducing repeat browser requests without creating long-lived stale shell risk.
3. This only helps after current `main` is explicitly deployed to Vercel.

## DISAGREEMENTS

1. None.
