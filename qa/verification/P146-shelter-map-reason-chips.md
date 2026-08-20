# P146 Shelter Map Reason Chips

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

Generic reason chips inside the shelter-map evidence reason group now use shelter-map evidence wording:

```text
Shelter map evidence preview
Shelter map evidence unavailable
Shelter map evidence available
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  23:03:05
   Duration  6.61s (transform 4.05s, setup 0ms, import 5.82s, tests 9.03s, environment 16ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:178:    expect(source).toContain("Shelter map evidence preview");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:179:    expect(source).toContain("Shelter map evidence unavailable");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:180:    expect(source).toContain("Shelter map evidence available");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:184:    expect(source).not.toContain("Route evidence preview");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:185:    expect(source).not.toContain("Route evidence unavailable");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:186:    expect(source).not.toContain("Route evidence available");
C:\sgSHIOK2026\web\app\page.tsx:680:    return ["Shelter map evidence preview", "Not scored in the current bundle"];
C:\sgSHIOK2026\web\app\page.tsx:700:  if (!score.paths || !score.best_node) return ["Shelter map evidence unavailable", "Bundle score unavailable"];
C:\sgSHIOK2026\web\app\page.tsx:701:  if (!score.subscores) return ["Bundle score incomplete", "Shelter map evidence available"];
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:228:    expect(html).toContain("Shelter map evidence preview");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:237:    expect(html).not.toContain("Route evidence preview");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:396:    expect(html).toContain("Shelter map evidence unavailable");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:406:    expect(html).not.toContain("Route evidence unavailable");
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

1. The reason-chip group was already named `Shelter map evidence reasons`, but generic chips inside it still said `Route evidence preview`, `Route evidence unavailable`, and `Route evidence available`.
2. Those generic chips now use shelter-map evidence wording, while state-specific walking-route and score-bundle caveats remain precise.
3. This is browser copy and test coverage only. It does not alter score-state classification, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
