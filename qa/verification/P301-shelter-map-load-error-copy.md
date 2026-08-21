# P301 Shelter Map Load Error Copy

## Evidence

Command output is recorded below for the shelter-map load error copy change.

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
   Start at  10:46:44
   Duration  715ms (transform 100ms, setup 0ms, import 130ms, tests 51ms, environment 0ms)
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

1. The selected-postal load fallback still said `Failed to load score data`, which framed a shelter-map data-load failure around internal score data. It now says `Failed to load shelter-map data`.

## DISAGREEMENTS

1. None.
