# P33 Exposed Gap Context Reset

Date: 2026-08-16

## Startup Guard

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

```text
817bbb2ca994865b8ed439a791dee4a9975cbd38
817bbb2ca994865b8ed439a791dee4a9975cbd38	refs/heads/main
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
      Tests  8 passed (8)
   Start at  12:30:00
   Duration  1.58s (transform 632ms, setup 0ms, import 147ms, tests 647ms, environment 0ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/route-evidence-map-interaction.test.ts
```

```text
EXIT_CODE=0
```

## Full Verification

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  116 passed (116)
   Start at  12:30:27
   Duration  27.22s (transform 17.31s, setup 0ms, import 23.23s, tests 40.46s, environment 53ms)

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

1. P32 introduced a selected exposed-gap marker, but route mode, transit mode, and custom-stop changes could leave the marker pointing at a gap from the previous route context.
2. P33 clears the focused exposed gap on every route-context change, keeping the map marker tied to the currently displayed route evidence.

## DISAGREEMENTS

1. None.
