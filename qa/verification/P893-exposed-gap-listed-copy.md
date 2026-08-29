# P893 Exposed-Gap Listed Copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

- Browser copy/test/evidence work only.
- No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, dependency install, or protected evidence rewrite.
- `pipeline/config/weights.yaml` was not modified.

## Change

Exposed-gap copy now says:

- `All listed exposed gaps are shown.`
- `No exposed gaps are listed for this shortest walk.`
- `All mapped segments for this shortest walk stay under covered-walkway or connector evidence.`

## Commands

```text
> npm --prefix C:\sgSHIOK2026\web test -- score-card-copy.test.ts accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  14:28:33
   Duration  3.48s (transform 1.05s, setup 0ms, import 1.35s, tests 880ms, environment 1ms)
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

1. The exposed-gap card still used `recorded` storage language in the visible no-gap and all-gaps states.

## DISAGREEMENTS

1. None.
