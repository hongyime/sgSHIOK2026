# P655 Crossing Score Contribution Copy

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Pipeline cost: zero; no scoring, export, rescore, subset run, ingest, or network build.

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The locked-score row now says crossing friction still contributes 5% to the locked score, instead of calling it a 5% locked term.

## Focused Web Tests

Command:

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  12:13:55
   Duration  6.33s (transform 2.03s, setup 0ms, import 2.57s, tests 1.75s, environment 1ms)
```

## Evidence Tracking Check

Command:

```text
git check-ignore -v qa/verification/P655-crossing-score-contribution-copy.md; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
exit=1
```

## Python Collect-Only

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
457 tests collected in 30.49s
```

## Repository Integrity

Command:

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit=0
```

## Full Web Tests

Command:

```text
npm --prefix web test
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  12:15:01
   Duration  48.03s (transform 2.74s, setup 0ms, import 4.86s, tests 24.49s, environment 15ms)
```

## Diff Check

Command:

```text
git diff --check; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit=0
```

## Protected Path Check

Command:

```text
git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
exit=0
```

## FINDINGS

1. The locked-score row still described crossing friction as a `5% locked term`, which is more formula-internal than the current secondary-score presentation needs. The new copy says it contributes 5% to the locked score.
2. The change is web-copy only. It does not touch scoring inputs, exports, protected QA payloads, checksums, or `pipeline/config/weights.yaml`.

## DISAGREEMENTS

1. None.
