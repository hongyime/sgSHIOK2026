# P140 Missing Address Shelter Map Bundle

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

Missing-address states now call the frozen/current artifact a shelter-map bundle:

```text
No OneMap address result found. Try a 6-digit postal code; the frozen shelter-map bundle has measured recent-source misses.
Postal 560231 is not in the current shelter-map bundle.
```

## Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  22:42:21
   Duration  18.54s (transform 13.94s, setup 0ms, import 17.72s, tests 29.67s, environment 26ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\app\page.tsx:158:  if (!selection.score) return `${postal} is not in the current shelter-map bundle.`;
C:\sgSHIOK2026\web\app\page.tsx:218:          No OneMap address result found. Try a 6-digit postal code; the frozen shelter-map bundle has measured recent-source misses.
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:152:    expect(noResultsHtml).toContain("the frozen shelter-map bundle has measured recent-source misses");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:153:    expect(noResultsHtml).not.toContain("the frozen score bundle has measured recent-source misses");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:250:    expect(html).toContain("Postal 560231 is not in the current shelter-map bundle.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:252:    expect(html).not.toContain("Postal 560231 is not in the current score bundle.");
C:\sgSHIOK2026\web\lib\nearest-transit.ts:8: * The current score bundle does NOT ship a ranked candidate list or per-stop
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

1. Missing-address user states still called the published artifact a frozen/current score bundle, even though the user-facing product surface is now the shelter map.
2. The no-results search hint and outside-bundle live-region announcement now say shelter-map bundle.
3. The remaining `score bundle` hit is an internal code comment in `nearest-transit.ts`, not rendered product copy. Preview and locked-score caveats still use score-bundle language where they specifically discuss score inclusion.
4. This is browser copy and test coverage only. It does not alter search behavior, score lookup, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
