# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest commit: `39af2fb` (`fix: preflight onemap validation outputs`)

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
- P713 is complete and pushed: `pipeline.onemap_validation` now requires an explicit fresh `--output` for `plan`, `plan-targeted`, `evaluate`, and `collect` before sample building, sample reading, cache evaluation, or OneMap collection can start.
- Evidence: `qa/verification/P713-onemap-validation-output-guard.md`.
- Checks: `tests/test_onemap_validation.py` passed 27/27; Python collect-only is 496; repo integrity passed; diff-check passed; protected-diff guard passed.
- No OneMap collection, scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
