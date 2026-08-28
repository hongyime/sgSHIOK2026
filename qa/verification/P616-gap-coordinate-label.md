# P616 gap coordinate label

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
Exposed-gap coordinate labels now say "Map coordinate <lat>, <lon>" instead of "Near <lat>, <lon>", and the focus button aria-label uses "at map coordinate". The exposed-gap list already showed per-gap length and coordinates; this makes the coordinate field explicit for the headline exposure-gaps evidence.
```

## Focused test

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  31 passed (31)
   Start at  08:50:36
   Duration  4.79s (transform 2.04s, setup 0ms, import 2.50s, tests 1.11s, environment 1ms)
```

## Full web test

```text
npm --prefix web test

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  158 passed (158)
   Start at  08:51:11
   Duration  42.53s (transform 2.09s, setup 0ms, import 4.17s, tests 16.27s, environment 10ms)
```

## Python collect-only

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 13.71s
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
git check-ignore -v qa/verification/P616-gap-coordinate-label.md
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
web/app/page.tsx                                | 4 ++--
web/lib/__tests__/accessibility-render.test.tsx | 9 ++++++---
2 files changed, 8 insertions(+), 5 deletions(-)
```

## FINDINGS

1. The exposed-gap list already displayed per-gap coordinates, but the visible label was generic: "Near <lat>, <lon>".
2. P616 makes the coordinate field explicit as "Map coordinate <lat>, <lon>" and aligns the focus button accessibility label.
3. This is a user-visible copy clarity change only; it does not change route geometry, score values, exported data, protected artifacts, deployment state, or locked weights.

## DISAGREEMENTS

1. None.
