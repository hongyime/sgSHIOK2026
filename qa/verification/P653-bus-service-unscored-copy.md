# P653 Bus Service Unscored Copy

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14
Pipeline cost: zero; no scoring, export, rescore, subset run, ingest, or network build.

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

For records with shelter-map walk evidence but no full locked score, the bus row now says `Bus service not scored` and explains that bus service support is not computed outside the locked 1.2 km transit range.

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
   Start at  12:03:31
   Duration  42.87s (transform 15.82s, setup 0ms, import 18.95s, tests 2.11s, environment 2ms)
```

## Evidence Tracking Check

Command:

```text
git check-ignore -v qa/verification/P653-bus-service-unscored-copy.md; Write-Output "exit=$LASTEXITCODE"
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
457 tests collected in 20.56s
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
   Start at  12:04:42
   Duration  43.38s (transform 2.52s, setup 0ms, import 8.07s, tests 14.25s, environment 11ms)
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

1. The no-full-score bus row still exposed `Locked bus term unavailable` to users. The new copy keeps the release rule visible without using formula-internal term language.
2. The change is web-copy only. It does not touch scoring inputs, exports, protected QA payloads, checksums, or `pipeline/config/weights.yaml`.

## DISAGREEMENTS

1. None.
