# P621 night-lighting map layer copy

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

```text
Free-tier web UI copy change. No scoring, export, rescore, subset run, ingest, network build, upstream API probe, input mutation, protected QA mutation, public-data write, deployment, or locked-weight change was performed.
```

## Change

```text
The map's visible and screen-reader night-lighting status now says "Night lighting map layer" instead of "Night lighting overlay", aligning it with the page-level layer toggle and selected-walk Night lighting detail.
```

## Old-copy search

```text
rg -n "Night lighting overlay|night lighting overlay|overlay is on" web/components web/app web/lib/__tests__
exit=1
```

## Focused test

```text
npm --prefix web test -- lib/__tests__/route-evidence-map-interaction.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  09:18:52
   Duration  1.63s (transform 615ms, setup 0ms, import 175ms, tests 621ms, environment 0ms)
```

## Full web test

```text
npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  24 passed (24)
      Tests  160 passed (160)
   Start at  09:19:20
   Duration  53.01s (transform 2.50s, setup 0ms, import 4.68s, tests 27.17s, environment 14ms)
```

## Python collect-only

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 29.21s
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
git check-ignore -v qa/verification/P621-night-lighting-map-layer-copy.md
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
web/components/route-evidence-map.tsx                   | 12 ++++++------
.../__tests__/route-evidence-map-interaction.test.ts    | 17 +++++++++--------
2 files changed, 15 insertions(+), 14 deletions(-)
```

## FINDINGS

1. The page-level control and selected-walk detail had converged on "night lighting map layer", but the map's own status copy still used "Night lighting overlay".
2. P621 removes that user-facing terminology split across every lamp-post loading state.
3. The change is copy-only for the web map status and does not touch lamp-post data, map tiles, exported data, protected artifacts, deployment, scoring, or locked weights.

## DISAGREEMENTS

1. None.
