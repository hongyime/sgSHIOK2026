# P137 Map Aria Shelter Label

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The map container accessibility label now uses shelter-map framing:

```text
Singapore shelter map with MRT stations, LRT stations, and bus stops
Shelter map for ${labels}, showing ${routeModeLabel(mode)}
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:32:39
   Duration  8.48s (transform 5.27s, setup 0ms, import 7.21s, tests 12.05s, environment 11ms)
```

## Diff Guards

```text
git diff --check
```

No output.

```text
git diff -- pipeline/config/weights.yaml
```

No output.

## FINDINGS

1. The map container's accessible label still identified the empty map as a Singapore transit map and selected routes as route-evidence maps, lagging the shelter-map product frame now used by the title, footer, empty panel, and non-visual summary.
2. The accessible label now calls the surface a shelter map both before and after route selection.
3. This is browser accessibility copy only. It does not alter map rendering, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
