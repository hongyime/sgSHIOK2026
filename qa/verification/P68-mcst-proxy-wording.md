# P68 MCST proxy wording

Date: 2026-08-20
Machine: PRAWN-E14
Working root: C:\sgSHIOK2026

## Scope

Free-tier wording accuracy change only.
No scoring, export, rescore, subset run, ingest, network build, input rebuild, API collection, public-data write, deployment, or weights change was run.

## Startup guard

```text
PWD=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Finding Trigger

P19 evidence says:

```text
BCA MCST constitution date is a proxy for private strata completion/onboarding, not a TOP date.
```

The browser, README, readiness, and decisions text were using generic `completions` wording for the full 976-row denominator. That was too strong for the MCST side of the sample.

## Failed web-test attempts

Command:

```text
npm --prefix web test -- --runTestsByPath lib/__tests__/score-card-copy.test.ts --runInBand
```

Output:

```text
CACError: Unknown option `--runTestsByPath`
```

Command:

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts --runInBand=false
```

Output:

```text
CACError: Unknown option `--runInBand`
```

These failed before running tests because the project uses Vitest, not Jest.

## Focused browser-copy test

Command:

```text
npm --prefix web test -- lib/__tests__/score-card-copy.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  17:29:39
   Duration  574ms (transform 60ms, setup 0ms, import 81ms, tests 28ms, environment 0ms)
```

## Focused readiness test

Command:

```text
uv run pytest tests/test_production_readiness.py::test_build_readiness_report_accepts_minimal_valid_current_state -q
```

Output:

```text
.                                                                        [100%]
1 passed in 6.46s
```

## Full readiness test file

Command:

```text
uv run pytest tests/test_production_readiness.py -q
```

Output:

```text
................                                                         [100%]
16 passed in 60.61s (0:01:00)
```

## Repo integrity

Command:

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit=0
```

## Diff check

Command:

```text
git diff --check; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
exit=0
```

## Weights guard

Command:

```text
git diff -- pipeline/config/weights.yaml; Write-Output "exit=$LASTEXITCODE"
```

Output:

```text
exit=0
```

## FINDINGS

1. P19's private-strata evidence is BCA MCST constitution date, a proxy for private strata onboarding/completion timing and not a direct TOP/completion date.
2. The browser, README, readiness, and decisions text now describe the P19 denominator as `HDB completion and MCST proxy rows`, avoiding an overclaim while preserving the 8/976 measurement.
3. This is wording accuracy only; no measurement, source data, public bundle, scoring, export, deployment, or locked weights changed.

## DISAGREEMENTS

1. None for this phase.
