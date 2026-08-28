# P674 Map Aria Night Layer Copy

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

```text
Singapore shelter-map view for covered-walkway ratio, exposed gaps, transit targets, and night lighting evidence
Singapore shelter-map view for covered-walkway ratio, exposed gaps, transit targets, and the night-lighting map layer
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  13:49:10
   Duration  2.03s (transform 905ms, setup 0ms, import 273ms, tests 806ms, environment 0ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  13:49:29
   Duration  32.95s (transform 2.04s, setup 0ms, import 3.96s, tests 11.13s, environment 10ms)
```

## Python Collect-Only

```text
457 tests collected in 15.95s
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## Diff Check

```text
exit=0
```

## Protected Path Guard

```text
exit=0
```

## FINDINGS

1. The empty-route map aria label still called night lighting `evidence`; naming `the night-lighting map layer` better matches the product model and the visible map-layer controls.

## DISAGREEMENTS

1. None.
