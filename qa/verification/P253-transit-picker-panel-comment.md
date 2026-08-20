# P253 transit picker panel comment

## Root guard

```text
ROOT_OK C:\sgSHIOK2026
HOST PRAWN-E14
```

## Scope

Maintained web source still had one score-first explanatory comment:

```text
The primary score card already announces the active stop's routed
distance in its headline row
```

It now uses the settled product frame:

```text
The shelter-map panel already announces the active stop's selected
walk distance in its headline row
```

## Focused tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs transit-stop-picker.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  33 passed (33)
   Start at  07:37:42
   Duration  7.00s (transform 2.84s, setup 0ms, import 4.02s, tests 118ms, environment 1ms)
```

## FINDINGS

1. A maintained transit picker comment still described the main result surface as the primary score card, even though the product frame is shelter-map evidence first and locked score secondary.
2. The comment is now guarded by a focused source-copy test so the old score-first wording does not return.
3. This was comment/test work only. No scoring, export, rescore, ingest, network build, public-data write, deployment, or locked weight change was run.

## DISAGREEMENTS

1. None.
