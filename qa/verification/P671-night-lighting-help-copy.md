# P671 Night-Lighting Help Copy

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

```text
Night lighting uses LTA lamp-post points as map evidence outside the locked score; the map loads lamp-post points only after you zoom into a neighbourhood.
Night lighting uses LTA lamp-post points as night-lighting map evidence outside the locked score; the map loads lamp-post points only after you zoom into a neighbourhood.

Night lighting: LTA lamp-post locations; map evidence only, not part of the locked score
Night lighting: LTA lamp-post locations; night-lighting map layer only, not part of the locked score
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  65 passed (65)
   Start at  13:36:03
   Duration  9.02s (transform 2.62s, setup 0ms, import 3.36s, tests 1.91s, environment 2ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  13:36:28
   Duration  33.94s (transform 2.33s, setup 0ms, import 4.34s, tests 11.17s, environment 11ms)
```

## Python Collect-Only

```text
457 tests collected in 16.62s
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

1. The night-lighting detail note and toggle title still used broad `map evidence` wording even after the row value and layer note were narrowed to `night-lighting` wording.
2. The route-map source test now guards against the old night-lighting title so the broader phrase does not silently return.

## DISAGREEMENTS

1. None.
