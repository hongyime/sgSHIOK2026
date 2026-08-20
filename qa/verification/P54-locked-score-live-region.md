# P54 Locked-Score Live Region Evidence

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
BRANCH=main
```

## Scope

```text
P54 changes the route evidence panel live-region announcement from generic `Score ...` to `Locked score ...`.
No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change is part of this change.
```

## Source Scan

```text
C:\sgSHIOK2026\web\app\page.tsx:159:  return `${postal} route evidence panel loaded. ${stationName ?? "Transit target loaded"}. Locked score ${scoreText}. ${stopText} Route display ${routeMode}; ${selectedRouteLabel ?? "route"} active.`;
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:31:    expect(source).toContain("Locked score ${scoreText}");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:160:    expect(html).toContain("Postal 560231 route evidence panel loaded.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:161:    expect(html).toContain("Locked score 72 out of 100.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:167:    expect(html).not.toContain("Postal 560231 score panel loaded.");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:168:    expect(html).not.toContain("Score 72 out of 100.");
```

## Focused Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  22 passed (22)
   Start at  16:15:10
   Duration  4.00s (transform 2.07s, setup 0ms, import 2.64s, tests 661ms, environment 1ms)

EXIT_CODE=0
```

## TypeScript

```text
C:\sgSHIOK2026\web\node_modules\.bin\tsc.cmd --noEmit --project C:\sgSHIOK2026\web\tsconfig.json
EXIT_CODE=0
```

## Full Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  122 passed (122)
   Start at  16:15:58
   Duration  13.53s (transform 9.94s, setup 0ms, import 14.52s, tests 15.88s, environment 35ms)

EXIT_CODE=0
```

## Final Guards

```text
repo_integrity=ok
EXIT_CODE=0
```

```text
git diff --check
DIFF_CHECK_EXIT=0
```

```text
git diff -- pipeline/config/weights.yaml
WEIGHTS_DIFF_EXIT=0
```

## Findings

1. The visible UI already treats the composite as the locked SHIOK score, but the screen-reader status still announced it as generic `Score`.
2. The first focused test attempt failed because the assertion expected `80 out of 100`, while the render fixture's score total is `72`; the assertion was corrected before commit.

## Disagreements

1. None.
