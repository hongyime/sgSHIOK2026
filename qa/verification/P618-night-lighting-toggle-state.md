# P618 night-lighting toggle state

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

```text
Free-tier web UI label change. No scoring, export, rescore, subset run, ingest, network build, upstream API probe, input mutation, protected QA mutation, public-data write, deployment, or locked-weight change was performed.
```

## Change

```text
The night-lighting map-layer toggle now uses visible stateful text: "Night lighting off" by default and "Night lighting on" when enabled. The existing aria-pressed state and lamp-post overlay behavior are unchanged.
```

## Focused tests

```text
npm --prefix web test -- lib/__tests__/route-evidence-map-interaction.test.ts lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  57 passed (57)
   Start at  09:00:14
   Duration  9.75s (transform 2.09s, setup 0ms, import 2.67s, tests 1.88s, environment 2ms)
```

## Full web test

```text
npm --prefix web test

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  158 passed (158)
   Start at  09:01:19
   Duration  46.34s (transform 2.15s, setup 0ms, import 4.02s, tests 22.21s, environment 90ms)
```

## Python collect-only

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 25.54s
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
git check-ignore -v qa/verification/P618-night-lighting-toggle-state.md
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
web/app/page.tsx                                         | 2 +-
web/lib/__tests__/route-evidence-map-interaction.test.ts | 3 ++-
2 files changed, 3 insertions(+), 2 deletions(-)
```

## FINDINGS

1. The night-lighting toggle already had `aria-pressed`, but the visible label stayed static as "Night lighting", so sighted users had to infer state from color.
2. P618 makes the second map layer's state explicit in visible text while leaving the overlay behavior unchanged.
3. This is a user-visible label change only; lamp-post data, map tiles, score values, exported data, protected artifacts, deployment state, and locked weights are unchanged.

## DISAGREEMENTS

1. None.
