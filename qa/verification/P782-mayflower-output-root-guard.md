# P782 Mayflower Output Root Guard

## Scope

Zero-pipeline safety change. No scoring, export, rescore, subset run, ingest, network build, deployment, protected payload write, or `pipeline/config/weights.yaml` edit.

## Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Change

`scripts/mayflower_qa_summary.py` already refused historical default outputs and existing outputs before reading the active bundle. P782 adds an explicit protected-output-root refusal for:

- `web/public/data/`
- `qa/releases/`
- `qa/p6_*`
- `qa/p7_*`
- `qa/p8_*`
- `qa/p9_*`
- `qa/p10_*`
- `qa/p11/`
- `checksums.json`

The guard runs before active bundle discovery or input reads.

## Focused Test

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_mayflower_qa_summary.py -q
........                                                                 [100%]
8 passed in 27.13s
```

## Collection

```text
PS C:\sgSHIOK2026> uv run pytest -q --collect-only | Select-Object -Last 1
620 tests collected in 13.16s
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

1. `scripts/mayflower_qa_summary.py` had a narrow output guard gap: explicit new output paths under protected roots were accepted if they did not already exist.
2. The existing guard did run before active bundle/input reads, so the fix could remain small and localized to output-path classification.
3. Python collection moved from 619 to 620 because P782 adds one Mayflower CLI guard regression test.

## DISAGREEMENTS

1. None.
