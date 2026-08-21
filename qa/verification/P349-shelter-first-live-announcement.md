# P349 Shelter First Live Announcement

## Root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Change

```text
The score-card live-region status now announces shelter evidence before the locked score: covered-walkway ratio and exposed-gap total come first, then the secondary locked score.
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runInBand lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  13:50:58
   Duration  1.49s (transform 758ms, setup 0ms, import 990ms, tests 272ms, environment 0ms)
```

## Repository Integrity

```text
repo_integrity=ok
EXIT=0
```

## Locked Weights Check

```text
git diff -- pipeline/config/weights.yaml
```

```text
```

## Findings

1. The visual score card already keeps the locked score smaller than the shelter evidence, but the live-region status announced `Locked score ...` before any shelter measurement.
2. The accessibility announcement now follows the product hierarchy: selected shelter evidence first, locked score second.
3. The first focused test run caught a unit bug in the new announcement, formatting `covered_ratio: 0.62` as `0.62%`; the final code multiplies by 100 and the rendered assertion now guards `62%`.
4. This is browser accessibility copy and test coverage only. It does not alter visual rendering order, score values, scoring, exports, public data, inputs, deployment, or `pipeline/config/weights.yaml`.

## Disagreements

1. None.
