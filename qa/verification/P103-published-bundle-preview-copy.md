# P103 published-bundle preview authority copy

## Root guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

Live clicked-stop previews now explain that authoritative SHIOK scores come from the published score bundle. The rendered preview note says the clicked stop is not authoritative until it is included in a published score bundle.

Files intended for this phase:

```text
C:\sgSHIOK2026\web\app\page.tsx
C:\sgSHIOK2026\web\lib\live-route-scoring.ts
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx
C:\sgSHIOK2026\web\lib\__tests__\live-route-scoring.test.ts
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts
C:\sgSHIOK2026\decisions.md
C:\sgSHIOK2026\qa\verification\P103-published-bundle-preview-copy.md
```

## Validation

Validation output captured before commit:

Initial combined focused run timed out in an unrelated route-evidence map test:

```text
FAIL  lib/__tests__/route-evidence-map-interaction.test.ts > route evidence map interactions > summarizes the night-lighting overlay for non-visual map users
Error: Test timed out in 5000ms.
```

Focused files passed in isolation:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  20:18:17
   Duration  2.98s (transform 1.34s, setup 0ms, import 1.67s, tests 302ms, environment 0ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/live-route-scoring.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  20:18:17
   Duration  1.39s (transform 224ms, setup 0ms, import 288ms, tests 21ms, environment 0ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  20:18:17
   Duration  1.94s (transform 787ms, setup 0ms, import 245ms, tests 686ms, environment 0ms)
```

Full web suite passed:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  20:18:31
   Duration  9.57s (transform 5.60s, setup 0ms, import 13.45s, tests 11.45s, environment 9ms)
```

```text
repo_integrity=ok
exit=0
```

```text
git diff --check: exit 0
pipeline/config/weights.yaml diff: empty
```

```text
web/lib/__tests__/accessibility-render.test.tsx:218:    expect(html).not.toContain("until an offline bundle includes it");
web/lib/__tests__/accessibility-render.test.tsx:394:    expect(html).not.toContain("Awaiting offline bundle scoring");
web/lib/__tests__/route-evidence-map-interaction.test.ts:153:    expect(liveScoringSource).not.toContain("SHIOK scores come from offline bundle scoring.");
web/lib/__tests__/route-evidence-map-interaction.test.ts:159:    expect(pageSource).not.toContain("until an offline bundle includes it");
```

## FINDINGS

1. Clicked-stop preview copy still used `offline bundle scoring`, which is implementation language and weaker than the settled published-bundle authority framing.
2. The preview contract remains unchanged: live clicked-stop routes can show route evidence, but they do not produce authoritative SHIOK score values.
3. This is browser/provenance-copy only. It does not alter live preview route calculations, score values, state classification, scoring, inputs, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.

