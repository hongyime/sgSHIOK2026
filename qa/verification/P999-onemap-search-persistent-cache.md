# P999 OneMap search persistent cache

Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Date: 2026-08-29

## Scope

Free-tier Vercel request reduction for repeated address searches.

Change:

- Store successful OneMap search responses in browser storage for one day.
- Prefer `localStorage` so a repeated search after closing and reopening the browser can avoid another `/api/onemap-search` request.
- Fall back to `sessionStorage` when `localStorage` is unavailable.
- Keep failed requests uncached because only successful responses are written after `res.ok`.
- Use a v2 cache key format with `{ cached_at, payload }` so stale entries expire after 86,400,000 ms.

No pipeline, scoring, export, rescore, ingest, network build, dependency install, deployment, protected data mutation, or `weights.yaml` edit was performed.

## Command Output

```text
PS C:\sgSHIOK2026> npm --prefix web test -- onemap-search
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs onemap-search

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  23:08:32
   Duration  1.12s (transform 158ms, setup 0ms, import 197ms, tests 147ms, environment 0ms)
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; "repo_integrity_exit=$LASTEXITCODE"
repo_integrity=ok
repo_integrity_exit=0
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml
```

## Findings

1. The previous OneMap search client had memory caching and session storage, but the persisted cache ended when the tab/session ended.
2. OneMap search API responses already use a one-day browser cache header, so a one-day local browser storage cache matches the existing freshness policy while avoiding a Vercel function request for repeated same-query searches across visits.
3. Failed searches remain retryable because the client writes storage only after a successful `res.ok` response.

## Disagreements

1. None.
