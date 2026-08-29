# P956 Vercel Sitemap Cache

Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Intent

Reduce repeat crawler Edge/CDN requests by caching `/sitemap.xml` with the same policy already used for `/robots.txt`.

## Commands

```text
PS C:\sgSHIOK2026> npm --prefix C:\sgSHIOK2026\web test -- deployment
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs deployment

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  17 passed (17)
   Start at  19:54:43
   Duration  1.12s (transform 126ms, setup 0ms, import 167ms, tests 49ms, environment 0ms)
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

1. `/sitemap.xml` was the remaining crawler-policy endpoint without an explicit cache header. It now uses `public, max-age=86400, stale-while-revalidate=604800`, matching `/robots.txt`.
2. This reduces only polite crawler revalidation after the current main branch is deployed. It does not solve unknown dashboard Edge-request volume by itself, and it is not live while production remains pinned to the older deployment.

## DISAGREEMENTS

1. None.
