# P478 P19 source labels

Date: 2026-08-22
Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Free-tier structured reporting clarity only.

No scoring, export, rescore, subset run, ingest, network build, deployment, input rebuild, public-data mutation, protected QA mutation, P19/P379 evidence mutation, or weights.yaml edit was performed.

## Evidence commands

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_batch_plan.py tests/test_production_readiness.py -q -p no:cacheprovider
..........................
.....
.....                                     [100%]
36 passed in 88.67s (0:01:28)
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml checksums.json web/public/data qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

## FINDINGS

1. The P19 structured source-policy block already separated confirmed HDB missing rows from unvalidated MCST proxy rows, but its `sources` labels were still terse. The labels and limitations now explicitly state that HDB rows use completion year plus OneMap-geocoded postals, while BCA MCST constitution date is private-strata onboarding proxy evidence, not TOP or completion date.

## DISAGREEMENTS

1. None.
