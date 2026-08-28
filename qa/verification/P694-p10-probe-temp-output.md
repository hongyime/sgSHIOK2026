# P694 P10 Probe Temp Output

## Startup

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Observation

`scripts/analysis/p10_unresolved_network_probe.py` sent its default export probe output to
`qa/p10_network_provenance_20260813/unresolved_network_probe`. `export_static_artifacts` creates
the output directory before later validation, so the script could mutate protected P10 evidence
even when the expected validation error is raised.

## Probe

```text
uv run python scripts/analysis/p10_unresolved_network_probe.py; Write-Output "exit=$LASTEXITCODE"
raised=ValueError
message=unresolved network digest maps: missingnetworkdigest001
exit=0
```

## Verification

```text
uv run pytest tests/test_analysis_scripts.py -q -p no:cacheprovider
..........                                                               [100%]
10 passed in 5.16s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
462 tests collected in 52.23s
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

1. A historical P10 analysis probe could create output under protected P10 evidence by default.
2. The probe now writes only to a temporary directory while still proving the unresolved-network
   validation failure.
3. Python collection moved from 461 to 462 because one analysis-script guard test was added.

## DISAGREEMENTS

1. None.
