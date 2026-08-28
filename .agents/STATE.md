# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `b8ffee5` (`fix: require confirmation for direct bus arrivals`)

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
- P756 is complete and pushed: direct `pipeline.bus_arrivals collect` now requires `--confirm-bus-arrivals` before output checks or DataMall calls, and `run.py bus-arrivals` forwards that module-owned confirmation.
- Evidence: `qa/verification/P756-bus-arrivals-confirmation.md`.
- P736-P755 also remain complete: bounded geocode caches must be versioned, batch-plan blocks unversioned completed fills, lamp-overlay/postal-universe/report-writer tasks require confirmation, high-risk writer/network/deploy tasks fail closed at the runner, full OneMap wrappers require explicit approval, validate is documented as read-only, publish/activation/deploy wrappers pass required confirmations, full-rescore deploy and activation require distinct approvals, agent publish instructions match, postal-universe prep passes required confirmations/cache paths, legacy direct geocode and network entry points are guarded/retired, geocode cache paths use `--db`, README DataMall discovery copy matches latest recorded evidence, and direct ingest requires module-owned approval.
- Checks: `uv run pytest tests/test_bus_arrivals.py tests/test_run.py -q` passed 67/67; `uv run pytest -q --collect-only` collected 582; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
