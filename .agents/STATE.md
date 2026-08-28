# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `d5c2049` (`fix: require confirmation for production deploy wrapper`)

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
- P751 is complete and pushed: `scripts/deploy-production.ps1` now defaults to a plan-only response unless `-ConfirmProduction` is supplied, `scripts/release-data-bundle.ps1` passes its existing production confirmation through to the deploy wrapper, and `scripts/full-rescore-production.ps1` requires distinct `-ConfirmProductionDeploy` when `-Deploy` is requested.
- Evidence: `qa/verification/P751-deploy-wrapper-confirmation.md`.
- P736-P750 also remain complete: bounded geocode caches must be versioned, batch-plan blocks unversioned completed fills, lamp-overlay/postal-universe/report-writer tasks require confirmation, high-risk writer/network/deploy tasks fail closed at the runner, validate is documented as read-only, publish/activation wrappers pass required confirmations, agent publish instructions match, postal-universe prep passes required confirmations/cache paths, the legacy direct geocode entry point is retired, geocode cache paths use `--db`, and README DataMall discovery copy matches latest recorded evidence.
- Checks: `uv run pytest tests/test_release_scripts.py tests/test_run.py tests/test_publish.py -q` passed 69/69; `uv run pytest -q --collect-only` collected 575; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
