# P879 Night-Lighting Control Copy

## Commands

```text
Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Pipeline cost: zero; no scoring, export, rescore, subset run, ingest, network build, dependency install, public-data write, or deploy.
Protected paths: not modified.
```

## Change

```text
Updated the top map-layer toggle from status-style copy to user-facing action copy:
- off: Show night-lighting layer
- on: Night-lighting layer shown

Updated the explanatory note to say LTA lamp-post locations can be shown on the map and remain outside the locked score.
```

## Verification

```text
npm --prefix web test -- --run lib/__tests__/score-card-copy.test.ts lib/__tests__/route-evidence-map-interaction.test.ts

Test Files  2 passed (2)
     Tests  33 passed (33)
  Start at  13:36:43
  Duration  5.36s (transform 1.64s, setup 0ms, import 846ms, tests 1.58s, environment 2ms)

git diff --check

warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it

python scripts/check_repo_integrity.py
repo_integrity=ok
exit=0

git diff -- pipeline/config/weights.yaml
exit=0
```

## FINDINGS

1. The night-lighting control was technically wired and accessible, but its primary label still read as a status (`Night-lighting layer off`) instead of a user action. That weakened the second-layer product surface without requiring any data or pipeline work to fix.

## DISAGREEMENTS

1. None.
