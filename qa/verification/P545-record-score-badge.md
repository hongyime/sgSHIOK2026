# P545 Record Score Badge

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier web/test/docs work only. No scoring, export, rescore, subset run, ingest, network build, upstream probe, input mutation, public-data write, protected QA mutation, deployment, or locked-weight change was performed.

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
ce54592a5079810ecaac31441cfddb343a0e1659
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

## Change

The selected-record score panel already had state notes for partial and awaiting-score records, but the visual score badge still led with `Locked score` even when the record had no full locked score. Null-score records now render the badge as `No full score` / `Published bundle`. Numeric records still render as `Locked score` with the score value.

The badge CSS now uses a fixed compact width and allows the strong value text to wrap, so the longer null-score value does not depend on single-line overflow.

## Focused Test Command

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  42 passed (42)
   Start at  06:16:42
   Duration  4.01s (transform 2.24s, setup 0ms, import 2.76s, tests 684ms, environment 1ms)
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  147 passed (147)
   Start at  06:17:27
   Duration  6.32s (transform 4.08s, setup 0ms, import 5.73s, tests 8.82s, environment 29ms)
```

## Python Collection

```text
437 tests collected in 10.51s
```

## Repository Integrity

```text
repo_integrity=ok
exit=0
```

## Evidence Path And Diff Checks

```text
exit=1
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

`git check-ignore -v qa/verification/P545-record-score-badge.md` exited 1, meaning the evidence file is not ignored. `git diff --check` exited 0 and printed only CRLF normalization warnings for touched tracked files. The protected-path diff check against `pipeline/config/weights.yaml`, `checksums.json`, `web/public/data`, `qa/p6_*`, `qa/p7_*`, `qa/p8_*`, `qa/p9_*`, `qa/p10_*`, `qa/releases`, and `qa/p11` produced no output.

## FINDINGS

1. Record-level explanatory notes were already specific, but the score badge itself still visually led with `Locked score` for null-score records.
2. Null-score records now say `No full score` in the badge label and `Published bundle` as the badge value, making the no-full-score state visible in the highest-salience score UI.
3. Numeric records keep the existing `Locked score` badge and 0-to-100 value.

## DISAGREEMENTS

1. None.
