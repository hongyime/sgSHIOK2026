# P50 Route Evidence Footer Evidence

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=Prawn-E14
```

## Scope

```text
P50 replaces the stale visible footer copy `Source-derived comfort index.` with `Source-derived route evidence.` and pins it with a source-copy test.
No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or weight change is part of this change.
```

## Stale Copy Scan

```text
C:\sgSHIOK2026\web\app\page.tsx:2038:        <footer className={styles.pageFooter}>Source-derived route evidence.</footer>
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:148:    expect(html).not.toContain("Search any Singapore address to see its walk-to-transit comfort score.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:29:    expect(source).not.toContain("Singapore walk-to-transit comfort");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:53:    expect(source).toContain("Source-derived route evidence.");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:54:    expect(source).not.toContain("Source-derived comfort index.");
```

## Focused Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  15:52:57
   Duration  9.44s (transform 444ms, setup 0ms, import 565ms, tests 121ms, environment 1ms)

EXIT_CODE=0
```

## Full Web Test First Attempt

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/score-prefix-index.test.ts (1 test | 1 failed) 5040ms
     × uses the score prefix index before falling back to the full score index 5031ms
 ❯ lib/__tests__/route-evidence-map-interaction.test.ts (9 tests | 1 failed) 8321ms
     × summarizes the night-lighting overlay for non-visual map users 5029ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  lib/__tests__/route-evidence-map-interaction.test.ts > route evidence map interactions > summarizes the night-lighting overlay for non-visual map users
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ lib/__tests__/route-evidence-map-interaction.test.ts:54:3
     52|   });
     53|
     54|   it("summarizes the night-lighting overlay for non-visual map users",…
       |   ^
     55|     const { nightLightingSummary } = await import("../../components/ro…
     56|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯

 FAIL  lib/__tests__/score-prefix-index.test.ts > fetchScoreForPostal > uses the score prefix index before falling back to the full score index
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ lib/__tests__/score-prefix-index.test.ts:22:3
     20|   });
     21|
     22|   it("uses the score prefix index before falling back to the full scor…
       |   ^
     23|     vi.stubEnv("NEXT_PUBLIC_DATA_BASE", "/data/generated/");
     24|     const scoreRecord = {

[2/2]


 Test Files  2 failed | 21 passed (23)
      Tests  2 failed | 119 passed (121)
   Start at  15:53:34
   Duration  24.11s (transform 22.12s, setup 0ms, import 31.14s, tests 38.46s, environment 15ms)

EXIT_CODE=1
```

## Timed-Out Tests Direct Rerun

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-prefix-index.test.ts route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  10 passed (10)
   Start at  15:54:17
   Duration  1.22s (transform 589ms, setup 0ms, import 274ms, tests 678ms, environment 1ms)

EXIT_CODE=0
```

## TypeScript

```text
EXIT_CODE=0
```

Command:

```text
C:\sgSHIOK2026\web\node_modules\.bin\tsc.cmd --noEmit --project C:\sgSHIOK2026\web\tsconfig.json
```

## Full Web Test Rerun

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  121 passed (121)
   Start at  15:54:43
   Duration  5.97s (transform 3.54s, setup 0ms, import 5.41s, tests 7.00s, environment 30ms)

EXIT_CODE=0
```

## Final Guards

```text
repo_integrity=ok
EXIT_CODE=0
```

```text
git diff --check
EXIT_CODE=0
```

```text
git diff -- pipeline/config/weights.yaml
EXIT_CODE=0
```

## Findings

1. The only remaining visible stale `Source-derived comfort index.` string in `web/app/page.tsx` was the footer. It conflicted with the P18-P48 shelter-first route-evidence framing.
2. The first full web-suite attempt hit two unrelated 5-second Vitest timeouts, but both timed-out test files passed when rerun directly and the full suite passed on immediate rerun.

## Disagreements

1. None.
