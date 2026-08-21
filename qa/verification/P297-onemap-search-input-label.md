# P297 OneMap Search Input Label

## Evidence

Command output is recorded below for the first-view search input copy change.

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
   Start at  10:35:14
   Duration  619ms (transform 89ms, setup 0ms, import 111ms, tests 50ms, environment 0ms)
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

1. The search input placeholder and accessible label said `Search address or 6-digit postal`, which did not expose that non-postal address search uses OneMap while 6-digit postal lookup is direct. They now say `Search OneMap address or 6-digit postal`.

## DISAGREEMENTS

1. None.
