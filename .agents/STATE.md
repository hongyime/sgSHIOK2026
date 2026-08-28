# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `24335d8` (`fix: require confirmation for live score exports`)

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
- P728 is complete and pushed: live scoring through `pipeline.export export` and `run.py export` now fails closed unless `--confirm-live-score-export` is supplied; pre-scored `--records-dir` re-export remains allowed without a live-scoring confirmation.
- Evidence: `qa/verification/P728-live-export-confirmation.md`.
- Checks: `uv run pytest tests/test_export.py tests/test_run.py -q` passed 84/84; `uv run pytest -q --collect-only` collected 524; repo integrity passed; diff-check passed; protected-diff guard passed; direct live export commands returned exit 1 before scoring or creating `qa/p728`; records-dir export still reached the missing chunks check.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
