# P409 custom transit stop live-region

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Accessibility copy only. No scoring, export, rescore, subset run, ingest, network build, public-data write, deployment, transit-candidate mutation, route-geometry change, or locked-weight change.

## Evidence

`git check-ignore -v C:\sgSHIOK2026\qa\verification\P409-custom-transit-stop-live-region.md; $LASTEXITCODE`

```text
1
```

`npm --prefix web test -- accessibility-render.test.tsx score-card-copy.test.ts`

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  38 passed (38)
   Start at  18:55:25
   Duration  2.66s (transform 1.19s, setup 0ms, import 1.89s, tests 477ms, environment 1ms)
```

`python scripts/check_repo_integrity.py; $LASTEXITCODE`

```text
repo_integrity=ok
0
```

`git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11 C:\sgSHIOK2026\qa\releases`

```text
```

## FINDINGS

1. The visible selected-stop badge already said `Viewing selected transit stop`, but the score-card live region still announced generic `Custom stop selected`.
2. P409 changes the live-region status to `Custom transit stop selected` so non-visual users hear that the selected item is the transit target for the walk comparison.

## DISAGREEMENTS

1. None.
