# P298 Empty Search Prompt

## Evidence

Command output is recorded below for the empty shelter-map panel search prompt change.

### Root Guard

```text
ROOT_GUARD_OK actual=C:\sgSHIOK2026 host=PRAWN-E14
```

### Focused Web Test

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  19 passed (19)
   Start at  10:38:27
   Duration  2.70s (transform 1.14s, setup 0ms, import 1.50s, tests 359ms, environment 0ms)
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

1. The empty shelter-map panel still said `Find a postal code` and asked users to search a Singapore postal code even though the input now supports OneMap address search as well as direct 6-digit postal lookup. It now says `Find an address or postal code` and names `OneMap address or 6-digit postal code`.

## DISAGREEMENTS

1. None.
