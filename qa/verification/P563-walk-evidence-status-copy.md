# P563 Walk Evidence Status Copy

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Use `walk evidence` in screen-reader status, unavailable metadata, planning-area helper copy, and transit-stop comparison copy where the UI is referring to covered-walkway ratio and exposed gaps on the walk.

## Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\transit-stop-picker.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  78 passed (78)
   Start at  07:36:49
   Duration  2.44s (transform 1.92s, setup 0ms, import 2.68s, tests 686ms, environment 1ms)
```

## Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  150 passed (150)
   Start at  07:37:09
   Duration  6.34s (transform 3.50s, setup 0ms, import 5.18s, tests 9.07s, environment 11ms)
```

## Python Collect Only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 11.09s
```

## Repository Integrity

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Evidence Ignore Check

```text
check_ignore_exit=1
```

## Protected Diff Check

```text

```

## Findings

1. Several user-facing non-visual/helper strings still said generic `shelter evidence` even when the evidence being described was the walk's covered-walkway ratio and exposed gaps.
2. The updated copy now says `walk evidence` for those status/helper contexts, while leaving the broader product term `shelter-map evidence` intact where it refers to the bundle or preview mode.

## Disagreements

1. None.