# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `c577cad` (`docs: align readme datamall discovery status`)

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
- P750 is complete and pushed: README DataMall discovery guidance now matches P682/P683 and the browser copy: the 28 Aug 2026 discovery-only check found Covered Linkway, bridge/underpass, and Traffic Signals URLs still match frozen v1.
- Evidence: `qa/verification/P750-readme-datamall-discovery-copy.md`.
- P736-P749 also remain complete: bounded geocode caches must be versioned, batch-plan blocks unversioned completed fills, lamp-overlay/postal-universe/report-writer tasks require confirmation, high-risk writer/network/deploy tasks fail closed at the runner, validate is documented as read-only, deploy/publish/activation wrappers pass required confirmations, agent publish instructions match, postal-universe prep passes required confirmations/cache paths, the legacy direct geocode entry point is retired, and geocode cache paths use `--db`.
- Checks: `uv run pytest tests/test_readme.py tests/test_agent_docs.py -q` passed 6/6; `npm --prefix web test -- --run lib/__tests__/score-card-copy.test.ts` passed 16/16; `uv run pytest -q --collect-only` collected 573; repo integrity passed; diff-check and protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
