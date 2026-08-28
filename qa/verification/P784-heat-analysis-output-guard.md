# P784 Heat Analysis Output Guard

## Scope

Zero-pipeline safety change. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected evidence mutation, or `pipeline/config/weights.yaml` edit.

## Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Change

`scripts/analysis/analyze_heat_presentation.py` keeps `overwrite=True` for explicit scratch outputs, but P784 makes protected output paths impossible even when overwrite is requested. It refuses:

- `web/public/data/`
- `qa/releases/`
- `qa/p6_*`
- `qa/p7_*`
- `qa/p8_*`
- `qa/p9_*`
- `qa/p10_*`
- `qa/p11/`
- `checksums.json`

P784 also refreshes stale UI audit line numbers after later score-card copy/layout edits. The audited strings were still present; only the stored line references had drifted.

## Focused Test

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_heat_presentation_analysis.py -q
......                                                                   [100%]
6 passed in 7.70s
```

## Final Focused Test

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_heat_presentation_analysis.py -q
......                                                                   [100%]
6 passed in 5.79s
```

## Collection

```text
PS C:\sgSHIOK2026> uv run pytest -q --collect-only | Select-Object -Last 1
622 tests collected in 21.58s
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

1. `scripts/analysis/analyze_heat_presentation.py --overwrite` could replace an explicit protected target such as `checksums.json`; scratch overwrite remains useful, but protected paths must fail independently of overwrite.
2. The heat-presentation UI audit had six stale line references after later browser copy/layout work; the strings still resolved, but the exact-line check was no longer honest.
3. Python collection moved from 620 to 622 because P784 adds two heat-analysis output guard regression tests.

## DISAGREEMENTS

1. None.
