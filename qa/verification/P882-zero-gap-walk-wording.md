# P882 Zero Exposed-Gap Walk Wording

## Commands

```text
Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Pipeline cost: zero; no scoring, export, rescore, subset run, ingest, network build, dependency install, public-data write, or deploy.
Protected paths: not modified.
```

## Change

```text
Changed the no-exposed-gap secondary sentence from:
- All recorded segments for this display stay under covered-walkway or connector evidence.

to selected-walk-specific copy:
- All recorded segments for this shortest walk stay under covered-walkway or connector evidence.
- All recorded segments for this sheltered walk stay under covered-walkway or connector evidence.
```

## Verification

```text
npm --prefix web test -- --run lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

Test Files  2 passed (2)
     Tests  63 passed (63)
  Start at  13:51:41
  Duration  8.13s (transform 2.17s, setup 0ms, import 2.85s, tests 2.80s, environment 2ms)

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

1. The empty exposed-gap state still used interface wording (`this display`) for a headline shelter artifact. Naming the selected walk is clearer for someone evaluating the actual walk to transit.

## DISAGREEMENTS

1. None.
