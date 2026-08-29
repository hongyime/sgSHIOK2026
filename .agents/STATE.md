# Current State

Date: 2026-08-29
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `73443e1` (`docs: clarify nearby-address order copy`)

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
- P930 is complete and pushed: nearby-address comparison helper now says `Nearby addresses are ordered by locked score` instead of the more internal `Nearby-address list orders by locked score`; the first Vitest filter used repo-root paths and failed before running tests, then the corrected focused web run passed 2 files / 63 tests.
- P929 is complete and pushed: comparison panel ARIA/select labels now use nearby-address naming to match the visible `Compare nearby addresses` title.
- P928 is complete and pushed: planning-area comparison status and empty states now use nearby-address framing while preserving the planning-area boundary where it explains no comparable full locked scores.
- P927 is complete and pushed: locked-row-unavailable reason chips now say `Shelter-map evidence inspectable` instead of `Shelter-map evidence available`; a stale P926 source assertion was also corrected.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, dependency install, or locked-weight change was performed.

Next useful free-tier work:
- Continue aligning visible comparison/status copy with the shelter-first and nearby-address framing.
- Prefer small browser copy/test/evidence commits, pushed to main immediately.
