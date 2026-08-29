# P885 Address-List Missing-Score Count

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

- Browser copy/test/evidence work only.
- No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, dependency install, or protected evidence rewrite.
- `pipeline/config/weights.yaml` was not modified.

## Change

The full-score availability line now names both sides of the coverage statement as June 2020 address-list records:

`Full locked scores: 95,157 of 124,443 June 2020 address-list records; 29,286 address-list records (23.5%, roughly a quarter) missing full scores: ...`

## Commands

```text
> npm --prefix C:\sgSHIOK2026\web test -- locked-score-availability.test.ts data.test.ts accessibility-render.test.tsx score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs locked-score-availability.test.ts data.test.ts accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  4 passed (4)
      Tests  72 passed (72)
   Start at  14:02:57
   Duration  7.30s (transform 1.13s, setup 0ms, import 1.48s, tests 3.85s, environment 1ms)
```

```text
> git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

```text
> git diff --check
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
```

```text
> python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

## FINDINGS

1. The P884 denominator fix left the missing-score count as generic `records`, which could still imply current Singapore address coverage rather than the frozen June 2020 address-list population.

## DISAGREEMENTS

1. None.
