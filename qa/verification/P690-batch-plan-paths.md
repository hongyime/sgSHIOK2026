# P690 Batch Plan Path Hygiene

## Startup

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Observation

```text
uv run python run.py batch-plan
```

Before this change, `bounded_geocoding.completed_fill.cache_db` surfaced stale processed-summary
metadata as `C:\shiok\raw\geocode_cache.db`. The current geocode code resolves the live cache path
from `PROJECT_ROOT`, but the dry-run planner displayed the historical path verbatim from the frozen
completed-fill summary.

## Post-change Probe

```text
>     "completed_fill": {
>       "cache_db": "raw\\geocode_cache.db",
        "cache_failures": 476,
        "cache_successes": 99,
exit=0
```

## Verification

```text
uv run pytest tests/test_batch_plan.py -q -p no:cacheprovider
..........                                                               [100%]

10 passed in 19.68s
```

```text
uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -q -p no:cacheprovider
....................................                                     [100%]
36 passed in 162.79s (0:02:42)
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
459 tests collected in 30.94s
```

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
git diff --check; Write-Output "exit=$LASTEXITCODE"
warning: in the working copy of 'tests/test_batch_plan.py', CRLF will be replaced by LF the next time Git touches it
exit=0
```

```text
git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases raw processed; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. `run.py batch-plan` was not using `C:\shiok` for execution, but it did display a stale absolute
   path copied from frozen completed-fill metadata, which undermined the C: working-root guarantee
   in operator-facing dry-run output.
2. The completed-fill facts are still preserved; only known `raw\` and `processed\` artifact paths
   are normalized for display in the generated plan.

## DISAGREEMENTS

1. None.
