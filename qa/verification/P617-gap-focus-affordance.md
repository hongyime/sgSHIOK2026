# P617 gap focus affordance

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

```text
Free-tier web UI affordance change. No scoring, export, rescore, subset run, ingest, network build, upstream API probe, input mutation, protected QA mutation, public-data write, deployment, or locked-weight change was performed.
```

## Change

```text
Coordinate-backed exposed-gap rows already acted as map-focus buttons, but the visible row text did not say that. P617 adds a compact "Focus map" affordance to actionable gap rows and gives the gap row a third fixed grid column so the action does not collide with the length or coordinate text.
```

## Focused tests

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  2 passed (2)
      Tests  47 passed (47)
   Start at  08:55:41
   Duration  7.35s (transform 2.45s, setup 0ms, import 3.01s, tests 1.42s, environment 1ms)
```

## Full web test

```text
npm --prefix web test

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  24 passed (24)
      Tests  158 passed (158)
   Start at  08:56:19
   Duration  30.75s (transform 1.87s, setup 0ms, import 3.63s, tests 10.29s, environment 10ms)
```

## Python collect-only

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 13.53s
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
git check-ignore -v qa/verification/P617-gap-focus-affordance.md
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
web/app/page.module.css                         | 12 +++++++++++-
web/app/page.tsx                                |  1 +
web/lib/__tests__/accessibility-render.test.tsx |  1 +
web/lib/__tests__/score-card-copy.test.ts       |  5 +++++
4 files changed, 18 insertions(+), 1 deletion(-)
```

## FINDINGS

1. Coordinate-backed exposed-gap rows were already clickable map-focus controls, but the visible row text did not tell users they could focus the map from that row.
2. P617 adds a visible "Focus map" affordance only when a focus target and handler exist, preserving non-clickable rows as plain evidence.
3. This is a user-visible affordance change only; route geometry, score values, exported data, protected artifacts, deployment state, and locked weights are unchanged.

## DISAGREEMENTS

1. None.
