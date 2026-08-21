# P333 Rain/Heat Locked-Release Copy

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

- Free-tier web copy/test/documentation change only.
- No scoring, export, rescore, subset run, ingest, or network build.
- `pipeline/config/weights.yaml` untouched.
- Existing `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, and `checksums.json` untouched.

## Change

The shelter-exposure note changed from:

```text
Rain shelter and heat comfort currently share mostly the same covered-walkway evidence.
```

to:

```text
In this locked release, rain shelter and heat comfort share mostly the same covered-walkway evidence.
```

## Verification

```text
PS C:\sgSHIOK2026> npm --prefix web test -- accessibility-render score-card-copy
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render score-card-copy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  12:44:27
   Duration  1.76s (transform 901ms, setup 0ms, import 1.17s, tests 295ms, environment 1ms)
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml; Write-Output "EXIT=$LASTEXITCODE"
EXIT=0
```

## Findings

1. The shelter-exposure note still used a moving-current phrase for the rain/heat overlap; the app now frames that overlap as a locked-release property.
2. Focused web tests cover both the new wording and the removal of the old "currently share" sentence.
3. This was free-tier work: no scoring, export, rescore, subset run, ingest, network build, public data mutation, or locked-weight change.

## Disagreements

1. None.
