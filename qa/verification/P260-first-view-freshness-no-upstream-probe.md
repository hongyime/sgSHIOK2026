# P260 first-view freshness no-upstream-probe disclosure

Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`
Date: 2026-08-21

## Command output

```text
> npm --prefix web test -- score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  08:03:44
   Duration  1.66s (transform 226ms, setup 0ms, import 287ms, tests 81ms, environment 0ms)
```

```text
> python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
> git diff -- pipeline/config/weights.yaml
```

```text
> git diff --stat
 web/app/page.tsx                          | 2 +-
 web/lib/__tests__/score-card-copy.test.ts | 3 ++-
 2 files changed, 3 insertions(+), 2 deletions(-)
```

## FINDINGS

1. The first-view data freshness line already said `manifest-only check`, but did not explicitly say that no upstream URLs were probed.
2. The first-view line now states `No upstream URLs were probed.` so users do not read local manifest freshness as live upstream freshness.
3. This is zero pipeline cost. It does not probe upstream APIs, fetch sources, mutate manifests or inputs, score, export, deploy, public data, or touch locked weights.

## DISAGREEMENTS

1. None.
