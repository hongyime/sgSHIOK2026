# P348 Greenery Proxy Source Boundary

## Root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Change

```text
The selected walk details now state that the Greenery proxy uses sparse NParks route geometry for heat only, and is not measured temperature or Leaf Area Index.
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runInBand lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  13:46:02
   Duration  1.46s (transform 657ms, setup 0ms, import 1.02s, tests 241ms, environment 1ms)
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

1. The app already explains that Leaf Area Index is a freshness-tracked reference and not route geometry in README/operator policy, but the selected card only showed `Greenery proxy` without the same boundary.
2. The new note keeps heat evidence weaker than measured thermal comfort and prevents users from connecting the Leaf Area Index freshness line to the selected-route greenery percentage.
3. This is browser copy and test coverage only. It does not alter shade geometry, source manifests, freshness policy, scoring, exports, public data, deployment, or `pipeline/config/weights.yaml`.

## Disagreements

1. None.
