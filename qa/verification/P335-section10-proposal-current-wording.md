# P335 Section 10 Proposal Current Wording

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

- Free-tier web proposal/test/documentation change only.
- No scoring, export, rescore, subset run, ingest, or network build.
- `pipeline/config/weights.yaml` untouched.
- Existing `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, and `checksums.json` untouched.

## Change

`web/section10-presentation-proposal.md` no longer describes the pre-P18 five-row presentation as "current" and now uses the locked-release/published-bundle wording used by the app.

## Verification

First focused test run caught one stale proposal assertion:

```text
PS C:\sgSHIOK2026> npm --prefix web test -- score-card-copy
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/score-card-copy.test.ts (15 tests | 1 failed) 66ms
     × shows four display rows without changing the locked weights 30ms

 FAIL  lib/__tests__/score-card-copy.test.ts > score card copy > shows four display rows without changing the locked weights
AssertionError: expected '# Section 10 Presentation Proposal\n\…' to contain 'current strongest evidence is the she…'
```

After updating that assertion to the locked-release wording:

```text
PS C:\sgSHIOK2026> npm --prefix web test -- score-card-copy
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  12:51:29
   Duration  474ms (transform 66ms, setup 0ms, import 83ms, tests 35ms, environment 0ms)
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

1. The committed Section 10 proposal still described the pre-P18 presentation as "current" even after P18 landed the four-row shelter-first UI.
2. The focused copy test also preserved one stale "current strongest evidence" assertion; it now guards the locked-release wording instead.
3. This was free-tier documentation/test work: no scoring, export, rescore, subset run, ingest, network build, public data mutation, or locked-weight change.

## Disagreements

1. None.
