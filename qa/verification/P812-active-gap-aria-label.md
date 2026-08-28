# P812 Active Gap ARIA Label

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Align focused exposed-gap button accessible labels with their visible selected-map state.

No scoring, export, rescore, subset run, ingest, network build, public-data mutation, protected evidence mutation, deployment, or locked-weight change was performed.

## Startup Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Finding

Active exposed-gap rows visibly changed from `Focus on map` to `Selected on map`, and carried `aria-pressed="true"`, but their `aria-label` still said `Focus on map for...`.

## Change

Visible and hidden exposed-gap buttons now share `exposureGapMapActionLabel()`, which returns:

```text
Selected on map for ...
```

when the gap is focused, and:

```text
Focus on map for ...
```

when it is not.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  59 passed (59)
   Start at  06:46:05
   Duration  4.04s (transform 1.30s, setup 0ms, import 1.66s, tests 1.01s, environment 1ms)
```

```text
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs
tests/test_triage_onemap_outliers.py::test_triage_cli_refuses_existing_explicit_output_before_input_reads

629 tests collected in 9.77s
exit_code=0
```

```text
repo_integrity=ok
exit_code=0
```

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

## FINDINGS

1. The active exposed-gap button state was visually correct but accessibility copy still described the inactive action.
2. The fix keeps the visible label, `aria-pressed`, and `aria-label` in the same state model for both visible and hidden exposed-gap rows.
3. This is browser accessibility/test/evidence work only; it does not alter route geometry, scores, public-data artifacts, exports, inputs, or locked weights.

## DISAGREEMENTS

1. None.
