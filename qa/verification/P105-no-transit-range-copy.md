# P105 no-transit range copy

## Root guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

No-transit reason chips now avoid vague threshold language. Candidate-selection failures say `Outside current transit-candidate limits`, and no-walk cases say nearby transit may exist beyond the `1.2 km scoring range`.

Files intended for this phase:

```text
C:\sgSHIOK2026\web\app\page.tsx
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts
C:\sgSHIOK2026\decisions.md
C:\sgSHIOK2026\qa\verification\P105-no-transit-range-copy.md
```

## Validation

Validation output captured before commit:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  20:28:02
   Duration  4.17s (transform 596ms, setup 0ms, import 679ms, tests 239ms, environment 1ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  20:28:43
   Duration  19.99s (transform 10.38s, setup 0ms, import 13.87s, tests 25.31s, environment 14ms)
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
web/lib/__tests__/score-card-copy.test.ts:16:    expect(source).not.toContain("Outside current candidate thresholds");
web/lib/__tests__/score-card-copy.test.ts:17:    expect(source).not.toContain("Nearby transit may still exist outside the current threshold");
```

## FINDINGS

1. The no-transit score-card reason chips still used vague `threshold` wording after the title card and score-state copy had moved toward user-facing product language.
2. The chip now names the current transit-candidate limits and repeats the 1.2 km scoring range for no-walk cases, making the limitation clearer without changing the underlying scoring state.
3. This is browser copy only. It does not alter transit candidate selection, routing, state classification, scoring, inputs, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.

