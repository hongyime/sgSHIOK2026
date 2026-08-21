# P561 Covered-Walkway Breakdown Copy

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Replace internal `shelter trace` wording in the live score breakdown with explicit covered-walkway ratio and exposed-gap language.

## Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  45 passed (45)
   Start at  07:29:03
   Duration  1.89s (transform 854ms, setup 0ms, import 1.30s, tests 448ms, environment 1ms)
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
   Start at  07:29:23
   Duration  6.42s (transform 4.98s, setup 0ms, import 7.03s, tests 9.00s, environment 10ms)
```

## Python Collect Only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 13.50s
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

1. The live breakdown still used `shelter trace`, an internal shorthand, in the heat note and locked-score note.
2. The live breakdown now names the actual user-facing evidence: covered-walkway ratio and exposed gaps.

## Disagreements

1. None.