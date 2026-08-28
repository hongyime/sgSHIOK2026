# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `542b882` (`fix: retire legacy geocode entrypoint`)

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
- P747 is complete and pushed: the direct legacy `pipeline.geocode` entry point is retired so it cannot call OneMap or write `raw/geocode_cache.db`; `run.py geocode-universe` now forwards its confirmed arguments to `pipeline.geocode_universe`.
- Evidence: `qa/verification/P747-legacy-geocode-guard.md`.
- P736-P746 also remain complete: bounded geocode caches must be versioned, batch-plan blocks unversioned completed fills, lamp-overlay/postal-universe/report-writer tasks require confirmation, high-risk writer/network/deploy tasks fail closed at the runner, validate is documented as read-only, the deploy wrapper passes both publish confirmations, agent publish instructions match, and the postal-universe prep wrapper passes required confirmations/cache paths.
- Checks: `uv run pytest tests/test_run.py tests/test_legacy_geocode.py tests/test_geocode_universe.py -q` passed 67/67; `uv run pytest -q --collect-only` collected 571; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
