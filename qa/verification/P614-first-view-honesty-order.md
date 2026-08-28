# P614 first-view honesty order

## Root guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Scope

```text
Free-tier web copy regression only. No scoring, export, rescore, subset run, ingest, network build, upstream API probe, input mutation, protected QA mutation, public-data write, deployment, or locked-weight change was performed.
```

## Change

```text
web/lib/__tests__/score-card-copy.test.ts now asserts that first-view title-card source order keeps the user-facing honesty sequence intact:
1. shelter-map evidence date
2. frozen June 2020 address universe
3. 16 Aug 2026 public-source sample
4. OSM addr:postcode cross-check
5. source freshness
6. Covered Linkway versioning caveat
7. Leaf Area Index role caveat
8. locked-score coverage line
```

## Focused test

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  08:38:27
   Duration  2.20s (transform 381ms, setup 0ms, import 442ms, tests 241ms, environment 1ms)
```

## Full web test

```text
npm --prefix web test

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  158 passed (158)
   Start at  08:39:24
   Duration  49.52s (transform 2.44s, setup 0ms, import 4.35s, tests 23.75s, environment 10ms)
```

## Python collect-only

```text
uv run pytest -q --collect-only | Select-Object -Last 1
457 tests collected in 21.71s
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
git check-ignore -v qa/verification/P614-first-view-honesty-order.md
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
web/lib/__tests__/score-card-copy.test.ts | 20 ++++++++++++++++++++
1 file changed, 20 insertions(+)
```

## FINDINGS

1. The first-view overlay already includes the required honesty disclosures, but before P614 the tests only proved the pieces existed, not that the frozen-universe and full-score coverage disclosures remained wired into the visible title-card sequence.
2. P614 pins that sequence as a regression test so the app keeps telling users both what address universe it uses and that roughly a quarter of records lack a full locked score.
3. This is test-only guardrail work; it does not change runtime UI copy, layout, data, scoring, export, deployment, protected artifacts, or locked weights.

## DISAGREEMENTS

1. None.
