# Current State

Date: 2026-08-20

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Remote main at P77 start: `06d6534`

Mandatory startup guard:
- First assert the working directory is exactly `C:\sgSHIOK2026`; abort otherwise.
- Never use a relative path for a write.
- `X:\01 REPOSITORIES\sgSHIOK2026` is a synced cold mirror, not a working root.
- This rule belongs here, not only in `AGENTS.md`, because the sourcerepo sync bot has overwritten `AGENTS.md` seven times.

Status:
- P76 is complete and pushed: production readiness now reports manifest-only source freshness from `raw/manifest.json` and `pipeline/config/sources.yaml` as non-blocking release context.
- P77 is in progress: the route evidence panel now summarizes total exposed metres and recorded exposed-gap count before listing the longest gaps.
- Current source freshness on Prawn-E14: 12 current, 6 stale, 2 manual, 1 unknown-age. Stale sources are `nparks_heritage_road_green_buffers`, `nparks_heritage_trees`, `nparks_nature_ways`, `nparks_tracks`, `planning_area_boundary`, and `traffic_signals`; `overture_addresses_sg_candidate` has unknown age.
- Evidence is tracked at `qa/verification/P76-source-freshness-readiness.md`.
- P77 evidence is being recorded at `qa/verification/P77-exposed-gap-summary.md`.
- P75 landed at `682d9b1`: README documents gitignored local data artifacts and the `lamp_posts_v1` deploy artifact contract.
- Do not run scoring, export, rescore, subset runs, ingest, network build, input rebuilds, public data writes, deployment, or weight changes unless the owner explicitly approves.
