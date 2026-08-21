# P417 shared metadata evidence framing

## Root guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## git rev-parse HEAD / origin main

```text
d2142817f3a8b4debf54f5bc23359e3abfc5e607
d2142817f3a8b4debf54f5bc23359e3abfc5e607	refs/heads/main
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
C:\sgSHIOK2026\web\app\layout.tsx:6:  "Explore covered-walkway exposure gaps, night-lighting evidence, and the secondary locked SHIOK score for Singapore walks to transit.";
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:243:      "Explore covered-walkway exposure gaps, night-lighting evidence, and the secondary locked SHIOK score"
```

## npm focused test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  19:32:42
   Duration  741ms (transform 118ms, setup 0ms, import 145ms, tests 58ms, environment 0ms)
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
decisions.md                              | 4 ++++
web/app/layout.tsx                        | 2 +-
web/lib/__tests__/score-card-copy.test.ts | 3 ++-
3 files changed, 7 insertions(+), 2 deletions(-)
```

## FINDINGS

1. The share-card/search-snippet metadata still compressed the headline evidence into `covered-walkway exposure gaps`, while the visible UI now names `covered-walkway ratio` and `exposed gaps` separately.
2. This change is metadata/browser-copy/test/evidence only. It does not run scoring, export, rescore, subset, ingest, network, deploy, or public-data mutation.

## DISAGREEMENTS

1. None.
