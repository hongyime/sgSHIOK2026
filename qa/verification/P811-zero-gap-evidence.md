# P811 Zero-Gap Evidence State

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Make zero exposed gaps visible as positive shelter-map evidence instead of hiding the exposed-gap section.

No scoring, export, rescore, subset run, ingest, network build, public-data mutation, protected evidence mutation, deployment, or locked-weight change was performed.

## Startup Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Finding

Before P811, the render test for a zero-gap selected walk accepted the hero sentence `No exposed gaps are recorded for this shortest walk.` but asserted that the exposed-gap section was absent. That made a favorable route state visually weaker than routes with gaps, even though exposed gaps are the headline inspectable artifact.

## Change

The score card now renders an `Exposed gap evidence` block for scored, non-preview, non-direct-bus-fallback walks with zero recorded gaps:

```text
No exposed gaps are recorded for this shortest walk.
All recorded segments for this display stay under covered-walkway or connector evidence.
```

Routes with one or more exposed gaps keep the existing sorted gap list and map-focus actions.

## Initial Test Failure

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/score-card-copy.test.ts (17 tests | 1 failed) 148ms
     × renders zero exposed gaps as evidence instead of hiding the gap section 20ms

Failed Tests 1

 FAIL  lib/__tests__/score-card-copy.test.ts > score card copy > renders zero exposed gaps as evidence instead of hiding the gap section
ReferenceError: readPageSource is not defined
 ❯ lib/__tests__/score-card-copy.test.ts:841:20
    839|
    840|   it("renders zero exposed gaps as evidence instead of hiding the gap …
    841|     const source = readPageSource();
       |                    ^
    842|
    843|     expect(source).toContain('aria-label="Exposed gap evidence"');

[Vitest separator line omitted after terminal copy corruption]


 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 56 passed (57)
   Start at  06:38:25
   Duration  4.59s (transform 1.46s, setup 0ms, import 1.87s, tests 1.19s, environment 1ms)
```

The source-level test was corrected to use the local file's existing `readFileSync(join(...))` pattern.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  57 passed (57)
   Start at  06:39:04
   Duration  3.98s (transform 1.20s, setup 0ms, import 1.56s, tests 904ms, environment 1ms)
```

```text
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs
tests/test_triage_onemap_outliers.py::test_triage_cli_refuses_existing_explicit_output_before_input_reads

629 tests collected in 9.33s
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

1. A zero-gap walk was treated as absence of gap evidence in the detailed panel, even though it is a favorable shelter-map result.
2. Rendering a stable zero-gap evidence block keeps the product hierarchy consistent: exposed gaps remain visible whether the answer is "here are the gaps" or "none recorded".
3. This is UI/test/evidence work only; it does not alter route geometry, scores, public-data artifacts, exports, inputs, or locked weights.

## DISAGREEMENTS

1. None.
