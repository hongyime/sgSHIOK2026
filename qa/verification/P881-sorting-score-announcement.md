# P881 Sorting-Only Score Announcement

## Commands

```text
Working root: C:\sgSHIOK2026
Machine: Prawn-E14
Pipeline cost: zero; no scoring, export, rescore, subset run, ingest, network build, dependency install, public-data write, or deploy.
Protected paths: not modified.
```

## Change

```text
Changed the scored-record screen-reader status from:
- Locked score 72 out of 100.

to:
- Sorting-only score 72 out of 100.

Preview status keeps `Locked score preview only; published locked score unchanged` because that state explains that clicked-stop previews do not alter published locked scores.
```

## Verification

```text
npm --prefix web test -- --run lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

Test Files  1 failed | 1 passed (2)
     Tests  1 failed | 62 passed (63)

Failed boundary assertion:
describes awaiting bundle scoring as a frozen v1 bundle state

The first implementation changed unavailable-score live copy to `Sorting-only score unavailable in the published shelter-map data.` The test showed that no-full-score states should keep `Locked score unavailable...` because they are explaining availability, not presenting a completed 0-to-100 sorting value.

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
  Start at  13:47:59
  Duration  4.59s (transform 1.40s, setup 0ms, import 1.83s, tests 1.24s, environment 1ms)
```

## FINDINGS

1. P880 demoted the visual score badge to `Sorting-only score`, but the screen-reader live status still announced scored records as `Locked score`. That left assistive users with a more score-first framing than sighted users saw.
2. The focused render test caught that no-full-score states should keep `Locked score unavailable` wording; `Sorting-only score` is appropriate only when a numeric sorting value exists.

## DISAGREEMENTS

1. None.
