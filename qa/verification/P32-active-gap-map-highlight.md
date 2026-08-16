# P32 Active Gap Map Highlight

Date: 2026-08-16

## Startup Guard

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

```text
d952e67c2a04bdcc1099d960816d042b5347bb71
d952e67c2a04bdcc1099d960816d042b5347bb71	refs/heads/main
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
      Tests  7 passed (7)
   Start at  12:23:16
   Duration  4.46s (transform 1.75s, setup 0ms, import 417ms, tests 1.65s, environment 3ms)

npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs lib/__tests__/route-evidence-map-interaction.test.ts
```

```text
EXIT_CODE=0
```

The direct TypeScript command that omitted `-p web/tsconfig.json` printed compiler help and exited 1 because it ran from the repository root. It was rerun against the web project explicitly:

```text
EXIT_CODE=0
```

## Full Verification

```text

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  115 passed (115)
   Start at  12:24:13
   Duration  9.93s (transform 6.14s, setup 0ms, import 6.59s, tests 14.34s, environment 19ms)

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

1. P31 let a user center the map on an exposed-gap coordinate, but the map did not distinguish the selected coordinate after panning. P32 adds a dedicated `active-exposure-gap` source and ring layer so the selected exposed gap remains visible as map evidence.
2. The route geometry and existing exposed-gap line layer are unchanged; the new marker is derived only from the already selected gap latitude/longitude passed from the score card.

## DISAGREEMENTS

1. None.
