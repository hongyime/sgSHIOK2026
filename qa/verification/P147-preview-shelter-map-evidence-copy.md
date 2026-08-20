# P147 Preview Shelter Map Evidence Copy

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

Clicked-stop preview copy now says:

```text
Preview shelter map evidence only
Preview only: this clicked stop has shelter map evidence, but it is not part of the published score bundle yet.
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  23:06:36
   Duration  10.60s (transform 4.43s, setup 0ms, import 7.32s, tests 13.34s, environment 11ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\app\page.tsx:426:    return "Preview only: this clicked stop has shelter map evidence, but it is not part of the published score bundle yet.";
C:\sgSHIOK2026\web\app\page.tsx:1232:              <span>{previewRoute ? "Preview shelter map evidence only" : "Viewing selected stop"}</span>
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:227:    expect(html).toContain("Preview shelter map evidence only");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:234:      "Preview only: this clicked stop has shelter map evidence, but it is not part of the published score bundle yet."
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:237:    expect(html).not.toContain("Preview route evidence only");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:238:    expect(html).not.toContain("this clicked stop has route evidence");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:163:    expect(pageSource).toContain("Preview shelter map evidence only");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:164:    expect(pageSource).toContain("Preview only: this clicked stop has shelter map evidence");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:166:    expect(pageSource).not.toContain("Preview route evidence only");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:167:    expect(pageSource).not.toContain("Preview only: this clicked stop has route evidence");
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

1. Clicked-stop preview copy still said `Preview route evidence only` and `this clicked stop has route evidence`, lagging the shelter-map evidence frame used by the panel and reason chips.
2. Preview copy now says shelter map evidence while preserving the warning that preview evidence is not part of the published score bundle.
3. This is browser copy and test coverage only. It does not alter clicked-stop routing, preview scoring, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
