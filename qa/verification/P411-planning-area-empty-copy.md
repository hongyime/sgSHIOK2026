# P411 planning-area empty copy

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Browser copy only. No scoring, export, rescore, subset run, ingest, network build, public-data write, deployment, ranking-data mutation, ranking-order change, score-value change, or locked-weight change.

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

```text
npm --prefix web test -- accessibility-render.test.tsx score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  39 passed (39)
   Start at  19:06:12
   Duration  1.57s (transform 831ms, setup 0ms, import 1.08s, tests 322ms, environment 0ms)
```

```text
git check-ignore -v -- 'C:\sgSHIOK2026\qa\verification\P411-planning-area-empty-copy.md'; Write-Output "EXIT=$LASTEXITCODE"
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

1. The planning-area comparison empty state always said `No comparable full locked scores in this planning area`, even after the selected comparison view changed to non-score evidence such as rain-shelter evidence.
2. P411 preserves that sentence for the locked-score view and uses `No comparable planning-area records for ...` for non-overall evidence views.

## DISAGREEMENTS

1. None.
