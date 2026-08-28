# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest commit: `88e0e81` (`fix: require explicit onemap probe confirmation`)

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
- P715 is complete and pushed: `pipeline.probe_onemap` now requires explicit fresh `--output` plus `--confirm-onemap-probe`, refuses the historical `logs/onemap_probe.csv` path, and opens the CSV with exclusive creation.
- Evidence: `qa/verification/P715-onemap-probe-guard.md`.
- Checks: `tests/test_probe_onemap.py` passed 4/4; Python collect-only is 502; repo integrity passed; diff-check passed; protected-diff guard passed.
- No OneMap probe, scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
