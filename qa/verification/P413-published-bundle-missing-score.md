# P413 published bundle missing score

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Browser copy and smoke-script alignment only. No scoring, export, rescore, subset run, ingest, network build, public-data write, deployment, search behavior change, route-geometry change, score-state change, score-value change, or locked-weight change.

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

```text
npm --prefix web test -- accessibility-render.test.tsx score-card-copy.test.ts route-evidence-map-interaction.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  49 passed (49)
   Start at  19:16:10
   Duration  7.44s (transform 5.52s, setup 0ms, import 6.47s, tests 4.30s, environment 3ms)
```

```text
git check-ignore -v -- 'C:\sgSHIOK2026\qa\verification\P413-published-bundle-missing-score.md'; Write-Output "EXIT=$LASTEXITCODE"
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
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
EXIT=0
```

## FINDINGS

1. Missing locked-score visible reasons and live-region copy still said `in this bundle`, even after P412 moved other absence caveats to `published shelter-map bundle`.
2. P413 changes those missing-score phrases to `published shelter-map bundle` and updates browser-smoke acceptance to match.

## DISAGREEMENTS

1. None.
