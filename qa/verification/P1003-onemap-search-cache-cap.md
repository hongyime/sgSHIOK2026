# P1003 OneMap search cache cap

Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Date: 2026-08-29

## Scope

Free-tier Vercel request reduction hardening after P999.

Change:

- Cap persisted OneMap search cache entries at 50.
- Prune expired, malformed, and oldest search cache entries before writing.
- Retry the write once after pruning if browser storage is full.
- Leave unrelated browser storage keys untouched.

No pipeline, scoring, export, rescore, ingest, network build, dependency install, deployment, protected data mutation, or `weights.yaml` edit was performed.

## Command Output

```text
PS C:\sgSHIOK2026> npm --prefix web test -- onemap-search
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs onemap-search

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  23:32:07
   Duration  1.39s (transform 252ms, setup 0ms, import 314ms, tests 180ms, environment 1ms)
```

```text
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P1003-onemap-search-cache-cap.md; if ($LASTEXITCODE -eq 0) { "p1003_check_ignore_exit=0" } else { "p1003_check_ignore_exit=$LASTEXITCODE" }
p1003_check_ignore_exit=1
```

## Findings

1. P999 added one-day persistent OneMap search caching, but it did not cap the number of browser storage entries.
2. Search payloads are small, so this was lower-risk than route-preview geometry caching, but capped storage is still the cleaner deploy candidate.
3. A 50-entry cap keeps common repeated-address savings while avoiding unbounded local storage growth.

## Disagreements

1. None.
