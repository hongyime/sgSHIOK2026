# P800 Stale P19 Batch Policy

## Working Root

```text
PWD=C:\sgSHIOK2026
Prawn-E14
```

## Intent

```text
P799 made p19-gap-status report that the cached 16 Aug 2026 public-source sample is stale for current gap sizing. P800 propagates that stale/currentness distinction into the dry-run batch plan and production readiness source-policy surface so a v2 postal universe cannot be described as not approved from a "current" sample.
```

## Batch Plan Policy Probe

```text
{
  "checkpoint_blockers": [
    "human approval required before full geocode/scoring batch",
    "human approval required before production deploy or mock-to-real frontend cutover",
    "postal universe uses frozen v1 third-party OneMap-derived 2020 source; v2 requires candidate-source-first approval before full-batch use",
    "not every bundled full-batch change has prerequisite subset evidence",
    "completed bounded geocode fill used an unversioned cache path; future bounded geocode fills must use a numeric-version cache artifact"
  ],
  "currentness": {
    "dynamic_status_command": "uv run python run.py p19-gap-status",
    "fresh_for_current_gap_sizing": false,
    "reason": "the cached 16 Aug 2026 sample is historical evidence; current gap sizing requires explicit owner approval and new versioned outputs",
    "stale_after_days": 7,
    "stale_after_utc": "2026-08-23T02:08:55.624822+00:00",
    "status": "stale"
  },
  "ok": true,
  "status": "not_approved_from_stale_sample",
  "verdict": "small sampled historical current-source gap in frozen v1; refresh or v2 remains candidate-source-first if approved"
}
exit_code=0
```

## Focused Tests

```text
....................................                                     [100%]
36 passed in 60.22s (0:01:00)
exit_code=0
```

## Collect Only

```text
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs
tests/test_triage_onemap_outliers.py::test_triage_cli_refuses_existing_explicit_output_before_input_reads

626 tests collected in 21.38s
exit_code=0
```

## Repo Integrity

```text
repo_integrity=ok
exit_code=0
```

## Protected Diff Guard

```text
exit_code=0
```

## Diff Stat

```text
warning: in the working copy of 'tests/test_batch_plan.py', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'tests/test_production_readiness.py', CRLF will be replaced by LF the next time Git touches it
 pipeline/batch_plan.py             | 25 ++++++++++++++++++++-----
 tests/test_batch_plan.py           | 25 ++++++++++++++++++++-----
 tests/test_production_readiness.py | 23 +++++++++++++++++++----
 3 files changed, 59 insertions(+), 14 deletions(-)
```

## FINDINGS

1. The dry-run batch plan previously described the P19 evidence as a current cached sample even after P799 proved it is stale for current gap sizing.
2. The batch plan now reports `not_approved_from_stale_sample` and names the 7 day stale threshold plus the exact stale-after timestamp.
3. No scoring, export, rescore, subset run, ingest, network build, protected payload write, deployment, or locked-weight change was performed.

## DISAGREEMENTS

1. None.
