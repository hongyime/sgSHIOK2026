# P552 Rank Button Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
d6bdb5736c4861c28785704c1a565264a99f9a8c
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
?? qa/p19/
?? qa/p21/
?? qa/p379/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## Scope

```text
Change the collapsed planning-area comparison toggle from generic "Show" to "Show ranks".
No scoring, export, rescore, subset run, ingest, network build, upstream probe, input mutation, public-data write, protected QA mutation, deployment, or locked-weight change.
```

## Interrupted Focused Test Failure

```text
Command:
npm --prefix C:\sgSHIOK2026\web test -- --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts

Result:
1 failed, 44 passed

Failure:
accessibility-render.test.tsx expected "Show ranks" in html rendered with rankPanelOpen: true. That fixture renders the expanded rank selector, not the collapsed button.
```

## Focused Test After Fixture Correction

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  45 passed (45)
   Start at  06:52:10
   Duration  2.36s (transform 1.27s, setup 0ms, import 1.65s, tests 553ms, environment 1ms)
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
   Start at  06:52:54
   Duration  13.75s (transform 9.26s, setup 0ms, import 13.14s, tests 22.00s, environment 28ms)
```

## Python Collect Only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 28.31s
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

1. The collapsed planning-area rank panel button was too generic: `Show` did not name what would be revealed.
2. The first focused render assertion used an open-panel fixture, so it could not observe the collapsed button; the fixed test now renders the closed state directly.

## DISAGREEMENTS

1. None.
