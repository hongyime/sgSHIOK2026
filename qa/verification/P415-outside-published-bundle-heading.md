# P415 outside published bundle heading

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Browser copy and test coverage only. No scoring, export, rescore, subset run, ingest, network build, public-data write, deployment, search behavior change, route-geometry change, score-value change, or locked-weight change.

## Commands

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

```text
npm --prefix web test -- accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  23 passed (23)
   Start at  19:23:35
   Duration  5.06s (transform 2.03s, setup 0ms, import 2.62s, tests 1.01s, environment 2ms)
```

```text
git check-ignore -v -- 'C:\sgSHIOK2026\qa\verification\P415-outside-published-bundle-heading.md'; Write-Output "EXIT=$LASTEXITCODE"
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
EXIT=0
```

## FINDINGS

1. The outside-bundle empty-state heading still said `Outside shelter-map bundle` while the body now referred to the `published shelter-map bundle`.
2. P415 changes the heading to `Outside published shelter-map bundle` without changing search behavior or data.

## DISAGREEMENTS

1. None.
