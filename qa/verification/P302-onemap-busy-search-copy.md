# P302 OneMap Busy Search Copy

## Evidence

Command output is recorded below for the OneMap busy-search copy change.

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
   Start at  10:49:07
   Duration  423ms (transform 60ms, setup 0ms, import 76ms, tests 30ms, environment 0ms)
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

1. The OneMap 429 branch still said `Search is busy`, which obscured that only OneMap address lookup is rate-limited there. It now says `OneMap search is busy`.

## DISAGREEMENTS

1. None.
