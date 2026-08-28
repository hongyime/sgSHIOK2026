# P672 Night-Lighting Layer Top Copy

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

```text
Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio and exposed gaps on the walk to transit, plus night lighting map evidence.
Search a OneMap address or 6-digit postal code to inspect covered-walkway ratio and exposed gaps on the walk to transit, plus the night-lighting map layer.

See covered-walkway ratio and exposed gaps on the walk to transit, plus night lighting map evidence
See covered-walkway ratio and exposed gaps on the walk to transit, plus the night-lighting map layer

Source-derived walk evidence: covered-walkway ratio and exposed gaps, plus night lighting map evidence.
Source-derived walk evidence: covered-walkway ratio and exposed gaps, plus the night-lighting map layer.
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  65 passed (65)
   Start at  13:40:21
   Duration  9.11s (transform 2.55s, setup 0ms, import 3.29s, tests 2.23s, environment 2ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  13:41:03
   Duration  45.98s (transform 2.88s, setup 0ms, import 5.30s, tests 18.59s, environment 12ms)
```

## Python Collect-Only

```text
457 tests collected in 28.44s
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

1. Top-level search, empty-map, and footer copy still called night lighting `map evidence`; the product model is clearer when it is named as the separate night-lighting map layer.

## DISAGREEMENTS

1. None.
