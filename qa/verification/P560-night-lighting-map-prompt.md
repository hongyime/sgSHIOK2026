# P560 Night Lighting Map Prompt

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Clarify first-view and no-selection prompts so covered-walkway ratio and exposed gaps are described as on-walk evidence, while night lighting is named as map evidence.

## Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  55 passed (55)
   Start at  07:25:12
   Duration  2.36s (transform 1.47s, setup 0ms, import 1.61s, tests 1.28s, environment 1ms)
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
   Start at  07:25:37
   Duration  16.48s (transform 13.00s, setup 0ms, import 16.84s, tests 26.18s, environment 24ms)
```

## Python Collect Only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 32.47s
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

1. The brand subtitle and no-selection prompt still said users could inspect night lighting on the walk to transit, even though the current night-lighting implementation is an LTA lamp-post map layer outside the locked score.
2. The updated prompts now describe covered-walkway ratio and exposed gaps as on-walk evidence, and night lighting as map evidence.

## Disagreements

1. None.