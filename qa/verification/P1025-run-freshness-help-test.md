# P1025 Run Freshness Help Test

Date: 2026-08-30
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Scope

Test correction for the safe freshness command contract.
No scoring, export, rescore, subset run, ingest, network build, deployment, dependency install, upstream probe, manifest write, or protected data mutation.

## Failing Output Before Fix

```text
.FF........................................................              [100%]
================================== FAILURES ===================================
_____ test_run_docstring_separates_safe_reports_from_gated_pipeline_tasks _____

    def test_run_docstring_separates_safe_reports_from_gated_pipeline_tasks():
        assert "Safe reports:" in run.__doc__
        assert (
            "check --freshness-only | check --geospatial-discovery-only | universe-status | p19-gap-status | p19-mcst-locations | p125-osm-status | network-qa | network-preflight | readiness | readiness --gate-summary | batch-plan | validate"
            in run.__doc__
        )
>       assert (
            "check --freshness-only reads raw/manifest.json only; it probes no upstream URLs, writes no manifest, groups action summaries with source names, and says stale sources require a versioned refresh."
            in run.__doc__
        )
E       AssertionError: assert 'check --freshness-only reads raw/manifest.json only; it probes no upstream URLs, writes no manifest, groups action summaries with source names, and says stale sources require a versioned refresh.' in 'S.H.I.O.K. task runner (cross-platform replacement for make).\n\nUsage: uv run python run.py <task> [options]\n\nSafe...after owner approval.\n\n`publish` ALWAYS runs `validate` first — this gate is hard-coded and must never be removed.\n'
E        +  where 'S.H.I.O.K. task runner (cross-platform replacement for make).\n\nUsage: uv run python run.py <task> [options]\n\nSafe...after owner approval.\n\n`publish` ALWAYS runs `validate` first — this gate is hard-coded and must never be removed.\n' = run.__doc__

tests\test_run.py:17: AssertionError
______________ test_run_help_headline_does_not_flatten_all_tasks ______________

    def test_run_help_headline_does_not_flatten_all_tasks():
        help_text = run.build_parser().format_help()
    
        assert "usage: run.py [-h] task" in help_text
        assert "{batch-plan,bus-arrivals" not in help_text
        assert "Safe reports:" in help_text
>       assert (
            "check --freshness-only reads raw/manifest.json only; it probes no upstream URLs, writes no manifest, groups action summaries with source names, and says stale sources require a versioned refresh."
            in help_text
        )
E       AssertionError: assert 'check --freshness-only reads raw/manifest.json only; it probes no upstream URLs, writes no manifest, groups action summaries with source names, and says stale sources require a versioned refresh.' in 'usage: run.py [-h] task\n\nS.H.I.O.K. task runner (cross-platform replacement for make).\n\nUsage: uv run python run....d must never be removed.\n\npositional arguments:\n  task\n\noptions:\n  -h, --help  show this help message and exit\n'

tests\test_run.py:143: AssertionError
=========================== short test summary info ===========================
FAILED tests/test_run.py::test_run_docstring_separates_safe_reports_from_gated_pipeline_tasks
FAILED tests/test_run.py::test_run_help_headline_does_not_flatten_all_tasks
2 failed, 57 passed in 2.21s
```

## Passing Output After Fix

```text
...........................................................              [100%]
59 passed in 2.79s
```

## FINDINGS

1. `run.py` correctly documents that `check --freshness-only` reads both `raw/manifest.json` and `pipeline/config/sources.yaml`, but `tests/test_run.py` still expected obsolete `raw/manifest.json only` wording.
2. The corrected test now guards against the stale manifest-only phrase while asserting the current two-file safe-report contract.

## DISAGREEMENTS

1. None.
