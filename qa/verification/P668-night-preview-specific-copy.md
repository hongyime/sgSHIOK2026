# P668 Night Preview Specific Copy

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

```text
Split the remaining broad "Map evidence only" phrase by meaning:
- Night lighting now says "Night-lighting map layer only; not part of the locked score."
- Clicked-stop shelter-map preview reason chips now say "Not in published bundle."
```

## Initial Focused Test Failure

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/route-evidence-map-interaction.test.ts (10 tests | 1 failed) 126ms
     × summarizes the night-lighting overlay for non-visual map users 79ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  lib/__tests__/route-evidence-map-interaction.test.ts > shelter map interactions > summarizes the night-lighting overlay for non-visual map users
AssertionError: expected 'Night lighting map layer is on; zoom …' to be 'Night lighting map layer is on; zoom …' // Object.is equality

Expected: "Night lighting map layer is on; zoom in to load LTA lamp-post points. Night-lighting map layer only; not part of the locked score."
Received: "Night lighting map layer is on; zoom in to load LTA lamp-post points. Map evidence only; not part of the locked score."

 ❯ lib/__tests__/route-evidence-map-interaction.test.ts:122:51
    120|
    121|     expect(nightLightingSummary("off", 12)).toBeNull();
    122|     expect(nightLightingSummary("below_zoom", 0)).toBe(
       |                                                   ^
    123|       "Night lighting map layer is on; zoom in to load LTA lamp-post p…
    124|     );

⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed | 2 passed (3)
      Tests  1 failed | 64 passed (65)
   Start at  13:21:55
   Duration  4.32s (transform 1.25s, setup 0ms, import 1.63s, tests 895ms, environment 2ms)
```

## Corrected Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  65 passed (65)
   Start at  13:22:28
   Duration  6.44s (transform 1.54s, setup 0ms, import 1.55s, tests 2.12s, environment 2ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  13:22:58
   Duration  55.80s (transform 3.61s, setup 0ms, import 6.15s, tests 29.09s, environment 26ms)
```

## Python Collect-Only

```text
457 tests collected in 38.90s
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit=0
```

## Protected Path Guard

```text
exit=0
```

## FINDINGS

1. The single phrase `Map evidence only` was carrying two meanings: night lighting as a non-score map layer, and clicked-stop shelter-map evidence as preview-only data outside the published bundle.
2. The first focused run caught that the route map helper had its own hard-coded night-lighting suffix, so changing only `page.tsx` would have left screen-reader map summaries inconsistent.

## DISAGREEMENTS

1. None.
