# P300 OneMap Search Error Copy

## Evidence

Command output is recorded below for the OneMap search error copy change.

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
   Start at  10:43:28
   Duration  624ms (transform 87ms, setup 0ms, import 110ms, tests 51ms, environment 0ms)
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

1. Two search error strings were still generic: `Selected result has no usable postal code` and `Failed to search postal location`. They now name the OneMap path as `Selected OneMap result has no usable postal code` and `Failed to search OneMap address`.

## DISAGREEMENTS

1. None.
