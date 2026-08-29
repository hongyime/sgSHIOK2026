# P889 Comparison-Helper Address Copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

- Browser copy/test/evidence work only.
- No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, dependency install, or protected evidence rewrite.
- `pipeline/config/weights.yaml` was not modified.

## Change

The comparison panel helper now says:

- `Nearby-address comparison for this locked-score row; locked SHIOK score is unchanged.`
- `Nearby-address comparison for this evidence row; locked SHIOK score is unchanged.`

## Commands

```text
> npm --prefix C:\sgSHIOK2026\web test -- score-card-copy.test.ts accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  14:15:37
   Duration  2.38s (transform 808ms, setup 0ms, import 1.05s, tests 586ms, environment 0ms)
```

```text
> git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

```text
> git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

```text
> python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

## FINDINGS

1. After the panel heading moved to `Compare nearby addresses`, the opened helper still described the same UI as a planning-area detail view, which was less direct for a home-search comparison task.

## DISAGREEMENTS

1. None.
