# P199 Production Readiness Absolute Path

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Finding

Running production readiness by absolute script path failed before the report could start because the script did not add the repository root to `sys.path` before importing local packages.

```text
uv run python C:\sgSHIOK2026\scripts\production_readiness.py
Traceback (most recent call last):
  File "C:\sgSHIOK2026\scripts\production_readiness.py", line 13, in <module>
    from pipeline.batch_plan import OSM_ADDR_POSTCODE_COVERAGE, PARAMS_PATH, build_batch_plan
ModuleNotFoundError: No module named 'pipeline'
```

## Fix

`scripts/production_readiness.py` now inserts `C:\sgSHIOK2026` into `sys.path` before importing `pipeline.*` and `scripts.*`, matching the portability pattern used by other scripts in `scripts/`.

## Verification

```text
uv run python C:\sgSHIOK2026\scripts\production_readiness.py --help
usage: production_readiness.py [-h] [--bundle-dir BUNDLE_DIR] [--mode MODE]
                               [--summary SUMMARY] [--universe UNIVERSE]
                               [--params PARAMS] [--qa QA] [--debug DEBUG]
                               [--waive-onemap-validation]
                               [--production-deploy-approved]
                               [--owner-approval-note OWNER_APPROVAL_NOTE]

Fast production-readiness report without scoring or deploying.

options:
  -h, --help            show this help message and exit
  --bundle-dir BUNDLE_DIR
  --mode MODE
  --summary SUMMARY
  --universe UNIVERSE
  --params PARAMS
  --qa QA
  --debug DEBUG
  --waive-onemap-validation
                        Record an owner waiver for a failed fresh same-bundle
                        OneMap gate.
  --production-deploy-approved
                        Record explicit owner approval for production
                        deployment.
  --owner-approval-note OWNER_APPROVAL_NOTE
```

```text
uv run pytest C:\sgSHIOK2026\tests\test_production_readiness.py -q -k "absolute_path" -p no:cacheprovider
.                                                                        [100%]
1 passed, 22 deselected in 28.70s
```

```text
python C:\sgSHIOK2026\scripts\check_repo_integrity.py
repo_integrity=ok
integrity_exit=0
```

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
weights_diff_start
weights_diff_end
```

## FINDINGS

1. `production_readiness.py` was documented as an operator command, but absolute-path invocation failed with `ModuleNotFoundError: No module named 'pipeline'`.
2. The fix is import-path bootstrap only; it does not alter readiness checks, scoring, exports, inputs, public data, deployment, or locked weights.

## DISAGREEMENTS

1. None.
