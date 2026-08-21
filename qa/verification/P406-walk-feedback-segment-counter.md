# P406 walk feedback segment counter

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Browser copy only. No scoring, export, rescore, subset run, ingest, network build, public-data write, deployment, feedback schema removal, or locked-weight change.

## Evidence

`git check-ignore -v C:\sgSHIOK2026\qa\verification\P406-walk-feedback-segment-counter.md; $LASTEXITCODE`

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
   Start at  18:46:37
   Duration  1.32s (transform 693ms, setup 0ms, import 905ms, tests 255ms, environment 0ms)
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

1. The traced-correction editor already used `Suggest better walk`, `Copy walk QA JSON`, and `Optional walk note`, but its counter still said generic `segments`.
2. P406 changes that visible counter to `walk segments` while leaving copied feedback JSON compatibility fields untouched.

## DISAGREEMENTS

1. None.
