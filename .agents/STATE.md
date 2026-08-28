# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `aed6445` (`fix: cover all manifest sources in freshness policy`)

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
- P732 is complete and pushed: `pipeline/config/sources.yaml` now covers every source recorded in `raw/manifest.json`; `overture_addresses_sg_candidate` remains config-only and unknown-age.
- Evidence: `qa/verification/P732-freshness-source-coverage.md`.
- UI freshness copy now reports the measured 28 Aug 2026 manifest-only state: 11 current, 9 stale, 3 manual, 1 unknown-age.
- Checks: `uv run pytest tests/test_fetch.py tests/test_readme.py -q` passed 28/28; `npm --prefix web test -- score-card-copy.test.ts --runInBand` passed 16/16; collect-only found 531 tests; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
