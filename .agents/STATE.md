# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `844d779` (`docs: fix stale decision path references`)

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
- P735 is complete and pushed: stale `docs/decisions.md` references in scoring/export comments now point to root `decisions.md`.
- Evidence: `qa/verification/P735-decision-path-hygiene.md`.
- A source-text guard in `tests/test_agent_docs.py` prevents the stale decision path from returning in the affected files.
- Checks: `uv run pytest tests/test_agent_docs.py tests/test_scoring_integration.py -q` passed 70/70; `uv run pytest -q --collect-only` collected 532; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
