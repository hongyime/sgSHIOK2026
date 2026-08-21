# P414 transit candidate contract

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Source-contract wording and test coverage only. No scoring, export, rescore, subset run, ingest, network build, public-data write, deployment, candidate-derivation change, transit-selection change, route-geometry change, score-value change, or locked-weight change.

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

```text
npm --prefix web test -- transit-stop-picker.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs transit-stop-picker.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  33 passed (33)
   Start at  19:20:07
   Duration  1.19s (transform 323ms, setup 0ms, import 472ms, tests 82ms, environment 1ms)
```

```text
git check-ignore -v -- 'C:\sgSHIOK2026\qa\verification\P414-transit-candidate-contract.md'; Write-Output "EXIT=$LASTEXITCODE"
EXIT=1
```

```text
python scripts/check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
git diff -- 'C:\sgSHIOK2026\pipeline\config\weights.yaml' 'C:\sgSHIOK2026\checksums.json' 'C:\sgSHIOK2026\web\public\data' 'C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712' 'C:\sgSHIOK2026\qa\p7_determinism_20260813' 'C:\sgSHIOK2026\qa\p8_provenance_repair_20260813' 'C:\sgSHIOK2026\qa\p9_input_provenance_20260813' 'C:\sgSHIOK2026\qa\p10_network_provenance_20260813' 'C:\sgSHIOK2026\qa\p11' 'C:\sgSHIOK2026\qa\releases'; Write-Output "EXIT=$LASTEXITCODE"
EXIT=0
```

```text
git diff --check; Write-Output "EXIT=$LASTEXITCODE"
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
EXIT=0
```

## FINDINGS

1. `nearest-transit.ts` still described candidate-list limits as a property of the `current shelter-map bundle` and `today's bundle`, while nearby user-facing caveats now use the published-artifact boundary.
2. P414 changes that source contract to `published shelter-map bundle` without changing candidate ranking, transit selection, or route evidence.

## DISAGREEMENTS

1. None.
