# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `fc5531b` (`fix: gate postal universe runner task`)

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
- P741 is complete and pushed: `run.py postal-universe` now requires `--confirm-postal-universe`, and lamp-overlay replacement command examples include `--confirm-lamp-overlay` without forwarding a stray `--`.
- Evidence: `qa/verification/P741-postal-universe-runner-gate.md`.
- P736-P740 also remain complete: bounded geocode caches must be versioned, batch-plan blocks unversioned completed fills, lamp-overlay requires confirmation, and high-risk writer/network/deploy tasks fail closed at the runner.
- Checks: `uv run pytest tests/test_run.py tests/test_readme.py tests/test_batch_plan.py tests/test_production_readiness.py -q` passed 86/86; `uv run pytest -q --collect-only` collected 555; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
