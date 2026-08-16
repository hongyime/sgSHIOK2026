# P31 Exposed Gap Map Focus

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
HEAD=8eadec4354f2769feac9f993152c470f9bebe323
REMOTE_MAIN=8eadec4354f2769feac9f993152c470f9bebe323	refs/heads/main
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

The first focused render run failed because the test harness did not pass the optional gap-focus callback, so `ScoreCard` correctly rendered non-interactive gap rows. The harness was updated to exercise the interactive path.

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web

 ❯ lib/__tests__/accessibility-render.test.tsx (9 tests | 1 failed) 723ms
     × renders exposed gap lengths with coordinates 188ms

 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 15 passed (16)
   Start at  12:15:43
   Duration  5.97s (transform 3.27s, setup 0ms, import 3.60s, tests 2.58s, environment 3ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/route-evidence-map-interaction.test.ts
```

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  16 passed (16)
   Start at  12:16:13
   Duration  2.27s (transform 1.47s, setup 0ms, import 1.43s, tests 1.03s, environment 1ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/accessibility-render.test.tsx lib/__tests__/route-evidence-map-interaction.test.ts
```

## TypeScript

```text
EXIT_CODE=0
```

## Full Web Test

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  115 passed (115)
   Start at  12:16:30
   Duration  9.20s (transform 5.39s, setup 0ms, import 7.00s, tests 13.62s, environment 14ms)

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

1. The credential-backed OneMap measurement remains blocked because `ONEMAP_EMAIL`, `ONEMAP_PASSWORD`, and `LTA_DATAMALL_ACCOUNT_KEY` are absent.
2. The score card displayed exposed gap lengths and coordinates, but those coordinates were passive text rather than map actions.
3. Top exposed gaps with coordinates now become keyboard-accessible controls that focus the map on the selected gap while preserving the existing length and coordinate display.

## DISAGREEMENTS

1. None.
