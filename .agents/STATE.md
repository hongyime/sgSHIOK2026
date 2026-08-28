# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `822b974` (`fix: expose per-change full-batch readiness`)

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
- P734 is complete and pushed: `run.py batch-plan` now exposes `full_batch_change_readiness` for each bundled full-batch change.
- Evidence: `qa/verification/P734-full-batch-change-readiness.md`.
- The full-batch gate stays closed when any bundled change lacks prerequisite subset evidence; `NO_TRANSIT_IN_RANGE` and postal-universe v2 remain not ready for inclusion.
- Checks: `uv run pytest tests/test_batch_plan.py -q` passed 10/10; `uv run pytest -q --collect-only` collected 531; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
