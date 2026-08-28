# P667 Shelter-Map Walk Live Copy

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

```text
Aligned populated live-region shelter evidence copy with the unavailable branch:
Walk evidence ... -> Shelter-map walk evidence ...

Aligned the outside-transit-range explanatory note:
Walk evidence is shown ... -> Shelter-map walk evidence is shown ...
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  13:17:20
   Duration  3.96s (transform 1.38s, setup 0ms, import 1.78s, tests 906ms, environment 1ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  13:17:40
   Duration  66.27s (transform 5.16s, setup 0ms, import 8.87s, tests 26.13s, environment 20ms)
```

## Python Collect-Only

```text
457 tests collected in 32.38s
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

1. The populated accessibility announcement still used generic `Walk evidence` even after the unavailable branch had been narrowed to `Shelter-map walk evidence unavailable`; this made the live status less explicit than the rest of the score card.
2. The outside-transit-range note had the same generic lead phrase, so a record with shelter evidence but no locked score could still read as broad walk evidence rather than shelter-map walk evidence.

## DISAGREEMENTS

1. None.
