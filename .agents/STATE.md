# Current State

Date: 2026-08-28
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest commit: `1066ed0` (`docs: record leaf area index provenance policy`)

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
- P721 is complete and pushed: Leaf Area Index policy was verified as closed for future score provenance; `leaf_area_index` is excluded from `SCORE_PROVENANCE_SOURCE_HASH_KEYS`, while heat/shade provenance uses the five spatial NParks geometry proxy keys.
- Evidence: `qa/verification/P721-leaf-area-index-policy-closed.md`.
- Checks: focused scoring-provenance test passed; repo integrity passed; diff-check passed; protected-diff guard passed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.
