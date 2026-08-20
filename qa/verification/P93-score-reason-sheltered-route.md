# P93 Score Reason Sheltered Route

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
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  24 passed (24)
   Start at  19:33:45
   Duration  1.26s (transform 607ms, setup 0ms, import 813ms, tests 160ms, environment 0ms)
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  125 passed (125)
   Start at  19:34:00
   Duration  5.56s (transform 3.49s, setup 0ms, import 4.80s, tests 7.68s, environment 12ms)
```

## Covered Route Copy Search

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:89:    expect(source).not.toContain('"Covered route"');
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:42:    expect(source).not.toContain("covered-route segments");
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:43:    expect(source).not.toContain('return "covered route";');
C:\sgSHIOK2026\web\lib\__tests__\route-evidence-map-interaction.test.ts:44:    expect(source).not.toContain('return "shortest and covered routes";');
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

1. The score-card reason text still said `62% sheltered on covered route`, which overstated the route as covered even when the route can contain exposed gaps.
2. After the change, remaining `covered route` / `covered-route` hits in web source are negative assertions only.
3. This is browser copy only. It does not alter score-reason selection logic, scores, route geometry, exports, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
