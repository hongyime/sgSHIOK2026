# P788 Shelter Promotion Target Guard

## Scope

Zero-pipeline safety change. No scoring, export, rescore, subset run, ingest, network build, deployment, public-data write, protected evidence mutation, or `pipeline/config/weights.yaml` edit.

## Root

```text
C:\sgSHIOK2026
Prawn-E14
```

## Change

`scripts/promote_audited_shelter_corrections.py` already required `--confirm-promotion` for non-dry-run promotion, but the underlying `promote_corrections()` function could still accept an arbitrary target path. P788 makes the function reject protected target paths before reading the draft GeoJSON or creating parent directories.

## Focused Test

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_promote_audited_shelter_corrections.py -q
......                                                                   [100%]
6 passed in 8.66s
```

## Collection

```text
PS C:\sgSHIOK2026> uv run pytest -q --collect-only | Select-Object -Last 1
625 tests collected in 15.00s
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

1. `scripts/promote_audited_shelter_corrections.py` had a confirmation gate, but direct calls to `promote_corrections()` could still write an approved correction collection to a protected target path.
2. The guard now fails before reading the draft input, so protected target misuse is blocked early.
3. Python collection moved from 624 to 625 because P788 adds one promotion target-guard regression test.

## DISAGREEMENTS

1. None.
