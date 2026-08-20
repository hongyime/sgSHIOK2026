# P104 published-bundle awaiting-score copy

## Root guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The `NOT_YET_SCORED` detail note now says the postal is in the frozen v1 address universe, but the current published bundle has not scored it yet. This replaces the remaining live browser phrase `current offline bundle`.

Files intended for this phase:

```text
C:\sgSHIOK2026\web\app\page.tsx
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx
C:\sgSHIOK2026\decisions.md
C:\sgSHIOK2026\qa\verification\P104-published-bundle-awaiting-score-copy.md
```

## Validation

Validation output captured before commit:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  20:23:06
   Duration  6.72s (transform 2.92s, setup 0ms, import 3.65s, tests 841ms, environment 17ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  20:23:40
   Duration  26.85s (transform 8.19s, setup 0ms, import 9.93s, tests 31.34s, environment 11ms)
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
web/lib/__tests__/accessibility-render.test.tsx:394:    expect(html).not.toContain("current offline bundle");
web/lib/__tests__/accessibility-render.test.tsx:395:    expect(html).not.toContain("Awaiting offline bundle scoring");
web/lib/__tests__/route-evidence-map-interaction.test.ts:153:    expect(liveScoringSource).not.toContain("SHIOK scores come from offline bundle scoring.");
web/lib/__tests__/route-evidence-map-interaction.test.ts:159:    expect(pageSource).not.toContain("until an offline bundle includes it");
```

## FINDINGS

1. P103 moved clicked-stop preview authority to `published score bundle`, but the not-yet-scored note still said `current offline bundle`.
2. This change makes the live user-facing score-state copy consistently use published-bundle authority language.
3. This is browser copy only. It does not alter state classification, search behavior, scoring, inputs, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.

