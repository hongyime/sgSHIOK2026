# P783 Shelter Action Copy Alignment

## Scope

Zero-pipeline browser copy change. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected evidence mutation, or `pipeline/config/weights.yaml` edit.

## Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Change

The visible exposed-gap action already says `Report missing shelter`, while the inactive overflow menu action still said `Trace shelter correction`. P783 aligns the overflow label to `Report missing shelter` and keeps the active state as `Done tracing shelter`.

## Focused Web Test

```text
PS C:\sgSHIOK2026> npm --prefix web test -- score-card-copy.test.ts accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  02:02:34
   Duration  12.47s (transform 5.56s, setup 0ms, import 6.89s, tests 1.66s, environment 1ms)
```

## Full Web Test

```text
PS C:\sgSHIOK2026> npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  02:04:04
   Duration  62.57s (transform 3.50s, setup 0ms, import 8.80s, tests 28.65s, environment 24ms)
```

## Collection

```text
PS C:\sgSHIOK2026> uv run pytest -q --collect-only | Select-Object -Last 1
620 tests collected in 46.56s
```

## Integrity

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

## Protected Diff Guard

```text
PS C:\sgSHIOK2026> git diff --name-only -- pipeline/config/weights.yaml web/public/data checksums.json qa/releases qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11
```

## FINDINGS

1. P779 left a visible copy inconsistency: exposed-gap CTA used `Report missing shelter`, but the overflow entry still used `Trace shelter correction`.
2. The correction workflow is easier to recognize when every inactive entry point uses the same verb phrase.

## DISAGREEMENTS

1. None.
