# P554 Shelter-Map Panel Label

## Startup Guard

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
8ffc333f6e46ef829d6d6dc42749358529e33f73
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

## Scope

```text
Align the score card accessible panel label and live status from "Shelter map panel" to "Shelter-map panel".
Update browser smoke to query the same accessible label.
No scoring, export, rescore, subset run, ingest, network build, upstream probe, input mutation, public-data write, protected QA mutation, deployment, or locked-weight change.
```

## Old Label Search

```text
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:76:    expect(script).not.toContain('section[aria-label="Shelter map panel"]');
```

## New Label Search

```text
C:\sgSHIOK2026\web\scripts\browser-smoke.mjs:525:      const card = document.querySelector('section[aria-label="Shelter-map panel"]');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:197:    expect(html).toContain('aria-label="Shelter-map panel"');
C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx:233:    expect(html).toContain('aria-label="Shelter-map panel"');
C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts:75:    expect(script).toContain('section[aria-label="Shelter-map panel"]');
C:\sgSHIOK2026\web\app\page.tsx:1145:      <section className={styles.scoreCard} aria-label="Shelter-map panel">
C:\sgSHIOK2026\web\app\page.tsx:1160:      <section className={styles.scoreCard} aria-label="Shelter-map panel">
C:\sgSHIOK2026\web\app\page.tsx:1377:    <section className={styles.scoreCard} aria-label="Shelter-map panel">
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs --run C:\sgSHIOK2026\web\lib\__tests__\accessibility-render.test.tsx C:\sgSHIOK2026\web\lib\__tests__\deployment.test.ts C:\sgSHIOK2026\web\lib\__tests__\score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  3 passed (3)
      Tests  54 passed (54)
   Start at  07:00:35
   Duration  6.06s (transform 3.43s, setup 0ms, import 5.01s, tests 1.69s, environment 2ms)
```

## Diff Check

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
```

## Full Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  23 passed (23)
      Tests  150 passed (150)
   Start at  07:01:31
   Duration  9.80s (transform 7.39s, setup 0ms, import 11.79s, tests 14.16s, environment 18ms)
```

## Python Collect Only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 17.49s
```

## Repository Integrity

```text
repo_integrity=ok
repo_integrity_exit=0
```

## Evidence Check Ignore

```text
check_ignore_exit=1
```

## Protected Path Diff

```text
```

## FINDINGS

1. The live score-card panel label still used unhyphenated `Shelter map panel`, while the surrounding product copy had moved to `shelter-map`.
2. The browser smoke selector depended on the old accessible name, so it needed to move with the UI label.

## DISAGREEMENTS

1. None.
