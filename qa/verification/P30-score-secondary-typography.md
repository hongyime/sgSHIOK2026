# P30 Score Secondary Typography

## Root Guard

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
HEAD=3a54d467c3cb1822374fed2e2c577d773f9cd9d2
REMOTE_MAIN=3a54d467c3cb1822374fed2e2c577d773f9cd9d2	refs/heads/main
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

## Pre-Change Typography Evidence

```text
web/app/page.module.css:279:.scoreBadge strong {
web/app/page.module.css:280:  font-size: 18px;
web/app/page.module.css:577:.exposureHero strong {
web/app/page.module.css:581:  font-size: 15px;
web/app/page.module.css:1079:  .scoreBadge strong {
web/app/page.module.css:1080:    font-size: 18px;
```

## Focused Web Test

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  12:10:37
   Duration  2.79s (transform 340ms, setup 0ms, import 421ms, tests 149ms, environment 1ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/score-card-copy.test.ts
```

## TypeScript

```text
EXIT_CODE=0
```

## Full Web Test

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  114 passed (114)
   Start at  12:11:04
   Duration  8.86s (transform 5.84s, setup 0ms, import 7.74s, tests 12.49s, environment 13ms)

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

1. The standing objective says the locked 0-to-100 composite must stay visible but secondary and never be the largest number on screen.
2. Before P30, the header score badge numeric text was 18px while the shelter-evidence headline was 15px, and the mobile CSS re-enlarged the score badge to 18px.
3. P30 makes the shelter-evidence headline larger than the score badge and pins that contract in the web copy test.

## DISAGREEMENTS

1. None.
