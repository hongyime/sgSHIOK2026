# P107 no-transit walking-route evidence copy

## Root guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

The `NO_TRANSIT_IN_RANGE` graph-disconnected note now says the bundle has no connected walking route evidence yet, instead of saying the current walking graph could not connect a route.

Files intended for this phase:

```text
C:\sgSHIOK2026\web\app\page.tsx
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts
C:\sgSHIOK2026\decisions.md
C:\sgSHIOK2026\qa\verification\P107-no-transit-route-evidence-copy.md
```

## Validation

Validation output captured before commit:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  20:37:42
   Duration  712ms (transform 87ms, setup 0ms, import 115ms, tests 40ms, environment 0ms)
```

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  126 passed (126)
   Start at  20:38:04
   Duration  7.54s (transform 4.64s, setup 0ms, import 6.84s, tests 10.65s, environment 33ms)
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
web/lib/__tests__/score-card-copy.test.ts:17:    expect(source).not.toContain("current walking graph could not connect a route yet");
```

## FINDINGS

1. The graph-disconnected no-transit note still exposed `current walking graph` implementation language in user-facing copy.
2. The new note keeps the real limitation: transit candidates exist, but this bundle has no connected walking route evidence yet.
3. This is browser copy only. It does not alter routing, graph construction, transit candidate selection, state classification, scoring, inputs, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.

