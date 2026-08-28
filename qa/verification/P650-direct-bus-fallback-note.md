# P650 Direct Bus Fallback Note

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Pipeline cost: zero; no scoring, export, rescore, subset run, ingest, or network build.

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The bus-service row's direct-bus fallback note now says direct bus service is shown as fallback evidence, then names the missing verified shelter-map walk to an official LTA bus stop.

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

The failure was a stale source-copy assertion that still expected the old direct-bus fallback note.

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
   Start at  11:48:27
   Duration  5.04s (transform 1.64s, setup 0ms, import 2.05s, tests 1.38s, environment 1ms)
```

## Evidence Tracking Check

Command:

```text
git check-ignore -v qa/verification/P650-direct-bus-fallback-note.md; Write-Output "exit=$LASTEXITCODE"
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
457 tests collected in 17.44s
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
   Start at  11:49:02
   Duration  49.56s (transform 2.68s, setup 0ms, import 5.50s, tests 17.54s, environment 20ms)
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

1. The direct-bus fallback bus row still said only that shelter-map walk access was not verified. The new copy is more explicit: direct bus service is fallback evidence, not a verified shelter-map walk to an official LTA bus stop.
2. The first focused run caught a stale source-copy assertion for the old note. The assertion was corrected before commit.
3. The change is web-copy only. It does not touch scoring inputs, exports, protected QA payloads, checksums, or `pipeline/config/weights.yaml`.

## DISAGREEMENTS

1. None.
