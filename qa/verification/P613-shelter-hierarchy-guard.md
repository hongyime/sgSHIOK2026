# P613 shelter hierarchy guard

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

```text
Free-tier web test guard only. No scoring, export, rescore, subset run, ingest, network build, upstream API probe, input mutation, protected QA mutation, public-data write, deployment, or locked-weight change was performed.
```

## Change

```text
web/lib/__tests__/accessibility-render.test.tsx now asserts that .exposureHero strong has a larger font-size than .scoreBadge strong, pinning the settled shelter-first visual hierarchy where covered-walkway evidence remains more prominent than the locked composite.
```

## Focused test

First command used a repo-root test path while the web runner changes cwd to web, so Vitest correctly found no file and ran no tests:

```text
npm --prefix web test -- web/lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web

No test files found, exiting with code 1

filter: web/lib/__tests__/accessibility-render.test.tsx
include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exclude:  **/node_modules/**, **/.git/**
```

Correct web-relative focused command:

```text
npm --prefix web test -- lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  31 passed (31)
   Start at  08:31:33
   Duration  3.68s (transform 1.51s, setup 0ms, import 1.91s, tests 846ms, environment 0ms)
```

## Full web test

```text
npm --prefix web test

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  24 passed (24)
      Tests  158 passed (158)
   Start at  08:32:04
   Duration  106.27s (transform 3.64s, setup 0ms, import 7.47s, tests 36.94s, environment 18ms)
```

## Python collect-only

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 20.23s
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
git check-ignore -v qa/verification/P613-shelter-hierarchy-guard.md
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
web/lib/__tests__/accessibility-render.test.tsx | 27 +++++++++++++++++++++++++
1 file changed, 27 insertions(+)
```

## FINDINGS

1. The settled P18 product hierarchy was visually true but only indirectly protected by render-copy assertions; P613 adds a direct CSS contract that covered-walkway evidence remains visually larger than the locked score badge.
2. Web tests increase from 157 to 158 because this adds one regression test; Python collection remains 457.
3. This is a guardrail only: it does not change browser runtime copy, layout, data, scoring, export, deployment, protected artifacts, or locked weights.

## DISAGREEMENTS

1. None.
