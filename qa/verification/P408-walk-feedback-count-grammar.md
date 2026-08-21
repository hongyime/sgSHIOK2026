# P408 walk feedback count grammar

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Browser copy only. No scoring, export, rescore, subset run, ingest, network build, public-data write, deployment, feedback schema removal, or locked-weight change.

## Evidence

`git check-ignore -v C:\sgSHIOK2026\qa\verification\P408-walk-feedback-count-grammar.md; $LASTEXITCODE`

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
   Start at  18:52:15
   Duration  2.68s (transform 1.19s, setup 0ms, import 1.71s, tests 603ms, environment 1ms)
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

1. P406/P407 moved the traced-correction feedback editor to walk language, but the counter could still render `2 points / 1 walk segments`.
2. P408 adds a formatter so point and walk-segment counts pluralize correctly while leaving copied feedback JSON compatibility fields untouched.

## DISAGREEMENTS

1. None.
