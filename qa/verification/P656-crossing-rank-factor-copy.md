# P656 Crossing Rank Factor Copy

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Pipeline cost: zero; no scoring, export, rescore, subset run, ingest, or network build.

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The planning-area comparison selector now labels crossing as `Crossing-friction score factor`, and the helper says `Planning-area locked-score factor view`.

## First Focused Web Test Run

Command:

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts
```

Output:

```text
Test Files  1 failed | 1 passed (2)
     Tests  1 failed | 54 passed (55)
```

The failure was a stale rendered-helper assertion still expecting `Planning-area locked-term view`.

## Corrected Focused Web Test Run

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
   Start at  12:19:43
   Duration  58.05s (transform 25.47s, setup 0ms, import 30.83s, tests 2.24s, environment 3ms)
```

## First Full Web Test Run

Command:

```text
npm --prefix web test
```

Output:

```text
Test Files  1 failed | 23 passed (24)
     Tests  1 failed | 165 passed (166)
```

The failure was a stale `subscore-ranking.test.ts` assertion still expecting `Crossing-friction locked term`.

## Corrected Focused Rank Test Run

Command:

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts lib/__tests__/subscore-ranking.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts lib/__tests__/subscore-ranking.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  59 passed (59)
   Start at  12:23:05
   Duration  15.49s (transform 4.57s, setup 0ms, import 5.82s, tests 3.31s, environment 3ms)
```

## Corrected Full Web Test Run

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
   Start at  12:23:45
   Duration  29.69s (transform 1.96s, setup 0ms, import 3.91s, tests 8.52s, environment 11ms)
```

## Python Collect-Only

Command:

```text
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
457 tests collected in 18.84s
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

## Evidence Tracking Check

Command:

```text
git check-ignore -v qa/verification/P656-crossing-rank-factor-copy.md; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
exit=1
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

1. The planning-area comparison UI still called crossing friction a locked term in both the selector and helper copy. `Score factor` keeps it distinct from shelter evidence without exposing formula-internal term wording.
2. The first focused run caught a stale rendered-helper assertion for the old copy. The assertion was corrected before commit.
3. The first full web run caught a stale rank-label unit-test assertion for the old selector label. The assertion was corrected before commit.
4. The change is web-copy only. It does not touch scoring inputs, exports, protected QA payloads, checksums, or `pipeline/config/weights.yaml`.

## DISAGREEMENTS

1. None.
