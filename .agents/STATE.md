# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `d03eb62` (`fix: require confirmation for candidate audits`)

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
- P729 is complete and pushed: `candidate-audit` now fails closed unless `--confirm-candidate-audit` is supplied.
- Evidence: `qa/verification/P729-candidate-audit-confirmation.md`.
- Checks: `uv run pytest tests/test_audit_output_guards.py tests/test_run.py -q` passed 29/29; `uv run pytest -q --collect-only` collected 526; repo integrity passed; diff-check passed; protected-diff guard passed; direct `run.py candidate-audit` and module invocations returned exit 2 before scoring or creating `qa/p729`.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
