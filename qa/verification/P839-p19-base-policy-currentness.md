# P839 P19 Base Policy Currentness

Date: 2026-08-29
Working root: `C:\sgSHIOK2026`
Machine: `PRAWN-E14`

## Scope

Free-tier source-policy reporting/test/evidence work only. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected-payload mutation, or locked-weight change was performed.

## Constant And Dynamic Probe

Command:

```text
uv run python -c "import json; from pipeline.batch_plan import RECENT_PUBLIC_SOURCE_GAP_SAMPLE, recent_public_source_gap_sample_policy; print(json.dumps({'base_currentness': RECENT_PUBLIC_SOURCE_GAP_SAMPLE['currentness'], 'dynamic_currentness': recent_public_source_gap_sample_policy()['currentness']}, indent=2, sort_keys=True))"
```

Output:

```json
{
  "base_currentness": {
    "dynamic_status_command": "uv run python run.py p19-gap-status",
    "fresh_for_current_gap_sizing": false,
    "reason": "currentness is time-sensitive; call p19-gap-status before using this sample for current gap sizing",
    "status": "runtime_status_required"
  },
  "dynamic_currentness": {
    "dynamic_status_command": "uv run python run.py p19-gap-status",
    "fresh_for_current_gap_sizing": true,
    "max_age_days": 0.215,
    "reason": "the cached v2 sample is fresh current-source evidence; promotion still requires explicit owner approval and candidate-source-first scope",
    "status": "fresh",
    "summary": "cached P19 sample age 0.215d is within the 7d current-gap sizing threshold",
    "threshold_days": 7.0
  }
}
```

## Search Evidence

Command:

```text
git grep -n "2026-09-04\|stale_after_utc\|stale_after_days.*7" -- ':!qa/verification/*' ':!decisions.md' ':!.agents/STATE.md'
```

Output:

```text
```

Exit code: 1

## Tests

```text
..............                                  [100%]
39 passed in 165.41s (0:02:45)
```

## FINDINGS

1. After P837, the emitted reports were dynamic, but the base `RECENT_PUBLIC_SOURCE_GAP_SAMPLE` literal still carried the expiring 2026-09-04 freshness claim.
2. The base policy now says `runtime_status_required` and `fresh_for_current_gap_sizing: false`; callers must use `recent_public_source_gap_sample_policy()` to obtain a current fresh/stale state.
3. No tracked non-evidence surface now carries the hardcoded P19 2026-09-04 currentness deadline.

## DISAGREEMENTS

1. None.
