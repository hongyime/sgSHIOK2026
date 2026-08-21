# P544 Locked Score Coverage Copy

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier web/test/docs work only. No scoring, export, rescore, subset run, ingest, network build, upstream probe, input mutation, public-data write, protected QA mutation, deployment, or locked-weight change was performed.

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
b8b50aa58c747b112fc4e172cb8e425ef0944ecf
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

The first-view locked score coverage disclosure used the phrase `full locked sorting index`. That phrase is appropriate in the planning-area rank control, where the locked score is literally used as a sorting index, but it is not the clearest user-facing description of whether a postal renders a full score. The disclosure now says `full locked score`.

## Focused Test Command

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/locked-score-availability.test.ts lib/__tests__/data.test.ts lib/__tests__/score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  23 passed (23)
   Start at  06:11:30
   Duration  1.48s (transform 529ms, setup 0ms, import 660ms, tests 693ms, environment 2ms)
```

## User-Facing Phrase Search

```text
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:263:      "full locked sorting index"
```

The remaining instance is a negative assertion proving `web/lib/locked-score-availability.ts` does not contain the old phrase.

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  147 passed (147)
   Start at  06:12:20
   Duration  8.74s (transform 7.73s, setup 0ms, import 10.78s, tests 12.90s, environment 16ms)
```

## Python Collection

```text
437 tests collected in 16.30s
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
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
```

`git check-ignore -v qa/verification/P544-locked-score-coverage-copy.md` exited 1, meaning the evidence file is not ignored. `git diff --check` exited 0 and printed only CRLF normalization warnings for touched tracked files. The protected-path diff check against `pipeline/config/weights.yaml`, `checksums.json`, `web/public/data`, `qa/p6_*`, `qa/p7_*`, `qa/p8_*`, `qa/p9_*`, `qa/p10_*`, `qa/releases`, and `qa/p11` produced no output.

## FINDINGS

1. The first-view coverage disclosure had correct numbers but used internal wording: `full locked sorting index`.
2. The disclosure now says `full locked score`, while preserving the 95,157 / 124,443 and 29,286 / 23.5% live-bundle counts.
3. The planning-area ranking UI still says the locked score is a sorting index, because that is the behavior of that control.

## DISAGREEMENTS

1. None.
