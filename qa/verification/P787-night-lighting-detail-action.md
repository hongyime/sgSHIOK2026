# P787 Night Lighting Detail Action

## Scope

Zero-pipeline browser product change. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected evidence mutation, or `pipeline/config/weights.yaml` edit.

## Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Change

Night lighting is the second product layer after shelter exposure. The selected-walk detail strip already stated whether the map layer was off, but the user had to find the separate map-layer toggle above the card. P787 adds a compact `Switch on night lighting` action inside the walk-details strip when the layer is off. It reuses the existing `lampOverlayEnabled` state and existing map overlay implementation; it does not add or regenerate lamp data.

## Focused Web Test

```text
PS C:\sgSHIOK2026> npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  02:24:23
   Duration  5.00s (transform 1.65s, setup 0ms, import 2.09s, tests 1.24s, environment 1ms)
```

## Full Web Test

```text
PS C:\sgSHIOK2026> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  02:24:44
   Duration  33.92s (transform 2.18s, setup 0ms, import 4.62s, tests 9.41s, environment 14ms)
```

## Collection

```text
PS C:\sgSHIOK2026> uv run pytest -q --collect-only | Select-Object -Last 1
624 tests collected in 12.50s
```

## Integrity

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

## Protected Diff Guard

```text
PS C:\sgSHIOK2026> git diff --name-only -- pipeline/config/weights.yaml web/public/data checksums.json qa/releases qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11
```

## FINDINGS

1. The night-lighting layer existed and was described in the selected-walk details, but the detail strip did not provide a local way to enable it.
2. P787 makes the second product layer actionable from the place where the user sees its state.
3. No test-count movement occurred; Python collection remains 624 and web remains 166.

## DISAGREEMENTS

1. None.
