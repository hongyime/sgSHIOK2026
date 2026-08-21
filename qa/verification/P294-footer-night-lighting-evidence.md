# P294 Footer Night Lighting Evidence

## Evidence

Command output is recorded below for the first-view footer copy change.

### Root Guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

### Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  15 passed (15)
   Start at  10:25:01
   Duration  557ms (transform 75ms, setup 0ms, import 95ms, tests 39ms, environment 0ms)
```

### Repository Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

### Locked Weights Diff Check

```text
EXIT_CODE=0
```

## FINDINGS

1. The first-view footer still named only covered-walkway and exposure-gap evidence, omitting the now-shipped night-lighting map layer. It now names `night-lighting map evidence` while keeping the footer source/evidence framed and not score framed.

## DISAGREEMENTS

1. None.
