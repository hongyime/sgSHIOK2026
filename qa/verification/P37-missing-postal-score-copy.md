# P37 Missing Postal Score Copy

Date: 2026-08-16

## Startup Guard

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

```text
0865fb666d019e92fb688905d5b009fb6ccdd990
0865fb666d019e92fb688905d5b009fb6ccdd990	refs/heads/main
```

```text
ONEMAP_EMAIL_PRESENT=False LENGTH=0
ONEMAP_PASSWORD_PRESENT=False LENGTH=0
LTA_DATAMALL_ACCOUNT_KEY_PRESENT=False LENGTH=0
```

## Focused Verification

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  10 passed (10)
   Start at  12:48:12
   Duration  3.35s (transform 1.37s, setup 0ms, import 1.82s, tests 340ms, environment 1ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx
```

```text
EXIT_CODE=0
```

## Full Verification

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  118 passed (118)
   Start at  12:48:29
   Duration  7.39s (transform 4.38s, setup 0ms, import 5.95s, tests 10.45s, environment 19ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs
```

```text
repo_integrity=ok
EXIT_CODE=0
```

```text
EXIT_CODE=0
```

## Scope

No API calls, scoring, export, rescore, subset run, ingest, network build, input rebuild, deployment, public data write, or `pipeline/config/weights.yaml` change was run.

## FINDINGS

1. When a searched postal had no score record, the detail card said only that it was not in the current score bundle.
2. P37 makes the absence explicit as missing published route evidence in the frozen June 2020 address universe, matching the title-card caveat at the point of failure.

## DISAGREEMENTS

1. None.
