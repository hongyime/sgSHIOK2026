# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `b9ed2ed` (`fix: require confirmation for bundle exports`)

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
- P731 is complete and pushed: every `pipeline.export export` / `run.py export` bundle write now requires `--confirm-export`; live-scoring export still additionally requires `--confirm-live-score-export`.
- Evidence: `qa/verification/P731-export-confirmation.md`.
- Checks: `uv run pytest tests/test_export.py tests/test_run.py -q` passed 87/87; `uv run pytest -q --collect-only` collected 531; repo integrity passed; diff-check passed; protected-diff guard passed; direct unconfirmed export commands returned exit 1 before records-dir reads, scoring, or creating `qa/p731`.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
