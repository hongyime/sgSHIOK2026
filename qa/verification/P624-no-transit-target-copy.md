# P624 no-transit target copy

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
The no-candidate NO_TRANSIT_IN_RANGE title and reason now say "No qualifying transit target within 1.2 km" instead of "No qualifying transit stop within 1.2 km", matching the detailed note that the locked range covers MRT/LRT exits and bus stops.
```

## Old-copy search

```text
rg -n "No qualifying transit stop within 1\.2 km|No qualifying transit target within 1\.2 km" web/app/page.tsx web/lib/__tests__
web/app/page.tsx:549:  if (reason === "no_transit_candidates_selected") return "No qualifying transit target within 1.2 km";
web/app/page.tsx:820:      return ["No qualifying transit target within 1.2 km", "Outside locked transit range"];
web/lib/__tests__\accessibility-render.test.tsx:905:    expect(html).toContain("No qualifying transit target within 1.2 km");
web/lib/__tests__\accessibility-render.test.tsx:906:    expect(html).not.toContain("No qualifying transit stop within 1.2 km");
web/lib/__tests__\score-card-copy.test.ts:28:    expect(source).toContain("No qualifying transit target within 1.2 km");
web/lib/__tests__\score-card-copy.test.ts:29:    expect(source).not.toContain("No qualifying transit stop within 1.2 km");
```

## Focused tests

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  49 passed (49)
   Start at  09:31:41
   Duration  4.25s (transform 1.34s, setup 0ms, import 1.76s, tests 929ms, environment 1ms)
```

## Full web test

```text
npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  24 passed (24)
      Tests  160 passed (160)
   Start at  09:32:07
   Duration  56.44s (transform 3.44s, setup 0ms, import 5.80s, tests 29.30s, environment 12ms)
```

## Python collect-only

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 26.22s
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
git check-ignore -v qa/verification/P624-no-transit-target-copy.md
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
web/lib/__tests__/accessibility-render.test.tsx | 3 ++-
web/lib/__tests__/score-card-copy.test.ts       | 3 ++-
3 files changed, 6 insertions(+), 4 deletions(-)
```

## FINDINGS

1. The no-candidate no-transit title said "transit stop" even though the detailed user-facing note correctly covers MRT/LRT exits and bus stops.
2. P624 changes the title/reason summary to "transit target" and guards against the old stop-only phrase.
3. This is a copy-only web change; no transit data, score values, route geometry, exported artifacts, deployment, or locked weights changed.

## DISAGREEMENTS

1. None.
