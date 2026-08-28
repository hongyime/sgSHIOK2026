# P813 Preview Score Announcement

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Date: 2026-08-29

## Scope

Align the screen-reader announcement for clicked-transit preview walks with the visible `Locked score: Preview only` state.

No scoring, export, rescore, subset run, ingest, network build, public-data mutation, protected evidence mutation, deployment, or locked-weight change was performed.

## Startup Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Finding

The preview route summary grid visibly rendered:

```text
Locked score
Preview only
```

but `scoreCardAnnouncement()` still described null preview totals through the generic published-bundle unavailable branch. Preview evidence is not a published locked-score state, so assistive copy should name it as preview-only.

## Change

`scoreCardAnnouncement()` now announces:

```text
Locked score preview only; published locked score unchanged.
```

when `previewRoute` is true.

## Verification

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  60 passed (60)
   Start at  06:52:31
   Duration  8.04s (transform 2.54s, setup 0ms, import 3.18s, tests 2.29s, environment 3ms)
```

```text
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs
tests/test_triage_onemap_outliers.py::test_triage_cli_refuses_existing_explicit_output_before_input_reads

629 tests collected in 23.80s
exit_code=0
```

```text
repo_integrity=ok
exit_code=0
```

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

## FINDINGS

1. Clicked-transit preview walks had the correct visible locked-score state but weaker screen-reader wording.
2. The fix keeps preview shelter-map evidence separate from the published locked score without changing visible layout, scoring, public data, or route geometry.

## DISAGREEMENTS

1. None.
