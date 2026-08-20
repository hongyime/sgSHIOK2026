# P110 locked-score no-full-score value

## Root guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The locked-score null value now renders as `No full score` instead of `Not scored`. Null subscore rows still render as `Not scored` to avoid inventing numeric evidence.

Files intended for this phase:

```text
C:\sgSHIOK2026\web\app\page.tsx
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx
C:\sgSHIOK2026\decisions.md
C:\sgSHIOK2026\qa\verification\P110-locked-score-no-full-score-value.md
```

## Validation

Validation output captured before commit:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  20:50:49
   Duration  3.14s (transform 1.30s, setup 0ms, import 1.75s, tests 424ms, environment 1ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  20:51:13
   Duration  14.72s (transform 7.68s, setup 0ms, import 11.22s, tests 18.29s, environment 43ms)
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
web/lib/__tests__/accessibility-render.test.tsx:368:    expect(html).not.toContain("<strong>Not scored</strong><small>No locked score</small>");
```

## FINDINGS

1. The locked-score row still used the generic null value `Not scored`, even though the rest of the bundle-state copy now says `No full score in this bundle`.
2. The change is deliberately scoped to the locked score. Null subscore rows still say `Not scored` because they represent missing component evidence and should not be collapsed into a bundle-level state.
3. This is browser copy only. It does not alter state classification, score values, ranking, scoring, inputs, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.

