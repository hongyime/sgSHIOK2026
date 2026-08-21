# P306 Partial Locked Score State Note

## Evidence

Command output is recorded below for the partial locked-score state note change.

### Root Guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

### Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  34 passed (34)
   Start at  11:01:47
   Duration  2.57s (transform 1.31s, setup 0ms, import 1.67s, tests 453ms, environment 1ms)
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

1. The `SCORED_PARTIAL` note described missing component scores without saying shelter-map evidence may still be present. It now separates partial locked-score availability from shelter-map evidence availability.

## DISAGREEMENTS

1. None.
