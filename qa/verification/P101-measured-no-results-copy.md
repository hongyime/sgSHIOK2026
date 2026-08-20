# P101 measured no-results copy

## Root guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The submitted-search no-results message now says the frozen score bundle has measured recent-source misses instead of saying newer completions may still be outside the bundle.

Files intended for this phase:

```text
C:\sgSHIOK2026\web\app\page.tsx
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx
C:\sgSHIOK2026\decisions.md
C:\sgSHIOK2026\qa\verification\P101-measured-no-results-copy.md
```

## Validation

Validation output captured before commit:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  20:05:34
   Duration  3.51s (transform 1.62s, setup 0ms, import 2.01s, tests 416ms, environment 0ms)
```

Initial full web run timed out in an unrelated TypeScript contract test:

```text
 ❯ lib/__tests__/typescript-contract.test.ts (1 test | 1 failed) 93656ms
     × type-checks rank payload projections 93650ms

 FAIL  lib/__tests__/typescript-contract.test.ts > typescript contracts > type-checks rank payload projections
Error: Test timed out in 30000ms.
```

The timed-out contract test passed in isolation:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/typescript-contract.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  20:07:46
   Duration  2.22s (transform 71ms, setup 0ms, import 120ms, tests 1.45s, environment 0ms)
```

Full web suite passed on rerun:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  20:07:57
   Duration  5.72s (transform 3.76s, setup 0ms, import 5.01s, tests 7.38s, environment 45ms)
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
web/lib/__tests__/accessibility-render.test.tsx:141:    expect(noResultsHtml).not.toContain("newer completions may still be outside");
web/lib/__tests__/score-card-copy.test.ts:37:    expect(source).not.toContain("newer completions may be missing.");
```

## FINDINGS

1. P100 fixed the title-card universe caveat, but submitted address searches with no OneMap results still described the same frozen-bundle limitation as a possibility rather than an observed measured-miss condition.
2. The no-results message still gives the practical next action: try a 6-digit postal code.
3. This is browser copy only. It does not alter OneMap query behavior, search routing, scoring, inputs, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.

