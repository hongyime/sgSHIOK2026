# P695 P10 Analysis Root Paths

## Startup

```text
root=C:\sgSHIOK2026
host=PRAWN-E14
```

## Observation

Several P10 read-only analysis scripts used cwd-relative default input paths. They did not mutate
protected evidence, but they could read the wrong tree if invoked outside `C:\sgSHIOK2026`.

## Cwd-shifted Probe

```text
C:\sgSHIOK2026\qa\p9_input_provenance_20260813\bundle
C:\sgSHIOK2026\qa\p10_network_provenance_20260813\exported_bundle
C:\sgSHIOK2026\web\public\data\generated_20260805_prefer_scored_routed
C:\sgSHIOK2026\qa\p9_input_provenance_20260813\bundle\manifest.json
C:\sgSHIOK2026\qa\p10_network_provenance_20260813\exported_bundle\manifest.json
exit=0
```

## Verification

```text
uv run pytest tests/test_analysis_scripts.py -q -p no:cacheprovider
...........                                                              [100%]
11 passed in 4.99s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
463 tests collected in 37.44s
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

1. Three P10 read-only analysis scripts had cwd-relative default inputs for protected QA or public
   data bundles.
2. The scripts now resolve those defaults from `PROJECT_ROOT`, so changing cwd no longer changes
   which local artifact tree they inspect.
3. Python collection moved from 462 to 463 because one path-regression test was added.

## DISAGREEMENTS

1. None.
