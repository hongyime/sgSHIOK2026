# P307 No Transit Qualifying Stop Copy

## Evidence

Command output is recorded below for the no-transit qualifying-stop copy change.

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
   Start at  11:04:58
   Duration  800ms (transform 113ms, setup 0ms, import 146ms, tests 55ms, environment 0ms)
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

1. The `no_transit_candidates_selected` title/reason said `No transit stop within scoring range`, which could read as a real-world absence rather than no qualifying transit candidate inside the scoring policy. It now says `No qualifying transit stop within 1.2 km`.

## DISAGREEMENTS

1. None.
