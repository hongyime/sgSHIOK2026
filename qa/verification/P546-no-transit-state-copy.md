# P546 No-Transit State Copy

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier web/test/docs work only. No scoring, export, rescore, subset run, ingest, network build, upstream probe, input mutation, public-data write, protected QA mutation, deployment, or locked-weight change was performed.

## Root Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
2a3ddd579329116bc73bd6b67d301df0b8ab7f11
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

The selected-record panel already separated `NO_TRANSIT_IN_RANGE` causes internally. This change makes the far-connected-walk title less generic: `Transit beyond locked range` became `Connected walk beyond 1.2 km`.

Rendered tests now pin three no-transit states:

- a connected shelter-map walk exists, but only beyond the locked 1.2 km range;
- a transit stop or exit exists, but the published shelter-map bundle has no connected walk;
- no qualifying MRT/LRT exit or bus stop was selected within the locked 1.2 km range.

The browser smoke classifier was updated so no-transit launch checks still recognize the far-connected-walk state.

## Focused Test Command

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run lib/__tests__/accessibility-render.test.tsx lib/__tests__/score-card-copy.test.ts lib/__tests__/deployment.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  54 passed (54)
   Start at  06:22:30
   Duration  1.82s (transform 1.17s, setup 0ms, import 1.46s, tests 433ms, environment 1ms)
```

## Phrase Search

```text
C:\sgSHIOK2026\web\app\page.tsx:522:    ? "Connected walk beyond 1.2 km"
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:573:    summary.cardText.includes("Connected walk beyond 1.2 km") ||
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:724:    expect(html).toContain("Connected walk beyond 1.2 km");
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:731:    expect(html).not.toContain("Transit beyond locked range");
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:65:    expect(script).toContain("Connected walk beyond 1.2 km");
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:66:    expect(script).not.toContain("Transit beyond locked range");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:15:    expect(source).toContain("Connected walk beyond 1.2 km");
C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts:24:    expect(source).not.toContain("Transit beyond locked range");
```

The old phrase remains only in negative assertions.

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  150 passed (150)
   Start at  06:23:18
   Duration  10.37s (transform 5.22s, setup 0ms, import 7.94s, tests 15.13s, environment 15ms)
```

## Python Collection

```text
437 tests collected in 17.20s
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

`git check-ignore -v qa/verification/P546-no-transit-state-copy.md` exited 1, meaning the evidence file is not ignored. `git diff --check` exited 0 and printed only CRLF normalization warnings for touched tracked files. The protected-path diff check against `pipeline/config/weights.yaml`, `checksums.json`, `web/public/data`, `qa/p6_*`, `qa/p7_*`, `qa/p8_*`, `qa/p9_*`, `qa/p10_*`, `qa/releases`, and `qa/p11` produced no output.

## FINDINGS

1. `NO_TRANSIT_IN_RANGE` is not one state from a user's point of view: far connected walks, disconnected candidates, and no selected candidates need different explanations.
2. The far-connected-walk title now says what happened: a connected walk exists, but beyond the locked 1.2 km range.
3. Rendered tests now cover all three no-transit explanation branches.

## DISAGREEMENTS

1. None.
