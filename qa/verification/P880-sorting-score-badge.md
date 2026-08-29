# P880 Sorting-Only Score Badge

## Commands

```text
Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Pipeline cost: zero; no scoring, export, rescore, subset run, ingest, network build, dependency install, public-data write, or deploy.
Protected paths: not modified.
```

## Change

```text
Changed the score header badge label for complete records:
- before: Locked score
- after: Sorting-only score

The no-score badge remains:
- No full locked score / Walk evidence
```

## Verification

```text
npm --prefix web test -- --run lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

Test Files  1 failed | 1 passed (2)
     Tests  1 failed | 62 passed (63)

Failed stale assertion:
formats the night-lighting layer note for off and on states

The failure was an outdated expected string from P879. It expected `LTA lamp-post locations load from the published lamp-post layer` after the implementation had already changed the note to map-evidence wording.

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

npm --prefix web test -- --run lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

Test Files  2 passed (2)
     Tests  63 passed (63)
  Start at  13:42:44
  Duration  3.88s (transform 1.26s, setup 0ms, import 1.62s, tests 965ms, environment 1ms)
```

## FINDINGS

1. The detail breakdown already demoted the 0-to-100 composite as `Sorting-only score`, but the header badge still used `Locked score`. That kept the composite more primary than the settled shelter-first framing requires.

## DISAGREEMENTS

1. None.
