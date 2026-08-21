# P350 Shelter First Share Metadata

## Root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Change

```text
The app metadata now has explicit Open Graph and Twitter summary metadata that leads with covered-walkway exposure gaps and night-lighting evidence, with the locked SHIOK score named as secondary.
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runInBand lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  13:54:38
   Duration  616ms (transform 98ms, setup 0ms, import 120ms, tests 44ms, environment 0ms)
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

1. The page title and description were already shelter-first, but link previews had no explicit Open Graph or Twitter metadata.
2. The new metadata reuses the same title and description across standard, Open Graph, and Twitter summary fields so shared links do not fall back to older comfort-index framing.
3. This is browser metadata and test coverage only. It does not alter app rendering, scoring, exports, public data, inputs, deployment, or `pipeline/config/weights.yaml`.

## Disagreements

1. None.
