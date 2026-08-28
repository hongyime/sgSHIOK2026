# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `ef547eb` (`fix: pass geocode cache path with db flag`)

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
- P748 is complete and pushed: `scripts/prepare-postal-universe.ps1` now passes the bounded geocode cache path with the module's actual `--db` flag, and the test rejects the stale `--cache-db` spelling.
- Evidence: `qa/verification/P748-postal-wrapper-geocode-db-flag.md`.
- P736-P747 also remain complete: bounded geocode caches must be versioned, batch-plan blocks unversioned completed fills, lamp-overlay/postal-universe/report-writer tasks require confirmation, high-risk writer/network/deploy tasks fail closed at the runner, validate is documented as read-only, the deploy wrapper passes both publish confirmations, agent publish instructions match, postal-universe prep passes required confirmations/cache paths, and the legacy direct geocode entry point is retired.
- Checks: `uv run pytest tests/test_release_scripts.py tests/test_run.py tests/test_legacy_geocode.py -q` passed 62/62; `uv run pytest -q --collect-only` collected 571; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
