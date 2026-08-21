# P541 Prioritized Stale Freshness

## Scope

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

Change: sort structured stale freshness sources by days past stale and expose the most-overdue source directly.

Hard limits observed:
- No scoring, export, rescore, subset run, ingest, network build, or deployment was run.
- No upstream API probes were run; freshness evidence came from manifest-only code paths.
- `pipeline/config/weights.yaml` was not modified.
- Existing protected QA evidence, `web/public/data/`, `qa/releases/`, and `checksums.json` were not modified.
- Existing `qa/verification/` evidence was not rewritten.

## Command Output

### Working Root

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

### git check-ignore -v qa/verification/P541-prioritized-stale-freshness.md

```text
exit_code=1
```

### Structured Probe

Command:

```text
uv run python -c "import json; from datetime import UTC, datetime; from scripts.production_readiness import source_freshness_readiness; report=source_freshness_readiness(now=datetime(2026, 8, 21, 21, 30, 11, 361076, tzinfo=UTC)); print(json.dumps({'most_overdue_stale_source': report['most_overdue_stale_source'], 'stale_sources': report['stale_sources']}, indent=2, sort_keys=True))"
```

Output:

```json
{
  "most_overdue_stale_source": {
    "age_basis": "last_modified",
    "age_days": 259.807122,
    "days_past_stale": 139.807122,
    "expected_cadence": "quarterly",
    "name": "Planning Area Boundaries (MP2019 No Sea)",
    "source_key": "planning_area_boundary",
    "stale_after_days": 120
  },
  "stale_sources": [
    {
      "age_basis": "last_modified",
      "age_days": 259.807122,
      "days_past_stale": 139.807122,
      "expected_cadence": "quarterly",
      "name": "Planning Area Boundaries (MP2019 No Sea)",
      "source_key": "planning_area_boundary",
      "stale_after_days": 120
    },
    {
      "age_basis": "last_modified",
      "age_days": 239.807817,
      "days_past_stale": 119.807817,
      "expected_cadence": "quarterly",
      "name": "NParks Tracks",
      "source_key": "nparks_tracks",
      "stale_after_days": 120
    },
    {
      "age_basis": "last_modified",
      "age_days": 201.807875,
      "days_past_stale": 81.807875,
      "expected_cadence": "quarterly",
      "name": "NParks Heritage Road Green Buffers",
      "source_key": "nparks_heritage_road_green_buffers",
      "stale_after_days": 120
    },
    {
      "age_basis": "last_modified",
      "age_days": 168.545953,
      "days_past_stale": 48.545953,
      "expected_cadence": "quarterly",
      "name": "Traffic Signals",
      "source_key": "traffic_signals",
      "stale_after_days": 120
    },
    {
      "age_basis": "last_modified",
      "age_days": 142.807944,
      "days_past_stale": 22.807944,
      "expected_cadence": "quarterly",
      "name": "NParks Heritage Trees",
      "source_key": "nparks_heritage_trees",
      "stale_after_days": 120
    },
    {
      "age_basis": "last_modified",
      "age_days": 127.807909,
      "days_past_stale": 7.807909,
      "expected_cadence": "quarterly",
      "name": "NParks Nature Ways",
      "source_key": "nparks_nature_ways",
      "stale_after_days": 120
    }
  ]
}
```

### uv run pytest tests/test_production_readiness.py tests/test_readme.py -q

```text
..............................                                           [100%]
30 passed in 80.12s (0:01:20)
```

### uv run pytest -q --collect-only | Select-Object -Last 5

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 7.80s
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
exit_code=0
```

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
warning: in the working copy of 'tests/test_production_readiness.py', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

### Protected Diff Guard

Command:

```text
git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases qa/p11
```

Output:

```text
```

## FINDINGS

1. P540 made stale sources structured, but left them in source-key order, so refresh planning still had to scan the full list to find the most overdue item.
2. `source_freshness_readiness()` now sorts `stale_sources` by `days_past_stale` descending and exposes `most_overdue_stale_source` directly.
3. The current most overdue stale source is `planning_area_boundary`, 139.807122 days past its 120-day threshold.

## DISAGREEMENTS

1. None.
