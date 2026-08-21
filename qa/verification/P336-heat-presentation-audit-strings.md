# P336 Heat Presentation Audit Strings

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

- Free-tier analysis metadata/test/documentation change only.
- No scoring, export, rescore, subset run, ingest, network build, or bundle analysis run.
- `pipeline/config/weights.yaml` untouched.
- Existing `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, and `checksums.json` untouched.

## Change

`scripts/analysis/analyze_heat_presentation.py` now audits the current app copy for heat-proxy evidence and the locked-release rain/heat overlap disclosure.

## Verification

Baseline failure before the audit strings were updated:

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_heat_presentation_analysis.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 4 items

tests\test_heat_presentation_analysis.py ...F                            [100%]

================================== FAILURES ===================================
____________ test_heat_presentation_ui_audit_entries_still_resolve ____________

    def test_heat_presentation_ui_audit_entries_still_resolve() -> None:
        entries = analyze_heat_presentation.validate_ui_entries(
            analyze_heat_presentation.PROJECT_ROOT
        )
    
        assert entries
>       assert [entry for entry in entries if not entry["line_match"]] == []
E       assert [{'file': 'we...n row.', ...}] == []
E         
E         Left contains 2 more items, first extra item: {'file': 'web/app/page.tsx', 'line': 96, 'string': 'heat: { low: "Low heat-proxy evidence", high: "Better heat-proxy score" },', 'verdict': 'Acceptable: reason chips describe the proxy score rather than measured thermal comfort.', ...}
E         Use -v to get more diff

tests\test_heat_presentation_analysis.py:50: AssertionError
=========================== short test summary info ===========================
FAILED tests/test_heat_presentation_analysis.py::test_heat_presentation_ui_audit_entries_still_resolve
========================= 1 failed, 3 passed in 0.69s =========================
```

After updating the audit strings:

```text
PS C:\sgSHIOK2026> uv run pytest tests/test_heat_presentation_analysis.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 4 items

tests\test_heat_presentation_analysis.py ....                            [100%]

============================== 4 passed in 0.81s ==============================
```

```text
PS C:\sgSHIOK2026> python scripts/check_repo_integrity.py; Write-Output "EXIT=$LASTEXITCODE"
repo_integrity=ok
EXIT=0
```

```text
PS C:\sgSHIOK2026> git diff -- pipeline/config/weights.yaml; Write-Output "EXIT=$LASTEXITCODE"
EXIT=0
```

## Findings

1. `scripts/analysis/analyze_heat_presentation.py` had two stale UI audit entries and its resolver test was failing before this change.
2. The helper now audits the current `Stronger heat-proxy evidence` reason copy and the locked-release rain/heat disclosure.
3. This was free-tier analysis metadata/test work: no scoring, export, rescore, subset run, ingest, network build, public data mutation, or locked-weight change.

## Disagreements

1. None.
