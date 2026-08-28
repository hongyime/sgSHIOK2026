# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `2ad5a38` (`fix: require confirmation for runner ingest`)

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
- P724 is complete and pushed: `run.py ingest` now fails closed unless `--confirm-input-refresh` is supplied, and the runner strips that confirmation flag before invoking `pipeline.fetch`.
- Evidence: `qa/verification/P724-run-ingest-confirmation.md`.
- Checks: `uv run pytest tests/test_run.py -q` passed 19/19; `uv run pytest -q --collect-only` collected 509; repo integrity passed; diff-check passed; protected-diff guard passed; direct `uv run python run.py ingest` returned exit 2 before fetch.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
