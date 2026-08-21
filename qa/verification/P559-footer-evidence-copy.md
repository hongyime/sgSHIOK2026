# P559 Footer Evidence Copy

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Clarify the persistent footer so covered-walkway ratio and exposed gaps are described as source-derived walk evidence, while night lighting remains map evidence.

## Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  07:20:35
   Duration  1.21s (transform 194ms, setup 0ms, import 258ms, tests 114ms, environment 0ms)
```

## Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  150 passed (150)
   Start at  07:21:00
   Duration  17.66s (transform 12.05s, setup 0ms, import 17.14s, tests 27.86s, environment 46ms)
```

## Python Collect Only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 30.76s
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

1. The previous footer phrasing grouped covered-walkway ratio, exposed gaps, and night lighting into one evidence phrase. That blurred the settled distinction between on-walk route evidence and map-only lighting evidence.
2. The clarified footer keeps the route-derived signals together as walk evidence and leaves night lighting as map evidence, matching the shelter-first screen framing.

## Disagreements

1. None.