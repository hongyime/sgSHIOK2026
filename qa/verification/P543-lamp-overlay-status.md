# P543 Lamp Overlay Status

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier web/test/docs work only. No scoring, export, rescore, subset run, ingest, network build, upstream probe, input mutation, public-data write, protected QA mutation, deployment, or locked-weight change was performed.

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
e94716e269fd5d9765eabb7f0c79b78527898018
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
?? qa/p125/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p379/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## Defect

The lamp overlay already had a map layer, tile loading, a visible status pill, and non-visual summaries. The defect was narrower: when a viewport had indexed lamp-post tiles and some tile fetches failed, the browser could still report the overlay as loaded. When every indexed tile fetch failed, it could report the viewport as empty instead of unavailable.

## Focused Test Command

The first focused run used repo-root test paths while Vitest was running from `web/`, so it found no files:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run web/lib/__tests__/route-evidence-map-interaction.test.ts web/lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web

No test files found, exiting with code 1

filter: web/lib/__tests__/route-evidence-map-interaction.test.ts, web/lib/__tests__/score-card-copy.test.ts
include: **/*.{test,spec}.?(c|m)[jt]s?(x)
exclude:  **/node_modules/**, **/.git/**
```

Rerun with paths relative to the web package:

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/route-evidence-map-interaction.test.ts lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  26 passed (26)
   Start at  06:05:58
   Duration  1.05s (transform 518ms, setup 0ms, import 325ms, tests 413ms, environment 1ms)
```

## Whitespace Check

```text
```

`git diff --check` exited 0 with no output.

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run

 RUN  v4.1.10 C:/sgSHIOK2026/web

 Test Files  23 passed (23)
      Tests  147 passed (147)
   Start at  06:07:00
   Duration  31.13s (transform 14.15s, setup 0ms, import 21.48s, tests 43.74s, environment 30ms)
```

## Python Collection

```text
437 tests collected in 41.21s
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## Evidence Path And Protected Diff Check

```text
exit=1
```

`git check-ignore -v qa/verification/P543-lamp-overlay-status.md` exited 1, meaning the evidence file is not ignored. The protected-path diff check against `pipeline/config/weights.yaml`, `checksums.json`, `web/public/data`, `qa/p6_*`, `qa/p7_*`, `qa/p8_*`, `qa/p9_*`, `qa/p10_*`, `qa/releases`, and `qa/p11` produced no output.

## FINDINGS

1. The night lighting overlay was not missing, but its failure states were too coarse: partial tile failure could look fully loaded, and complete tile failure could look empty.
2. The browser now distinguishes `partial` from `loaded` and maps all failed indexed viewport tiles to `unavailable`, preserving the difference between "there are no indexed lamp posts here" and "the evidence could not be loaded."
3. The work touched only tracked web/test/docs/evidence files and did not regenerate or mutate the protected `web/public/data/lamp_posts_v1/` artifact.

## DISAGREEMENTS

1. None.
