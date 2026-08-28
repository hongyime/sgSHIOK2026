# P620 night-lighting route detail

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
The selected-walk Night lighting detail now gives an action in the off state: "Map layer off; switch on night lighting, then zoom in". The on state remains "Map layer on; zoom in for lamp-post points". This aligns the selected panel with the stateful page-level night-lighting toggle and note.
```

## Lingering old-text check

```text
rg -n "Available; map layer off|nightLightingRouteDetailValue|Map layer off; switch on night lighting" web/app/page.tsx web/lib/__tests__
web/app/page.tsx:121:export function nightLightingRouteDetailValue(lampOverlayEnabled: boolean): string {
web/app/page.tsx:124:    : "Map layer off; switch on night lighting, then zoom in";
web/app/page.tsx:1286:      value: nightLightingRouteDetailValue(lampOverlayEnabled),
web/lib/__tests__\accessibility-render.test.tsx:18:  nightLightingRouteDetailValue,
web/lib/__tests__\accessibility-render.test.tsx:222:    expect(nightLightingRouteDetailValue(false)).toBe(
web/lib/__tests__\accessibility-render.test.tsx:223:      "Map layer off; switch on night lighting, then zoom in"
web/lib/__tests__\accessibility-render.test.tsx:225:    expect(nightLightingRouteDetailValue(true)).toBe("Map layer on; zoom in for lamp-post points");
web/lib/__tests__\accessibility-render.test.tsx:568:    expect(html).toContain("Map layer off; switch on night lighting, then zoom in");
web/lib/__tests__\accessibility-render.test.tsx:569:    expect(html).not.toContain("Available; map layer off");
web/lib/__tests__\accessibility-render.test.tsx:654:    expect(offHtml).toContain("Map layer off; switch on night lighting, then zoom in");
web/lib/__tests__\accessibility-render.test.tsx:655:    expect(offHtml).not.toContain("Available; map layer off");
web/lib/__tests__\score-card-copy.test.ts:427:    expect(tsxSource).toContain("value: nightLightingRouteDetailValue(lampOverlayEnabled),");
web/lib/__tests__\score-card-copy.test.ts:428:    expect(tsxSource).toContain("export function nightLightingRouteDetailValue(lampOverlayEnabled: boolean): string");
web/lib/__tests__\score-card-copy.test.ts:429:    expect(tsxSource).toContain("Map layer off; switch on night lighting, then zoom in");
web/lib/__tests__\score-card-copy.test.ts:432:    expect(tsxSource).not.toContain("Available; map layer off");
```

## Focused tests

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  49 passed (49)
   Start at  09:14:34
   Duration  6.46s (transform 2.12s, setup 0ms, import 2.62s, tests 1.28s, environment 1ms)
```

## Full web test

```text
npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  24 passed (24)
      Tests  160 passed (160)
   Start at  09:15:04
   Duration  32.76s (transform 1.69s, setup 0ms, import 3.46s, tests 13.01s, environment 9ms)
```

## Python collect-only

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 14.47s
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
git check-ignore -v qa/verification/P620-night-lighting-route-detail.md
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
web/app/page.tsx                                |  8 ++++++-
web/lib/__tests__/accessibility-render.test.tsx | 32 +++++++++++++++++--------
web/lib/__tests__/score-card-copy.test.ts       |  5 +++-
3 files changed, 33 insertions(+), 12 deletions(-)
```

## FINDINGS

1. After P619, the page-level night-lighting note was state-aware, but the selected-walk detail still said "Available; map layer off", which did not tell the user how to inspect the lamp-post layer.
2. P620 makes the selected-walk off state actionable while keeping night lighting clearly outside the locked score.
3. Web tests now collect and pass 160 tests; Python collect-only remains 457.

## DISAGREEMENTS

1. None.
