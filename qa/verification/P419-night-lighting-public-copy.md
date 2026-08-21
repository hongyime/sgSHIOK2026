# P419 night lighting public copy

## Root guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## git rev-parse HEAD / origin main

```text
d23bcdf980fb2e3dd31c0e5b1c87847769a9bfe8
d23bcdf980fb2e3dd31c0e5b1c87847769a9bfe8	refs/heads/main
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
C:\sgSHIOK2026\web\app\layout.tsx:6:  "Explore covered-walkway ratio, exposed gaps, night-lighting evidence, and the secondary locked SHIOK score for Singapore walks to transit.";
C:\sgSHIOK2026\web\components\route-evidence-map.tsx:970:    return "Singapore shelter map for covered-walkway ratio, exposed gaps, transit stops, and night-lighting evidence";
C:\sgSHIOK2026\web\app\page.tsx:2232:        <footer className={styles.pageFooter}>Source-derived covered-walkway ratio, exposed gaps, and night-lighting map evidence.</footer>
```

## npm focused tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  26 passed (26)
   Start at  19:42:05
   Duration  3.13s (transform 1.40s, setup 0ms, import 652ms, tests 1.20s, environment 1ms)
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
web/app/layout.tsx                                       | 2 +-
web/app/page.tsx                                         | 2 +-
web/components/route-evidence-map.tsx                    | 2 +-
web/lib/__tests__/route-evidence-map-interaction.test.ts | 3 ++-
web/lib/__tests__/score-card-copy.test.ts                | 6 ++++--
6 files changed, 13 insertions(+), 6 deletions(-)
```

## FINDINGS

1. Three outward-facing surfaces still used hyphenated `night-lighting evidence` while the visible title/search/freshness copy used plain `night lighting`.
2. This change is browser copy/accessibility copy/test/evidence only. It does not run scoring, export, rescore, subset, ingest, network, deploy, or public-data mutation.

## DISAGREEMENTS

1. None.
