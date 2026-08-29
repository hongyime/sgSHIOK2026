# P1000 Route preview persistent cache

Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Date: 2026-08-29

## Scope

Free-tier Vercel request reduction for repeated live OneMap walking previews.

Change:

- Persist successful `/api/onemap-route` preview payloads in browser storage for one day.
- Prefer `localStorage` so repeated shared-link or clicked-stop visits after a browser restart can avoid another Vercel function request.
- Fall back to `sessionStorage` or memory-only when browser storage is unavailable.
- Keep failed, unavailable, and geometry-less previews uncached and retryable.
- Preserve the existing six-decimal coordinate key and URL normalization.

No pipeline, scoring, export, rescore, ingest, network build, dependency install, deployment, protected data mutation, or `weights.yaml` edit was performed.

## Command Output

```text
PS C:\sgSHIOK2026> npm --prefix web test -- route-evidence-map-interaction
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  11 passed (11)
   Start at  23:13:06
   Duration  1.94s (transform 766ms, setup 0ms, import 318ms, tests 682ms, environment 1ms)
```

```text
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P1000-route-preview-persistent-cache.md; if ($LASTEXITCODE -eq 0) { "p1000_check_ignore_exit=0" } else { "p1000_check_ignore_exit=$LASTEXITCODE" }
p1000_check_ignore_exit=1
```

## Findings

1. Live route previews already deduped in-flight requests and used session storage, but the stored cache ended with the tab/session.
2. The `/api/onemap-route` response already has a one-day browser cache header, so a one-day local browser storage TTL matches existing freshness policy.
3. The cache key includes postal, stop id, origin coordinates, and stop coordinates, so cached previews are scoped to the exact selected walk.

## Disagreements

1. None.
