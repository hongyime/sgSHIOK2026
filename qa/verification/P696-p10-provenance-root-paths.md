# P696 P10 Provenance Root Paths

## Startup

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Observation

`scripts/analysis/p10_provenance_coverage.py` was read-only, but it read both
`pipeline/config/sources.yaml` and `raw/manifest.json` through cwd-relative paths. That made the
script sensitive to the caller's current directory.

## Cwd-shifted Probe

```text
C:\sgSHIOK2026\pipeline\config\sources.yaml
C:\sgSHIOK2026\raw\manifest.json
exit=0
```

## Verification

```text
uv run pytest tests/test_analysis_scripts.py -q -p no:cacheprovider
...........                                                              [100%]
11 passed in 20.08s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
463 tests collected in 18.16s
```

```text
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0
```

```text
git diff --check; Write-Output "exit=$LASTEXITCODE"
exit=0
```

```text
git diff --exit-code -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/releases raw processed; Write-Output "exit=$LASTEXITCODE"
exit=0
```

## FINDINGS

1. `p10_provenance_coverage.py` was another read-only P10 analysis helper whose default inputs
   changed with the caller's cwd.
2. It now resolves both `pipeline/config/sources.yaml` and `raw/manifest.json` from
   `PROJECT_ROOT`.
3. Python collection remains 463; this expanded an existing analysis-script path regression rather
   than adding a new test case.

## DISAGREEMENTS

1. None.
