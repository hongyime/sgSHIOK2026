# P96 Live Preview Provenance Copy

## Root Guard

```text
cwd=C:\sgSHIOK2026
hostname=PRAWN-E14
```

## Evidence Path Ignore Check

```text
exit=1
```

## Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/live-route-scoring.test.ts lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  13 passed (13)
   Start at  19:43:47
   Duration  1.32s (transform 727ms, setup 0ms, import 489ms, tests 489ms, environment 1ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  19:44:09
   Duration  14.22s (transform 10.36s, setup 0ms, import 13.63s, tests 22.50s, environment 27ms)
```

## Retired Pipeline Phrase Search

```text
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:217:    expect(html).not.toContain("offline scoring pipeline includes it");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:387:    expect(html).not.toContain("Needs pipeline scoring evidence");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:388:    expect(html).not.toContain("pipeline scoring evidence");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:153:    expect(liveScoringSource).not.toContain("offline pipeline bundle");
```

## Diff Whitespace Check

```text
```

## Weights Diff Check

```text
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## FINDINGS

1. Live clicked-stop preview score records still carried an `offline pipeline bundle` provenance reason after the visible preview note had moved to offline-bundle wording.
2. The preview record reason now matches the product-facing language: route evidence exists, but authoritative SHIOK scores come from offline bundle scoring.
3. This is preview-record copy only. It does not alter live route segmentation, score-state classification, authoritative bundle data, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
