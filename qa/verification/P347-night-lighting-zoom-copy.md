# P347 Night Lighting Zoom Copy

## Root

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## Change

```text
Night-lighting route details now say "Map layer on; zoom in for points" when the layer is enabled, and the note says lamp-post points load only after zooming into a neighbourhood.
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --runInBand lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  44 passed (44)
   Start at  13:40:13
   Duration  1.98s (transform 1.62s, setup 0ms, import 1.65s, tests 890ms, environment 2ms)
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

1. The map already announced below-zoom night-lighting status, but the selected record's walk-details strip only said "Map layer on", so a user could enable the layer and miss why no lamp points were visible. The card now carries the same zoom instruction in the place where the selected route evidence is summarized.
2. This is a browser-copy-only change. It does not touch scoring, export, inputs, published data, checksums, or `pipeline/config/weights.yaml`.

## Disagreements

1. None.
