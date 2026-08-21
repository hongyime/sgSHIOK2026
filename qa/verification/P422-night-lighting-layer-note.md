# P422 night lighting layer note

## Root guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## git rev-parse HEAD / origin main

```text
05e62745a6c92f9144a118aa0ae625bf4ef67fb9
05e62745a6c92f9144a118aa0ae625bf4ef67fb9	refs/heads/main
```

## git status --short before commit

```text
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p125/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p379/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## Focused inspection

```text
web\app\page.tsx:2160:              LTA lamp-post layer: 126,144 points, source last modified 7 Jul 2026. Switch on and zoom into a neighbourhood to load points. Map evidence only; not part of the locked score.
web\lib\__tests__\route-evidence-map-interaction.test.ts:99:      "LTA lamp-post layer: 126,144 points, source last modified 7 Jul 2026. Switch on and zoom into a neighbourhood to load points. Map evidence only; not part of the locked score."
web\lib\__tests__\score-card-copy.test.ts:237:      "LTA lamp-post layer: 126,144 points, source last modified 7 Jul 2026. Switch on and zoom into a neighbourhood to load points. Map evidence only; not part of the locked score."
```

## Focused tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  26 passed (26)
   Start at  19:55:35
   Duration  1.01s (transform 533ms, setup 0ms, import 318ms, tests 409ms, environment 1ms)
```

## git check-ignore evidence path

```text
EXIT=1
```

## repo integrity

```text
repo_integrity=ok
EXIT=0
```

## protected path diff

```text
EXIT=0
```

## git diff --stat

```text
decisions.md                                             | 4 ++++
web/app/page.tsx                                         | 2 +-
web/lib/__tests__/route-evidence-map-interaction.test.ts | 3 ++-
web/lib/__tests__/score-card-copy.test.ts                | 3 ++-
4 files changed, 9 insertions(+), 3 deletions(-)
```

## FINDINGS

1. The visible note under the `Night lighting` map-layer control still led with raw-source wording: `LTA lamp-post layer`.
2. The note now presents the user-facing layer first and keeps the LTA point count and source date.
3. This is browser copy/test/evidence only. It does not run scoring, export, rescore, subset, ingest, network, deploy, or public-data mutation.

## DISAGREEMENTS

1. None.
