# P295 Night Lighting Rendered Test

## Evidence

Command output is recorded below for the rendered accessibility test correction.

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
   Start at  10:28:48
   Duration  7.30s (transform 3.12s, setup 0ms, import 4.13s, tests 1.00s, environment 2ms)
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

1. The rendered accessibility tests for night-lighting walk details still expected `Layer on` / `Layer off`, and one test explicitly rejected `Map layer`, contradicting P293's product copy. They now require `Map layer on` / `Map layer off` and reject the retired ambiguous wording.

## DISAGREEMENTS

1. None.
