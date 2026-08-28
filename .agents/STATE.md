# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `5efe6ec` (`fix: preflight historical analysis report outputs`)

Mandatory startup guard:
- First assert the working directory is exactly `C:\sgSHIOK2026`; abort otherwise.
- Never use a relative path for a write.
- `X:\01 REPOSITORIES\sgSHIOK2026` is a synced cold mirror, not a working root.
- Keep this rule here because the sourcerepo sync bot has overwritten `AGENTS.md` repeatedly.

Protected invariants:
- Do not modify `pipeline/config/weights.yaml`.
- Do not overwrite, move, rename, or delete existing protected data/evidence payloads under `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, or `checksums.json`.
- Do not run scoring, export, rescore, subset runs, ingest, network builds, input rebuilds, public-data writes, or deployments without explicit owner approval.
- Evidence under `qa/verification/` is append-only unless creating a new tracked phase file.

Status:
- P723 is complete and pushed: historical bus analysis report CLIs now preflight existing output paths before reading bundle data, and the heat-presentation audit coordinates now match the current P18 copy.
- Evidence: `qa/verification/P723-analysis-report-preflight.md`.
- Checks: `uv run pytest tests/test_analysis_scripts.py tests/test_heat_presentation_analysis.py -q` passed 23/23; `uv run pytest -q --collect-only` collected 507; `uv run pytest -q` passed 507/507; repo integrity passed; diff-check passed; protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
