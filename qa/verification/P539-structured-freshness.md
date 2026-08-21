# P539 Structured Freshness

## Scope

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

Change: expose the nearest current source to stale as structured production-readiness fields.

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

### git check-ignore -v qa/verification/P539-structured-freshness.md

```text
exit_code=1
```

### Structured Probe

Command:

```text
uv run python -c "import json; from datetime import UTC, datetime; from scripts.production_readiness import source_freshness_readiness; print(json.dumps(source_freshness_readiness(now=datetime(2026, 8, 21, 21, 30, 11, 361076, tzinfo=UTC))['nearest_current_source_to_stale'], indent=2, sort_keys=True))"
```

Output:

```json
{
  "age_basis": "last_modified",
  "age_days": 113.566752,
  "days_until_stale": 6.433248,
  "expected_cadence": "quarterly",
  "name": "NParks Leaf Area Index",
  "source_key": "leaf_area_index",
  "stale_after_days": 120,
  "status": "current"
}
```

### uv run pytest tests/test_fetch.py tests/test_production_readiness.py tests/test_readme.py -q

```text
....................................................                     [100%]
52 passed in 45.64s
```

### uv run pytest -q --collect-only | Select-Object -Last 5

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 5.93s
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

1. Production readiness exposed the nearest current source to stale only as prose in `oldest_current_source`, forcing downstream planning tools to parse text.
2. `source_freshness_readiness()` now returns `nearest_current_source_to_stale` as structured fields while preserving the prose summary.
3. With the pinned probe time, the structured nearest current source is `leaf_area_index`, at 113.566752 days old with 6.433248 days until stale.

## DISAGREEMENTS

1. None.
