# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest commit: `dc6d3ff` (`feat: expose guarded onemap probe task`)

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
- P716 is complete and pushed: `run.py` now exposes the guarded OneMap sustained-rate probe as `onemap-probe` with help text naming the explicit `--output` and `--confirm-onemap-probe` requirements.
- Evidence: `qa/verification/P716-onemap-probe-run-task.md`.
- Checks: `tests/test_run.py tests/test_probe_onemap.py` passed 21/21; Python collect-only is 503; repo integrity passed; diff-check passed; protected-diff guard passed.
- No OneMap probe, scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
