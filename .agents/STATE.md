# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `301618d` (`fix: require versioned bounded geocode cache`)

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
- P736 is complete and pushed: confirmed non-dry bounded OneMap geocode fills now reject unversioned cache paths such as `raw/geocode_cache.db` before opening the cache or calling OneMap.
- Evidence: `qa/verification/P736-geocode-cache-versioning.md`.
- `run.py` now lists `geocode-universe` as a gated pipeline task because it can call OneMap and write a cache, parquet, and summary.
- Checks: `uv run pytest tests/test_geocode_universe.py tests/test_run.py -q` passed 31/31; `uv run pytest -q --collect-only` collected 533; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
