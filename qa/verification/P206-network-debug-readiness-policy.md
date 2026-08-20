# P206 Network Debug Readiness Policy

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

Production readiness and the dry-run batch plan no longer treat the missing compact `qa/island_debug.geojson` diagnostic artifact as an island-network QA failure. They still require the durable island QA JSON metrics, and stricter execution-time paths keep their default debug requirement.

## Real Island QA Split

Command:

```text
uv run python -c "from pathlib import Path; from pipeline.network_qa import validate_network_qa; qa=Path(r'C:\sgSHIOK2026\qa\conflation_qa_island.json'); debug=Path(r'C:\sgSHIOK2026\qa\island_debug.geojson');
for require_debug in (True, False):
    ok, summary = validate_network_qa(qa, debug, require_debug=require_debug, require_production_sources=True)
    print('require_debug=', require_debug, 'ok=', ok)
    print('errors=', summary['errors'])"
```

Output:

```text
require_debug= True ok= False
errors= ['missing debug GeoJSON: C:\\sgSHIOK2026\\qa\\island_debug.geojson']
require_debug= False ok= True
errors= []
```

## Real Batch Plan Gate

Command:

```text
uv run python -c "from pipeline.batch_plan import build_batch_plan; ok, report=build_batch_plan(mode='candidate_full_registered'); print('batch_plan_ok=', ok); print('island_network_qa_ok=', report['checkpoint_gates']['island_network_qa_ok']); print('debug_required_for_plan=', report['checkpoint_gates']['island_network_debug_required_for_plan']); print('debug_required_for_full_batch_execution=', report['checkpoint_gates']['island_network_debug_required_for_full_batch_execution']); print('blockers=', report['checkpoint_gates']['blockers']); print('network_errors=', report['island_network_qa']['errors'])"
```

Output:

```text
batch_plan_ok= True
island_network_qa_ok= True
debug_required_for_plan= False
debug_required_for_full_batch_execution= True
blockers= ['human approval required before full geocode/scoring batch', 'human approval required before production deploy or mock-to-real frontend cutover', 'postal universe uses frozen v1 third-party OneMap-derived 2020 source; v2 requires candidate-source-first approval before full-batch use']
network_errors= []
```

## Tests

Command:

```text
uv run pytest C:\sgSHIOK2026\tests\test_batch_plan.py C:\sgSHIOK2026\tests\test_production_readiness.py C:\sgSHIOK2026\tests\test_network_qa.py -q -p no:cacheprovider
```

Output:

```text
37 passed in 102.89s (0:01:42)
```

## Integrity

Command:

```text
uv run python C:\sgSHIOK2026\scripts\check_repo_integrity.py
```

Output:

```text
repo_integrity=ok
exit=0
```

Command:

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

Output:

```text
weights_diff_exit=0
```

## Full Readiness Attempt

Command:

```text
uv run python C:\sgSHIOK2026\scripts\production_readiness.py
```

Result:

```text
Interrupted after the command exceeded the previous P200 runtime and emitted no output. No scoring, export, rescore, ingest, or network build was running; this was the read-only readiness report. The focused validator, batch-plan, and unit-test evidence above proves the narrow network-debug policy change.
```

## Findings

1. The real island QA JSON passes production source checks when the rebuildable debug GeoJSON requirement is disabled: zero validator errors with `require_debug=False`.
2. The strict validator still fails with `require_debug=True` because `C:\sgSHIOK2026\qa\island_debug.geojson` is absent, preserving the distinction needed for execution-time checks.
3. Dry-run batch planning now reports island network QA as green while explicitly recording that debug is not required for planning but remains required for full-batch execution.
4. The full production-readiness command was slower than the previous P200 run and emitted no output before interruption; future work should profile or make that report stream progress if it remains a regular operator command.

## Disagreements

1. None.
