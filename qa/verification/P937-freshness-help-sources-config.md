# P937 Freshness Help Sources Config

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Change

Updated `run.py` safe-report help so `check --freshness-only` says it reads both `raw/manifest.json` and `pipeline/config/sources.yaml`, matching `pipeline.fetch.load_freshness_defaults()` and the existing `CLAUDE.md` operator instructions.

## Checks

Executed before commit:

- `uv run pytest C:\sgSHIOK2026\tests\test_agent_docs.py -q`
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`
- `git diff --check`
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P937-freshness-help-sources-config.md`

Results:

- `uv run pytest C:\sgSHIOK2026\tests\test_agent_docs.py -q`: 3 passed.
- `python C:\sgSHIOK2026\scripts\check_repo_integrity.py`: `repo_integrity=ok`, exit 0.
- `git diff --check`: exit 0.
- `git diff -- C:\sgSHIOK2026\pipeline\config\weights.yaml`: no output.
- `git check-ignore -v C:\sgSHIOK2026\qa\verification\P937-freshness-help-sources-config.md`: exit 1, not ignored.

## FINDINGS

1. `run.py` help understated the freshness-only read scope as `raw/manifest.json only`, while the implementation also reads `pipeline/config/sources.yaml` for source names and freshness defaults.
2. This was free-tier runner documentation/test work only; it did not run `run.py check`, scoring, export, rescore, subset runs, ingest, network builds, dependency installs, deployments, or protected data writes.

## DISAGREEMENTS

1. None.
