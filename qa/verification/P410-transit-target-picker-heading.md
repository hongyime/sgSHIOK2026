# P410 transit target picker heading

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Browser copy only. No scoring, export, rescore, subset run, ingest, network build, public-data write, deployment, transit-candidate mutation, route-geometry change, or locked-weight change.

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs transit-stop-picker.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  49 passed (49)
   Start at  18:58:07
   Duration  984ms (transform 411ms, setup 0ms, import 564ms, tests 120ms, environment 0ms)
```

```text
git check-ignore -v -- 'C:\sgSHIOK2026\qa\verification\P410-transit-target-picker-heading.md'; Write-Output "EXIT=$LASTEXITCODE"
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

1. The transit-stop picker header said generic `Nearby transit`, and its chip group aria-label said `Nearby transit stops`, while the score-card framing treats these chips as transit targets for the walk comparison.
2. P410 changes both visible and non-visual picker labels to `Nearby transit targets` without changing candidate selection behavior.

## DISAGREEMENTS

1. None.
