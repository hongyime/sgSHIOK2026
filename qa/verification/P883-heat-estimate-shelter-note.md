# P883 Heat-Estimate Shelter Note

## Commands

```text
Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Pipeline cost: zero; no scoring, export, rescore, subset run, ingest, network build, dependency install, public-data write, or deploy.
Protected paths: not modified.
```

## Change

```text
Changed the shelter-exposure row and implemented Section 10 reference note from:
- In this locked release, rain shelter and heat comfort share mostly the same covered-walkway evidence.

to:
- In this locked release, rain shelter and the heat estimate share mostly the same covered-walkway evidence.
```

## Verification

```text
npm --prefix web test -- --run lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

Test Files  2 passed (2)
     Tests  63 passed (63)
  Start at  13:55:26
  Duration  3.91s (transform 1.30s, setup 0ms, import 1.68s, tests 929ms, environment 1ms)

git diff --check

warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit=0

python scripts/check_repo_integrity.py
repo_integrity=ok
exit=0

git diff -- pipeline/config/weights.yaml
exit=0
```

## FINDINGS

1. One shelter-exposure row note and the implemented Section 10 reference still called the heat term `heat comfort`, even though current project policy and adjacent UI copy say `Heat estimate` and `not measured temperature`.

## DISAGREEMENTS

1. None.
