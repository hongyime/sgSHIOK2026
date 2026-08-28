# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `965c63a` (`fix: gate report runner tasks`)

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
- P742 is complete and pushed: `run.py` now requires runner-level confirmations before launching `network-debug`, `onemap-validation collect`, `onemap-outlier-replay`, `onemap-outlier-triage`, `overture-addresses`, and `compare-targeted`.
- Evidence: `qa/verification/P742-report-runner-gates.md`.
- P736-P741 also remain complete: bounded geocode caches must be versioned, batch-plan blocks unversioned completed fills, lamp-overlay requires confirmation, high-risk writer/network/deploy tasks fail closed at the runner, and postal-universe requires confirmation.
- Checks: `uv run pytest tests/test_run.py -q` passed 58/58; `uv run pytest -q --collect-only` collected 567; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
