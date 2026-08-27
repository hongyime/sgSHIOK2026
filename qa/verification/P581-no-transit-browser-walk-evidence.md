# P581 no-transit browser walk evidence

Date: 2026-08-28
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

No scoring, export, rescore, subset run, ingest, network build, upstream probe, public-data write, protected QA mutation, deployment, or locked-weight change was performed.

## Startup guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Change

P580 made future `NO_TRANSIT_IN_RANGE` score records able to carry inspectable walk evidence while keeping `total` and `subscores` null. Before P581, the browser rendered route metrics for records with `paths`, but suppressed the four-row evidence/locked-score panel whenever `subscores` was null. P581 keeps the score unavailable while showing the covered-walkway ratio, walk distance, unavailable bus term, and unavailable release sorting index in that panel.

The existing far-connected no-transit render test used the older all-null shape. P581 changes that fixture to the P580 shape: `NO_TRANSIT_IN_RANGE`, null locked score fields, non-null `best_node`, non-null `paths`, and non-null `exposure_gaps`.

## Focused web tests

Command:

```text
npm --prefix C:\sgSHIOK2026\web test -- --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  46 passed (46)
   Start at  01:37:14
   Duration  27.22s (transform 14.86s, setup 0ms, import 16.79s, tests 2.01s, environment 1ms)
```

## Full web test before timeout correction

Command:

```text
npm --prefix C:\sgSHIOK2026\web test
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/typescript-contract.test.ts (1 test | 1 failed) 225491ms
     × type-checks rank payload projections 225477ms

Failed Tests 1

 FAIL  lib/__tests__/typescript-contract.test.ts > typescript contracts > type-checks rank payload projections
Error: Test timed out in 30000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ lib/__tests__/typescript-contract.test.ts:6:3
      4|
      5| describe("typescript contracts", () => {
      6|   it("type-checks rank payload projections", () => {
       |   ^
      7|     const webRoot = join(__dirname, "../..");
      8|     const tscBin = join(webRoot, "node_modules", "typescript", "bin", …

[1/1]


 Test Files  1 failed | 22 passed (23)
      Tests  1 failed | 150 passed (151)
   Start at  01:39:05
   Duration  387.48s (transform 11.80s, setup 0ms, import 26.33s, tests 240.08s, environment 191ms)
```

## Standalone TypeScript contract

Command:

```text
node C:\sgSHIOK2026\web\node_modules\typescript\bin\tsc --noEmit --pretty false; Write-Output "tsc_exit=$LASTEXITCODE"
```

Output:

```text
tsc_exit=0
```

The contract assertion was sound but the Vitest per-test timeout was too small for this E14 run. The timeout was raised from 30 seconds to 300 seconds; the assertion still shells out to the same `tsc --noEmit --pretty false` command and still fails on type errors.

## Full web test after timeout correction

Command:

```text
npm --prefix C:\sgSHIOK2026\web test
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  151 passed (151)
   Start at  01:48:23
   Duration  135.32s (transform 5.92s, setup 0ms, import 12.82s, tests 22.15s, environment 24ms)
```

## Python collection

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 5
```

Output:

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

439 tests collected in 91.08s (0:01:31)
```

## Repository integrity

Command:

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "repo_integrity_exit=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Evidence ignore check

Command:

```text
git check-ignore -v C:\sgSHIOK2026\qa\verification\P581-no-transit-browser-walk-evidence.md; Write-Output "check_ignore_exit=$LASTEXITCODE"
```

Output:

```text
check_ignore_exit=1
```

## Protected path diff

Command:

```text
git diff --name-only -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\releases C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11; Write-Output "protected_diff_exit=$LASTEXITCODE"
```

Output:

```text
protected_diff_exit=0
```

## FINDINGS

1. P580's pipeline record shape was not yet pinned in the browser: a no-transit record with route paths and null locked score fields rendered route metrics, but the four-row shelter-map evidence and locked-score panel was hidden because it was gated on `score.subscores`.
2. The existing far-connected browser fixture still represented the old all-null `NO_TRANSIT_IN_RANGE` shape, so it could not catch regressions in the new path-bearing no-transit shape.
3. The TypeScript contract test was valid but had an E14-hostile 30-second timeout around a shell-out to `tsc`; direct `tsc --noEmit --pretty false` exited 0, and raising only that test's timeout made the full web suite pass.

## DISAGREEMENTS

1. None.
