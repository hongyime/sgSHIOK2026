# P670 Night-Lighting Detail Layer Copy

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

```text
Map layer on; zoom in for lamp-post points
Night-lighting layer on; zoom in for lamp-post points

Map layer off; switch on night lighting, then zoom in
Night-lighting layer off; switch on night lighting, then zoom in
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  13:31:14
   Duration  6.53s (transform 2.24s, setup 0ms, import 2.78s, tests 1.76s, environment 1ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  13:31:37
   Duration  31.39s (transform 1.81s, setup 0ms, import 3.68s, tests 10.25s, environment 10ms)
```

## Python Collect-Only

```text
457 tests collected in 15.22s
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

1. The selected-walk details row already had label `Night lighting`, but its value still said generic `Map layer on/off`; read in isolation, that hid that the layer is specifically night-lighting evidence.

## DISAGREEMENTS

1. None.
