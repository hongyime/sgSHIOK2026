# P108 snap connector route-evidence copy

## Root guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The snap connector note now says it links the postal or transit point onto mapped walking-route evidence instead of onto the walking graph.

Files intended for this phase:

```text
C:\sgSHIOK2026\web\app\page.tsx
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts
C:\sgSHIOK2026\decisions.md
C:\sgSHIOK2026\qa\verification\P108-snap-connector-route-evidence-copy.md
```

## Validation

Validation output captured before commit:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  25 passed (25)
   Start at  20:42:05
   Duration  6.17s (transform 3.52s, setup 0ms, import 4.36s, tests 263ms, environment 1ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  20:42:24
   Duration  6.74s (transform 2.75s, setup 0ms, import 7.40s, tests 8.63s, environment 10ms)
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
web/lib/__tests__/accessibility-render.test.tsx:286:    expect(html).not.toContain("onto the walking graph");
web/lib/__tests__/score-card-copy.test.ts:129:    expect(tsxSource).not.toContain("onto the walking graph");
```

## FINDINGS

1. After P107 removed walking-graph wording from the no-transit note, the snap connector explanation still exposed `walking graph` in live route-detail copy.
2. The new wording keeps the meaning of the connector distance while using the product's route-evidence framing.
3. This is browser copy only. It does not alter connector computation, route geometry, state classification, scoring, inputs, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.

