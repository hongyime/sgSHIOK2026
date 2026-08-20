# P193 Live Route Shelter Map Comments

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Findings

1. `web/lib/live-route-scoring.ts` runtime copy already says clicked-stop previews have shelter map evidence only, but its top-level comments still described the path as preview route evidence.
2. This is web-only documentation/test maintenance; it does not alter preview routing, scoring, exports, public data, deployment, or locked weights.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/route-evidence-map-interaction.test.ts lib/__tests__/live-route-scoring.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  13 passed (13)
   Start at  02:16:12
   Duration  1.09s (transform 614ms, setup 0ms, import 414ms, tests 378ms, environment 1ms)
```

```text
repo_integrity=ok
integrity_exit=0
```

```text
weights_diff_start
weights_diff_end
```

```text
C:\sgSHIOK2026\web\lib\live-route-scoring.ts:2: * Live client-side shelter segmentation for preview shelter-map evidence.
C:\sgSHIOK2026\web\lib\live-route-scoring.ts:151: * for preview-only shelter-map evidence.
C:\sgSHIOK2026\web\lib\live-route-scoring.ts:313:        "Clicked transit POI has shelter map evidence only; published scores come from the score bundle.",
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:162:    expect(liveScoringSource).toContain("preview shelter-map evidence");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:163:    expect(liveScoringSource).toContain("preview-only shelter-map evidence");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:164:    expect(liveScoringSource).toContain("Clicked transit POI has shelter map evidence only");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:165:    expect(liveScoringSource).not.toContain("preview route evidence");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:166:    expect(liveScoringSource).not.toContain("preview-only route evidence");
```

## FINDINGS

1. Live preview comments lagged behind the shelter-map product language and still called the preview route-evidence based.

## DISAGREEMENTS

1. None.
