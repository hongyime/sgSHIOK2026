# P29 Night Lighting Accessibility

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
HEAD=a33b6701cc1e61939cb9e04717f2873feaf9c08b
REMOTE_MAIN=a33b6701cc1e61939cb9e04717f2873feaf9c08b	refs/heads/main
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
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
STATUS_END
```

## Credential Gate

```text
ONEMAP_EMAIL_PRESENT=False LENGTH=0
ONEMAP_PASSWORD_PRESENT=False LENGTH=0
LTA_DATAMALL_ACCOUNT_KEY_PRESENT=False LENGTH=0
```

## Evidence Path Check

```text
EXIT_CODE=1
```

## Focused Web Test

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  12:05:28
   Duration  2.47s (transform 869ms, setup 0ms, import 250ms, tests 806ms, environment 1ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/route-evidence-map-interaction.test.ts
```

## TypeScript

```text
EXIT_CODE=0
```

## Full Web Test

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  113 passed (113)
   Start at  12:05:47
   Duration  8.03s (transform 4.28s, setup 0ms, import 5.95s, tests 9.33s, environment 13ms)

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
public_data_writes=0
deployments=0
```

## FINDINGS

1. The credential-backed OneMap measurement remains blocked because the required environment variables are still absent.
2. The route map's screen-reader summary did not include the night-lighting overlay state, even though the visible map could enable and load the layer.
3. The summary now reports the night-lighting overlay when enabled and includes the current loaded lamp-point count, without adding visible instructional copy.

## DISAGREEMENTS

1. None.
