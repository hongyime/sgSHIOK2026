# P806 P19 Sample Freshness Window

## Working Root

```text
PWD=C:\sgSHIOK2026
Prawn-E14
```

## Intent

```text
Surface the freshness boundary for the P19 v2 current-source sample in user-facing Data limits copy. This is web copy/test/evidence work only; it does not score, export, rescore, ingest, build network inputs, deploy, or modify protected payloads.
```

## Artifact Check

```text
generated_at_utc: 2026-08-28T21:15:15.685030+00:00
pipeline/batch_plan.py stale_after_utc: 2026-09-04T21:15:15.685030+00:00
Displayed boundary: Current for gap sizing until 4 Sep 2026 UTC under the 7-day sample policy.
```

## Focused Web Tests

```text
npm notice run shiok-web@0.1.0 test
npm notice run node scripts/test-web.mjs accessibility-render.test.tsx score-card-copy.test.ts

 RUN  v4.1.10 C:/sgSHIOK2026/web


 Test Files  2 passed (2)
      Tests  56 passed (56)
   Start at  05:49:17
   Duration  7.09s (transform 2.23s, setup 0ms, import 2.83s, tests 2.08s, environment 1ms)
```

## Collect Only

```text
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs
tests/test_triage_onemap_outliers.py::test_triage_cli_refuses_existing_explicit_output_before_input_reads

629 tests collected in 41.40s
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
 web/app/page.tsx                                | 2 +-
 web/lib/__tests__/accessibility-render.test.tsx | 5 +++--
 web/lib/__tests__/score-card-copy.test.ts       | 2 +-
 3 files changed, 5 insertions(+), 4 deletions(-)
```

## FINDINGS

1. P803 made the P19 v2 sample current again, but the web Data limits copy did not tell users when that current-source evidence expires under the project's 7-day sample policy.
2. The UI now states that the sample is current for gap sizing until 4 Sep 2026 UTC, derived from the 28 Aug 2026 generated timestamp plus the committed 7-day currentness window.

## DISAGREEMENTS

1. None.
