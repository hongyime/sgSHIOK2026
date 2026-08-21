# P555 Shelter-Map View Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
7c049143058d2692ccc4d2e0526e7e82afce2e32
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

## Scope

```text
Align route map non-visual text from "shelter map" noun copy to "shelter-map view" copy.
No scoring, export, rescore, subset run, ingest, network build, upstream probe, input mutation, public-data write, protected QA mutation, deployment, or locked-weight change.
```

## Old String Search

```text
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:55:    expect(source).not.toContain("Shelter map for ${labels}, showing ${routeModeLabel(mode)}");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:56:    expect(source).not.toContain("Shelter map for ${routeLabels}.");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:49:    expect(source).not.toContain("Singapore shelter map for covered-walkway ratio, exposed gaps, transit stops, and night lighting evidence");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:50:    expect(source).not.toContain("Singapore shelter map for covered-walkway ratio, exposed gaps, transit stops, and night-lighting evidence");
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  07:04:04
   Duration  1.67s (transform 620ms, setup 0ms, import 238ms, tests 580ms, environment 1ms)
```

## Diff Check

```text
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  150 passed (150)
   Start at  07:04:40
   Duration  6.29s (transform 3.36s, setup 0ms, import 5.37s, tests 8.73s, environment 12ms)
```

## Python Collect Only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 10.79s
```

## Repository Integrity

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Evidence Check Ignore

```text
check_ignore_exit=1
```

## Protected Path Diff

```text
```

## FINDINGS

1. The map aria/text summary still said `Shelter map for ...`, which was inconsistent with the surrounding `shelter-map` adjective convention.
2. The empty-map aria label also used `Singapore shelter map ...`, while the app now presents that surface as a shelter-map view of walk evidence.

## DISAGREEMENTS

1. None.
