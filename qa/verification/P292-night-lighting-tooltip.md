# P292 Night Lighting Tooltip

## Evidence

Command output is recorded below for the night-lighting layer tooltip copy change.

### Root Guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

### Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/route-evidence-map-interaction.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  10:18:22
   Duration  770ms (transform 290ms, setup 0ms, import 89ms, tests 289ms, environment 0ms)
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

1. The night-lighting layer button title still led with raw `LTA lamp post locations` while the visible control had moved to the user-facing `Night lighting` label. The tooltip now starts with `Night lighting` and keeps the LTA source and locked-score separation.

## DISAGREEMENTS

1. None.
