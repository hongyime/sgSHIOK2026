# P535 Universe Status

## Scope

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

New command: `uv run python run.py universe-status`.

Hard limits observed:
- No scoring, export, rescore, subset run, ingest, network build, or deployment was run.
- No API-probing measurement was run; the command reads cached P19/P125 status only.
- `pipeline/config/weights.yaml` was not modified.
- Existing protected QA evidence, `web/public/data/`, `qa/releases/`, and `checksums.json` were not modified.
- Existing `qa/verification/` evidence was not rewritten.

## Command Output

### Working Root

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

### git check-ignore -v qa/verification/P535-universe-status.md

```text
exit_code=1
```

### uv run python run.py universe-status

```json
{
  "decision_boundary": "Use these cached measurements to size the frozen-v1 address-universe gap before building postal-universe v2. They do not approve a v2 promotion, scoring, export, or input mutation.",
  "measurements": {
    "osm_addr_postcode_coverage": {
      "cache_status_command": "uv run python run.py p125-osm-status",
      "measurement": "P125 20 Aug 2026 Overpass addr:postcode coverage cross-check",
      "osm_coverage_of_v1_pct": 20.791045,
      "osm_valid_distinct_postcodes": 25879,
      "osm_valid_in_v1": 25873,
      "osm_valid_not_in_v1": 6,
      "registry_policy": "not the address registry",
      "source_role": "geometry evidence and coverage cross-check",
      "v1_distinct_postals": 124443,
      "verdict": "not sufficient as primary Singapore address registry",
      "will_call_apis": false,
      "will_write_files": false
    },
    "recent_public_source_gap_sample": {
      "cache_status_command": "uv run python run.py p19-gap-status",
      "confirmed_missing_address_rows": 6,
      "measurement": "16 Aug 2026 public-source sample",
      "source_quality_warning_rows": 2,
      "status": "sample_classified",
      "summary": "6 coordinate-backed HDB missing rows confirmed as address-universe gaps; 2 MCST proxy rows remain source-quality warnings",
      "will_call_apis": false,
      "will_write_files": false
    }
  },
  "mode": "universe_measurement_status",
  "will_call_apis": false,
  "will_write_files": false
}
```

### uv run pytest tests/test_analysis_scripts.py tests/test_run.py tests/test_readme.py -q

```text
29 passed in 2.30s
```

### uv run pytest -q --collect-only | Select-Object -Last 5

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

437 tests collected in 6.16s
```

### python scripts/check_repo_integrity.py

```text
repo_integrity=ok
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

### git diff --check

```text
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
exit_code=0
```

## FINDINGS

1. The repo had separate safe commands for P19 and P125, but no single operator-facing command that consolidated the current address-universe measurement evidence.
2. `run.py universe-status` now reports the cached P19 public-source gap sample and P125 OSM addr:postcode coverage cross-check together, with `will_call_apis=false` and `will_write_files=false`.

## DISAGREEMENTS

1. None.
