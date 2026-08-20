# P138 Live Region Shelter Map Panel

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

The score-card live region now announces a loaded selection as:

```text
Postal 560231 shelter map panel loaded.
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:35:39
   Duration  5.39s (transform 3.74s, setup 0ms, import 5.27s, tests 7.48s, environment 10ms)
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

1. The screen-reader live region for a loaded postal still announced a `route evidence panel`, even though the product surface is now consistently framed as the shelter map.
2. The live region now announces the `shelter map panel loaded` while retaining transit target, locked score, selected stop, route display, and active-route details.
3. This is browser accessibility copy only. It does not alter score-card state, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
