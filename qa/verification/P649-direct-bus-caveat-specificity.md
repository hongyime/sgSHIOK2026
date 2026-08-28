# P649 Direct Bus Caveat Specificity

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Pipeline cost: zero; no scoring, export, rescore, subset run, ingest, or network build.

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The direct-bus fallback locked-score caveat now names direct bus service evidence instead of generic nearby bus evidence.

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
   Start at  11:41:05
   Duration  4.30s (transform 1.39s, setup 0ms, import 1.80s, tests 1.05s, environment 1ms)
```

## Evidence Tracking Check

Command:

```text
git check-ignore -v qa/verification/P649-direct-bus-caveat-specificity.md; Write-Output "exit=$LASTEXITCODE"
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
457 tests collected in 78.66s (0:01:18)
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
   Start at  11:43:25
   Duration  39.74s (transform 2.49s, setup 0ms, import 4.74s, tests 13.67s, environment 11ms)
```

## Diff Check

Command:

```text
git diff --check; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
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

1. Direct-bus fallback records still had one rendered locked-score caveat that said "nearby bus evidence"; the surrounding UI had already moved to "direct bus service" wording, so this was inconsistent and less precise.
2. The change is web-copy only. It does not touch scoring inputs, exports, protected QA payloads, checksums, or `pipeline/config/weights.yaml`.

## DISAGREEMENTS

1. None.
