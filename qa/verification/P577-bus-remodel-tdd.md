# P577 Bus Remodel TDD — routed-vs-null semantics

Working root: C:\sgSHIOK2026
Date: 2026-08-26

## Scope

Serialization-semantics change only: unrouted bus subscore serializes as explicit `null` (state becomes `SCORED_PARTIAL`) instead of literal `0.0` (state `SCORED`). Composite arithmetic untouched; weights untouched; schema keys untouched. Implements the P576 routed-or-null decision.

## Evidence

### RED (failing-first, right reason)

Amended contract test `tests/test_scoring_integration.py::test_record_assembly_scores_unrouted_bus_as_null_partial` run against pre-change code:

```text
>       assert record["state"] == "SCORED_PARTIAL"
E       AssertionError: assert 'SCORED' == 'SCORED_PARTIAL'
tests\test_scoring_integration.py:424: AssertionError
FAILED ... 1 failed in 39.19s
```

Failure mode is assertion-on-values (the semantic under change), not import/syntax error.

### GREEN (minimal implementation)

Diff on `pipeline/scoring_integration.py`: 1 insertion, 5 deletions — the unrouted special case at the candidate serialization site collapsed into `round_nullable_score(bus) if bus_data_available else None`, which already maps sentinels to `None`.

```text
uv run python -m pytest "tests/test_scoring_integration.py::test_record_assembly_scores_unrouted_bus_as_null_partial" -q
.                                                                        [100%]
1 passed in 26.88s
```

### Focused file + full floor

```text
uv run python -m pytest tests/test_scoring_integration.py -q
64 passed in 63.27s

uv run python run.py test            (log: logs\p577_full_suite.log)
EXIT=0 — 438 passed in 765.99s (0:12:45)
```

Floor moved 437 -> 438 solely because the amended/rename-added contract test counts once more; zero skips, zero failures.

## Findings

1. Totals are provably unaffected: `calculate_composite_score` already contributes 0.0 x weight for sentinel terms ("Missing or unavailable subscore terms contribute zero under the locked weights"), and the composite reads raw sentinel values, never serialized ones. The flip is representational at the boundary.
2. Honest side effect by design: records whose best option has an unrouted bus now report `state: SCORED_PARTIAL`, matching the existing partial-state mechanics used for fallback candidates since the 2026-08-05 honesty-floor decision.
3. Provenance retention unchanged: `direct_bus_fallback` continues to document rejected candidates on affected records (verified across P575 artifacts; no code path touched).
4. Downstream impact quantified at P578 subset validation next; web copy tests are part of the green floor above via the python-side contract tests, with browser-level checks re-run at P578.

## Disagreements

None. Weights/schema conflict did not arise; no STOP condition triggered.
