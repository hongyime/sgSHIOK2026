# P786 Shared Report Guard Refactor

## Scope

Zero-pipeline refactor. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected evidence mutation, or `pipeline/config/weights.yaml` edit.

## Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Change

P785 centralized protected analysis output-path detection in `scripts.analysis.report_io`. P786 removes duplicate protected-root predicates from:

- `scripts/mayflower_qa_summary.py`
- `scripts/analysis/analyze_heat_presentation.py`

Both scripts now call `is_protected_report_path()` from the shared writer module.

## Guard Predicate Search

```text
PS C:\sgSHIOK2026> rg -n "PROTECTED_OUTPUT|is_protected_output_path|resolve_output_path|is_protected_report_path" scripts tests -S
scripts\analysis\analyze_heat_presentation.py:8:from scripts.analysis.report_io import is_protected_report_path
scripts\analysis\analyze_heat_presentation.py:259:    if is_protected_report_path(path):
scripts\analysis\report_io.py:7:PROTECTED_OUTPUT_ROOTS = (
scripts\analysis\report_io.py:11:PROTECTED_OUTPUT_FILES = (PROJECT_ROOT / "checksums.json",)
scripts\analysis\report_io.py:21:def is_protected_report_path(path: Path) -> bool:
scripts\analysis\report_io.py:23:    if any(resolved == protected.resolve(strict=False) for protected in PROTECTED_OUTPUT_FILES):
scripts\analysis\report_io.py:27:        for protected in PROTECTED_OUTPUT_ROOTS
scripts\analysis\report_io.py:41:    if is_protected_report_path(path):
scripts\mayflower_qa_summary.py:19:from scripts.analysis.report_io import is_protected_report_path, write_new_text_report
scripts\mayflower_qa_summary.py:596:        if is_protected_report_path(output):
```

## Focused Tests

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_analysis_scripts.py tests/test_mayflower_qa_summary.py tests/test_heat_presentation_analysis.py -q
.......................................                                  [100%]
39 passed in 11.12s
```

## Collection

```text
PS C:\sgSHIOK2026> uv run pytest -q --collect-only | Select-Object -Last 1
624 tests collected in 13.95s
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

1. P782 and P784 left three copies of the same protected-output policy in the tree; P786 reduces that to the shared `report_io` predicate plus two call sites.
2. No test-count movement occurred in P786; collection remains 624.

## DISAGREEMENTS

1. None.
