# P207 Production Readiness Progress

Date: 2026-08-21
Working root: C:\sgSHIOK2026
Machine: Prawn-E14

## Startup Guard

```text
root=C:\sgSHIOK2026
host=Prawn-E14
```

## Change

`scripts/production_readiness.py` now emits progress markers to stderr before each major read-only readiness stage. JSON report output remains on stdout.

## CLI Progress Probe

Command:

```text
uv run python C:\sgSHIOK2026\scripts\production_readiness.py
```

Output before intentional interrupt:

```text
[production-readiness] resolving active bundle and QA paths
[production-readiness] validating static bundle artifacts
```

Result:

```text
Interrupted intentionally after progress output was observed; no scoring, export, rescore, ingest, or network build was running.
```

## Tests

Command:

```text
uv run pytest C:\sgSHIOK2026\tests\test_production_readiness.py -q -p no:cacheprovider
```

Output:

```text
23 passed in 120.13s (0:02:00)
```

Command:

```text
uv run python C:\sgSHIOK2026\scripts\production_readiness.py --help
```

Output:

```text
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

## Integrity

Command:

```text
uv run python -m py_compile C:\sgSHIOK2026\scripts\production_readiness.py
```

Output:

```text
py_compile_exit=0
```

Command:

```text
uv run python C:\sgSHIOK2026\scripts\check_repo_integrity.py
```

Output:

```text
repo_integrity=ok
integrity_exit=0
```

Command:

```text
git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml
```

Output:

```text
weights_diff_exit=0
```

## Findings

1. The production-readiness CLI previously provided no indication of whether it was validating static artifacts, auditing bundle state, checking OneMap reports, or summarizing policy while it ran.
2. The CLI now emits immediate stderr markers before expensive stages while preserving stdout for the JSON readiness report.
3. The current local full readiness command reaches `validating static bundle artifacts` quickly; this confirms the P206 no-output symptom is addressed at least at the first long-running stage.

## Disagreements

1. None.
