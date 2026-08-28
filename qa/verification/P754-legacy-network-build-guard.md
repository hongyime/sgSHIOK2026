# P754 legacy network build direct-entry guard

## Working root

```text
C:\sgSHIOK2026
PRAWN-E14
```

## Scope

```text
Free-tier guard/test work only.
No network build, scoring, export, rescore, subset run, ingest, OneMap collection, validation run, deployment, bundle activation, public-data mutation, protected QA evidence mutation, or locked weights change.
```

## Finding

```text
scripts/run_network_build.py is a legacy direct network builder that writes processed network artifacts and QA debug outputs. Direct execution previously called run_build() with no confirmation. The module also created qa/ and processed/ at import time.

Direct execution now requires --confirm-network-build and exits 2 otherwise. Importing the module no longer creates output directories; directory creation happens inside run_build().
```

## Verification

```text
uv run pytest tests/test_legacy_network_build.py tests/test_shelter_skeleton.py tests/test_hdb_void_deck_inference.py tests/test_osm_tags.py tests/test_audited_shelter_corrections.py -q
.......................                                                  [100%]
23 passed in 12.44s
```

```text
uv run pytest -q --collect-only | Select-Object -Last 1
580 tests collected in 13.40s
```

```text
python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

```text
git diff --check; Write-Output "exit_code=$LASTEXITCODE"; git diff --numstat -- pipeline/config/weights.yaml web/public/data checksums.json qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases; Write-Output "protected_exit_code=$LASTEXITCODE"
exit_code=0
protected_exit_code=0
```

## FINDINGS

1. `scripts/run_network_build.py` needed a direct-entry confirmation because it writes processed network artifacts outside `run.py network`.
2. Importing `scripts.run_network_build` should not create output directories; that side effect is now limited to `run_build()`.
3. The collected test count moved from 578 to 580 because P754 adds two legacy-network source tests and executes no pipeline.

## DISAGREEMENTS

1. None.
