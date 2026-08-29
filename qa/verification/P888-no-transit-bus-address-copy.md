# P888 No-Transit Bus Address Copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

- Browser copy/test/evidence work only.
- No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, dependency install, or protected evidence rewrite.
- `pipeline/config/weights.yaml` was not modified.

## Change

The no-transit bus-support caveat now says:

`Bus service support is not computed for addresses outside the locked 1.2 km transit range.`

## Commands

```text
> npm --prefix C:\sgSHIOK2026\web test -- score-card-copy.test.ts accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  14:12:03
   Duration  9.93s (transform 3.23s, setup 0ms, import 4.15s, tests 2.29s, environment 4ms)
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

1. The no-transit bus-support caveat still used `records` for a user-facing place limitation, even after the surrounding address-list copy had been corrected.

## DISAGREEMENTS

1. None.
