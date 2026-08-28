# P669 Planning-Area Shelter-Map Primary Copy

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

```text
Planning-area list uses locked score only as a sorting index; walk evidence remains the primary view.
Planning-area list uses locked score only as a sorting index; shelter-map walk evidence remains the primary view.
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  13:26:42
   Duration  3.58s (transform 1.12s, setup 0ms, import 1.47s, tests 878ms, environment 1ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  13:27:00
   Duration  45.11s (transform 2.74s, setup 0ms, import 5.55s, tests 13.58s, environment 19ms)
```

## Python Collect-Only

```text
457 tests collected in 20.94s
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

1. The planning-area rank helper still used generic `walk evidence` while explaining that locked score is only a sorting index; naming `shelter-map walk evidence` keeps the primary product evidence explicit.

## DISAGREEMENTS

1. None.
