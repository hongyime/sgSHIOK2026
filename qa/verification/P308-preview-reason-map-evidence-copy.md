# P308 Preview Reason Map Evidence Copy

## Evidence

Command output is recorded below for the live-preview reason copy change.

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
   Start at  11:08:29
   Duration  1.68s (transform 863ms, setup 0ms, import 1.13s, tests 271ms, environment 1ms)
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

1. The live OneMap clicked-stop preview reason said `Not scored in the current bundle`, while the rest of the preview surface frames it as shelter-map evidence outside the locked score. It now says `Map evidence only`.

## DISAGREEMENTS

1. None.
