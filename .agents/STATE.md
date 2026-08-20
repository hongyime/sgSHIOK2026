# Current State

Date: 2026-08-20

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`
Remote main after P99: `d0b41f3`

Mandatory startup guard:
- First assert the working directory is exactly `C:\sgSHIOK2026`; abort otherwise.
- Never use a relative path for a write.
- `X:\01 REPOSITORIES\sgSHIOK2026` is a synced cold mirror, not a working root.
- This rule belongs here, not only in `AGENTS.md`, because the sourcerepo sync bot has overwritten `AGENTS.md` seven times.

Status:
- P76 is complete and pushed: production readiness now reports manifest-only source freshness from `raw/manifest.json` and `pipeline/config/sources.yaml` as non-blocking release context.
- P77 is complete and pushed: the route evidence panel now summarizes total exposed metres and recorded exposed-gap count before listing the longest gaps.
- P78 is complete and pushed: the title-card score coverage line now uses route-evidence language for partial, beyond-range, and awaiting-scoring records.
- P79 is complete and pushed: the transit target tabs now label route evidence availability before the user switches modes.
- P80 is complete and pushed: the night-lighting layer note now tells users to switch on and zoom into a neighbourhood to load lamp points.
- P81 is complete and pushed: route details now label endpoint connector distance as `Snap connector` and explain it as the short link onto the walking graph.
- P82 is complete and pushed: alternate-stop comparison now includes the straight-line metre delta as well as the percentage farther than best.
- P83 is complete and pushed: the rank panel now labels its comparison set as planning-area scoped in visible, loading, empty, and screen-reader copy.
- P84 is complete and pushed: clicked-stop previews now show `Bundle score: Preview only` instead of the less precise `Score status: Not scored`.
- P85 is complete and pushed: the header score badge now labels the value as `Locked score` while keeping it visually smaller than the shelter evidence headline.
- P86 is complete and pushed: the search input now says `Search address or 6-digit postal` in visible placeholder and accessible label.
- P87 is complete and pushed: submitted address searches with zero OneMap results now show guidance to try a six-digit postal and note frozen-bundle limits.
- P88 is complete and pushed: the selected higher-shelter route is labeled `Sheltered` / `Sheltered route` / `Sheltered walk` instead of `Covered`.
- P89 is complete and pushed: the title-card score disclosure now starts `Bundle score availability` instead of `Score coverage`.
- P90 is complete and pushed: night-lighting overlay status messages now repeat that lamp points are map evidence outside the locked score.
- P91 is complete and pushed: the score-card live region now announces the default route display as `sheltered` instead of exposing the internal `shiokest` mode token.
- P92 is complete and pushed: non-visual map summaries now say `sheltered route` / `sheltered-route segments` instead of `covered route` / `covered-route segments`.
- P93 is complete and pushed: score-card reason text now says `sheltered on sheltered route` instead of `sheltered on covered route`.
- P94 is complete and pushed: score-card reason chips now describe missing scores as bundle/offline scoring states instead of pipeline implementation states.
- P95 is complete and pushed: score-state notes now describe clicked-stop previews and awaiting-score records as offline bundle inclusion/scoring states instead of pipeline evidence states.
- P96 is complete and pushed: live clicked-stop preview record provenance now says authoritative SHIOK scores come from offline bundle scoring instead of an offline pipeline bundle.
- P97 is complete and pushed: tracked support copy in browser smoke checks, attribution, the section 10 proposal, and heat-presentation analysis now follows `sheltered route` / `sheltered walk` language.
- P98 is complete and pushed: the score-card breakdown now uses route-evidence plus locked-score wording instead of score/composite-first labels.
- P99 is complete and pushed: locked-score row and section 10 proposal now say locked score instead of locked composite/composite score.
- Current source freshness on Prawn-E14: 12 current, 6 stale, 2 manual, 1 unknown-age. Stale sources are `nparks_heritage_road_green_buffers`, `nparks_heritage_trees`, `nparks_nature_ways`, `nparks_tracks`, `planning_area_boundary`, and `traffic_signals`; `overture_addresses_sg_candidate` has unknown age.
- Evidence is tracked at `qa/verification/P76-source-freshness-readiness.md`.
- P77 evidence is tracked at `qa/verification/P77-exposed-gap-summary.md`.
- P78 evidence is tracked at `qa/verification/P78-score-coverage-wording.md`.
- P79 evidence is tracked at `qa/verification/P79-transit-target-availability.md`.
- P80 evidence is tracked at `qa/verification/P80-night-lighting-zoom-disclosure.md`.
- P81 evidence is tracked at `qa/verification/P81-snap-connector-wording.md`.
- P82 evidence is tracked at `qa/verification/P82-alternate-stop-distance-delta.md`.
- P83 evidence is tracked at `qa/verification/P83-planning-area-ranks.md`.
- P84 evidence is tracked at `qa/verification/P84-preview-bundle-score.md`.
- P85 evidence is tracked at `qa/verification/P85-locked-score-badge.md`.
- P86 evidence is tracked at `qa/verification/P86-search-postal-hint.md`.
- P87 evidence is tracked at `qa/verification/P87-search-no-results.md`.
- P88 evidence is tracked at `qa/verification/P88-sheltered-route-label.md`.
- P89 evidence is tracked at `qa/verification/P89-bundle-score-availability.md`.
- P90 evidence is tracked at `qa/verification/P90-night-lighting-score-separation.md`.
- P91 evidence is tracked at `qa/verification/P91-route-display-announcement.md`.
- P92 evidence is tracked at `qa/verification/P92-map-summary-sheltered-route.md`.
- P93 evidence is tracked at `qa/verification/P93-score-reason-sheltered-route.md`.
- P94 evidence is tracked at `qa/verification/P94-bundle-score-reason-copy.md`.
- P95 evidence is tracked at `qa/verification/P95-offline-bundle-state-notes.md`.
- P96 evidence is tracked at `qa/verification/P96-live-preview-provenance-copy.md`.
- P97 evidence is tracked at `qa/verification/P97-sheltered-language-followthrough.md`.
- P98 evidence is tracked at `qa/verification/P98-locked-score-breakdown-copy.md`.
- P99 evidence is tracked at `qa/verification/P99-locked-score-sort-copy.md`.
- P75 landed at `682d9b1`: README documents gitignored local data artifacts and the `lamp_posts_v1` deploy artifact contract.
- Do not run scoring, export, rescore, subset runs, ingest, network build, input rebuilds, public data writes, deployment, or weight changes unless the owner explicitly approves.
