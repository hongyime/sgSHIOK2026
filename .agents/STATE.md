# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `157e65e` (`fix: require confirmation for datamall static parser`)

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
- P766 is complete and pushed: direct `pipeline.parse_static_datamall` now requires `--confirm-datamall-static-parse` before live DataMall static page HTTP requests.
- Evidence: `qa/verification/P766-datamall-static-parser-confirmation.md`.
- P736-P765 also remain complete: bounded geocode caches must be versioned, batch-plan blocks unversioned completed fills, lamp-overlay/postal-universe/report-writer tasks require confirmation, high-risk writer/network/deploy tasks fail closed at the runner, full OneMap wrappers require explicit approval, validate is documented as read-only, publish/activation/deploy wrappers pass required confirmations, full-rescore deploy and activation require distinct approvals, agent publish instructions match, postal-universe prep passes required confirmations/cache paths, legacy direct geocode and network entry points are guarded/retired, geocode cache paths use `--db`, README DataMall discovery copy matches latest recorded evidence, direct fetch ingest requires module-owned approval, direct bus-arrivals collection requires module-owned approval, direct bus API ingest requires module-owned approval, direct postal-universe build requires module-owned approval, direct lamp-overlay build requires module-owned approval, direct export writer subcommands require module-owned approval, direct Overture probes require module-owned approval, direct network-debug rebuild requires module-owned approval, production preflight requires wrapper-owned approval, direct DataMall probes require module-owned approval, and direct data.gov.sg probes require module-owned approval.
- Checks: `uv run pytest tests/test_parse_static_datamall.py -q` passed 3/3; `uv run pytest -q --collect-only` collected 611; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
