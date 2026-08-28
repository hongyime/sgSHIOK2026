# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `55d3cf7` (`fix: require confirmation for lamp overlay runner`)

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
- P738 is complete and pushed: `run.py lamp-overlay` now requires `--confirm-lamp-overlay` before invoking the lamp-post artifact writer.
- Evidence: `qa/verification/P738-lamp-overlay-runner-gate.md`.
- P736/P737 also remain complete: confirmed bounded geocode fills require a versioned cache path, and batch-plan blocks completed fills backed by unversioned caches.
- Checks: `uv run pytest tests/test_run.py -q` passed 25/25; `uv run pytest -q --collect-only` collected 534; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
