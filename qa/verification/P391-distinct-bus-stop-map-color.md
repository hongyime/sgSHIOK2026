# P391 Distinct Bus-Stop Map Color

## Scope

Free-tier browser map styling/test change only. No scoring, export, rescore, ingest, network build, deploy, public-data write, or data mutation was run.

## Working Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Change

Bus-stop map dots and labels now use a distinct bus purple:

```text
TRANSIT_POI_BUS_PURPLE=#6f4c8b
bus_label_text=#4c3760
```

The inline legend bus dot uses the same purple, while MRT/LRT remains hot pink.

## Focused Tests

Command:

```text
npm --prefix web test -- route-evidence-map-interaction.test.ts accessibility-render.test.tsx
```

Output:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs route-evidence-map-interaction.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  31 passed (31)
   Start at  17:54:17
   Duration  1.85s (transform 1.14s, setup 0ms, import 1.10s, tests 811ms, environment 1ms)
```

## FINDINGS

1. MRT/LRT and bus-stop POIs were both rendered hot pink, so the map and legend did not visually distinguish the two transit access types.
2. Bus stops now have a distinct purple in the MapLibre layer and matching inline legend chip; MRT/LRT remains hot pink.

## DISAGREEMENTS

1. None.
