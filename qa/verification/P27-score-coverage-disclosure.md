# P27 Score Coverage Disclosure

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
HEAD=7a99567ef4d86d07c505635de786ad837456a5f6
REMOTE_MAIN=7a99567ef4d86d07c505635de786ad837456a5f6	refs/heads/main
STATUS_START
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p12/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
STATUS_END
```

## Objective File

```text
OBJECTIVE_PATH=C:\Users\bryan\.codex\attachments\3cf757f3-21d9-4cd6-b777-58bf108c6f95\pasted-text-1.txt
OBJECTIVE_BYTES=7321
OBJECTIVE_LINES=1
OBJECTIVE_SHA256=E89090D88D1BB7BACB227DD01F1A26E927C4D87ECBED11D241D30881490BFFB3
```

## Manifest Score Availability

```text
record_count 124443
state_counts {"NOT_YET_SCORED": 476, "NO_TRANSIT_IN_RANGE": 9827, "SCORED": 95157, "SCORED_PARTIAL": 18983}
full_score_count 95157
non_full_count 29286
non_full_pct 23.534
```

Arithmetic:

```text
124443 - 95157 = 29286
29286 / 124443 * 100 = 23.534
```

## Evidence Path Check

```text
EXIT_CODE=1
```

## Focused Web Test

First invocation used a repo-root path while Vitest runs from `web/`; it found no files and was rerun with a path relative to `web/`.

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs web/lib/__tests__/score-card-copy.test.ts
No test files found, exiting with code 1

filter: web/lib/__tests__/score-card-copy.test.ts
include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exclude:  **/node_modules/**, **/.git/**
```

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  8 passed (8)
   Start at  11:50:50
   Duration  1.13s (transform 138ms, setup 0ms, import 179ms, tests 44ms, environment 1ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts
```

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  11 passed (11)
   Start at  11:51:48
   Duration  1.07s (transform 188ms, setup 0ms, import 316ms, tests 153ms, environment 1ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts lib/__tests__/score-coverage.test.ts
```

## TypeScript Check

The first full web run exposed a nullable provenance type error; the exact `tsc` command then showed the diagnostic.

```text
lib/score-coverage.ts(23,29): error TS18047: 'provenance' is possibly 'null'.
```

After narrowing provenance:

```text
EXIT_CODE=0
```

## Full Web Test

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  112 passed (112)
   Start at  11:53:49
   Duration  6.31s (transform 3.27s, setup 0ms, import 6.81s, tests 7.64s, environment 13ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs
```

## Repo Integrity

```text
repo_integrity=ok
EXIT_CODE=0
```

## Weights Diff

```text
EXIT_CODE=0
```

## Pipeline Cost

```text
api_calls=0
scoring_runs=0
exports=0
rescores=0
subset_runs=0
ingest_runs=0
network_builds=0
```

## FINDINGS

1. The browser already disclosed the frozen 2020-derived address universe, but did not disclose the active bundle's score availability gap despite the standing product requirement.
2. The active manifest reports 95,157 fully scored records out of 124,443; 29,286 records, or 23.534%, do not render a full score, so "roughly a quarter" is accurate.
3. The disclosure is now derived from `manifest.provenance.record_count` and `state_counts` and will disappear rather than lie if a future bundle omits those counts.

## DISAGREEMENTS

1. None.
