# P673 Transit Picker Shelter Evidence Copy

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Change

```text
42% farther than auto-picked target (+42 m straight-line only; walk evidence updates after selection)
42% farther than auto-picked target (+42 m straight-line only; shelter-map walk evidence updates after selection)
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/transit-stop-picker.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  33 passed (33)
   Start at  13:44:42
   Duration  1.77s (transform 549ms, setup 0ms, import 733ms, tests 113ms, environment 0ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  24 passed (24)
      Tests  166 passed (166)
   Start at  13:44:59
   Duration  70.42s (transform 4.78s, setup 0ms, import 8.91s, tests 18.57s, environment 21ms)
```

## Python Collect-Only

```text
457 tests collected in 21.26s
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## Diff Check

```text
exit=0
```

## Protected Path Guard

```text
exit=0
```

## FINDINGS

1. The transit target picker's straight-line comparison caveat still said generic `walk evidence updates after selection`, even though the update is specifically the shelter-map walk preview/published evidence path.

## DISAGREEMENTS

1. None.
