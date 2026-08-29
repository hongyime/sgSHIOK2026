# P886 Missing-Score Copy Pin

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

- Browser test/evidence work only.
- No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, dependency install, or protected evidence rewrite.
- `pipeline/config/weights.yaml` was not modified.

## Change

`web/lib/__tests__/score-card-copy.test.ts` now pins the formatter fragment `address-list records (${pctText})`, so the missing-score count cannot regress to generic `records` while the scored-count denominator remains correct.

## Commands

```text
> npm --prefix C:\sgSHIOK2026\web test -- score-card-copy.test.ts locked-score-availability.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts locked-score-availability.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  26 passed (26)
   Start at  14:05:23
   Duration  1.29s (transform 181ms, setup 0ms, import 225ms, tests 179ms, environment 1ms)
```

```text
> git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

```text
> git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

```text
> python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

## FINDINGS

1. P885 changed the live formatter and direct formatter tests, but the broader copy-pinning test only checked the complete-score denominator and the old generic-count negative fragment.

## DISAGREEMENTS

1. None.
