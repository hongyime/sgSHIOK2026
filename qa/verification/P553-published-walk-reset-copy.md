# P553 Published Walk Reset Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
0045cb4a4cb7f285e905b6e67d26569b6a4e63c7
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
Clarify the selected-transit-stop reset copy from "Published walk" to "Published shelter-map walk" in both visible button text and screen-reader status.
No scoring, export, rescore, subset run, ingest, network build, upstream probe, input mutation, public-data write, protected QA mutation, deployment, or locked-weight change.
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  55 passed (55)
   Start at  06:56:53
   Duration  1.85s (transform 1.32s, setup 0ms, import 1.44s, tests 906ms, environment 1ms)
```

## Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  150 passed (150)
   Start at  06:57:29
   Duration  6.36s (transform 4.79s, setup 0ms, import 7.40s, tests 9.50s, environment 11ms)
```

## Python Collect Only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 11.02s
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

1. The custom-stop reset button said `Published walk`, which did not name that it restores the published shelter-map walk rather than any arbitrary walk.
2. The screen-reader status had the same ambiguity through `Published walk selected.`.

## DISAGREEMENTS

1. None.
