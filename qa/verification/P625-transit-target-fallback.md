# P625 transit target fallback

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

```text
Free-tier web copy change. No scoring, export, rescore, subset run, ingest, network build, upstream API probe, input mutation, protected QA mutation, public-data write, deployment, or locked-weight change was performed.
```

## Change

```text
Generic selected-panel transit fallback copy now says "Selected transit target" and "No transit target loaded" instead of stop-only or nearby wording. Specific clicked-stop preview copy remains unchanged where it is actually referring to a selected transit stop.
```

## Copy search

```text
rg -n "No transit found nearby|No transit target loaded|Selected transit stop|Selected transit target|No Transit Target Loaded|No Transit Found Nearby" web/app/page.tsx web/lib/__tests__
web/app/page.tsx:1223:      ? toProperCase(score.best_node?.name ?? "Selected transit target")
web/app/page.tsx:1228:      : toProperCase(score.best_node?.name ?? "No transit target loaded");
web/lib/__tests__\accessibility-render.test.tsx:315:    expect(html).toContain("No Transit Target Loaded");
web/lib/__tests__\accessibility-render.test.tsx:316:    expect(html).not.toContain("No Transit Found Nearby");
web/lib/__tests__\score-card-copy.test.ts:70:    expect(source).toContain("No transit target loaded");
web/lib/__tests__\score-card-copy.test.ts:71:    expect(source).not.toContain("No transit found nearby");
```

## Focused tests

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  50 passed (50)
   Start at  09:36:13
   Duration  3.04s (transform 930ms, setup 0ms, import 1.24s, tests 645ms, environment 1ms)
```

## Full web test

```text
npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  24 passed (24)
      Tests  161 passed (161)
   Start at  09:36:34
   Duration  28.15s (transform 1.59s, setup 0ms, import 3.54s, tests 9.03s, environment 10ms)
```

## Python collect-only

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 11.75s
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
git check-ignore -v qa/verification/P625-transit-target-fallback.md
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
web/app/page.tsx                                |  4 ++--
web/lib/__tests__/accessibility-render.test.tsx | 15 +++++++++++++++
web/lib/__tests__/score-card-copy.test.ts       |  2 ++
3 files changed, 19 insertions(+), 2 deletions(-)
```

## FINDINGS

1. Generic selected-panel fallbacks still used "Selected transit stop" and "No transit found nearby" even though the UI now treats bus stops and MRT/LRT exits together as transit targets.
2. P625 updates those generic fallbacks to transit-target wording and adds a rendered test for the no-best-node fallback.
3. This is a web copy/accessibility guard change only; no score values, route geometry, exported artifacts, protected data, deployment, or locked weights changed.

## DISAGREEMENTS

1. None.
