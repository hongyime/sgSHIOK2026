# P785 Shared Report Output Guard

## Scope

Zero-pipeline safety change. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected evidence mutation, or `pipeline/config/weights.yaml` edit.

## Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Change

`scripts.analysis.report_io.write_new_text_report()` is the shared writer used by many scratch analysis helpers. P785 makes the shared preflight refuse protected output paths before parent-directory creation or file writes:

- `web/public/data/`
- `qa/releases/`
- `qa/p6_*`
- `qa/p7_*`
- `qa/p8_*`
- `qa/p9_*`
- `qa/p10_*`
- `qa/p11/`
- `checksums.json`

Normal explicit scratch outputs outside protected roots still work and still refuse overwrites.

## Focused Test

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_analysis_scripts.py -q
.........................                                                [100%]
25 passed in 7.12s
```

## Dependent Guard Tests

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_mayflower_qa_summary.py tests/test_heat_presentation_analysis.py -q
..............                                                           [100%]
14 passed in 18.31s
```

## Collection

```text
PS C:\sgSHIOK2026> uv run pytest -q --collect-only | Select-Object -Last 1
624 tests collected in 43.42s
```

## Integrity

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
repo_integrity=ok
exit_code=0
```

## Protected Diff Guard

```text
PS C:\sgSHIOK2026> git diff --name-only -- pipeline/config/weights.yaml web/public/data checksums.json qa/releases qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11
```

## FINDINGS

1. Before P785, most helpers using `write_new_text_report()` inherited overwrite protection but not protected-root protection.
2. P782 and P784 fixed two scripts directly, but the shared writer was still the better boundary for future analysis report writes.
3. Python collection moved from 622 to 624 because P785 adds two shared report-writer guard regression tests.

## DISAGREEMENTS

1. None.
