# Current State

Date: 2026-08-29
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `538913d` (`docs: clarify inspectable shelter evidence copy`)

Mandatory startup guard:
- First assert the working directory is exactly `C:\sgSHIOK2026`; abort otherwise.
- Never use a relative path for a write.
- `X:\01 REPOSITORIES\sgSHIOK2026` is a synced cold mirror, not a working root.
- Keep this rule here because the sourcerepo sync bot has overwritten `AGENTS.md` repeatedly.

Protected invariants:
- Do not modify `pipeline/config/weights.yaml`.
- Do not overwrite, move, rename, or delete existing protected data/evidence payloads under `web/public/data/`, `qa/p6_*` through `qa/p11/*`, `qa/releases/`, or `checksums.json`.
- Do not run scoring, export, rescore, subset runs, ingest, network builds, input rebuilds, public-data writes, dependency installs, or deployments without explicit owner approval.
- Evidence under `qa/verification/` is append-only unless creating a new tracked phase file.

Status:
- P927 is complete and pushed: locked-row-unavailable reason chips now say `Shelter-map evidence inspectable` instead of `Shelter-map evidence available`; a stale P926 source assertion was also corrected.
- P926 is complete and pushed: live OneMap walking-preview failures now say the preview could not load instead of saying it is unavailable.
- P925 is complete and pushed: no-transit fallback bus rows now say `Bus support not computed` instead of `Bus service not scored`.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, dependency install, or locked-weight change was performed.

Next useful free-tier work:
- Continue pruning user-facing copy that implies future scoring or internal pipeline state.
- Prefer small browser copy/test/evidence commits, pushed to main immediately.
