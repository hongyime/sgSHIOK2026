# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `8be672e` (`fix: require confirmation for direct bus ingest`)

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
- P757 is complete and pushed: direct `pipeline.bus ingest` now requires `--confirm-input-refresh` before source config loading, DataMall calls, or raw/manifest mutation.
- Evidence: `qa/verification/P757-bus-api-ingest-confirmation.md`.
- P736-P756 also remain complete: bounded geocode caches must be versioned, batch-plan blocks unversioned completed fills, lamp-overlay/postal-universe/report-writer tasks require confirmation, high-risk writer/network/deploy tasks fail closed at the runner, full OneMap wrappers require explicit approval, validate is documented as read-only, publish/activation/deploy wrappers pass required confirmations, full-rescore deploy and activation require distinct approvals, agent publish instructions match, postal-universe prep passes required confirmations/cache paths, legacy direct geocode and network entry points are guarded/retired, geocode cache paths use `--db`, README DataMall discovery copy matches latest recorded evidence, direct fetch ingest requires module-owned approval, and direct bus-arrivals collection requires module-owned approval.
- Checks: `uv run pytest tests/test_bus.py tests/test_fetch.py tests/test_run.py -q` passed 89/89; `uv run pytest -q --collect-only` collected 584; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
