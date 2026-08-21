# P364 Locked-Score Visual Hierarchy Guard

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Tighten the web test for the product rule that the locked score stays visually secondary to shelter evidence. The test now extracts CSS font sizes for `.exposureHero strong` and `.scoreBadge strong` and asserts the exposure hero is larger.

No runtime behavior change, scoring, export, rescore, subset run, ingest, network build, public-data mutation, protected QA mutation, or locked-weights change was run or made.

## Verification

### npm --prefix web test -- --run lib/__tests__/score-card-copy.test.ts

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  14:51:13
   Duration  998ms (transform 143ms, setup 0ms, import 189ms, tests 83ms, environment 1ms)
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
EXIT=0
```

### git diff -- pipeline/config/weights.yaml

```text
WEIGHTS_DIFF_EXIT=0
```

## FINDINGS

1. The existing visual-hierarchy test checked loose stylesheet substrings, so it could pass even if the relevant selector sizes drifted while the same `font-size` strings remained elsewhere.

## DISAGREEMENTS

1. None.
