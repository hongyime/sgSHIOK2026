# P622 exposed gap coordinate summary

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

```text
Free-tier web accessibility copy change. No scoring, export, rescore, subset run, ingest, network build, upstream API probe, input mutation, protected QA mutation, public-data write, deployment, or locked-weight change was performed.
```

## Change

```text
The non-visual selected exposed-gap map summary now says "Selected exposed gap marker at map coordinate <lat>, <lon>." instead of "near <lat>, <lon>.", matching the exposed-gap list and focus-button wording.
```

## Old-copy search

```text
rg -n "Selected exposed gap marker near|Selected exposed gap marker at map coordinate|near 1\.37123" web/components/route-evidence-map.tsx web/lib/__tests__/route-evidence-map-interaction.test.ts
web/lib/__tests__/route-evidence-map-interaction.test.ts:169:      "Selected exposed gap marker at map coordinate 1.37123, 103.84235."
web/lib/__tests__/route-evidence-map-interaction.test.ts:172:      "near 1.37123, 103.84235"
web/components/route-evidence-map.tsx:1031:  return `Selected exposed gap marker at map coordinate ${focusedExposureGap.lat.toFixed(5)}, ${focusedExposureGap.lon.toFixed(5)}.`;
```

## Focused test

```text
npm --prefix web test -- lib/__tests__/route-evidence-map-interaction.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  09:22:57
   Duration  1.89s (transform 810ms, setup 0ms, import 185ms, tests 790ms, environment 1ms)
```

## Full web test

```text
npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  24 passed (24)
      Tests  160 passed (160)
   Start at  09:23:17
   Duration  26.22s (transform 1.71s, setup 0ms, import 3.33s, tests 9.07s, environment 9ms)
```

## Python collect-only

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 11.41s
```

## Repository integrity

```text
python scripts/check_repo_integrity.py
Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

## Evidence path ignore check

```text
git check-ignore -v qa/verification/P622-exposed-gap-coordinate-summary.md
Write-Output "exit=$LASTEXITCODE"
exit=1
```

## Protected diff

```text
git diff --name-only -- pipeline/config/weights.yaml checksums.json web/public/data qa/releases 'qa/p6_*' 'qa/p7_*' 'qa/p8_*' 'qa/p9_*' 'qa/p10_*' 'qa/p11/d_*'
Write-Output "exit=$LASTEXITCODE"
exit=0
```

## Diff stat before commit

```text
web/components/route-evidence-map.tsx                    | 2 +-
web/lib/__tests__/route-evidence-map-interaction.test.ts | 5 ++++-
2 files changed, 5 insertions(+), 2 deletions(-)
```

## FINDINGS

1. Exposed-gap rows and focus buttons used exact "map coordinate" wording, but the map's non-visual selected-gap summary still said the marker was "near" the coordinate.
2. P622 aligns that screen-reader summary with the same coordinate evidence wording used in the visual exposed-gap controls.
3. This is an accessibility copy change only; route geometries, exposed-gap data, exported artifacts, scoring, deployment, and locked weights are unchanged.

## DISAGREEMENTS

1. None.
