# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest commit: `bf70309` (`fix: prevent bus-arrival output appends`)

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
- P712 is complete and pushed: `pipeline.bus_arrivals.collect_snapshots()` and the CLI now refuse existing explicit output paths before any LTA fetch, preventing accidental append/mutation of prior bus-arrival snapshots.
- Evidence: `qa/verification/P712-bus-arrivals-output-guard.md`.
- Checks: `tests/test_bus_arrivals.py` passed 7/7; Python collect-only is 494; repo integrity passed; diff-check passed; protected-diff guard passed.
- No data collection, scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
