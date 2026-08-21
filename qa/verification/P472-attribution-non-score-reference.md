# P472 Attribution Non-Score Reference

Startup guard:

```text
C:\sgSHIOK2026
PRAWN-E14
```

Scope:

```text
Free documentation/test alignment only.
No scoring, export, rescore, subset run, ingest, network build, deployment, or public-data mutation.
pipeline/config/weights.yaml untouched.
```

Finding:

```text
ATTRIBUTION.md grouped Leaf Area Index under "Candidate Or Unshipped Sources" even though current project policy says LAI can appear in legacy provenance as a shipped non-score reference source and future score provenance excludes it.
```

Change:

```text
ATTRIBUTION.md now uses "Candidate And Non-Score Reference Sources", keeps Overture as candidate-only, and splits Leaf Area Index into its own non-score reference paragraph.
tests/test_attribution.py now guards the section heading.
```

Verification:

```text
C:\sgSHIOK2026
PRAWN-E14

uv run pytest C:\sgSHIOK2026\tests\test_attribution.py -q -p no:cacheprovider
.                                                                        [100%]
1 passed in 3.67s

python C:\sgSHIOK2026\scripts\check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0

git diff --name-only -- C:\sgSHIOK2026\pipeline\config\weights.yaml C:\sgSHIOK2026\checksums.json C:\sgSHIOK2026\web\public\data C:\sgSHIOK2026\qa\p6_rerun_cost_20260812_102712 C:\sgSHIOK2026\qa\p7_determinism_20260813 C:\sgSHIOK2026\qa\p8_provenance_repair_20260813 C:\sgSHIOK2026\qa\p9_input_provenance_20260813 C:\sgSHIOK2026\qa\p10_network_provenance_20260813 C:\sgSHIOK2026\qa\p11\d_calibration_w2_0050 C:\sgSHIOK2026\qa\p11\d_full_w2_1200 C:\sgSHIOK2026\qa\p11\d_pilot_w2_0200_final C:\sgSHIOK2026\qa\releases
```

FINDINGS:

1. Leaf Area Index was not an unshipped candidate in the same sense as Overture; it is a legacy non-score reference hash whose values are not consumed by shipped scoring.

DISAGREEMENTS:

1. None.
