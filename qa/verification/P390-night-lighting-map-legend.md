# P390 Night-Lighting Map Legend

## Scope

Free-tier browser copy/styling/test change only. No scoring, export, rescore, ingest, network build, deploy, public-data write, or lamp overlay artifact build was run.

## Working Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Change

When the night-lighting overlay is enabled, the inline map legend now includes:

```text
LTA lamp points
```

The legend item is absent when the overlay is off.

## Focused Tests

Command:

```text
npm --prefix web test -- accessibility-render.test.tsx route-evidence-map-interaction.test.ts
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  31 passed (31)
   Start at  17:49:34
   Duration  3.59s (transform 3.34s, setup 0ms, import 2.55s, tests 1.51s, environment 0ms)
```

## FINDINGS

1. The night-lighting overlay was present and had status/toggle copy, but the inline map legend did not identify the lamp-post points when the layer was enabled.
2. The legend now treats night lighting as a visible second map layer: the lamp-point key appears only when the overlay is on, and stays absent when off.

## DISAGREEMENTS

1. None.
