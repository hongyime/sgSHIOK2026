# P623 partial score walk evidence

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
The no-full-score locked-score row now says "shelter-map walk evidence remains inspectable" instead of "route evidence remains inspectable", keeping partial-score copy aligned with the shelter-first/walk-evidence framing.
```

## Old-copy search

```text
rg -n "route evidence remains inspectable|shelter-map walk evidence remains inspectable" web/app/page.tsx web/lib/__tests__
web/app/page.tsx:1433:            notes: ["No full locked score is published for this postal, but the shelter-map walk evidence remains inspectable."],
web/lib/__tests__\accessibility-render.test.tsx:849:    expect(html).toContain("No full locked score is published for this postal, but the shelter-map walk evidence remains inspectable.");
web/lib/__tests__\accessibility-render.test.tsx:850:    expect(html).not.toContain("No full locked score is published for this postal, but the route evidence remains inspectable.");
```

## Focused test

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  33 passed (33)
   Start at  09:26:46
   Duration  3.23s (transform 1.19s, setup 0ms, import 1.53s, tests 878ms, environment 0ms)
```

## Full web test

```text
npm --prefix web test
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  24 passed (24)
      Tests  160 passed (160)
   Start at  09:27:17
   Duration  46.79s (transform 2.15s, setup 0ms, import 4.23s, tests 22.93s, environment 11ms)
```

## Python collect-only

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 26.32s
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
git check-ignore -v qa/verification/P623-partial-score-walk-evidence.md
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
web/app/page.tsx                                | 2 +-
web/lib/__tests__/accessibility-render.test.tsx | 3 ++-
2 files changed, 3 insertions(+), 2 deletions(-)
```

## FINDINGS

1. The no-full-score locked-score row still used "route evidence remains inspectable", even though the rest of the selected panel frames the product as shelter-map walk evidence.
2. P623 replaces that visible note with "shelter-map walk evidence remains inspectable" and adds a render guard against the old route-evidence sentence.
3. This is a copy-only web change; score values, route geometry, exported artifacts, protected data, deployment, and locked weights are unchanged.

## DISAGREEMENTS

1. None.
