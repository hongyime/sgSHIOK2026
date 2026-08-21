# P489 Night Lighting Operator Wording

Working root:

```text
C:\sgSHIOK2026
Prawn-E14
```

## Check-ignore

```text
Command: git check-ignore -v qa/verification/P489-night-lighting-operator-wording.md; if ($LASTEXITCODE -eq 0) { "exit=$LASTEXITCODE" } else { "exit=$LASTEXITCODE" }
exit=1
```

## Pre-Fix Focused Failure

```text
Command: uv run pytest C:\sgSHIOK2026\tests\test_heat_presentation_analysis.py -q
...F                                                                     [100%]
================================== FAILURES ===================================
____________ test_heat_presentation_ui_audit_entries_still_resolve ____________

    def test_heat_presentation_ui_audit_entries_still_resolve() -> None:
        entries = analyze_heat_presentation.validate_ui_entries(
            analyze_heat_presentation.PROJECT_ROOT
        )
    
        assert entries
>       assert [entry for entry in entries if not entry["line_match"]] == []
E       AssertionError: assert [{'file': 'we...ndary.', ...}] == []
E         
E         Left contains one more item: {'file': 'web/app/layout.tsx', 'line': 7, 'string': 'Explore covered-walkway exposure gaps, night-lighting evidence, a... 'verdict': 'Acceptable: metadata leads with the shelter/exposure artifact and keeps the locked score secondary.', ...}
E         Use -v to get more diff

tests\test_heat_presentation_analysis.py:50: AssertionError
=========================== short test summary info ===========================
FAILED tests/test_heat_presentation_analysis.py::test_heat_presentation_ui_audit_entries_still_resolve
1 failed, 3 passed in 2.65s
```

## Focused Tests

```text
Command: uv run pytest C:\sgSHIOK2026\tests\test_heat_presentation_analysis.py C:\sgSHIOK2026\tests\test_production_readiness.py -q
..............................                                           [100%]
30 passed in 101.56s (0:01:41)
```

## FINDINGS

1. `scripts.analysis.analyze_heat_presentation` still audited the pre-P18 metadata string `covered-walkway exposure gaps, night-lighting evidence`, so its own focused test failed against the current browser metadata.
2. `scripts.production_readiness` still emitted `night-lighting` in lamp overlay warnings/errors while the product, README, and agent docs use `night lighting`.

## DISAGREEMENTS

1. None.
