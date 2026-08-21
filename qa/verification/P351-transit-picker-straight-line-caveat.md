# P351 Transit Picker Straight Line Caveat

## Root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Change

```text
The nearby-transit comparison note now says a selected stop is farther than the auto-picked stop on straight-line distance only, and that shelter evidence updates after selection.
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runInBand lib/__tests__/transit-stop-picker.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  33 passed (33)
   Start at  13:58:38
   Duration  6.49s (transform 3.14s, setup 0ms, import 4.03s, tests 98ms, environment 0ms)
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

1. The picker previously said `farther than best`, which was concise but too strong because the comparison is straight-line distance before route shelter evidence is loaded for the selected stop.
2. The new wording preserves the distance comparison while making the evidence boundary explicit: straight-line only first, shelter-map evidence after selection.
3. This is browser copy and test coverage only. It does not alter candidate selection, routing, scoring, exports, public data, inputs, deployment, or `pipeline/config/weights.yaml`.

## Disagreements

1. None.
