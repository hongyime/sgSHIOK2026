# P418 map accessible label headline evidence

## Root guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## git rev-parse HEAD / origin main

```text
404ed9978e4d9b89e257792e32c9925667acba9a
404ed9978e4d9b89e257792e32c9925667acba9a	refs/heads/main
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
C:\sgSHIOK2026\web\components\route-evidence-map.tsx:970:    return "Singapore shelter map with MRT stations, LRT stations, bus stops, and night-lighting evidence";
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:48:    expect(source).toContain("Singapore shelter map with MRT stations, LRT stations, bus stops, and night-lighting evidence");
```

## npm focused test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  19:36:55
   Duration  2.40s (transform 1.11s, setup 0ms, import 318ms, tests 962ms, environment 0ms)
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
web/components/route-evidence-map.tsx                    | 2 +-
web/lib/__tests__/route-evidence-map-interaction.test.ts | 3 ++-
3 files changed, 7 insertions(+), 2 deletions(-)
```

## FINDINGS

1. The empty-map aria label still described the map as transit POIs plus night-lighting evidence, omitting the primary covered-walkway ratio and exposed-gap evidence that sighted users see first.
2. This change is browser accessibility copy/test/evidence only. It does not run scoring, export, rescore, subset, ingest, network, deploy, or public-data mutation.

## DISAGREEMENTS

1. None.
