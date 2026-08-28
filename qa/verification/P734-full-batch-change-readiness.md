# P734 full-batch change readiness

## Root and host

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Evidence path ignore check

```text
exit_code=1
```

## Batch-plan checklist output

```text
>       "not every bundled full-batch change has prerequisite subset evidence"
      ],
      "full_batch_allowed_now": false,
      "full_geocode_scoring_batch_requires_human_approval": true,
      "island_network_debug_required_for_full_batch_execution": true,
>   "full_batch_change_readiness": [
      {
        "change": "bus remodel",
        "evidence": [
          "decisions.md P576",
>       "status": "subset_measured_not_approved_for_full_batch"
      },
      {
        "change": "NO_TRANSIT_IN_RANGE partial-score fix",
        "evidence": [
>       "status": "policy_decided_subset_proof_missing"
      },
      {
        "change": "network conflation repair",
        "evidence": [
>       "status": "subset_measured_not_approved_for_full_batch"
      },
      {
        "change": "promoted postal universe v2",
        "evidence": [
>       "status": "not_approved_from_current_sample"
      }
    ],
    "full_batch_release_scope": {
      "bundled_changes": [
>         "status": "not_approved_from_current_sample"
        },
        "verdict": "small sampled current-source gap in frozen v1; v2 remains candidate-source-first if approved"
      },
      "requires_human_approval_for_universe": true,
```

## Focused tests

```text
..........                                                               [100%]
10 passed in 32.06s
```

## Collection

```text
531 tests collected in 64.47s (0:01:04)
```

## Integrity checks

```text
repo_integrity=ok
exit_code=0
```

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'tests/test_batch_plan.py', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

```text
exit_code=0
```

## FINDINGS

1. `run.py batch-plan` already carried the policy that every full-batch change must be proven on the 1200-record subset first, but it did not expose per-change readiness status.
2. The dry-run report now names which bundled changes are measured candidates and which are still missing prerequisite evidence before the one-attempt full batch.
3. The full-batch gate remains closed because `NO_TRANSIT_IN_RANGE` partial-score work lacks 1200-record subset proof and postal-universe v2 is not approved from the current sample.

## DISAGREEMENTS

1. None.
