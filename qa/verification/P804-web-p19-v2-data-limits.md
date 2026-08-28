# P804 Web P19 v2 Data Limits

## Working Root

```text
PWD=C:\sgSHIOK2026
Prawn-E14
```

## Intent

```text
Surface the completed P19 v2 current-source universe-gap sample in the existing web Data limits copy. This is a copy/data-evidence alignment change only; it does not score, export, rescore, ingest, build network inputs, deploy, or modify protected payloads.
```

## Old Literal Check

```text
exit_code=1
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs score-card-copy.test.ts accessibility-render.test.tsx

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  55 passed (55)
   Start at  05:32:41
   Duration  11.23s (transform 5.25s, setup 0ms, import 6.52s, tests 1.40s, environment 1ms)

exit_code=0
```

## Collect Only

```text
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs
tests/test_triage_onemap_outliers.py::test_triage_cli_refuses_existing_explicit_output_before_input_reads

629 tests collected in 42.19s
exit_code=0
```

## Repo Integrity

```text
repo_integrity=ok
exit_code=0
```

## Protected Diff Guard

```text
protected_diff_exit_code=0
```

## Diff Stat

```text
warning: in the working copy of 'web/lib/__tests__/accessibility-render.test.tsx', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'web/lib/__tests__/score-card-copy.test.ts', CRLF will be replaced by LF the next time Git touches it
 web/app/page.tsx                                |  4 ++--
 web/lib/__tests__/accessibility-render.test.tsx | 12 ++++++------
 web/lib/__tests__/score-card-copy.test.ts       |  4 ++--
 3 files changed, 10 insertions(+), 10 deletions(-)
```

## FINDINGS

1. The web Data limits copy still referenced the stale 16 Aug P19 sample after P803 completed and committed the fresh P19 v2 sample.
2. The UI now names the P19 v2 28 Aug 2026 public-source sample and keeps the measured gap at 6 confirmed HDB rows plus 2 MCST proxy warnings out of 976 rows with postals.
3. The OSM coverage line now reflects the refreshed P19 v2 Overpass output: 25,919 valid distinct postcodes, 25,899 overlapping frozen v1, and 20 valid OSM-only postcodes.

## DISAGREEMENTS

1. None.
