# P102 frozen-v1 awaiting-score copy

## Root guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The `NOT_YET_SCORED` score-state copy now describes the postal as part of the frozen v1 address universe whose current offline bundle has not scored it yet. The compact labels now say `No full score in this bundle` and `Awaiting bundle score`.

Files intended for this phase:

```text
C:\sgSHIOK2026\web\app\page.tsx
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx
C:\sgSHIOK2026\decisions.md
C:\sgSHIOK2026\qa\verification\P102-frozen-v1-awaiting-score-copy.md
```

## Validation

Validation output captured before commit:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  20:11:53
   Duration  8.94s (transform 5.10s, setup 0ms, import 5.99s, tests 949ms, environment 1ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  20:12:28
   Duration  12.39s (transform 15.09s, setup 0ms, import 16.40s, tests 17.74s, environment 14ms)
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
web/lib/__tests__/accessibility-render.test.tsx:392:    expect(html).not.toContain("source universe");
web/lib/__tests__/accessibility-render.test.tsx:393:    expect(html).not.toContain("Awaiting offline bundle scoring");
```

## FINDINGS

1. The `NOT_YET_SCORED` detail note still said `source universe`, which is accurate internally but weaker than the settled user-facing `frozen v1 address universe` disclosure.
2. The compact state labels used `offline bundle scoring`; shortening that to `Awaiting bundle score` keeps the state understandable without exposing implementation language.
3. This is browser copy only. It does not alter state classification, search behavior, scoring, inputs, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.

