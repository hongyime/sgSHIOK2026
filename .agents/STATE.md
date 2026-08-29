# Current State

Date: 2026-08-29
Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Latest substantive commit: `bee0e32` (`docs: remove pending direct bus comparison copy`)

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
- P924 is complete and pushed: direct-bus fallback cards now show `Verified shelter-map walk` as `No published walk` instead of `Pending`.
- P923 is complete and pushed: the partial locked-score note now says `some shelter-map evidence may still be inspectable` instead of describing evidence as merely present.
- P922 is complete and pushed: the `NOT_YET_SCORED` reason chip now says `Some shelter-map evidence may still be available` instead of `Partial shelter-map evidence may be available`.
- P913-P921 browser copy phases are complete and pushed.
- No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, dependency install, or locked-weight change was performed.

Next useful free-tier work:
- Continue pruning user-facing copy that implies future scoring or internal pipeline state.
- Prefer small browser copy/test/evidence commits, pushed to main immediately.
