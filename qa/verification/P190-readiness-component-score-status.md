# P190 Readiness Component Score Status

## Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Findings

1. Production readiness preserved schema keys such as `missing_subscore_status`, but the human warning text also said `complete subscore status` and `subscore status: ...`.
2. The product-facing copy has moved to `component score`; readiness warnings should use that wording while retaining the manifest/schema key names.

## Verification

```text
..........                                                               [100%]
10 passed, 12 deselected in 28.72s
```

```text
repo_integrity=ok
integrity_exit=0
```

```text
weights_diff_start
weights_diff_end
```

```text
C:\sgSHIOK2026\tests\test_production_readiness.py:941:        "complete component-score status" in warning
C:\sgSHIOK2026\tests\test_production_readiness.py:942:        and "component-score status: access, bus, crossing, heat, rain" in warning
C:\sgSHIOK2026\tests\test_production_readiness.py:945:    assert all("complete subscore status" not in warning for warning in report["warnings"])
C:\sgSHIOK2026\tests\test_production_readiness.py:946:    assert all("subscore status: access" not in warning for warning in report["warnings"])
C:\sgSHIOK2026\scripts\production_readiness.py:605:            reasons.append("component-score status: " + ", ".join(missing_subscores))
C:\sgSHIOK2026\scripts\production_readiness.py:628:                "fingerprints, complete component-score status, or fails provenance integrity "
```

## FINDINGS

1. Release-facing readiness warnings still exposed `subscore status` wording even though the app and docs now use component-score wording for users and operators.

## DISAGREEMENTS

1. None.
