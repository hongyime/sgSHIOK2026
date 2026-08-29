# P867 Planning Detail Copy

## Startup

```text
Path
----
C:\sgSHIOK2026

Prawn-E14
d93df576cf7219bccdaedc03476d5314b63dbd92
d93df576cf7219bccdaedc03476d5314b63dbd92	refs/heads/main
```

## Change

Browser-visible planning-area copy for bus, heat, and crossing now says `locked-score detail view` instead of `locked-score factor view`. The locked-score caveat remains unchanged.

## Evidence Path Ignore Check

```text
exit_code=1
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  63 passed (63)
   Start at  12:41:05
   Duration  5.83s (transform 1.89s, setup 0ms, import 2.38s, tests 1.62s, environment 1ms)
```

## Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

## Protected Path Guard

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=1
```

`rg` returned 1 because no protected modified paths matched.

## Repository Integrity

```text
repo_integrity=ok
exit_code=0
```

## Diff Stat Before Commit

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 web/app/page.tsx                                | 2 +-
 web/lib/__tests__/accessibility-render.test.tsx | 7 +++++--
 web/lib/__tests__/score-card-copy.test.ts       | 3 ++-
 3 files changed, 8 insertions(+), 4 deletions(-)
 M web/app/page.tsx
 M web/lib/__tests__/accessibility-render.test.tsx
 M web/lib/__tests__/score-card-copy.test.ts
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
?? qa/p19/hdb_2021_2026_onemap_geocode_cache.json
?? qa/p19/overpass_addr_postcodes_cache.json
?? qa/p19/universe_gap_measurement_detail.json
?? qa/p19/universe_gap_measurement_summary.json
?? qa/p21/
?? qa/p379/
?? qa/p567_baseline/
?? qa/p572_post_refresh/
?? qa/p575_compare/p575_build_delta_report.py
?? qa/p575_compare/p575_delta_report.json
?? qa/p575_compare/p575_partitions/
?? qa/p575_compare/p575_subset_first50_universe.parquet
?? qa/p575_compare/p575_subset_universe.parquet
?? qa/p8_provenance_repair_20260813/
?? qa/verification/P867-planning-detail-copy.md
?? sgSHIOK2026-copy.log
```

## FINDINGS

1. The planning-area helper still exposed implementation-ish `factor view` language for bus, heat, and crossing after the surrounding labels had already been simplified. The UI now uses `locked-score detail view`, keeping the locked-score caveat without making the user parse factor terminology.
2. No protected paths were modified, and no pipeline, export, rescore, subset, ingest, network, dependency install, or deployment command was run.

## DISAGREEMENTS

1. None for this scoped continuation.
