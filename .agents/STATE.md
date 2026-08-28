# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest commit: `51ba23b` (`fix: preflight overture report outputs`)

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
- P714 is complete and pushed: `pipeline.overture_addresses` now refuses existing requested `--output` and `--outlier-geojson` paths before the candidate report builder can read the current universe, query Overture, or archive raw rows.
- Evidence: `qa/verification/P714-overture-output-guard.md`.
- Checks: `tests/test_overture_addresses.py` passed 8/8; Python collect-only is 498; repo integrity passed; diff-check passed; protected-diff guard passed.
- No Overture query, raw archive write, scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
