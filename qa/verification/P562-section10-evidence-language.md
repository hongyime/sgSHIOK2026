# P562 Section 10 Evidence Language

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Align the Section 10 presentation reference with the implemented live copy by replacing internal `shelter trace` language with covered-walkway ratio, exposed-gap, and shelter-map walk evidence language.

## Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  07:32:20
   Duration  762ms (transform 99ms, setup 0ms, import 134ms, tests 52ms, environment 0ms)
```

## Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

## Shelter Trace Search

```text
```

Exit code: 1

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  150 passed (150)
   Start at  07:32:38
   Duration  8.44s (transform 5.31s, setup 0ms, import 8.62s, tests 11.73s, environment 13ms)
```

## Python Collect Only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 16.16s
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

1. The implemented app copy had moved away from `shelter trace`, but the Section 10 reference still used that internal shorthand.
2. The Section 10 reference now names the defensible evidence as covered-walkway ratio, exposed gaps, and shelter-map walk evidence.

## Disagreements

1. None.