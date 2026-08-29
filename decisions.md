2026-08-29 - P775 sample postal entry point:
The first screen should be immediately evaluable without requiring the user to know a Singapore postal code. A compact sample action loads `S560234`, a known published-bundle postal already used by data tests, through the same selection path as a direct postal search. This is web/test/evidence work only; it does not call OneMap search for the sample, score, export, rescore, ingest, build network, mutate inputs, deploy, touch protected payloads, or change locked weights.

2026-08-29 - P774 first-card product density:
The first viewport should sell the shelter-map action before it reads like provenance evidence. Keep the title, product sentence, data-as-of line, locked-score coverage line, search, and night-lighting toggle visible, but move address-universe, recent-source sample, OSM postcode, source freshness, attribution, and heat-proxy caveats into a `Data limits` disclosure below search/results. Exposed-gap rows should use action wording, `Focus on map`, because the exposure gaps are the product's strongest inspectable artifact. This is web/test/evidence work only; it does not score, export, rescore, ingest, build network, mutate inputs, deploy, touch protected payloads, or change locked weights.

2026-08-29 - P773 P379 MCST probe confirmation gate:
The P379 MCST proxy location probe is retained but its direct `--probe` mode now requires `--confirm-p379-probe` before OneMap calls or cache/report writes. Explicit non-historical output paths remain required. The default remains cache-status-only and read-only. This is safety/test/evidence work only; it does not run the probe, call APIs, score, export, rescore, ingest, build network, mutate inputs, deploy, touch protected payloads, or change locked weights.

2026-08-29 - P807 refreshed OSM coverage in source-policy surfaces:
Batch-plan and production-readiness source-policy reporting should use the freshest committed Overpass `addr:postcode` coverage cross-check. The shared `OSM_ADDR_POSTCODE_COVERAGE` block now cites the P19 v2 28 Aug 2026 Overpass result from `qa/p19/overpass_addr_postcodes_cache_v2.json`: 25,919 valid distinct OSM postcodes, 25,899 overlapping frozen v1, 20 valid OSM-only postcodes, and 20.811938% frozen-v1 coverage. P125 remains historical evidence and its read-only status command remains available, but it is no longer the freshest source-policy numerator. This is reporting/test/evidence work only; it does not call Overpass, mutate cached evidence, alter inputs, score, export, deploy, public data, or touch locked weights.

2026-08-29 - P772 P19 measurement confirmation gate:
The P19 recent-public-source measurement remains useful but its direct `--measure` mode is write- and API-capable, so it now requires `--confirm-p19-measure` plus explicit non-historical output/cache paths before loading protected inputs or calling public APIs. The default remains cache-status-only and read-only. This is safety/test/evidence work only; it does not run the measurement, call APIs, score, export, rescore, ingest, build network, mutate inputs, deploy, touch protected payloads, or change locked weights.

2026-08-29 - P771 script-level diagnostic retirement:
Historical standalone diagnostics under `scripts/` that directly opened raw geospatial inputs are retired. `scripts.classify_residuals`, `scripts.diagnostic_battery`, `scripts.diagnostic_coord`, `scripts.diagnostic_gap`, `scripts.diagnostic_snapping`, and `scripts.diagnostic_sportshub` were one-off probes, not maintained operator entrypoints. Current and future diagnostics that read inputs or write evidence should use explicit guarded runner tasks or tracked QA/status reports. This is safety/test/evidence work only; it does not score, export, rescore, ingest, build network, mutate inputs, deploy, touch protected payloads, or change locked weights.

2026-08-29 - P770 remaining legacy diagnostic retirement:
The remaining historical `pipeline.diag_*` exploratory scripts are retired because they still opened raw geospatial or HDB inputs directly, with two of them doing so at import time. These modules are not maintained operator entrypoints; current evidence should come from guarded runner tasks, read-only status/report commands, or tracked QA records. This is safety/test/evidence work only; it does not score, export, rescore, ingest, build network, mutate inputs, deploy, touch protected payloads, or change locked weights.

2026-08-29 - P767 legacy rescope retirement:
`pipeline.rescope` is retired as a direct legacy entrypoint because it performed OSM/HDB raw-data reads at import time from a relative `raw/` path. Operators should use the cached read-only `run.py p125-osm-status` and `run.py universe-status` reports for existing postal-universe evidence, and any new postal-universe build must go through the guarded `run.py postal-universe --confirm-postal-universe` path after owner approval. This is safety/test/evidence work only; it does not read or mutate inputs beyond code inspection, score, export, build network, deploy, public data, protected QA payloads, or locked weights.

2026-08-29 - P768 first-view freshness copy density:
The first-viewport source freshness disclosure should stay honest without reading like an audit log. The app now shows a concise visible manifest-only freshness summary and keeps the full stale-source list, near-stale sources, source-policy coverage, and versioned-refresh rule in an expandable detail block. This is browser copy/test/evidence work only; it does not rerun freshness, probe upstream APIs, mutate manifests or inputs, score, export, build network, deploy, public data, protected QA payloads, or locked weights.

2026-08-29 - P769 import-time diagnostic retirement:
Historical diagnostic modules should not read raw geospatial inputs at import time. `pipeline.diag_c2`, `pipeline.diag_d1`, and `pipeline.diag_linkway_length` are retired behind explicit `main()` functions that return a retirement message, because maintained evidence now belongs in guarded runner tasks or read-only QA/status reports with explicit scope. This is safety/test/evidence work only; it does not read or mutate inputs beyond code inspection, score, export, build network, deploy, public data, protected QA payloads, or locked weights.

2026-08-11 - Heat routing and comfort-mode evidence decision:
At commit 3a3244eab6eb4e64274362166ed07b72c91b8d23, prototype route-profile probes were run in temporary scripts only, with no artifact or scoring changes committed. Samples used seed 20260811. The corrected route probe used 300 real SCORED origins and 2,406 actual candidate origin-destination pairs from the active bundle generated_20260805_prefer_scored_routed. The full-bundle collinearity and mode analysis used all 95,157 shipped SCORED records. The routing graph had 896,830 edges; shade_ratio was exactly zero on 832,295 edges, or 92.804%. Planning-area shade proxy coverage was entirely absent in Tuas, Pioneer, Straits View, Changi Bay, and Western Islands. Dense transit areas were effectively absent too: Newton was 99.83% zero, Orchard 97.73%, Serangoon 98.15%, and Geylang 97.50%.

Rain and heat evidence were found to be strongly collinear in the shipped score records: covered_ratio versus heat_comfort_ratio had Pearson 0.989994 and Spearman 0.980943 island-wide, with Spearman above 0.999 in Newton, Orchard, and Rochor. The corrected heat-routing objective matched heat_comfort_evidence_m by counting covered edges at full heat benefit and uncovered shade at shade_ratio * shade_proxy_weight, with shade_proxy_weight = 0.5. That corrected heat optimizer was valid against its own metric: heat_safe differed from shortest on 1,242 of 2,406 pairs, and all 1,242 were strictly better on corrected heat metres, with zero equal and zero worse. However, heat_safe differed from rain_safe on only 277 of 2,406 pairs, or 11.51%. Heat-safe route gain versus shortest was dominated by covered metres: median total corrected heat gain was 130.24 m, median covered component was 125.69 m, and median weighted shade component was 0.00 m. Mean positive heat gain share was 92.66% covered metres and 7.34% weighted shade. This establishes that the currently available heat evidence is mostly rain shelter plus a small greenery-proxy term, not an independent heat-routing signal.

Mode reweighting showed the same collapse. With weights.yaml locked to PRD v4.2 section 7 at access 0.35, bus 0.20, rain 0.25, heat 0.15, crossing 0.05, the presentation-mode vectors are not authoritative scoring weights. Because rain and heat evidence are collinear, balanced and rain_cover both sit at effective shelter weight 0.40; heat_moderate sits at 0.45; heat_high sits at 0.50. A controlled synthetic mode test showed that restoring bus to 0.25 while keeping effective shelter at 0.40 collapsed rain_cover-to-heat_high rank movement to 4.54% of records moving more than 5% of the scored universe, and top-five planning-area changes to zero. Therefore the observed heat_high reordering is driven mainly by increasing effective shelter weight and reducing transit/bus emphasis, not by a distinct rain-versus-heat signal.

Decision: do not ship a distinct heat_safe routing profile on the current data. Ship one shelter-seeking route profile only, named for covered walkway evidence rather than a family of weather-specific alternatives. Treat covered walkways as rain shelter and incidental sun blockage, and disclose that heat evidence is currently dominated by covered shelter with only a sparse NParks greenery proxy term. Building footprints, building heights, tree canopy, and time-aware shade/thermal modelling are promoted from speculative future enhancement to measured prerequisite for any honest heat or thermal routing. If better data is added later, rerun the same seed 20260811 probes or a successor fixed-seed protocol against the then-current active bundle before reviving heat routing as a distinct capability.

Perceptibility sweep for a replacement shelter-emphasis control used the locked weights.yaml baseline as Standard, preserving the baseline rain:heat split of 25:15 and funding added effective shelter weight proportionally from access:bus:crossing at 35:20:5. Candidate effective shelter weights from 0.40 through 0.75 in 0.05 increments showed that the Standard origin is zero delta by definition: at shelter 0.40, top-five planning-area changes were 0.00%, top-twenty planning-area changes were 0.00%, median top-twenty overlap was 20 of 20, and full-universe rank movement was 0.00%. Adjacent 0.05 steps are generally below a defensible visibility threshold: top-five planning-area changes ranged from 6.52% to 10.87%, with median top-twenty overlap still 20 of 20 for every adjacent step. Against Standard, shelter 0.55 changed the top five in 17.39% of planning areas, changed the top twenty in 56.52%, reduced median top-twenty overlap to 19, and moved 48.15% of records by more than 5% of the scored universe. Shelter 0.60 changed the top five in 23.91% of planning areas and the top twenty in 65.22%, but leaves only 0.40 total weight for access, bus, and crossing. Shelter 0.75 changed the top five in 36.96% of planning areas, but reduces bus to 0.083333 and access to 0.145833, which no longer honestly describes a walk-to-transit comfort index.

Defensibility ceiling: effective shelter weight 0.55 is the recommended ceiling for any blended comfort composite on the current product claim, because access plus bus still totals 0.4125 and remains comparable to shelter. Shelter 0.60 is the absolute edge case but not recommended, because the composite becomes shelter-dominant and transit usefulness is subordinated. Using a product threshold that each adjacent selectable stop should change top-five results in at least 20% of planning areas, the perceptibility floor is about 0.60, which sits above the defensibility ceiling. The sweep, the 0.55 ceiling, the 0.60 perceptibility floor, and the resulting no-selector decision are one decision thread: the product first proved that weather/time modes were overstated, then proved that replacement shelter-weight stops are either too subtle to matter or too shelter-dominant to remain honest. Therefore no honest multi-stop shelter-emphasis control exists on the current evidence. Direct sub-score ranking is perceptible and honest as a separate view, with rain and heat sub-score sorts each changing top-five results in 82.61% of planning areas and top-twenty results in 97.83%, but it answers a narrower single-dimension question rather than the multidimensional composite. Recommendation: ship no mode or weighting selector for now; keep one authoritative composite score and make the sub-score breakdown prominent. If later adding a separate sort view, label it as sorting by a single sub-score, not as changing the SHIOK composite.

Dropped follow-ups: numpy cost vectors are not worth pursuing on the current machine because the saving is roughly 28 MiB per additional vector against a 63.5 GiB owner machine, while the risk is discontinuous shortest-path tie-breaking. A 1e-15 accumulated-weight difference can select a different equal-cost path with different geometry and shelter evidence, and tolerance-based metric tests would not detect that artifact drift. Revive this only if exact edge-path equality passes across the full realistic sample. QA history cleanup is also dropped for now: the working tree makes qa/ look like roughly 102 MiB of bloat, but the packed repository is about 24.6 MiB, so the clone-size problem is much smaller than the loose-file total implies. Rewriting history would invalidate every commit hash cited in this record and in release evidence, which costs more than the current packed-size benefit.

2026-08-11 - P1 licensing and attribution implementation decision:
Subagent research found that OneMap GreyLite map display requires the visible OneMap logo and Singapore Land Authority attribution markup, and that OneMap API datasets are pointed by the OneMap API Terms to the Singapore Open Data Licence v1.0. Singapore Open Data Licence v1.0 sources require conspicuous source and licence notice. LTA DataMall datasets used by SHIOK are treated as SODL inputs, while general LTA website content is not being redistributed. The audit identified the shipped sources requiring attribution as covered_linkway, overhead_bridge_underpass, bus_stops, bus_services, bus_routes, mrt_lrt_exits, train_station_codes, traffic_signals, building_points, sla_dwelling_information, ura_no_dwelling_units, planning_area_boundary, nparks_nature_ways, nparks_park_connector_loop, nparks_tracks, nparks_heritage_trees, nparks_heritage_road_green_buffers, and osm_extract.

Implementation: NOTICE now names every shipped source from the audit with publisher and licence; ATTRIBUTION.md records per-source licence URLs and derived use; README links to ATTRIBUTION.md; the web map uses non-compact OneMap attribution with the required logo markup; and the visible app source line includes © OpenStreetMap contributors, an ODbL link, and an ATTRIBUTION.md link. Overture and lamp_posts remain candidate/unshipped notes only, and leaf_area_index is documented as hash-shipped but not consumed.

Open question: whether SHIOK's published static OSM-derived data is an ODbL Produced Work or a Derivative Database under ODbL section 4.4 needing an explicit ODbL grant is unresolved and should not be treated as legal advice. Conservative reading for publication: ATTRIBUTION.md states that OSM-derived published static data is treated as ODbL-licensed.

2026-08-12 - P2 Strand 1 dead route-batch cleanup decision:
The unused route batch entry point and its pool initializer helpers were removed from `pipeline/routing.py`; `route_worker` remains because `pipeline/bus.py` calls it for bus-connector routing. The deleted `routing:` block in `pipeline/config/params.yaml` only configured those removed batch helpers and had no remaining code reader after the cleanup. No scoring formula, routing algorithm, weights, or export shape changed. P3 verification corrected the fingerprint note: commit 73add7c added this dead `routing:` block after the last publish, so removing it realigned `params.yaml` with the published bundle fingerprint `a05e9e9aac805de4a12217214ee574f6dc8813054d2fa8993a73e7d649bb1ce1`. The `pipeline/routing.py` fingerprint did change because the dead route-batch code was removed; that routing-code fingerprint delta is expected on the next provenance refresh.

2026-08-12 - P3 bus-zero investigation:
P3 found that the bus-zero defect is real at full-bundle scale: 39,786 of 95,157 SCORED rows have `subscores.bus == 0`, and 21,169 of those carry `provenance.direct_bus_fallback.best_expected_wait_min`. The median fallback wait is 0.779 minutes, so a narrow in-memory substitution would move 21,165 published totals after one-decimal rounding, with a median +20.0 composite-point delta and Spearman 0.924322063 against current totals. The recommended fix is not a blind fallback promotion. The dominant reason string is `implausible_graph_route_to_datamall_bus_stop_within_direct_radius`, and nearest-direct distances are often short, so the likely root cause is network conflation around DataMall bus stops. P5 should validate/fix bus-stop graph connectivity first, then publish either a routed bus score or an explicit partial/null state for unresolved cases. OneMap B3 validation was not completed in the P3 environment because no OneMap/DataMall/LTA credentials were present.

2026-08-12 P4 correction: about 20.280% of affected fallback-wait records have `nearest_direct_m` in `[250,305]`, which is outside `routed_max_m: 250` by construction. For those records, `implausible_graph_route_to_datamall_bus_stop_within_direct_radius` is a misleading reason label rather than evidence of a routing failure. P4 records this but does not change the published reason strings.

2026-08-12 - P4 rank-view payload scope:
The rank view now avoids the eager area-wide score fetch on every postal search and retains only compact `{postal,total,subscores}` rank records when the user opens the panel. This is the best web-only reduction available against the current static bundle. A true transferred-byte reduction needs an export-side per-area rank index, because the existing score shards are the only artifact containing the per-record sub-scores required for rank-by views. That export-side index is deferred because P4 must not touch pipeline/export behavior or move published artifacts.

2026-08-14 - P11 Windows migration portability decision:
Migration evidence must be recorded with repository-relative paths for new notes and scripts. Historical T14 paths such as `C:\shiok` and `X:\01 REPOSITORIES\SHIOK` are provenance facts only, not patterns to propagate. Fresh clones intentionally lack large ignored payloads under `raw/`, `processed/`, `web/public/data/`, and historical QA scratch directories; anchor verification after a move should first confirm Git status, Python/library identity, Node/npm identity, and focused tests before any expensive pipeline rerun. `.agents/STATE.md` and `.agents/JOURNAL.md` are currently tracked and unignored, so they can carry short handoff state, but durable product or release decisions remain in this visible `decisions.md` because repository instructions and sync-bot/dot-directory behavior make `.agents/` unsuitable as the only durable decision log.

2026-08-15 - P5 ingest and heat evidence backfill:
P5 made ingest validation fail closed on source and count validation errors, and reframed heat copy as proxy evidence rather than measured heat. Evidence is in `qa/verification/P5-ingest-and-heat.md` and `qa/verification/heat_presentation_investigation_20260812.json`. The durable decision is that heat remains a covered-route plus NParks greenery proxy until better heat or shade data exists; product copy must not imply measured thermal conditions.

2026-08-15 - P6 bus honesty and rerun timing backfill:
P6 kept direct-bus fallback as evidence of rejected candidates, not selected routed truth, and recorded that fallback provenance reaches the client for affected records. Evidence is in `qa/verification/P6-bus-honesty-and-timing.md`. The durable decision is that bus fallback evidence may explain why a bus candidate was rejected, but must not be promoted into a positive bus subscore without fixing or explicitly waiving the routing trust issue.

2026-08-15 - P7 untrusted-subscore and determinism backfill:
P7 closed the UI-warning proposal for `untrusted_subscores`: the field describes the rejected bus-fallback candidate, not the selected route, so no blanket UI warning is warranted. P7 also established same-machine determinism on T14 for the 1,200-record subset, with only expected manifest timestamp byte differences after normalization. Evidence is in `qa/verification/P7-untrusted-and-determinism.md`.

2026-08-15 - P8 provenance repair backfill:
P8 replaced full per-record scoring fingerprints with compact digest provenance and retained manifest-level resolver maps to reduce payload cost while keeping code/config traceability. Evidence is in `qa/verification/P8-provenance-repair.md`. The durable decision is that public score records should carry compact provenance digests, while full fingerprint maps live at manifest scope.

2026-08-15 - P9 input provenance backfill:
P9 added scoring-input digest provenance so score records can identify the exact postal-universe inputs used without repeating the full input map per record. Evidence is in `qa/verification/P9-input-provenance.md`. The durable decision is that input identity must be hash- and row-count-backed in manifests, not inferred from filenames.

2026-08-15 - P10 network provenance and published-input identity backfill:
P10 added network digest provenance and established that the published bundle cites the `processed\score_batches\full_rescore_20260804_205430\partitions\` partition set with 124,443 rows, not the older 124,032-row split. Evidence is in `qa/verification/P10-published-input-identity.md`. The durable decision is that the P6 scratch comparison against the 124,032-row split is not a valid published-bundle baseline; published-score comparisons must use the 124,443-row partition set cited by the active bundle.

2026-08-16 - P17 legacy provenance release standard:
The active published bundle `generated_20260805_prefer_scored_routed` predates the P8-P10 record-level provenance schema. It has source hashes, five legacy scoring fingerprints, and complete subscore status, but it does not carry the later full 18-file fingerprint set, record-level scoring fingerprint digests, scoring-input provenance, or network provenance. P11-P16 established that score values, coordinates, route origins, and input identity were independently checked, and P16 showed that re-exporting the preserved full-rescore chunks can preserve sampled score values but cannot create missing provenance honestly. The release standard is therefore changed: readiness reports legacy provenance as a distinct `legacy` state rather than a failed artifact when the missing capability was never recorded and no internal inconsistency is present. Internally inconsistent provenance, including the P10 stale-resume shape where `scoring_fingerprint_changed_during_run` is true, remains a release-blocking `failed` state. No full E14 rescore is approved merely to backfill provenance fields for an already verified legacy bundle.

2026-08-16 - P20 source freshness and lamp overlay gate:
Source freshness is a reporting signal, not a corruption signal. `pipeline/config/sources.yaml` now declares expected cadence and staleness thresholds by source kind, and `run.py check` reports overdue source manifests without treating staleness alone as a failed hash or changed input. The UI must disclose that the address universe remains the frozen v1 2020 SLA-derived postal set, because P19 measured a small but real recent-public-source miss signal and users choosing where to live should see that limitation before interpreting the score.

Lamp posts remain a separate map-layer candidate, not a score input. The fetched LTA lamp-post source is current and hashed, but it exists only as a 41,907,845-byte raw GeoJSON with 126,144 point features and is not present in the browser bundle. Shipping a night-safety overlay therefore requires a new derived public data artifact or tile/index strategy; it should not be smuggled in as React-only code or as an untracked mutation of the existing published bundle.

2026-08-16 - P21 lamp overlay artifact strategy:
The lamp overlay artifact strategy is compact H3-bucketed point tiles, not one monolithic GeoJSON in the browser bundle. `run.py lamp-overlay` builds a versioned output directory from the existing raw lamp source and refuses to write into a non-empty output path, preserving the project's versioned-artifact rule. The measured H3 resolution 8 preview from the current 126,144-point source produced 700 tile JSON files plus one manifest, 3,146,697 bytes total, with the largest tile at 794 points / 18,908 bytes. That is small enough for viewport-based fetching in a future map toggle. It is not yet a shipped public artifact: moving this under `web/public/data/` and wiring the React map layer are the next owner-visible steps, and must use a new versioned directory rather than mutating any existing bundle.

2026-08-16 - P22 lamp overlay browser layer:
Lamp posts ship as an optional map evidence overlay, not as a scoring input and not as a change to the locked SHIOK score. The public artifact path is the new versioned directory `web/public/data/lamp_posts_v1/`, built from the existing hashed raw lamp GeoJSON into H3 resolution 8 point tiles. The browser fetches the overlay by viewport tile only when the user enables the `Lamp posts` layer and the map is zoomed in, so the 126,144-point source is not loaded into the initial page or into the default whole-island map view. This is a product-visible delivery step because it exposes the current night-lighting source directly on the route map while preserving the existing score bundle and all route evidence.

2026-08-16 - P23 Leaf Area Index provenance policy:
NParks Leaf Area Index is a species/generic reference table, not route-level geometry. The raw XLSX has a version sheet, an explanatory calculation sheet, and a 1,609-row plant list with species names and generic LAI values, but no coordinates, polygons, or network-edge coverage. Wiring it into the current shade proxy would require a separate species-located canopy inventory and model design, plus a network rebuild and rescore; doing that implicitly from a reference table would overstate the evidence. Future score records therefore exclude `leaf_area_index` from per-record score `source_hashes`. `raw/manifest.json` and source freshness can still track the file as an upstream reference candidate, but score provenance now names only sources that affect scoring or route evidence.

2026-08-16 - P24 no-transit partial-score policy:
`NO_TRANSIT_IN_RANGE` is a subscore availability state, not by itself proof that every other route-evidence term is unusable. Future scoring therefore keeps the locked weight vector unchanged and does not renormalize: unavailable subscore terms, including access beyond the zero-credit distance, contribute zero under their locked weights while any available bus, shelter, heat, and crossing evidence still contributes normally. Records with numeric route evidence and at least one null subscore publish as `SCORED_PARTIAL`; records with no numeric candidate because no candidate was selected, no route connected, or every numeric route was rejected by trust gates remain `NO_TRANSIT_IN_RANGE`. This changes future score fingerprints because `pipeline/scoring.py` is fingerprinted; it does not mutate the existing published bundle and requires an owner-approved batch rescore/export before affecting production data.

2026-08-16 - P27 score availability disclosure:
The browser title card must disclose score availability from `manifest.provenance.record_count` and `state_counts`, not from hand-maintained copy. The active bundle has 95,157 fully scored records out of 124,443, leaving 29,286 records (23.534%) that are partial, not-yet-scored, or beyond current transit range and therefore do not render a full score. This is a user-facing product limitation disclosure, not a data-corruption signal; it changes only web copy and tests, not scoring, weights, exports, inputs, or public data artifacts.

2026-08-16 - P28 night-lighting layer label:
The lamp-post overlay remains a raw LTA point layer underneath, but its browser control should be user-facing as `Night lighting`. That aligns the visible map layer with the product story: lamp posts are evidence for night lighting, not a score term and not a raw-data inspection mode. The source/layer ids and `web/public/data/lamp_posts_v1/` artifact contract stay unchanged, so this is a copy-only web change with no scoring, export, input, public-data, or weight movement.

2026-08-16 - P29 night-lighting accessibility state:
The night-lighting overlay must be represented in the route map's non-visual summary when enabled. The visible map still uses the existing lamp-post tiles and layer ids, but the screen-reader summary now names whether the overlay is on and how many lamp points are loaded in the current view. This keeps the layer accessible without adding visible instructional copy or changing scoring, exports, inputs, public data, or locked weights.

2026-08-16 - P30 locked-score visual priority:
The browser must keep the locked 0-to-100 composite visible but visually secondary to route shelter evidence. P30 reduces the header score badge numeric size and raises the shelter-evidence headline so the covered-walkway percentage leads the card. This is a presentation-only change: it does not alter `score.total`, the four-row locked-weight breakdown, ranking logic, exports, inputs, public data, or `weights.yaml`.

2026-08-16 - P31 exposed-gap map focus:
Exposed gaps should be inspectable as map evidence, not just read as coordinates. The score card now turns each top exposed gap with coordinates into a keyboard-accessible control that centers the route map on that gap, while preserving the existing gap length/coordinate copy. This is a browser interaction change only; it does not alter route geometry, exposure-gap data, scoring, exports, inputs, public data, or locked weights.

2026-08-16 - P32 active exposed-gap map highlight:
After an exposed gap is selected from the score card, the route map should show which coordinate was selected rather than only panning to it. The browser now derives a transient `active-exposure-gap` point from the selected gap latitude/longitude and renders it as a map ring layer. This is presentation-only map evidence: it does not change the exposure-gap route geometry, source records, scoring, exports, inputs, public data, or locked weights.

2026-08-16 - P33 exposed-gap marker lifecycle:
The active exposed-gap marker is valid only for the route context that produced it. Changing the displayed route mode, transit mode, or selected transit stop clears the focused exposed gap so the map cannot keep showing a marker from a previous route. This keeps the shelter-evidence interaction honest without changing route geometry, scoring, exports, inputs, public data, or locked weights.

2026-08-16 - P34 shelter-first metadata:
The browser metadata should match the product's settled presentation, not the earlier five-term composite framing. The page description now leads with covered-walkway exposure gaps and night-lighting evidence, and names the locked SHIOK score as secondary. This changes only discoverability copy; it does not alter UI scoring, exports, inputs, public data, or locked weights.

2026-08-16 - P35 selected exposed-gap map summary:
Map evidence must be available to non-visual users when it becomes visible evidence. The active exposed-gap marker now contributes a coordinate sentence to the route map's screen-reader summary, matching the visual ring layer added in P32. This is a browser accessibility change only; it does not alter exposure-gap geometry, scoring, exports, inputs, public data, or locked weights.

2026-08-16 - P36 frozen postal-universe copy:
The title card should not imply that the address universe is current merely because route evidence has a current bundle date. The visible freshness line now says `Route evidence as of ...`, and the address-universe caveat names the frozen v1 source as a June 2020 OneMap-derived postal scrape. This is an honesty-copy change only; it does not alter manifests, inputs, scoring, exports, public data, or locked weights.

2026-08-16 - P37 missing postal score copy:
When a searched postal has no score record, the detail card should explain that no route evidence is published for that postal in the frozen June 2020 address universe, rather than only saying `not yet scored`. This keeps the local failure state aligned with the title-card caveat. It changes only browser copy and render tests; it does not alter search, scoring, exports, inputs, public data, or locked weights.

2026-08-16 - P38 shelter-first title card:
The title-card subtitle should match the settled product framing that route shelter evidence leads and the locked composite is secondary. The visible subtitle is now `Shelter-first walks to transit` instead of the older generic `Singapore walk-to-transit comfort`. This is a browser copy change only; it does not alter scoring, exports, inputs, public data, or locked weights.

2026-08-16 - P39 empty score-panel route evidence copy:
The score panel's pre-search empty state should introduce the product as sheltered route evidence, not as a generic comfort score. The visible prompt now asks users to search a Singapore postal code to inspect sheltered walk evidence to transit. This is a browser copy change only; it does not alter search behavior, scoring, exports, inputs, public data, or locked weights.

2026-08-16 - P40 route evidence panel accessibility:
The result card's accessible region and live status should name route evidence first, matching the visible shelter-first framing. The panel is now announced as `Route evidence panel`, and its no-selection and loaded statuses use route-evidence wording while still announcing the locked composite score when a score exists. This is a browser accessibility-copy change only; it does not alter scoring, exports, inputs, public data, or locked weights.

2026-08-16 - P41 browser smoke route evidence selector:
The browser smoke launch check must query the result card by the same accessible label the UI now exposes. Its card selector now targets `Route evidence panel` instead of the obsolete `Score panel`, with a packaging test pinning the selector. This is a QA-script compatibility change only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-16 - P42 route evidence reasons label:
The small reason-list chips explain the route evidence that produced or limited the selected result, while the separate breakdown section owns the locked score. The reason-list accessible label is now `Route evidence reasons` instead of `Score reasons`; `Score breakdown` remains unchanged for the locked-score section. This is a browser accessibility-copy change only; it does not alter scoring, exports, inputs, public data, or locked weights.

2026-08-16 - P43 browser smoke visible-text matching:
Browser smoke `--must-include` checks should match what users can see, even when CSS changes text case or whitespace in `innerText`. The smoke checker now normalizes case and whitespace before comparing required text against the result card and map summary. This is a QA-script robustness change only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-16 - P44 browser smoke route-evidence output names:
Browser smoke output should use the same route-evidence terminology as the UI. The canonical smoke JSON now includes `route_evidence_panel_loaded` and `route_evidence_panel_excerpt`, while retaining the older `score_panel_loaded` and `score_panel_excerpt` keys as compatibility aliases for existing QA artifacts or scripts. This is a QA-script schema compatibility change only; it does not alter browser rendering, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-16 - P45 README shelter-first framing:
The repository introduction should describe the shipped product promise, not the pre-P18 five-term comfort-score framing. The README now leads with the user's question, the covered-walkway ratio, exposed gaps on real routed paths, night-lighting evidence, and the locked SHIOK score as secondary. This is documentation only; it does not alter browser rendering, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-16 - P46 night-lighting score separation:
Night lighting is a map evidence layer backed by LTA lamp-post points, not a scoring term and not a mutation of the locked SHIOK score. The browser toggle now has visible and screen-reader-linked copy stating that it is map evidence only and not part of the locked score. This is a browser copy/accessibility change only; it does not alter lamp tiles, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-16 - P47 heat-proxy evidence wording:
Heat copy should stay weaker than measured thermal or route-level canopy evidence. The title card now says `Heat proxy: shelter + sparse NParks greenery`, and route-detail copy says `Heat proxy evidence` rather than generic score evidence. This keeps the browser aligned with the P5/P23 policy that current heat evidence is covered-walkway dominated with only sparse NParks greenery proxy support. This is browser copy only; it does not alter scoring, shade proxy geometry, exports, inputs, public data, deployment, or locked weights.

2026-08-16 - P48 clicked-stop preview failure disclosure:
Clicked transit stops without precomputed route geometry use a preview path while the browser asks OneMap for a walking route. If that route is still loading or cannot be returned, the result card must say so instead of silently showing a straight-line preview as if it were equivalent route evidence. The browser now reports loading and unavailable preview states for arbitrary clicked stops, while preserving precomputed bundle candidates as authoritative. This is browser state/copy only; it does not alter OneMap API behavior, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P50 route-evidence footer:
The page footer should not reintroduce the old comfort-index framing after the title card, result panel, README, and metadata have moved to shelter-first route evidence. The visible footer now says `Source-derived route evidence.` instead of `Source-derived comfort index.`. This is browser copy only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P51 night-lighting overlay status:
The night-lighting map summary should distinguish overlay lifecycle states instead of collapsing them into a single `no lamp points loaded` sentence. The non-visual map summary now reports whether the overlay is off, below the zoom threshold, loading LTA lamp-post points, empty for the current view, loaded with a point count, or unavailable. This keeps the browser honest about a viewport/zoom-loaded evidence layer without changing lamp tiles, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P52 quantified postal-universe caveat:
The title-card address-universe caveat should cite the measured P19 public-sample miss signal instead of leaving `newer completions may be missing` completely unquantified. The browser now states that the recent public-sample check found 8 missing rows out of 976 HDB completion and MCST proxy rows from 2021-2026 with postals. This is an honesty-copy change only; it does not alter the frozen v1 universe, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P53 score-coverage state breakdown:
The score-coverage line should explain what the non-full records are when the manifest carries complete state counts. The browser now expands the live-bundle coverage line into partial, beyond-current-transit-range, and not-yet-scored counts, while retaining the older generic fallback for incomplete manifests. This is browser disclosure copy only; it does not alter manifests, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P54 locked-score live-region wording:
The route-evidence panel's screen-reader status should match the visual product hierarchy: route evidence leads, and the 0-to-100 composite is a locked secondary score. The live-region announcement now says `Locked score ...` instead of generic `Score ...`. This is accessibility copy only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P55 locked-score rank label:
The rank selector should use the same product label as the score breakdown and live-region status. The overall ranking option is now `Locked SHIOK score` instead of `Overall SHIOK`; ranking behavior is unchanged. This is browser copy only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P56 rank helper copy:
The rank panel helper should describe the overall view as a locked score order, not as an authoritative composite order. The visible helper now says `Locked score order.` while the single-subscore helper still says the SHIOK score is unchanged. This is browser copy only; it does not alter ranking behavior, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P57 manifest-only freshness reporting:
Source freshness should be reportable without fetching, ingesting, or hashing upstream data. The fetch module now supports `check --freshness-only`, which reads the existing raw manifest and source freshness policy to print current/stale/manual/unknown source status. This is operational reporting only; it does not alter source cadence thresholds, inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P58 source freshness policy coverage:
Every configured source must resolve to an expected freshness cadence; every non-manual source must also resolve to a numeric stale-after-days threshold. This is now enforced by a config-level test so future sources cannot silently fall into `unknown_policy` freshness status. This is test coverage only; it does not alter source thresholds, inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P59 source freshness snapshot:
The manifest-only freshness snapshot reports 12 current sources, 6 stale sources, 2 manual sources, and 1 source with unknown age. The stale sources are traffic_signals, planning_area_boundary, nparks_nature_ways, nparks_tracks, nparks_heritage_trees, and nparks_heritage_road_green_buffers; overture_addresses_sg_candidate has unknown age because it is a candidate source not present in the raw manifest. The core delivery sources checked separately — covered_linkway, lamp_posts, and bus_stops — are current. This is evidence only; it does not alter inputs, thresholds, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P60 title-card source freshness:
The title card should expose the P59 freshness result in user-facing language, not only in verification evidence. The browser now states that shelter, bus stops, and night lighting are current while 6 supporting sources are stale. This is browser copy only; it does not alter freshness thresholds, inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P61 stale source category copy:
The source freshness disclosure should name the stale supporting-source categories rather than only giving a count. The browser now says the stale supporting sources include traffic signals and some greenery or boundary references, while shelter, bus stops, and night lighting remain current. This is browser copy only; it does not alter freshness thresholds, inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P63 OSM postcode coverage:
Live Overpass measurement found 25,879 distinct valid six-digit Singapore `addr:postcode` values, of which 25,873 overlap the frozen 124,443-postal universe. That is 20.791% coverage of the frozen universe, with only 6 OSM-only valid postcodes. OSM remains useful as a geometry source, but this measurement argues against treating Overpass `addr:postcode` as the primary current address-registry source for postal-universe v2. Evidence is tracked at `qa/verification/P63-osm-postcode-coverage.md`. This is evidence and product-source policy only; it does not alter inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P64 OneMap enumeration feasibility:
OneMap Search should be used to validate and geocode candidate postals, not to enumerate the national postal universe from scratch. The official docs bundle describes Search as a keyword-filtered endpoint requiring `searchVal`, and the read-only probe showed exact postal lookup works while broad or wildcard-style queries are either small, paginated result sets or immediately rate-limited. Postal-universe v2 should therefore be candidate-source-first: use free current sources such as HDB Property Information, SLA/URA, BCA MCST, and any approved address candidate source to propose rows, then pass bounded candidates through OneMap Search under explicit token/rate controls. Evidence is tracked at `qa/verification/P64-onemap-enumeration-feasibility.md`. This is evidence and source-architecture policy only; it does not alter inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P65 README universe status:
The README should expose the current universe policy at onboarding time instead of requiring a reader to reconstruct it from P19, P63, and P64 evidence. It now states that the 124,443-record universe is frozen v1, cites the 8/976 HDB completion and MCST proxy miss signal, records that live OSM covers only 25,873 frozen postals, and states that OneMap Search is candidate validation/geocoding rather than national enumeration. This is documentation only; it does not alter inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P66 readiness source-policy summary:
The production-readiness report should carry the settled postal-universe source policy directly, not only expose it through README and verification files. Its feature summary now states that the canonical 140k postal universe remains unclaimed because frozen v1 is the 124,443-record June 2020 OneMap-derived universe, P19 measured 8 missing HDB completion and MCST proxy rows out of 976 rows with postals, P63 measured live OSM `addr:postcode` at only 25,873 frozen postals, and P64 showed OneMap Search validates bounded candidates but is not an enumerator. A separate readiness key records the v2 policy: candidate-source-first current free sources, then bounded OneMap Search validation under token and rate controls. This is operational reporting only; it does not alter inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P67 batch-plan source-policy output:
The dry-run batch planner should expose the same postal-universe source policy as readiness, because it is the operational gate a future full geocode/scoring batch will consult before any expensive run. `pipeline.batch_plan` now emits a `source_policy` block stating that frozen v1 remains the 124,443-record June 2020 OneMap-derived universe, OSM `addr:postcode` is not sufficient as a primary registry, OneMap Search is candidate validation/geocoding rather than national enumeration, and v2 requires candidate-source-first current free sources followed by bounded OneMap Search validation under token/rate controls. The human-approval blocker now names frozen v1 and the candidate-source-first v2 approval requirement. This is dry-run reporting only; it does not alter inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P68 MCST proxy wording:
P19's private-strata source is BCA MCST constitution date, which is a useful open-data proxy for private strata onboarding but not a direct project completion or TOP date. User-facing and readiness copy should therefore describe the P19 denominator as `HDB completion and MCST proxy rows`, not generic `completions`. This is wording accuracy only; it does not alter the P19 measurement, frozen v1 universe, inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P69 MCST terminology consistency:
Non-evidence tracked files should use the P68 wording consistently. Stale completion-only terminology was removed from `.agents/STATE.md` and the older P65 decision text; immutable `qa/verification/` history is left unchanged, and the old generic browser phrase remains only inside negative regression assertions. This is terminology consistency only; it does not alter the P19 measurement, inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P70 API credential readiness:
Production readiness should expose whether local API credentials are present before any OneMap or LTA work starts. The readiness report now includes a non-secret `environment` block that reports only boolean presence and missing variable names for `LTA_DATAMALL_ACCOUNT_KEY`, `ONEMAP_EMAIL`, and `ONEMAP_PASSWORD`; missing values produce warnings but do not block static release checks. On Prawn-E14 at P70, all three variables are present. This is operational reporting only; it does not call APIs, alter inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P71 batch-plan API credential readiness:
`pipeline.batch_plan` should load `.env` when invoked directly, matching other pipeline entrypoints, before reporting API credential readiness. Before P71, `scripts.production_readiness.environment_readiness()` saw all three credentials through imported pipeline dotenv side effects, but `pipeline.batch_plan.api_environment_readiness()` saw none because the module did not load `.env` itself. Batch planning now loads `.env`, emits a non-secret `api_environment` block, and warns on missing LTA/OneMap variables without leaking values. This is dry-run reporting only; it does not call APIs, alter inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P72 night-lighting overlay release guard:
Because the browser exposes `/data/lamp_posts_v1/` as the night-lighting layer, production readiness must verify that the local deploy source contains a valid lamp overlay artifact before release. The guard checks the gitignored public artifact's manifest, source identity, nonzero point count, tile index length, referenced tile files, and tile byte totals, and blocks readiness if the artifact is missing or internally inconsistent. The current local artifact passes with 700 tiles and 126,144 lamp points. This is static release gating only; it reads but does not modify `web/public/data/`, does not call APIs, does not alter inputs, exports, scoring, deployment, or locked weights.

2026-08-20 - P73 night-lighting source disclosure:
The night-lighting layer note should name the lamp-post evidence scale and source date, not only say that the layer is map evidence outside the locked score. The browser now states that the LTA lamp-post layer has 126,144 points and that the source was last modified on 7 Jul 2026, while retaining the locked-score separation. The committed test suite uses temporary lamp-overlay fixtures rather than requiring the gitignored `web/public/data/lamp_posts_v1/` artifact to exist in a fresh clone; the local artifact proof remains in readiness evidence. This is browser copy and test hardening only; it reads but does not modify `web/public/data/`, does not alter inputs, exports, scoring, deployment, or locked weights.

2026-08-20 - P74 visible night-lighting layer status:
The night-lighting overlay status should be visible when the layer is on, not only present in the screen-reader map summary and debug output. The map now renders the existing status text for zoom-in, loading, unavailable, empty, and in-view states as a small overlay status, while keeping the same text in the non-visual map summary. This is browser UI only; it does not alter the lamp artifact, inputs, exports, scoring, deployment, or locked weights.

2026-08-20 - P75 local data artifact documentation:
The README should state that fresh clones lack gitignored local payloads and that the night-lighting layer depends on the separate local `web/public/data/lamp_posts_v1/` artifact. It now documents the active score bundle path, the lamp overlay artifact shape and source date, the requirement to run production readiness before any publish attempt, and the rule that existing public data directories must not be mutated to repair missing artifacts. A focused README test guards the universe-source policy and local lamp overlay deployment contract. This is documentation and test coverage only; it does not alter inputs, public data, exports, scoring, deployment, or locked weights.

2026-08-20 - P76 source freshness in production readiness:
Production readiness should surface the same manifest-only source freshness policy as `run.py check --freshness-only`, because release review needs to see stale and unknown-age sources without running any fetch, ingest, network build, scoring, export, or upstream probe. The readiness report now includes a non-blocking `source_freshness` block and unresolved warning when local `raw/manifest.json` and `pipeline/config/sources.yaml` show stale, unknown-policy, or unknown-age sources. Missing local freshness inputs remain non-blocking for fresh clones, because the signal is release context rather than data-corruption proof. Current Prawn-E14 status is 12 current, 6 stale, 2 manual, and 1 unknown-age source. This is operational reporting only; it reads but does not modify inputs, public data, exports, scoring, deployment, or locked weights.

2026-08-20 - P77 exposed-gap total disclosure:
The route evidence panel should summarize the total open-air burden, not only name the longest individual exposed gap. The browser now shows total exposed metres, recorded exposed-gap count, and whether the visible list is complete or only the longest three gaps. This keeps the covered-walkway/exposure-gaps artifact as the headline while avoiding a long uncontrolled list in the score card. This is browser presentation only; it does not alter inputs, public data, exports, scoring, deployment, or locked weights.

2026-08-20 - P78 score-coverage wording:
The title-card score-coverage line should explain missing full scores in user-facing route-evidence language rather than internal score-state shorthand. It now says `full route scores`, `with partial route evidence`, `beyond current transit range`, and `awaiting scoring`, preserving the same manifest-derived counts. This is browser copy only; it does not alter manifests, inputs, public data, exports, scoring, deployment, or locked weights.

2026-08-20 - P79 transit-target availability labels:
The MRT/LRT and bus target tabs should tell users whether that target already has route evidence before they switch modes. The transit target control now labels each option as `selected route`, `route evidence`, or `no route evidence` based on the existing record and route-option paths. This is browser presentation only; it does not alter routing, inputs, public data, exports, scoring, deployment, or locked weights.

2026-08-20 - P80 night-lighting zoom disclosure:
The night-lighting layer note should tell users that lamp points load only after the overlay is enabled and the map is zoomed into a neighbourhood. The browser note now says to switch on and zoom in before expecting points, while preserving the source count, source date, and locked-score separation. This is browser copy only; it does not alter the lamp artifact, inputs, public data, exports, scoring, deployment, or locked weights.

2026-08-20 - P81 snap-connector wording:
Route details should explain endpoint connector distance in user-facing graph language, not vague map language. The browser now labels the value `Snap connector` and explains that it is the short link from the postal or transit point onto the walking graph. This is browser presentation only; it does not alter route geometry, inputs, public data, exports, scoring, deployment, or locked weights.

2026-08-20 - P82 alternate-stop distance delta:
The nearby-transit picker should make alternate-stop tradeoffs concrete when a user selects a non-best stop. Its comparison note now keeps the straight-line caveat and adds the metre delta, for example `42% farther than best (+42 m straight-line)`. This is browser presentation only; it does not alter candidate ranking, routing, inputs, public data, exports, scoring, deployment, or locked weights.

2026-08-20 - P83 planning-area rank disclosure:
The rank panel should say that its comparison set is the selected postal's planning area, because `fetchRankRecordsForPostalArea()` loads the area shard and split shard parts rather than a national ranking. The visible helper, loading text, empty state, and screen-reader rank status now say `planning-area`. This is browser presentation only; it does not alter ranking order, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P84 preview bundle-score disclosure:
Clicked-stop previews should identify the score limitation as a bundle status, not just say `Not scored`. The preview summary now shows `Bundle score: Preview only`, matching the existing note that a clicked-stop OneMap preview is not an authoritative SHIOK score until the offline scoring pipeline includes it. This is browser presentation only; it does not alter live-route scoring logic, published scores, inputs, exports, public data, deployment, or locked weights.

2026-08-20 - P85 locked-score badge label:
The header score badge should identify its number as the locked score instead of displaying a bare 0-to-100 value. The badge now includes a small `Locked score` label while keeping the number visually smaller than the shelter evidence headline. This is browser presentation only; it does not alter scores, ranking, inputs, exports, public data, deployment, or locked weights.

2026-08-20 - P86 search postal hint:
The search input should tell users that direct postal lookup expects a six-digit postal code. The visible placeholder and accessible label now say `Search address or 6-digit postal` while leaving OneMap address search and direct postal behavior unchanged. This is browser copy only; it does not alter search behavior, inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P87 search no-results guidance:
Address search should not fail silently when OneMap returns zero results. After a submitted address search with no results, the UI now shows a non-alerting guidance message suggesting a six-digit postal code and noting that newer completions may still be outside the frozen score bundle. This is browser behavior/copy only; it does not alter OneMap query behavior, inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P88 sheltered route label:
The selected higher-shelter route should not be labeled simply `Covered`, because a route can still be partly exposed. User-facing route labels now say `Sheltered`, `Sheltered route`, and `Sheltered walk`, while the measured coverage percentage remains the source of truth. This is browser copy only; it does not alter route selection behavior, geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P89 bundle score availability wording:
The manifest-derived score-coverage disclosure should read as availability context for the frozen bundle, not as the product headline. It now starts `Bundle score availability` while preserving the same manifest-derived counts and missing-score breakdown. This is browser copy only; it does not alter manifest parsing, counts, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P90 night-lighting score separation:
The night-lighting overlay status should repeat that lamp points are map evidence outside the locked score, not only the title-card layer note. Every non-off night-lighting status now ends with `Map evidence only; not part of the locked score.` This is browser copy only; it does not alter lamp overlay loading, tiles, inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-20 - P91 route-display announcement:
The score-card live region should announce the default route display with the user-facing route concept, not the internal `shiokest` mode token. It now announces `Route display sheltered` for the selected higher-shelter route while keeping `shortest` and `both routes` distinct. This is browser accessibility copy only; it does not alter route selection, geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P92 map summary sheltered-route wording:
The map's non-visual route summaries should use the same `sheltered route` language as the score card and route controls. Screen-reader map labels and summaries now say `sheltered route`, `shortest and sheltered routes`, and `sheltered-route segments` instead of `covered route` / `covered-route segments`. This is browser accessibility copy only; it does not alter map layers, route IDs, geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P93 score reason sheltered-route wording:
The score-card reason chips should not describe the selected higher-shelter route as a `covered route`, because the measured route can still contain exposed gaps. The sheltered-percentage reason now says `sheltered on sheltered route`, matching the route controls, live region, and map summaries. This is browser copy only; it does not alter score reasons selection, scores, geometry, exports, public data, deployment, or locked weights.

2026-08-20 - P94 bundle-score reason copy:
The score-card reason chips should describe unavailable scores in product terms, not implementation terms. Awaiting-score records now say `Awaiting offline bundle scoring`; unavailable route/score records say `Bundle score unavailable`; and partial breakdown records say `Bundle score incomplete`. This is browser copy only; it does not alter score-state classification, scoring, route evidence, exports, public data, deployment, or locked weights.

2026-08-20 - P95 offline-bundle state notes:
Score-state notes should use the same bundle-scoring language as the reason chips. Clicked-stop previews now say they are not authoritative until an offline bundle includes them, and `NOT_YET_SCORED` records say they are awaiting offline bundle scoring instead of needing pipeline scoring evidence. This is browser copy only; it does not alter score-state classification, preview routing, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P96 live-preview provenance copy:
Client-side clicked-stop preview records should carry the same offline-bundle language as the browser notes. Their provenance reason now says `SHIOK scores come from offline bundle scoring` instead of `offline pipeline bundle`. This is preview-record copy only; it does not alter live route segmentation, score-state classification, authoritative bundle data, exports, public data, deployment, or locked weights.

2026-08-20 - P97 sheltered-language follow-through:
Tracked support files should not keep the old `covered route` framing after the browser moved to `sheltered route`. Browser smoke checks now expect `Sheltered` / `Sheltered route`, attribution describes bridge/underpass geometry as sheltered-route connectors, the section 10 proposal uses `Sheltered walk`, and the heat-presentation analysis refers to covered-walkway shelter rather than a covered route. This is docs/test/proposal copy only; it does not alter route IDs, map layers, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P98 locked-score breakdown copy:
The score-card breakdown should be framed as route evidence plus the locked score, not as a generic score/composite breakdown. The aria label now says `Route evidence and locked score breakdown`, partial records say `Partial bundle score`, missing totals say `No locked score`, and the bus fallback caveat says `Locked score caveat`. This is browser/proposal copy only; it does not alter score-state classification, displayed values, ranking, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P99 locked-score sort copy:
The locked-score row should not describe the release sorting value as a `locked composite` in user-facing copy. It now says `Use this locked score to sort the current bundle`, and the section 10 proposal says `locked score` instead of `locked composite score` / `Locked composite`. This is browser/proposal copy only; it does not alter displayed values, ranking behavior, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P100 measured universe caveat:
The title-card address-universe caveat should state that measured recent-source misses exist, because the browser already shows the P19 8-of-976 HDB completion and MCST proxy miss count on the next line. This keeps the frozen v1 disclosure empirical instead of speculative. This is browser copy only; it does not alter search behavior, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P101 measured no-results copy:
Submitted address searches with no OneMap result should use the same measured frozen-universe limitation as the title card. The no-results status now says the frozen score bundle has measured recent-source misses while still advising users to try a 6-digit postal code. This is browser copy only; it does not alter OneMap query behavior, search routing, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P102 frozen-v1 awaiting-score copy:
The not-yet-scored postal state should use the same frozen v1 address-universe framing as the title card and outside-bundle state. It now says the postal is in the frozen v1 address universe but the current offline bundle has not scored it yet, with compact labels No full score in this bundle and Awaiting bundle score. This is browser copy only; it does not alter state classification, search behavior, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P103 published-bundle preview authority copy:
Live clicked-stop preview copy should describe authoritative SHIOK scores as coming from the published score bundle rather than from offline bundle scoring. The rendered preview note now says a clicked-stop route is not authoritative until it is included in a published score bundle, while the live preview provenance reason says authoritative scores come from the published score bundle. This is browser/provenance-copy only; it does not alter live preview route calculations, score values, state classification, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P104 published-bundle awaiting-score copy:
The not-yet-scored postal note should use the same published-bundle authority framing as clicked-stop previews. It now says the postal is in the frozen v1 address universe but the current published bundle has not scored it yet, replacing the remaining live current offline bundle phrase. This is browser copy only; it does not alter state classification, search behavior, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P105 no-transit range copy:
No-transit reason chips should describe the current product limitation directly instead of using vague threshold language. Candidate-selection failures now say Outside current transit-candidate limits, and no-walk cases say nearby transit may still exist beyond the 1.2 km scoring range. This is browser copy only; it does not alter transit candidate selection, routing, state classification, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P106 live announcement no-full-score copy:
The score-card live region should use the same null-score language as the visible score-state copy. It now announces null locked scores as `no full score in this bundle` instead of `not scored`. This is accessibility/browser copy only; it does not alter state classification, score values, ranking, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P107 no-transit route-evidence copy:
The graph-disconnected no-transit note should describe missing bundle route evidence, not the internal walking graph. It now says transit candidates exist but this bundle has no connected walking route evidence yet. This is browser copy only; it does not alter routing, graph construction, transit candidate selection, state classification, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P108 snap connector route-evidence copy:
The snap connector route-detail note should use route-evidence language rather than saying the connector links onto the walking graph. It now says the short link connects the postal or transit point onto mapped walking-route evidence. This is browser copy only; it does not alter connector computation, route geometry, state classification, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P109 not-yet-scored heading copy:
The not-yet-scored detail heading should use the same published-bundle state language as the reason chips and live region. It now says No full score in this bundle instead of Location Evidence Missing. This is browser copy only; it does not alter state classification, route evidence, score values, ranking, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P110 locked-score no-full-score value:
The locked-score row should use bundle-level null language instead of the generic Not scored value. Null locked scores now render as No full score, while null subscore rows still render as Not scored to avoid inventing component evidence. This is browser copy only; it does not alter state classification, score values, ranking, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P111 no-transit stop range copy:
The no-transit candidate-selection state should name the user-visible transit stop or exit and the 1.2 km scoring range instead of exposing `candidate` limits. It now says no transit stop is within scoring range and that no qualifying MRT/LRT exit or bus stop was found within 1.2 km, while the graph-disconnected state remains separate as missing connected walking-route evidence. This is browser copy only; it does not alter transit candidate selection, routing, state classification, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P112 direct-bus option copy:
The direct-bus fallback note should describe fallback evidence as user-facing bus options, not scoring candidates. It now says direct bus options were found while preserving the route-not-verified caveat and the locked-score bus-term caveat. This is browser copy only; it does not alter direct-bus fallback detection, bus scoring, routing, score values, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P113 bus fallback route-access copy:
The direct-bus fallback warning should keep its conservative meaning without exposing walking-network implementation language. It now says nearby bus service is not route-verified and that walking-route access was not verified, preserving the 0 bus subscore and locked-score caveats. This is browser copy only; it does not alter fallback detection, routing, bus scoring, score values, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P114 transit-stop-found copy:
The graph-disconnected no-transit reason chip should say a transit stop or exit was found, not a transit candidate. This keeps the user-facing fact separate from the unresolved walking-route connection. This is browser copy only; it does not alter transit candidate selection, routing, state classification, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P115 transit-stops-exist copy:
The graph-disconnected no-transit note should keep the same stop/exit language as its reason chip. It now says transit stops or exits exist but the bundle has no connected walking-route evidence yet, instead of saying transit candidates exist. This is browser copy only; it does not alter transit candidate selection, routing, state classification, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P116 bundle generated date:
The title card should distinguish source data age from static bundle build age. It now shows both route evidence `data_as_of` and manifest `generated_at`, so users can see when the evidence was current and when this published bundle was produced. This is browser copy/formatting only; it reads existing manifest metadata and does not alter data fetching, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P117 source freshness counts:
The title-card source freshness disclosure should give the measured freshness audit counts, not only a qualitative current/stale summary. It now reports 12 current, 6 stale, 2 manual, and 1 unknown-age source, while naming the stale source classes. This is browser copy only; it does not alter freshness classification, data fetching, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P118 unknown-age source copy:
The source freshness line should clarify that the single unknown-age source is a candidate address source, not one of the core shelter, bus, night-lighting, or route-evidence sources. This keeps the freshness caveat accurate without overstating uncertainty in the current published evidence. This is browser copy only; it does not alter freshness classification, data fetching, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P119 stale source names:
The source freshness disclosure should name the exact stale sources instead of grouping them as generic greenery or boundary references. It now lists traffic signals, planning area boundary, NParks nature ways, tracks, heritage trees, and heritage road green buffers. This is browser copy only; it does not alter freshness classification, data fetching, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P120 component-score copy:
The score card should use user-facing `component score` language instead of `sub-score` in rendered partial-score, bus-fallback, and rank-panel copy. This keeps the locked-score explanation understandable without exposing implementation vocabulary. This is browser copy only; it does not alter score values, ranking behavior, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P121 greenery-proxy route detail:
The route-detail strip should call the NParks-derived helper value `Greenery proxy`, not `Shade proxy`, because the source is sparse greenery evidence rather than direct measured shade on the route. This keeps the detail strip aligned with the title-card and score-card copy while avoiding a stronger shelter claim than the data supports. This is browser copy only; it does not alter score values, route geometry, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P122 data-freshness title copy:
The title-card freshness disclosure should read as product-facing data freshness, not as an internal `Source freshness audit`, while preserving the measured 12 current, 6 stale, 2 manual, and 1 unknown-age source counts and naming all stale sources. This is browser copy only; it does not alter freshness classification, data fetching, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P123 preview shelter-evidence label:
Clicked-stop preview metrics should say `Shelter evidence` instead of `Sheltered evidence`, matching the route-evidence framing and avoiding an awkward adjective for a measured evidence value. This is browser copy only; it does not alter preview routing, route segmentation, score values, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P124 preview bundle-inclusion copy:
Clicked-stop preview copy should explain the concrete limitation: a selected stop may have route evidence, but it is not part of the published score bundle yet. The rendered note and preview provenance reason now use published-bundle language instead of `authoritative SHIOK score` phrasing. This is browser/provenance-copy only; it does not alter live preview routing, route segmentation, score values, exports, inputs, public data, deployment, or locked weights.

2026-08-20 - P125 OSM postcode coverage measurement:
Live Overpass measurement found 25,879 valid six-digit Singapore `addr:postcode` values in OSM, of which 25,873 overlap the frozen 124,443-postal v1 universe. That is 20.791045% coverage of v1, leaving 98,570 v1 postals absent from OSM address tags. OSM remains valuable as the geometry source it already is, but this measurement supports not using OSM `addr:postcode` as the primary Singapore address registry for postal-universe v2. This is evidence only; it does not alter inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P126 readiness citation for refreshed OSM measurement:
Production-readiness policy copy should cite the fresh P125 live Overpass measurement rather than the older P63 measurement when explaining why OSM `addr:postcode` is not a complete postal registry. The measured count and policy are unchanged: 25,873 frozen v1 postals overlap live OSM, so postal-universe v2 remains candidate-source-first with bounded OneMap Search validation. This is reporting copy and test coverage only; it does not alter inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P127 batch-plan OSM coverage fields:
The dry-run batch planner should expose the measured OSM `addr:postcode` coverage as structured source-policy fields, not only as a prose insufficiency verdict. It now reports the P125 measurement label, 25,879 valid distinct OSM postcodes, 25,873 overlapping frozen v1 postals, 124,443 frozen v1 postals, 20.791045% coverage, and the `not sufficient as primary registry` verdict. This is dry-run reporting only; it does not alter inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P128 readiness OSM coverage fields:
Production readiness should expose the measured OSM `addr:postcode` coverage as structured source-policy fields, not only as prose inside the postal-universe caveat. Readiness now reuses the batch planner's P125 measurement block: 25,879 valid distinct OSM postcodes, 25,873 overlapping frozen v1 postals, 124,443 frozen v1 postals, 20.791045% coverage, and the `not sufficient as primary registry` verdict. This is release-reporting only; it does not alter inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P129 exposure hero total gaps:
The route evidence hero should carry both headline shelter facts: the covered-walkway ratio and the exposure-gap burden. It now states total exposed metres and the recorded exposed-gap count before naming the longest exposed gap, while the detailed gap list remains below with coordinates. This is browser presentation only; it does not alter route geometry, exposure-gap data, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P130 shelter source labels:
The route source strip should use product-facing shelter-evidence labels rather than internal source-class wording. It now labels `lta_covered_linkway` as `LTA covered linkway`, `osm_covered` as `OSM shelter tags`, `inferred_hdb_void_deck` as `HDB void-deck inference`, and generic covered segments as `Mapped shelter`; the strip's accessible name is `Shelter source evidence`. This is browser copy and test coverage only; it does not alter route classification, map styling, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P131 shelter-map title:
The app's first brand signal should describe the user-facing artifact rather than the secondary score. The visible H1 and document metadata title now say `S.H.I.O.K. Shelter Map` instead of `S.H.I.O.K. Index`, while the subtitle remains `Shelter-first walks to transit` and the locked SHIOK score remains visible as a secondary route-evidence field. This is browser naming only; it does not alter scoring, ranking, route geometry, exports, public data, deployment, or locked weights.

2026-08-20 - P132 empty-state shelter map prompt:
The first route-evidence panel a user sees should name the actual artifacts the shelter map provides before any search. The no-selection status now says `No shelter map route selected`, and the empty prompt asks users to search a Singapore postal code to inspect sheltered walk evidence, exposed gaps, and night lighting near transit. This is browser copy only; it does not alter search behavior, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P133 shelter-map footer:
The page footer should match the shelter-map framing established by the app title and first-use prompt. It now says `Source-derived shelter map evidence` instead of generic route-evidence wording, while preserving the source-derived evidence caveat. This is browser copy only; it does not alter search behavior, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P134 README shelter-map title:
The repository README should use the same shelter-map framing as the browser title. Its heading now says `S.H.I.O.K. Shelter Map` instead of `S.H.I.O.K. Index`, while the existing intro continues to state that the app leads with covered-walkway ratio and exposed gaps and keeps the locked SHIOK score secondary. This is documentation and test coverage only; it does not alter browser behavior, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P135 README shelter-map status:
The README status line should describe the current live artifact in the same terms as the product title. It now says the project is a `live static shelter-map pilot over a 124,443-record source-derived universe` instead of the generic `static-first pilot` wording. This is documentation and test coverage only; it does not alter browser behavior, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P136 empty map summary shelter copy:
The non-visual map summary should use the same shelter-map framing as the visible empty route panel. Before a postal is selected it now tells users to search for a postal code to show shelter map evidence, exposed gaps, and nearby transit, instead of generic route evidence. This is browser accessibility copy only; it does not alter map rendering, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P137 map aria shelter label:
The map container's accessible label should call the product surface a shelter map, matching the H1, footer, empty prompt, and non-visual summary. It now announces an empty map as a Singapore shelter map and selected routes as a shelter map for the chosen route labels, while preserving MRT/LRT and bus-stop context. This is browser accessibility copy only; it does not alter map rendering, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P138 live-region shelter map panel:
The screen-reader live region for a loaded postal should announce the selected detail surface as the shelter map panel, not a generic route-evidence panel. It now says the shelter map panel loaded while preserving transit target, locked score, selected stop, route display, and active-route details. This is browser accessibility copy only; it does not alter score-card state, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P139 shelter-map panel region:
The score-card region's accessible name should match the shelter-map product frame in every render state. Empty, outside-bundle, and loaded selections now expose `aria-label="Shelter map panel"` instead of `Route evidence panel`, and the browser-smoke selector follows that label. This is browser accessibility naming and test-selector maintenance only; it does not alter score-card state, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P140 missing-address shelter-map bundle:
Missing-address user states should describe the frozen/current artifact as a shelter-map bundle, not a score bundle, because the user is searching the shelter map first and the locked score is secondary. The no-results search hint and outside-bundle live-region announcement now say shelter-map bundle, while score-bundle language remains where copy specifically discusses preview score inclusion. This is browser copy and test coverage only; it does not alter search behavior, score lookup, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P141 outside shelter-map bundle copy:
The visible outside-bundle detail panel should use the same shelter-map bundle language as the no-results hint and live-region announcement. It now says `Outside shelter-map bundle` and explains that no shelter map route is published for the postal in the frozen June 2020 address universe. This is browser copy and test coverage only; it does not alter search behavior, score lookup, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P142 heat proxy temperature caveat:
The first-viewport heat caveat should explicitly say what the app does not know. It now says `Heat proxy: shelter plus sparse NParks greenery, not measured temperature`, preserving the source inputs while making clear that the value is not observed thermal comfort. This is browser copy and test coverage only; it does not alter heat proxy computation, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P143 shelter-map data-age label:
The first-viewport data-age line should describe the product evidence as shelter-map evidence, not generic route evidence. It now says `Shelter map evidence as of ...; bundle generated ...`, preserving the distinction between source evidence age and static bundle generation date. This is browser copy and test coverage only; it does not alter manifest parsing, source freshness, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P144 shelter-map breakdown label:
The secondary breakdown and reason group should use the shelter-map evidence frame while keeping the locked score visibly secondary. The region now says `Shelter map evidence and locked score`, with matching accessible labels for the breakdown and reason chips. This is browser copy/accessibility naming and test coverage only; it does not alter score rows, ranking, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P145 planning-area comparison label:
The planning-area rank panel should read as a local comparison aid rather than a primary ranking surface. Its accessible name is now `Planning-area comparison` and its heading is `Compare nearby records`, while the select control still says `Rank records by` because that control changes the rank metric. This is browser copy/accessibility naming and test coverage only; it does not alter ranking data fetches, rank metrics, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P146 shelter-map reason chips:
Generic reason chips inside the shelter-map evidence reason group should use the same shelter-map evidence wording as the group label. Preview, unavailable, and available chips now say `Shelter map evidence ...`, while state-specific walking-route and score-bundle caveats stay precise. This is browser copy and test coverage only; it does not alter score-state classification, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P147 preview shelter-map evidence copy:
Clicked-stop preview copy should use shelter-map evidence language while preserving the published-score-bundle caveat. The preview badge and note now say shelter map evidence, not route evidence, and still warn that the clicked-stop preview is not part of the published score bundle. This is browser copy and test coverage only; it does not alter clicked-stop routing, preview scoring, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P148 transit-target shelter-map route labels:
Transit-target tabs should describe whether a shelter-map route exists for each mode, not whether generic route evidence exists. MRT/LRT and bus availability labels now say `shelter map route` or `no shelter map route`, while the best-transit tab still says `selected route`. This is browser copy and test coverage only; it does not alter transit-mode selection, route options, route geometry, score values, scoring, exports, public data, deployment, or locked weights.
2026-08-20 - P149 preview live status shelter-map framing:
The clicked-stop preview branch now announces `Preview shelter map evidence selected.` in the score-card live region. This is a copy/accessibility-only change: no scoring logic, export, rescore, input, or locked weight file changed.

2026-08-20 - P150 preview legend shelter-map framing:
The clicked-stop preview map legend now labels the preview line as `Shelter map preview` instead of `Preview route`. This keeps the visible map legend aligned with the preview badge and live status while preserving the published-score-bundle caveat. This is browser copy and test coverage only; it does not alter clicked-stop routing, preview geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P151 selected-route map summary shelter-map framing:
The non-visual selected-route map summary now starts `Shelter map for ...` instead of `Route evidence for ...`, matching the map container label and empty-map summary. This is accessibility copy and test coverage only; it does not alter map rendering, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P152 graph-disconnected shelter-map route note:
Graph-disconnected no-transit notes now say `this shelter-map bundle has no connected walking route yet` instead of generic walking-route evidence language. This keeps the user-facing limitation attached to the current shelter-map bundle while preserving the distinction from no transit stop within scoring range. This is browser copy and test coverage only; it does not alter route connectivity, transit candidate selection, state classification, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P153 score-coverage shelter-map wording:
The manifest-derived bundle availability line now says `full scores` and `partial shelter-map evidence` instead of `full route scores` and `partial route evidence`. This keeps the score availability disclosure secondary while aligning the partial-record explanation with the shelter-map product frame. This is browser copy and test coverage only; it does not alter manifest counts, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P154 live preview provenance shelter-map wording:
Live clicked-stop preview records now store `Clicked transit POI has shelter map evidence only; published scores come from the score bundle.` as their provenance reason. This keeps generated preview records aligned with the shelter-map evidence frame while preserving that clicked-stop previews are not published score-bundle records. This is browser provenance copy and test coverage only; it does not alter live route segmentation, preview geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P155 snap connector shelter-map route wording:
The snap-connector helper now says the connector is the short link onto `the shelter-map route` instead of mapped walking-route evidence. This is browser copy and test coverage only; it does not alter endpoint connector distance, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P156 full-batch one-attempt planning scope:
The dry-run batch planner now emits `full_batch_release_scope` to record that the expensive full batch is approved in principle but not approved to run, is one attempt only, requires each change to pass the 1,200-record subset first, and must bundle the bus remodel, `NO_TRANSIT_IN_RANGE` partial-score fix, network conflation repair, and any approved postal-universe v2 promotion. This is planning/reporting only; it does not run geocoding, scoring, export, deployment, public data writes, input rebuilds, or locked weight changes.

2026-08-20 - P157 production-readiness full-batch scope:
Production readiness now preserves `full_batch_release_scope` from the dry-run batch planner in its summarized `batch_plan` section, so release review carries the same one-attempt full-batch boundary and explicit owner-approval requirement. This is readiness reporting and test coverage only; it does not run geocoding, scoring, export, deployment, public data writes, input rebuilds, or locked weight changes.

2026-08-20 - P158 README full-batch approval boundary:
The README now carries the same full-batch boundary that `pipeline.batch_plan` and production readiness report: before any full geocode, scoring, or release batch, run `python scripts/production_readiness.py` and `python run.py batch-plan`; the next full-batch release is approved in principle but not approved to run; it is one attempt only; explicit owner approval is required before execution; and the batch must bundle the bus remodel, `NO_TRANSIT_IN_RANGE` partial-score fix, network conflation repair, and any approved postal-universe v2 promotion after each change passes on the 1,200-record subset. This is documentation and test coverage only; it does not run geocoding, scoring, export, deployment, public data writes, input rebuilds, or locked weight changes.

2026-08-20 - P159 night-lighting route-detail cue:
The selected shelter-map panel now includes `Night lighting` as a subtle route-detail item with value `Map layer`, and states that LTA lamp-post points are map evidence outside the locked score. This keeps the objective's second evidence layer visible in the route workflow without turning lighting into a score component. This is browser copy and test coverage only; it does not alter lamp data, map tiles, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P160 exposed-gap coordinate summary:
The selected shelter-map panel now labels the gap list as `Exposed gaps on this walk` and summarizes how many recorded gaps include map coordinates before listing each gap's length and coordinate. This makes the coordinate-backed exposure-gap artifact explicit in the main workflow. This is browser copy and test coverage only; it does not alter route geometry, exposure-gap data, scoring, exports, public data, deployment, or locked weights.

2026-08-20 - P161 locked-score reason chips:
Reason chips for missing or incomplete score states now say `Locked score unavailable` and `Locked score incomplete` instead of generic bundle-score wording. This keeps the secondary score label consistent with the rest of the shelter-map panel while preserving bundle-state copy where the UI is specifically discussing published-bundle inclusion. This is browser copy and test coverage only; it does not alter scoring state, score values, exports, public data, deployment, or locked weights.

2026-08-21 - P162 direct-bus fallback shelter-map wording:
Direct-bus fallback copy now says the `Shelter-map route` was not verified instead of generic walking-route access. This keeps the fallback caveat aligned with the shelter-map product frame while preserving the settled P7/P10 meaning: direct bus service evidence can exist, but the bus component remains 0 until a trusted shelter-map route to the DataMall stop is proven. This is browser copy and test coverage only; it does not alter fallback detection, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P163 night-lighting layer state in route details:
The selected shelter-map panel's night-lighting route detail now reflects whether the LTA lamp-post map layer is on or off instead of always saying `Map layer`. This makes the second evidence layer state visible in the main route workflow while keeping lamp points outside the locked score. This is browser UI copy/state wiring and test coverage only; it does not alter lamp data, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P164 outside-bundle universe caveat:
Outside-bundle copy now says no shelter-map route is published for the searched postal and separately states that the current bundle is tied to the frozen June 2020 address universe. This avoids implying that an arbitrary OneMap search result is inside the frozen v1 universe when the bundle has no record for it. This is browser copy and test coverage only; it does not alter search behavior, bundle membership, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P165 no-results search caveat:
The no-results search feedback now separates a OneMap lookup failure from the frozen shelter-map bundle's measured recent-source misses. It says no OneMap address result was found for the search, suggests trying a 6-digit postal code, and then separately reminds users that the frozen bundle has measured recent-source misses. This is browser copy and test coverage only; it does not alter search behavior, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P166 short-query search guidance:
The short-query validation error now distinguishes OneMap address search from direct postal lookup: users should enter at least 3 characters for OneMap search, or use a 6-digit postal code. This keeps search guidance aligned with the app's two lookup paths. This is browser copy and test coverage only; it does not alter search behavior, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P167 no-results live-region parity:
The hidden search-results live region should announce the same no-result state as the visible search feedback after a search attempt. It now names the OneMap address lookup failure and the 6-digit postal fallback instead of returning an empty status while a separate visible status box carries the message. This is browser accessibility copy and test coverage only; it does not alter search behavior, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P168 locked-score sort copy:
The selected shelter-map panel should not tell users to start with the locked score. The locked-score row now says to start with the shelter trace and exposed gaps, using the locked score only as the current-bundle sorting index; the planning-area comparison copy also states that shelter evidence remains the primary view. This is browser copy and test coverage only; it does not alter ranking data, sort logic, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P169 walk-display accessibility label:
The selected-route display control and score-card live region should describe the user action as choosing the walk display, not a generic route display. The visible buttons remain Sheltered/Both/Shortest, while the non-visual group label and live status now say `Walk display`. This is browser accessibility copy and test coverage only; it does not alter route selection, map rendering, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P170 published-walk reset copy:
The selected-stop reset control should send users back to the published walk, not to a `Scored route`. The custom-stop reset button now says `Published walk`, and the score-card live region says `Published walk selected` for the default published route state. This is browser copy/accessibility and test coverage only; it does not alter stop selection behavior, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P171 walk-details accessibility label:
The subtle selected-walk detail strip should be named as walk details, not generic route details. Its visible contents remain greenery proxy, night lighting, snap connector, and their notes; only the accessible region label changes to `Walk details`. This is browser accessibility copy and test coverage only; it does not alter map rendering, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P172 walk-feedback note copy:
The traced correction editor should invite a walk note, not a route note. The textarea placeholder now says `Optional walk note`, keeping the user-submitted correction tied to the walked shelter evidence. This is browser copy and test coverage only; it does not alter feedback payload structure, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P173 walk-feedback action copy:
The traced correction actions should describe walk feedback, not generic route feedback. The overflow menu now says `Suggest better walk` and `Copy walk QA JSON`, while the exported payload shape and QA JSON behavior are unchanged. This is browser copy and test coverage only; it does not alter feedback payload structure, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P174 empty shelter-map walk status:
The empty score-card live region should say no shelter-map walk is selected, not no route is selected. This keeps the pre-search screen-reader status aligned with the shelter-first walk workflow. This is browser accessibility copy and test coverage only; it does not alter search behavior, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P175 selected-walk live fallback:
The score-card live region should fall back to `walk active` when no selected-walk label is available, not `route active`. This preserves the shelter-map walk framing even in defensive helper calls that do not pass a selected route label. This is browser accessibility copy and test coverage only; it does not alter route selection, map rendering, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P176 selected-walk panel wording:
The selected shelter-map panel should describe its active evidence as a selected walk, not a generic selected route. The exposure hero aria label now says `Walk shelter evidence`, the no-gap fallback says `selected walk`, the access row note says `Selected walk distance`, and the Best transit tab says `selected walk`. This is browser copy and accessibility test coverage only; it does not alter transit selection, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P177 walk comparison copy:
The alternate-path comparison in the selected shelter-map panel should speak as a walk comparison, not a route comparison. The rendered comparison note now uses `Walk comparison`, `Shortest walk`, and `Sheltered walk`, and the same-route note says `Shortest same as sheltered walk.` This is browser copy and accessibility test coverage only; it does not alter route-mode logic, geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P178 bus fallback walk verification copy:
Direct-bus fallback and bus-caveat copy should describe the missing proof as unverified shelter-map walk access, not generic route verification. Reason chips now say `Nearby bus service not walk-verified`, shelter reasons say `sheltered on selected walk`, and the bus caveat/note says bus evidence was not connected to a verified shelter-map walk. This is browser copy and test coverage only; it does not alter bus fallback detection, transit selection, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P179 same-walk display announcement:
The walk-display live-region helper should announce the same shortest/sheltered geometry as `shortest same as sheltered walk`, not `shortest same as sheltered route`. This keeps same-path screen-reader copy aligned with the selected-walk framing while leaving route-mode logic and geometry unchanged. This is browser accessibility copy and test coverage only; it does not alter route selection, map rendering, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P180 README freshness-only command:
The README should tell operators how to run the manifest-only source freshness gate without fetching or mutating inputs. It now documents `uv run python run.py check --freshness-only`, because bare system `python run.py check --freshness-only` can fail before reaching freshness logic when the system interpreter lacks project dependencies. This is documentation and test coverage only; it reads but does not modify `raw/`, does not probe upstream APIs, and does not alter inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P181 score-source hash policy in readiness:
Production readiness should expose the score-source hash policy by key name, not only by count. The active policy has 13 score-affecting source keys and excludes `leaf_area_index`; readiness now reports expected, present, missing, unexpected, and non-score reference source hashes so a future bundle that leaks reference-only inputs into score provenance is visible without blocking verified legacy artifacts. This is readiness reporting and test coverage only; it does not alter source manifests, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P195 locked-score availability wording:
The manifest-derived score availability disclosure should use the same `Locked score` label as the rest of the shelter-first browser copy. It now starts `Locked score availability` instead of `Bundle score availability` while preserving the same manifest-derived counts and missing-score breakdown. This is browser copy and test coverage only; it does not alter manifest parsing, counts, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P196 preview locked-score metric label:
Clicked-stop shelter-map previews should use the same `Locked score` label as other score-facing browser copy. The preview metric now says `Locked score: Preview only` instead of `Bundle score: Preview only`, while the nearby note still explains that clicked-stop previews are not part of the published score bundle yet. This is browser copy and test coverage only; it does not alter preview routing, score values, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P197 partial and awaiting locked-score labels:
Partial and not-yet-scored browser states should name the secondary score as the locked score rather than as a bundle score. Partial records now say `Partial locked score`, and not-yet-scored records say `Awaiting locked score` while still keeping the `No full score in this bundle` context. This is browser copy and smoke-test alignment only; it does not alter score-state classification, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P198 locked-score availability helper naming:
The browser helper that formats the manifest-derived full-score disclosure should be named for the product concept it renders: locked-score availability, not generic score coverage. The helper module and test now use `locked-score-availability` and `formatLockedScoreAvailabilityLine`, while preserving the rendered copy and manifest-derived count logic. This is web code/test naming only; it does not alter browser output, manifest parsing, counts, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P203 OneMap candidate validation controls:
The postal-universe v2 source policy should name the current OneMap operational controls, not just say `rate controls`. Current OneMap documentation inspected in P203 says Search is a keyword endpoint, token-backed API access requires tokens refreshed every 72 hours, token-authenticated users have a higher API call limit capped at 250, and higher limits require SLA case-by-case discussion. Therefore v2 remains candidate-source-first: current free datasets propose candidate rows, then bounded OneMap Search validates/geocodes those candidates under explicit token, refresh, and limit controls. This is reporting/documentation/test coverage only; it does not call OneMap, build a scraper, mutate inputs, score, export, deploy, or alter locked weights.

2026-08-21 - P206 rebuildable network debug is not a readiness blocker:
Production readiness and the dry-run batch plan should judge island network QA from the durable `conflation_qa_island.json` metrics, not from the presence of the rebuildable compact `island_debug.geojson` diagnostic artifact. The debug GeoJSON remains required by stricter execution-time checks such as network preflight/full-batch execution, but a missing debug file alone should not make the release report say island network QA failed when the QA JSON has zero real disconnections, no flags, valid residual classifications, and loaded production source metrics. This is readiness/planning policy and test coverage only; it does not rebuild debug artifacts, run network/scoring/export, mutate inputs, public data, or locked weights.

2026-08-21 - P207 production-readiness progress:
The production-readiness CLI should emit stage markers to stderr while preserving JSON on stdout, because the real report can spend minutes inside bundle validation/audit work. The markers identify the active stage before each major read-only check and do not change the report schema or operator gating logic. This is CLI observability and test coverage only; it does not alter readiness criteria, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P208 static-artifact validation progress:
Static artifact validation should expose its own sub-stages because it scans and validates the 4,848 JSON artifacts in the active bundle before the rest of production readiness can proceed. `validate_static_artifacts` now accepts an optional progress callback and production readiness prefixes those events on stderr, showing the recursive scan count, file-size check, score-shard validation, geometry-shard validation, and transit-artifact validation without changing validation semantics or JSON report output. This is operator observability and test coverage only; it does not alter artifacts, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P209 static-artifact shard progress:
The production-readiness static-artifact stage should show bounded movement while validating large score and geometry shard sets. The active bundle has 304 score shards, so `validate_static_artifacts` now reports total shard counts and emits progress every 25 score shards and every 250 geometry shards, plus final counts. This is operator observability and test coverage only; it does not alter validation semantics, artifacts, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P210 local Vercel link readiness policy:
A missing local `.vercel/project.json` link is checkout/deploy context, not a bundle defect. Production readiness should warn that the local Vercel project is not linked, while keeping deploy/repoint guarded by explicit owner approval; it should still block when a local Vercel project is linked and its configured root directory is not `web`, because that is contradictory deploy configuration. This is readiness reporting and test coverage only; it does not link Vercel, deploy, repoint, score, export, mutate public data, or alter locked weights.

2026-08-21 - P211 first-view covered-walkway artifact copy:
The first view should name the product's unique evidence directly instead of only saying `Shelter-first walks to transit`. The title-card subtitle now says users can see covered-walkway ratio and exposed gaps to transit, and the empty shelter-map panel tells users to search a postal code to inspect the covered-walkway ratio, exposed gaps, and night lighting. This is browser copy and test coverage only; it does not alter search behavior, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P212 loaded-card covered-walkway ratio wording:
The loaded shelter-map panel should use the same covered-walkway ratio wording as the first view. The selected-walk summary metric and preview metric now label the percentage as `Covered-walkway ratio`, and the route-reason chip reports the percentage as covered-walkway ratio rather than generic `sheltered` copy. This is browser copy and test coverage only; it does not alter route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P213 walk-comparison covered-walkway ratio wording:
The alternate-walk comparison should name the same measured field as the summary grid: covered-walkway ratio. The comparison sentence now says the alternate walk has a higher/lower covered-walkway ratio in percentage points, instead of saying it is more/less sheltered. This is browser copy and test coverage only; it does not alter route comparison logic, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P214 map empty-summary covered-walkway ratio wording:
The non-visual map empty summary should name the same headline evidence as the first view and loaded card. It now tells users to search for covered-walkway ratio, exposed gaps, night lighting, and nearby transit, instead of the generic shelter-map evidence phrase. This is browser accessibility copy and test coverage only; it does not alter map data, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P215 footer covered-walkway evidence wording:
The persistent footer should reinforce the headline artifact instead of reverting to generic shelter-map evidence wording. It now says the page is source-derived covered-walkway and exposure-gap evidence. This is browser copy and test coverage only; it does not alter route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P216 shelter-map walk wording:
Rendered product copy should use walk language for the user-facing transit path, reserving route language for internal geometry and compatibility names. Transit-target availability labels, the outside-bundle message, and the snap-connector helper now say `shelter-map walk` instead of `shelter map route`. This is browser copy and test coverage only; it does not alter route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P217 map legend sheltered-walk wording:
The inline map legend should match the user-facing walk display controls and selected-walk panel. The main sheltered-line legend now says `Sheltered walk` instead of `Sheltered route`, while direct-bus and preview labels keep their existing specialized wording. This is browser copy and test coverage only; it does not alter map geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P218 non-visual map sheltered-walk wording:
Non-visual map summaries should use the same walk language as the visible controls and panel copy. The map aria label and screen-reader text now announce `sheltered walk`, `shortest walk`, and `sheltered-walk segments` instead of route wording. This is browser accessibility copy and test coverage only; it does not alter map geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P219 disconnected transit shelter-map walk wording:
No-transit disconnected states should describe the missing artifact as a shelter-map walk, not a generic transit or walking route. The no-transit title and reason chip now say `Shelter-map walk not connected yet`, matching the existing explanatory note that transit stops or exits exist but the shelter-map bundle has no connected shelter-map walk yet. This is browser copy and test coverage only; it does not alter candidate selection, routing, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P220 both-walks live-region wording:
The walk-display live region should describe the Both mode as two walks, not routes. `routeDisplayAnnouncement("both")` now returns `both walks`, matching the Walk display control and the shelter-map walk framing. This is browser accessibility copy and test coverage only; it does not alter display mode behavior, map geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P221 Section 10 proposal walk wording:
The Section 10 presentation proposal is review copy, so it should use the same walk language as the product UI. The proposal now says selected walk distance, asks whether the walk works for the user, and labels the primary visual as a shelter-map walk instead of route wording. This is proposal copy and test coverage only; it does not alter app behavior, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P222 Section 10 proposal walk-trace wording:
The Section 10 proposal goal and current-state critique should frame the defended artifact as the shelter-map walk trace, not a generic routed trace or route exposure. The proposal now says shelter-map walk trace, walk distance, and walk exposure in its overview/current-state text. This is proposal copy and test coverage only; it does not alter app behavior, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P223 clicked-stop walk-preview loading wording:
Clicked-stop loading copy should keep the same walk-preview framing as the preview panel. The loading note now says the selected stop is shown as a straight-line preview until the walk preview returns, instead of saying until a route returns. This is browser copy and test coverage only; it does not alter live preview behavior, OneMap calls, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P224 beyond-range shelter-map walk wording:
When a postal has connected transit evidence beyond the 1.2 km scoring range, the UI should describe the found artifact as a connected shelter-map walk rather than generic routed transit. The no-transit title still distinguishes `Transit beyond scoring range`, while the explanatory note and reason chip now say the closest connected shelter-map walk is beyond range. This is browser copy and test coverage only; it does not alter `nearest_routed_m`, no-transit classification, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P225 no-connected-walk fallback title:
The generic no-transit fallback title now says `No connected [transit target] shelter-map walk within range` instead of `No routed [transit target] within range`. More specific states still take precedence for disconnected graph evidence, no selected candidates, and beyond-range connected walks. This is browser copy and test coverage only; it does not alter `nearest_routed_m`, no-transit reason selection, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P226 browser-smoke sheltered-walk marker:
Browser smoke should detect scored shelter-map panels using the current rendered `Sheltered walk` copy, not the retired `Sheltered route` phrase. The QA summary now exposes `walk_mode_present` while preserving `route_mode_present` as a compatibility key backed by the same current walk wording. This is browser QA alignment and test coverage only; it does not alter app rendering, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P227 browser-smoke shelter-map panel aliases:
Browser-smoke JSON should expose the current product surface as a shelter-map panel, not only through legacy `route_evidence_*` field names. The smoke output now adds `shelter_map_panel_loaded` and `shelter_map_panel_excerpt` while preserving the older route-evidence and score-panel keys for compatibility. This is browser QA output alignment and test coverage only; it does not alter rendered UI, route geometry, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P228 agent doc shelter-map frame:
`CLAUDE.md` is part of the agent handoff surface and should not teach new sessions the retired comfort-score-first product frame. It now opens with S.H.I.O.K. Shelter Map, covered-walkway ratio, exposed gaps, night-lighting map evidence, and the locked SHIOK score as secondary; the clicked-stop helper is described as walk-preview evidence. This is documentation and test coverage only; it does not alter runtime behavior, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P229 agent doc walk-display scope guard:
The `CLAUDE.md` scope guard now says walk display is shelter-map evidence only instead of route display being score evidence. This keeps future agent sessions aligned with the current browser terminology and the settled distinction between displayed walks, static evidence, and the secondary locked score. This is documentation and test coverage only; it does not alter runtime behavior, routing, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P230 source-comment shelter-map language:
Stale maintained-source comments now say preview shelter-map evidence and sheltered/shortest walks instead of preview route evidence and sheltered/shortest routes. This keeps explanatory source comments aligned with the visible Shelter Map framing. This is comment and test coverage only; it does not alter runtime behavior, routing, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P231 source-config product name:
The `pipeline/config/sources.yaml` header now names S.H.I.O.K. Shelter Map instead of the retired S.H.I.O.K. Index framing. The freshness/source policy remains unchanged; this is config-comment and regression-test alignment only and does not alter input fetching, source URLs, source cadence thresholds, manifests, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P232 freshness snapshot wording:
The first-view data freshness sentence now says the 12-current/6-stale/2-manual/1-unknown-age counts are from the latest manifest-only check, and says the oldest current source was 112.5 days old at that check. This avoids presenting a fixed historical age as a live freshness age. This is browser copy and test coverage only; it does not alter freshness classification, raw manifests, source configs, data fetching, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P233 scoring module product name:
The `pipeline/scoring.py` module docstring now names S.H.I.O.K. Shelter Map and describes pure component-score functions plus locked score calculation instead of the retired Index/composite framing. This is documentation and regression-test alignment only; it does not alter score formulas, scoring behavior, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P234 editable pipeline header product name:
Editable pipeline package, fetch, and params headers now name S.H.I.O.K. Shelter Map instead of the retired S.H.I.O.K. Index frame. `pipeline/config/weights.yaml` still contains its locked PRD header and remains untouched by policy. This is documentation/config-comment and regression-test alignment only; it does not alter parameters, fetch behavior, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P235 freshness snapshot age:
The first-view freshness snapshot was refreshed from a zero-mutation `run.py check --freshness-only` measurement. The classification stayed 12 current, 6 stale, 2 manual, and 1 unknown-age source, while the oldest current source age moved from 112.5d to 112.6d for NParks Leaf Area Index. This is browser copy and test coverage only; it does not alter manifests, sources, inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P236 README Leaf Area Index policy:
README onboarding now states that NParks Leaf Area Index can appear in source freshness as a tracked reference table, but is not route geometry, shade-proxy geometry, or score provenance. This keeps the P23/P181 non-score reference policy visible to operators before they interpret freshness output. This is documentation and test coverage only; it does not alter manifests, sources, shade geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P237 README locked-score availability disclosure:
README onboarding now states that the active frozen bundle has 95,157 full scores out of 124,443 records and that 29,286 records, roughly a quarter, do not show a full locked score because they are partial, beyond current transit range, or awaiting scoring. This mirrors the browser's manifest-derived locked-score availability disclosure in primary operator documentation. This is documentation and test coverage only; it does not alter manifests, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P238 full-batch prerequisite evidence:
The dry-run batch plan and production readiness now carry structured prerequisite evidence for each bundled full-batch change: bus remodel, `NO_TRANSIT_IN_RANGE` partial-score fix, network conflation repair, and promoted postal-universe v2 if approved. This makes the one-attempt full-batch approval gate checkable before any expensive run. This is reporting and test coverage only; it does not run geocoding, scoring, export, deployment, public-data writes, input rebuilds, or locked weight changes.

2026-08-21 - P239 postal-universe version guard:
Postal-universe preparation now defaults to a numeric version tag (`v2`) and writes versioned universe/geocoded artifact paths. The wrapper refuses to run if any target versioned artifact already exists, and the Python postal-universe builder refuses to overwrite an existing output or summary path even when called directly. This enforces the v1/v2/v3 input-artifact rule without building, geocoding, scoring, exporting, deploying, mutating public data, or changing locked weights.

2026-08-21 - P240 postal-universe CLI early guard:
Direct postal-universe CLI calls now infer a versioned summary path from a versioned `--output`, validate output paths before loading source data, and return a clean JSON error when the default unversioned paths would be used. This prevents accidental source scans or late failures for unsafe unversioned artifact targets. This is CLI safety and test coverage only; it does not build a universe, geocode, score, export, deploy, mutate public data, or change locked weights.

2026-08-21 - P241 heat-presentation analysis output guard:
The heat/rain presentation helper should not rewrite historical evidence when someone reruns it. Its default output now resolves from the repository root to `qa/analysis/heat_presentation_investigation.json`, and `write_report` refuses to overwrite an existing output unless `--overwrite` is explicit. The helper's UI audit was also refreshed from stale fixed-line P5 strings to current shelter-map copy and now resolves entries by string location so future line shifts do not masquerade as product regressions. This is analysis-tool safety and test coverage only; it does not alter heat/rain scoring, inputs, exports, public data, deployment, or locked weights.

2026-08-21 - P242 dated freshness snapshot:
The browser freshness sentence should not describe a fixed snapshot as merely the `latest manifest-only check` without a date. The first view now says the counts are from the `21 Aug 2026 manifest-only check`, preserving the same measured 12 current, 6 stale, 2 manual, 1 unknown-age classification and NParks Leaf Area Index age of 112.6 days. This is browser honesty copy and test coverage only; it does not rerun freshness, fetch sources, alter manifests, inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P243 readiness source-freshness timestamp:
Production readiness source-freshness evidence should carry the timestamp used for manifest-only classification. `source_freshness_readiness()` now resolves a single `checked_at` value, passes it to every per-source freshness status, and includes that ISO-8601 timestamp in the returned `source_freshness` block. This is readiness-reporting metadata and test coverage only; it does not fetch sources, alter manifests, inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P244 readiness source-freshness summary timestamp:
Production readiness source-freshness evidence should not require raw JSON inspection to find the timestamp used for manifest-only classification. The reported-state summary now starts with the ISO-8601 `checked_at` timestamp, and missing/unreadable source-freshness states carry the same `checked_at` field for consistency. This is readiness-reporting metadata and test coverage only; it does not fetch sources, alter manifests, inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P245 freshness CLI checked-at output:
The zero-mutation source-freshness CLI should name the timestamp used to compute source ages, matching the readiness evidence policy. `run_freshness_report()` now resolves one `checked_at` timestamp, passes it to every per-source status, and prints it in the first line of `run.py check --freshness-only` output. This is reporting metadata and test coverage only; it does not fetch sources, alter manifests, inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P246 shelter-map user-agent identifiers:
Maintained pipeline HTTP user-agent identifiers should use the current S.H.I.O.K. Shelter Map product frame rather than the retired SHIOK Index / Singapore Walk-to-Transit Index names. Fetch, bus, bounded geocode, postal-universe, OneMap probe, OneMap validation, and data.gov.sg resolver callers now identify as `sgSHIOK-Shelter-Map...`, with regression coverage over those files. This changes only future request metadata if those tools are explicitly run; it does not call upstream APIs, fetch sources, alter manifests, inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P247 README shelter-map bundle wording:
Operator onboarding should describe the active static artifact as the live shelter-map bundle, not primarily as a score bundle. README local-data wording and the web data-loader comment now use shelter-map bundle language while preserving the exact locked-score availability counts and the readiness requirement. This is documentation/comment and test coverage only; it does not alter runtime data loading, manifests, inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P248 clicked-stop shelter-map bundle wording:
Clicked-stop previews should keep the shelter-map bundle frame even when explaining why preview evidence is not authoritative. The preview note now says the clicked stop is not part of the published shelter-map bundle yet, and the preview provenance reason says published locked scores come from the shelter-map bundle. The live-preview helper comment no longer overclaims full provenance for the legacy published bundle. This is browser copy/comment and test coverage only; it does not alter preview routing, score values, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P249 transit picker shelter-map bundle wording:
The transit-stop picker helper should describe the artifact limitation as a shelter-map bundle limitation, not a score-bundle limitation. Its source comment now says the current shelter-map bundle does not ship ranked candidate lists or per-stop route geometry, preserving the straight-line-distance limitation and behavior. This is browser comment/test coverage only; it does not alter nearest-stop ranking, map rendering, routing, score values, exports, inputs, public data, deployment, or locked weights.

2026-08-21 - P250 deployed-bundle audit CLI wording:
The current-bundle audit CLI is an operator-facing tool for the deployed shelter-map artifact, even though some fields inside that artifact are locked scores. Its argparse description now says `current deployed shelter-map bundle` instead of `current deployed score bundle`, with a focused test guard. This is CLI help text and test coverage only; it does not read bundles, run audits, mutate QA outputs, alter scoring, export, deploy, public data, inputs, or locked weights.

2026-08-21 - P251 freshness cadence interpretation:
README source-freshness guidance should explain that `current` is a local manifest freshness classification, not proof that no newer upstream geospatial release exists. The local-data section now states that LTA geospatial listings such as Covered Linkway use a quarterly cadence with a 120-day stale threshold, and that upstream should still be checked before an approved release batch. This is documentation and test coverage only; it does not probe upstream APIs, fetch sources, mutate manifests or inputs, score, export, deploy, public data, or locked weights.

2026-08-21 - P252 no-transit locked-score policy:
The full-batch prerequisite evidence now records that a future `NO_TRANSIT_IN_RANGE` partial-score fix must preserve the locked-score rule: missing or no-transit component terms remain zero-contribution under the locked weights, and any four-of-five presentation requires a new explicit display state rather than silent renormalisation. This is readiness/batch-plan reporting and test coverage only; it does not change score formulas, run scoring, export, mutate inputs, public data, deployment, or locked weights.

2026-08-21 - P253 transit picker shelter-map panel comment:
The transit-stop picker source comment now says the shelter-map panel announces the active stop's selected walk distance, instead of calling it the primary score card and routed distance. This keeps maintained web source aligned with the product frame where shelter-map evidence leads and the locked score is secondary. This is comment and test coverage only; it does not alter rendering, transit candidate ordering, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P254 maintained web source shelter-map panel wording:
Remaining maintained web type/test comments that described the result surface as the score card now use shelter-map panel and selected-walk wording. This keeps developer-facing source aligned with the settled product hierarchy without changing rendered UI or test assertions. This is comment/test wording only; it does not alter runtime behavior, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P255 freshness-only CLI manifest-only disclosure:
The zero-mutation `run.py check --freshness-only` output now prints `Manifest-only check: no upstream URLs were probed.` immediately after the checked timestamp. This keeps the command itself aligned with the README caveat that local freshness status does not prove no newer upstream release exists. This is CLI disclosure and test coverage only; it does not probe upstream APIs, fetch sources, mutate manifests or inputs, score, export, deploy, public data, or locked weights.

2026-08-21 - P256 readiness source-freshness scope fields:
Production-readiness source-freshness JSON now carries `scope: manifest_only` and `upstream_urls_probed: false` in reported, missing, and unreadable states. This makes the same no-upstream-probe limitation machine-readable for release-gate consumers, not only visible in CLI text and README prose. This is readiness reporting and test coverage only; it does not probe upstream APIs, fetch sources, mutate manifests or inputs, score, export, deploy, public data, or locked weights.

2026-08-21 - P257 readiness source-freshness human summary:
The production-readiness source-freshness human summary now starts `manifest-only source freshness checked at...` instead of the generic `source freshness checked at...`. This makes the no-upstream-probe limitation visible to text readers as well as JSON consumers. This is readiness wording and test coverage only; it does not probe upstream APIs, fetch sources, mutate manifests or inputs, score, export, deploy, public data, or locked weights.

2026-08-21 - P258 structured recent-source gap policy:
The P19 recent public-source miss measurement should be carried as structured policy data, not only prose. Dry-run batch planning and production readiness now expose `recent_public_source_gap_sample` beside OSM and OneMap controls: 976 HDB completion and BCA MCST proxy rows with postals from 2021-2026, 8 missing rows, 0.819672 percent missing, and the verdict that candidate-source-first v2 remains required. This is reporting/policy data only; it does not alter inputs, exports, public data, scoring, deployment, or locked weights.

2026-08-21 - P259 lamp overlay versioned output guard:
Lamp overlay generation should enforce the same numeric artifact-version policy as postal-universe work. `pipeline.lamp_overlay` now rejects output directory names that do not end in a positive numeric version tag such as `_v2`, and it does so before creating the directory. Existing non-empty-output protection remains in place. This is a generation-safety guard and test coverage only; it does not build a lamp artifact, mutate existing artifacts, alter public data, score, export, deploy, or touch locked weights.

2026-08-21 - P260 first-view freshness no-upstream-probe disclosure:
The first-view freshness sentence should not rely on `manifest-only check` alone to convey that no live upstream check happened. The browser now adds `No upstream URLs were probed.` to the same data freshness line, preserving the existing 12 current, 6 stale, 2 manual, 1 unknown-age counts and stale-source list. This is browser honesty copy and test coverage only; it does not probe upstream APIs, fetch sources, mutate manifests or inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P261 readiness structured universe policy:
Production readiness should expose the settled postal-universe policy as structured data, not only prose. Its `features.source_policy` block now includes `frozen_v1`, `v2`, and `onemap_search_role` beside the existing P19 sample, OSM coverage, and OneMap controls, matching the operational policy already emitted by dry-run batch planning. This is readiness reporting and test coverage only; it does not fetch sources, mutate manifests or inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P262 DataMall geospatial discovery drift:
A metadata-only DataMall geospatial discovery probe found that current authenticated discovery for Covered Linkway and pedestrian overhead bridge/underpass resolves to generic `dmgeospatial` S3 paths, while frozen v1 records dated `Mar2026` static URLs in `raw/manifest.json`; traffic signals still matches the frozen redacted base URL. This is not proof that bytes changed, because no source payload was downloaded and no input was rebuilt. It is a release-risk signal: any approved future release batch that refreshes LTA geospatial sources must do so as a new numbered input version and compare hashes/counts against frozen v1. Existing v1 artifacts remain untouched.

2026-08-21 - P263 DataMall signed URL regression:
Current DataMall geospatial fallback returns `dmgeospatial` S3 links with `X-Amz-*` presigned query parameters. `stable_manifest_url()` already strips those parameters before manifest persistence, and fetch tests now explicitly guard that current URL shape. This is provenance-safety test coverage only; it does not fetch sources, mutate manifests or inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P265 README DataMall discovery-only command:
README local-data guidance should name the safe command for checking current LTA DataMall geospatial discovery links, not just tell operators to check upstream. It now documents `uv run python run.py check --geospatial-discovery-only`, including that the command downloads no payloads, writes no manifest, and treats a changed discovery URL as a reason for a new numbered input version rather than an in-place repair. This is documentation and test coverage only; it does not fetch source payloads, mutate manifests or inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P266 structured DataMall discovery policy:
Dry-run batch planning and production readiness should carry the P262/P264 DataMall geospatial discovery drift as structured source-policy data, not only as README prose and CLI output. Their source-policy blocks now record the no-payload/no-manifest-write command, the two changed sources (`covered_linkway`, `overhead_bridge_underpass`), the matching `traffic_signals` source, and the rule that changed discovery URLs require a new numbered input version rather than an in-place repair. This is reporting/test coverage only; it does not probe upstream APIs, fetch source payloads, mutate manifests or inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P267 DataMall geospatial source notes:
`pipeline/config/sources.yaml` should not continue describing DataMall geospatial listing sources as unauthenticated public/static downloads after P262/P264 showed current discovery can require authenticated `GeospatialWholeIsland` fallback. The three DataMall geospatial source notes now describe the frozen-v1/current-discovery distinction and repeat that any refresh must be a new numbered input version rather than an in-place repair. This is maintained-source documentation and test coverage only; it does not change source keys, cadence, manifests, raw inputs, fetching behavior, scoring, export, deploy, public data, or locked weights.

2026-08-21 - P268 structured Leaf Area Index reference policy:
Dry-run batch planning and production readiness should expose the settled Leaf Area Index policy in structured source-policy data. `leaf_area_index` now appears as a non-score reference source: it is tracked for source freshness only, excluded from score source hashes, and cannot become route-level shade evidence without a separate species-located canopy inventory and approved model design. This is reporting/test coverage only; it does not alter manifests, source hashes, shade geometry, scoring, export, deploy, public data, or locked weights.

2026-08-21 - P269 structured night-lighting layer policy:
Dry-run batch planning and production readiness should expose the settled lamp-post policy in structured source-policy data: `lamp_posts` powers the separate `web/public/data/lamp_posts_v1/` night-lighting map layer, is not part of the locked score, is release-gated by production readiness, and future lamp overlay artifacts must use new numbered directories. This is reporting/test coverage only; it does not build or mutate lamp artifacts, public data, source manifests, scoring, export, deploy, or locked weights.

2026-08-21 - P270 structured source-freshness policy:
Dry-run batch planning and production readiness should expose the source-freshness check boundary in structured source-policy data. The manifest-only command is `uv run python run.py check --freshness-only`; it probes no upstream URLs, writes no manifest, and reports release context rather than corruption or hash-repair status. A stale result means plan a versioned refresh, not an in-place frozen-v1 mutation. This is reporting/test coverage only; it does not probe upstream APIs, fetch sources, mutate manifests or inputs, score, export, deploy, public data, or locked weights.

2026-08-21 - P271 bus-connector diagnostic shelter-map wording:
Bus-connector diagnostics should tell operators to refresh a targeted shelter-map bundle, not a targeted score bundle, before promoting recovered rows into active validation failures. The diagnostic still concerns score-bearing rows, but the current artifact is the shelter-map bundle with locked scores inside it; using score-bundle language weakens the settled shelter-first operator frame. This is diagnostic copy and test coverage only; it does not run diagnostics, score, export, deploy, mutate public data, mutate inputs, or touch locked weights.

2026-08-21 - P272 P10 provenance coverage Leaf Area Index wording:
The P10 provenance coverage helper should no longer describe shade/greenery source hashes as possibly `hash-shipped but unconsumed`, because Leaf Area Index now has an explicit settled policy: it is a freshness-only non-score reference, while scored shade/greenery inputs remain identified through source hashes when present. This is analysis-helper wording and static test coverage only; it does not run the helper, probe sources, mutate manifests or inputs, score, export, deploy, mutate public data, or touch locked weights.

2026-08-21 - P273 P19 gap-measurement cache status:
The P19 postal-universe gap measurement should have a cheap read-only status mode before any operator decides to call APIs or update resumable QA caches. `scripts/analysis/p19_universe_gap_measurement.py --cache-status-only` now reports existing `qa/p19` cache/report presence, byte sizes, HDB geocode query count, Overpass postcode count, summary timestamp, and detail row counts, while declaring `will_call_apis: false` and `will_write_files: false` and exiting before loading the postal universe. This is measurement tooling and test coverage only; it does not call data.gov.sg, OneMap, or Overpass, does not mutate `qa/p19`, inputs, public data, scoring, exports, deployments, or locked weights.

2026-08-21 - P274 P19 cache status in source-policy surfaces:
Dry-run batch planning and production readiness should point operators at the read-only P19 cache-status check wherever they report the recent public-source gap sample. The shared `RECENT_PUBLIC_SOURCE_GAP_SAMPLE` policy now includes the `--cache-status-only` command, declares that it calls no APIs and writes no files, and names the cached summary/detail paths. This is reporting/test coverage only; it does not run the P19 measurement, call data.gov.sg, OneMap, or Overpass, mutate `qa/p19`, mutate inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P275 README P19 cache-status command:
Operator onboarding should name the safe way to inspect the cached P19 postal-universe gap measurement, not only state the 8-of-976 result. The README universe-status section now points to `uv run python scripts/analysis/p19_universe_gap_measurement.py --cache-status-only` and states that it does not call data.gov.sg, OneMap, or Overpass. This is documentation/test coverage only; it does not run the measurement, call APIs, mutate `qa/p19`, mutate inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P276 README uv operator commands:
Operator onboarding should run readiness and batch-plan commands inside the project environment, matching the existing `uv run` guidance for freshness and P19 cache-status checks. README local-data guidance now says `uv run python scripts/production_readiness.py` and `uv run python run.py batch-plan` instead of bare system `python`, avoiding missing-dependency failures before operators reach the intended safety checks. This is documentation/test coverage only; it does not run readiness, batch planning, geocoding, scoring, export, deploy, mutate inputs, public data, or locked weights.

2026-08-21 - P277 P19 gap status runner task:
The cached P19 postal-universe gap measurement should be reachable through the project task runner, not only a long analysis-script invocation. `uv run python run.py p19-gap-status` now delegates to `scripts.analysis.p19_universe_gap_measurement --cache-status-only`, preserving the no-API/no-write boundary while making the measurement status discoverable beside other safe checks. This is operator tooling/reporting/test coverage only; it does not call APIs, mutate `qa/p19`, load or mutate inputs, score, export, deploy, public data, or locked weights.

2026-08-21 - P278 measured address-universe caveat:
The first-view address-universe caveat should carry the measured P19 gap count, not only the vague statement that recent-source misses exist. The title card now says the frozen v1 universe is from a June 2020 OneMap-derived postal scrape and that a 2021-2026 public-source sample found 8 missing rows out of 976. The detailed HDB completion and BCA MCST proxy line remains below it. This is browser copy and test coverage only; it does not alter search behavior, manifests, inputs, public data, scoring, export, deploy, or locked weights.

2026-08-21 - P279 full locked score availability copy:
The first-view availability disclosure should keep the secondary metric explicitly named as the locked score even inside the count phrase. The formatter now says `full locked scores` and `full locked score` instead of generic `full scores` and `full score`, while preserving the same manifest-derived counts and breakdown for partial shelter-map evidence, beyond-range rows, and awaiting-score rows. This is browser copy and test coverage only; it does not alter manifests, score values, inputs, public data, scoring, export, deploy, or locked weights.

2026-08-21 - P280 selected-card full locked score copy:
Selected-card empty score states should use the same locked-score frame as the first-view availability disclosure. The awaiting-score card title, reason chip, live announcement, and browser-smoke detector now say `No full locked score in this bundle` instead of generic `No full score in this bundle`, keeping missing locked-score availability separate from shelter-map evidence availability. This is browser copy/test/smoke coverage only; it does not alter route evidence, score values, manifests, inputs, public data, scoring, export, deploy, or locked weights.

2026-08-21 - P281 README full locked score copy:
README local-data guidance should use the same locked-score availability language as the browser first view. The active bundle description now says `95,157 full locked scores out of 124,443 records` instead of generic `full scores`, while preserving the same missing-count breakdown and deployment/artifact constraints. This is documentation and test coverage only; it does not alter manifests, score values, inputs, public data, scoring, export, deploy, or locked weights.

2026-08-21 - P282 README task-runner surface:
README's repo map should reflect the current `run.py` operator surface, not only the old compact task list. The `run.py` line now separates safe reports (`check --freshness-only`, `check --geospatial-discovery-only`, `p19-gap-status`, `readiness`, `batch-plan`) from gated pipeline tasks (`ingest`, `network`, `score`, `export`, `validate`, `publish`, `test`) while preserving the publish-validate guard. This is documentation and test coverage only; it does not run or alter reports, inputs, scoring, export, public data, deploy, or locked weights.

2026-08-21 - P283 README legacy provenance reproducibility:
README ground rules should not overclaim that every published score is reproducible from hashed inputs and tagged code, because the active published bundle is an accepted legacy artifact that predates record-level scoring-input and network provenance. The ground-rule summary now states the narrower verified fact: published score values, coordinates, and route origins have been independently verified, while the legacy bundle lacks the later provenance fields. This is documentation and test coverage only; it does not alter manifests, score values, inputs, public data, scoring, export, deploy, or locked weights.

2026-08-21 - P284 CLAUDE task-runner surface:
`CLAUDE.md` is part of the agent startup surface, so its repo-layout `run.py` description should match README's safe-report/gated-task split. The doc now names safe reports (`check --freshness-only`, `check --geospatial-discovery-only`, `p19-gap-status`, `readiness`, `batch-plan`) and describes the remaining runner surface as gated pipeline tasks instead of the old compact task list. This is agent-facing documentation and test coverage only; it does not run or alter reports, inputs, scoring, export, public data, deploy, or locked weights.

2026-08-21 - P285 README runner readiness command:
Operator documentation should invoke production readiness through the project task runner now that `run.py readiness` is documented as a safe report. README publish and full-batch planning guidance now uses `uv run python run.py readiness` instead of calling `scripts/production_readiness.py` directly, and `tests/test_run.py` guards that the task dispatches to `scripts.production_readiness` with `PYTHONHASHSEED=0`. This is documentation and task-runner test coverage only; it does not run readiness, scoring, export, deploy, public data, or locked weights.

2026-08-21 - P286 agent runner command:
Agent-facing operator guidance should use the uv-managed task runner command consistently. `CLAUDE.md` now documents `uv run python run.py <task>`, `uv run python run.py test`, and `uv run python run.py publish`, with test coverage rejecting the older bare `python run.py ...` guidance. This is documentation and test coverage only; it does not execute tasks, alter the runner, change scoring, mutate exports, touch public data, or modify locked weights.

2026-08-21 - P287 runner help command:
The task runner's own help text should match the uv-managed invocation shown in README and `CLAUDE.md`. `run.py` now advertises `Usage: uv run python run.py <task> [options]`, with a focused test rejecting the older bare-system-Python usage line. This is command-help text and test coverage only; it does not execute tasks, change runner dispatch, score, export, deploy, mutate public data, or touch locked weights.

2026-08-21 - P288 runner help safe gates:
The task runner help should make the safe-report boundary visible before an operator chooses a task. `run.py --help` now separates safe reports (`check --freshness-only`, `check --geospatial-discovery-only`, `p19-gap-status`, `readiness`, `batch-plan`) from gated pipeline tasks (`ingest`, `network`, `score`, `score-batch`, `export`, `export-transit`, `validate`, `publish`). This is command-help text and test coverage only; it does not execute tasks, change dispatch, score, export, deploy, mutate public data, or touch locked weights.

2026-08-21 - P289 runner help task headline:
The task runner help should not make the argparse choice list compete with the curated safe-report/gated-task split. The parser now uses `task` as the positional metavar and exposes a testable `build_parser()` helper, so `run.py --help` leads with `usage: run.py [-h] task` and the safe/gated sections carry the task taxonomy. This is help formatting and test coverage only; it does not execute tasks, change dispatch, score, export, deploy, mutate public data, or touch locked weights.

2026-08-21 - P290 title-card gap copy:
The browser title card should state the frozen address universe and the measured recent-source gap without repeating the same 8-of-976 fact twice. The first freshness line now says the address universe is frozen v1 from a June 2020 OneMap-derived postal scrape, and the next line names the P19 recent public-source check with 8 missing rows out of 976 HDB completion and MCST proxy rows from 2021-2026. This is browser copy and test coverage only; it does not alter search, manifests, inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P291 no-results gap copy:
The address-search no-results message should use the same measured frozen-bundle limitation as the title card instead of vague `measured recent-source misses` wording. It now says the frozen shelter-map bundle's recent public-source check found 8 missing rows out of 976 while preserving the separate OneMap lookup failure and 6-digit postal-code suggestion. This is browser copy and test coverage only; it does not alter OneMap search behavior, scoring, inputs, exports, public data, deployment, or locked weights.

2026-08-21 - P292 night-lighting tooltip:
The night-lighting layer's hover title should use the same user-facing layer name as the visible control instead of leading with raw lamp-post terminology. The button title now starts with `Night lighting`, then names the LTA lamp-post source and repeats that the layer is map evidence outside the locked score. This is browser copy and test coverage only; it does not alter lamp data, map loading, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P293 night-lighting detail state:
The selected-walk details strip should describe night lighting as a map-layer state, not as an ambiguous `Layer on/off` route detail. The value now says `Map layer on` or `Map layer off`, preserving the note that LTA lamp-post points are map evidence outside the locked score. This is browser copy and test coverage only; it does not alter lamp data, map loading, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P294 footer night-lighting evidence:
The first-view footer should name the night-lighting layer alongside covered-walkway and exposure-gap evidence, because night lighting is the settled second map layer even though it remains outside the locked score. The footer now says `Source-derived covered-walkway, exposure-gap, and night-lighting map evidence.` This is browser copy and test coverage only; it does not alter lamp data, map loading, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P295 night-lighting rendered test:
Rendered accessibility coverage should guard the P293 `Map layer on` wording for selected-walk night-lighting state, not the retired ambiguous `Layer on` wording. This is test coverage and evidence only; it does not alter browser copy, lamp data, map loading, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P296 README routed-walk framing:
README opening copy should match the settled shelter-map frame and CLAUDE.md by saying the app leads with exposed gaps on real routed walks, not generic routed paths. This is documentation and test coverage only; it does not alter browser copy, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P297 OneMap search input label:
The first-view search input should state that address search uses OneMap while 6-digit postal lookup remains direct. The placeholder and accessible label now say `Search OneMap address or 6-digit postal`, reducing ambiguity between OneMap lookup and the frozen shelter-map bundle. This is browser copy and test coverage only; it does not alter search behavior, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P298 empty-search prompt:
The empty shelter-map panel should match the search input's OneMap-address/direct-postal behavior instead of telling users only to find a postal code. It now says `Find an address or postal code` and names `OneMap address or 6-digit postal code` in the helper text. This is browser copy and test coverage only; it does not alter search behavior, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P299 map empty-search summary:
The map's non-visual empty summary should match the visible search behavior by naming OneMap address search and direct 6-digit postal lookup. It now says `Search a OneMap address or 6-digit postal code` before listing covered-walkway ratio, exposed gaps, night lighting, and nearby transit. This is browser copy and test coverage only; it does not alter map data, search behavior, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P300 OneMap search error copy:
Search error copy should distinguish OneMap lookup failures from direct postal lookup and frozen-bundle availability. The selected-result postal error now says `Selected OneMap result has no usable postal code`, and the generic search fallback says `Failed to search OneMap address`. This is browser copy and test coverage only; it does not alter search behavior, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P301 shelter-map load error copy:
The selected-postal load fallback should name shelter-map data rather than internal score data, because the first-view product promise is covered-walkway, exposure-gap, night-lighting, and transit evidence with the locked score secondary. The non-Error fallback now says `Failed to load shelter-map data`; thrown fetch errors still pass through unchanged. This is browser copy and test coverage only; it does not alter loading behavior, search, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P302 OneMap busy-search copy:
The OneMap rate-limit branch should name OneMap search rather than saying generic search is busy, because direct 6-digit postal lookup is local to the frozen shelter-map bundle while address lookup depends on OneMap. The 429 fallback now says `OneMap search is busy. Please try again in a moment.` This is browser copy and test coverage only; it does not alter OneMap request behavior, search, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P303 planning-area empty rank copy:
The planning-area comparison empty state should say that comparable full locked scores are absent, not generic scored records, because the panel ranks full-score rows while the selected postal may still have shelter-map evidence. The empty state now says `No comparable full locked scores in this planning area.` This is browser copy and test coverage only; it does not alter rank loading, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P304 planning-area comparison header:
The rank panel header should say `Compare planning-area records` instead of `Compare nearby records`, because the panel loads planning-area ranks rather than a distance-nearby sample. This is browser copy and rendered test coverage only; it does not alter rank loading, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P305 awaiting locked-score state note:
The `NOT_YET_SCORED` state note should describe user-visible availability, not internal pipeline scoring status. It now says the postal is in the frozen v1 address universe but this shelter-map bundle has no published full locked score for it yet. This is browser copy and rendered test coverage only; it does not alter score states, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P306 partial locked-score state note:
The `SCORED_PARTIAL` state note should not imply that missing component scores mean the selected postal lacks shelter-map evidence. It now says shelter-map evidence may still be present while one or more component scores are unavailable and locked weights count missing terms as zero. This is browser copy and rendered test coverage only; it does not alter score states, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P307 no-transit qualifying-stop copy:
The short `NO_TRANSIT_IN_RANGE` copy for `no_transit_candidates_selected` should not sound like no transit exists near the postal. The title/reason now say `No qualifying transit stop within 1.2 km`, while the detailed note continues to name the 1.2 km scoring range and qualifying MRT/LRT exit or bus stop criteria. This is browser copy and test coverage only; it does not alter candidate selection, score states, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P308 preview reason map-evidence copy:
The live OneMap clicked-stop preview reason should say `Map evidence only` instead of `Not scored in the current bundle`, because the preview intentionally displays covered-walkway evidence for a stop that is outside the published locked-score bundle. This is browser copy and rendered test coverage only; it does not alter live preview geometry, score states, score values, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P309 README P125 OSM measurement label:
README universe-status onboarding should cite the P125 live Overpass measurement by name when explaining why OSM `addr:postcode` is not the primary address registry. The counts are unchanged: OSM covers only 25,873 of 124,443 frozen postals, so v2 remains candidate-source-first with bounded OneMap Search validation. This is documentation and test coverage only; it does not call APIs, mutate cached P125/P19 evidence, alter inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P310 CLAUDE universe-source policy:
Agent-facing startup guidance should carry the measured postal-universe policy, not only the product frame and runner commands. `CLAUDE.md` now records frozen v1 as 124,443 records, P19's 8-of-976 recent public-source gap, P125's 25,873 frozen-postal OSM overlap, and the candidate-source-first v2 policy with bounded OneMap Search validation. This is documentation and test coverage only; it does not call APIs, mutate cached evidence, alter inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P311 runner P19 safe-report boundary:
`run.py --help` should make the `p19-gap-status` safety boundary visible, not only list the task name. The help now states that `p19-gap-status` reads cached P19 measurement status only, calls no APIs, and writes no files. This is task-runner help text and test coverage only; it does not run P19 status, call data.gov.sg, OneMap, or Overpass, mutate QA caches, alter inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P312 runner safe-report descriptions:
The safe-report section of `run.py --help` should describe why each report is safe, not only name the tasks. The help now states the no-upstream/no-write boundary for `check --freshness-only`, the metadata-only/no-payload/no-manifest boundary for `check --geospatial-discovery-only`, the no-scoring/no-deploy boundary for `readiness`, and the no-scoring dry-run boundary for `batch-plan`. This is runner help text and test coverage only; it does not execute any report, API probe, scoring, export, ingest, network build, public-data mutation, deployment, or locked-weight change.

2026-08-21 - P313 shelter-panel component wording:
The shelter panel should not frame secondary evidence rows as standalone component scores when the product framing is shelter evidence first and the locked score secondary. The planning-area alternate rank mode now says `component evidence view`, and the bus fallback caveat says the `locked bus term remains 0` rather than `this component score remains 0`. This is web copy and test coverage only; it does not change score values, ranking inputs, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P314 heat reason evidence wording:
The shelter panel's reason chips should frame heat as evidence, not as an independent score headline. The high-side heat reason now says `Stronger heat-proxy evidence` instead of `Better heat-proxy score`, matching the existing `Low heat-proxy evidence` low-side reason and the four-row shelter-map presentation. This is web copy and test coverage only; it does not change score values, score reasons selection, ranking inputs, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P315 bus reason service-evidence wording:
The shelter panel's bus reason chips should frame bus as service evidence, not as an unqualified connectivity verdict. The bus low/high reason labels now say `Limited bus-service evidence` and `Stronger bus-service evidence`, while the direct-bus fallback path still uses `Nearby bus service not walk-verified`. This is web copy and test coverage only; it does not change score values, reason selection, routing, ranking inputs, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P316 empty map night-lighting label:
The route map's empty-state non-visual label should name night-lighting evidence as part of the map scope, not only transit POIs. The no-route map aria label now says `Singapore shelter map with MRT stations, LRT stations, bus stops, and night-lighting evidence`, while route-specific summaries and the live night-lighting overlay status remain unchanged. This is accessibility copy and test coverage only; it does not change map data, lamp tiles, routes, scores, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P317 partial locked-score term wording:
The partial locked-score note should describe missing locked-weight terms, not standalone component scores. Partial records now say `one or more locked terms are unavailable; locked weights count missing terms as zero`, while preserving the warning that shelter-map evidence may still be present. This is web copy and test coverage only; it does not change score state logic, score values, missing-term handling, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P318 no-subscore reason term wording:
When a record has shelter-map paths but no subscore block, the shelter-panel reason chip should say `Locked terms unavailable` rather than `Locked score incomplete`. This keeps the reason aligned with the partial locked-score note and avoids implying that the shelter-map evidence itself is incomplete. This is web copy and test coverage only; it does not change score state logic, score values, missing-term handling, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P319 bus rank option service-evidence wording:
The planning-area rank dropdown should use the same bus-service evidence wording as the shelter panel, not the older `Bus connectivity` label. The bus rank option now says `Bus-service evidence`; it still ranks by the existing locked bus subscore field and does not change rank calculations. This is web copy and test coverage only; it does not change score values, ranking inputs, ranking order, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P320 planning-area rank labels as evidence views:
The planning-area rank dropdown should present non-overall rank modes as evidence views, not as independent component-score names. The option labels now read `Rain-shelter evidence`, `Transit-access evidence`, `Bus-service evidence`, `Heat-proxy evidence`, and `Crossing-friction evidence`; the `Locked SHIOK score` option remains the overall sort. This is web copy and test coverage only; it does not change rank calculations, score values, ranking inputs, ranking order, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P321 planning-area rank helper evidence wording:
The planning-area rank helper should match the rank menu's evidence-view framing. When the panel is open on a non-overall metric, it now says `Planning-area evidence view; locked SHIOK score is unchanged.` instead of `Planning-area component evidence view; locked SHIOK score is unchanged.` This is web copy and test coverage only; it does not change rank calculations, score values, ranking inputs, ranking order, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P322 planning-area rank select accessibility label:
The planning-area rank select's screen-reader label should describe the same evidence-view surface sighted users see. It now says `Choose planning-area evidence view` instead of `Rank records by`, while the visible dropdown options and rank calculations remain unchanged. This is web accessibility copy and test coverage only; it does not change rank calculations, score values, ranking inputs, ranking order, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P323 display-row unavailable fallback wording:
Unavailable display-row metadata should name the missing thing rather than generic score availability. The bus row fallback now says `Bus evidence unavailable` instead of `No bus score`, and the locked score row fallback now says `No full locked score` instead of `No locked score`. This is web copy and test coverage only; it does not change row inclusion, score values, ranking inputs, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P324 outside-bundle empty-state recent-source caveat:
The outside-bundle empty state should connect the frozen June 2020 address-universe limitation with the measured recent-source check, without claiming the searched postal is definitely a known miss. It now says the current bundle is tied to the frozen June 2020 address universe and that the recent public-source check found 8 missing rows out of 976. This is web copy and test coverage only; it does not change lookup logic, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P325 outside-bundle live-region caveat:
The outside-bundle live-region announcement should carry the same frozen-universe and recent-source caveat as the visible empty state. It now says the selected postal is outside the shelter-map bundle tied to the frozen June 2020 address universe and that the recent public-source check found 8 missing rows out of 976, instead of only saying it is not in the current shelter-map bundle. This is web accessibility copy and test coverage only; it does not change lookup logic, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P326 search no-results live-region recent-source caveat:
The OneMap address-search no-results live-region announcement should carry the same recent-source caveat as the visible no-results box. It now says no OneMap address result was found, suggests a 6-digit postal code, and separately notes the frozen shelter-map bundle's recent public-source check found 8 missing rows out of 976. This is web accessibility copy and test coverage only; it does not change search logic, API calls, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P327 missing locked-term display copy:
Missing shelter/access display-row values should be framed as unavailable evidence or unavailable locked terms, not as generic "Not scored" component rows. The four-row shelter-map breakdown now renders missing per-term values as "Unavailable", uses "Shelter evidence unavailable" and "Access term unavailable" for the row metadata, and keeps the full locked-score fallback as "No full locked score". This is web copy and test coverage only; it does not change score values, row inclusion, ranking logic, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P328 outside-bundle empty-state bundle naming:
The outside-bundle visible empty state should name the shelter-map bundle explicitly, matching the surrounding product framing and the non-visual announcement. It now says "this shelter-map bundle is tied to the frozen June 2020 address universe" instead of "the current bundle is tied..." while preserving the 8-of-976 recent public-source caveat. This is web copy and test coverage only; it does not change lookup logic, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P329 locked transit range copy:
NO_TRANSIT_IN_RANGE copy should describe the 1.2 km constraint as a locked release transit range, not as the "current scoring range". The affected empty-state notes and reason chips now say "locked transit range" / "locked 1.2 km transit range" while preserving the same 1.2 km threshold and fallback behavior. This is web copy and test coverage only; it does not change transit selection, route lookup, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P330 transit range heading cleanup:
NO_TRANSIT_IN_RANGE headings and no-candidate notes should not retain "scoring range" wording after the release range was reframed as locked. The far-connected-walk heading now says "Transit beyond locked range", and the no-candidate note says the postal has no qualifying MRT/LRT exit or bus stop within the locked 1.2 km transit range. This is web copy and test coverage only; it does not change transit selection, route lookup, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P331 locked-score sort target copy:
The locked-score display row should say the locked score sorts the published shelter-map bundle, not the generic current bundle. This keeps the secondary score row tied to the frozen release artifact while preserving the same score value, row order, and locked-score availability behavior. This is web copy and test coverage only; it does not change score values, ranking logic, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P332 locked-score availability transit-range copy:
The first-view locked-score availability disclosure should use the same locked transit-range wording as the selected-card NO_TRANSIT_IN_RANGE states. Records in NO_TRANSIT_IN_RANGE now appear as "beyond locked transit range" instead of "beyond current transit range" while preserving the manifest-derived counts and roughly-a-quarter disclosure. This is web copy and test coverage only; it does not change manifest parsing, state counts, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P333 rain/heat locked-release copy:
The shelter-exposure display row should describe the rain/heat overlap as a property of this locked release, not as a vague current condition. It now says "In this locked release, rain shelter and heat comfort share mostly the same covered-walkway evidence." This is web copy and test coverage only; it does not change row inclusion, score values, ranking logic, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P334 README locked transit range wording:
README onboarding should mirror the browser's locked-score availability wording. The active-bundle limitation now says non-full records may be "beyond locked transit range" instead of "beyond current transit range", matching the selected-card and first-view app copy. This is documentation and test coverage only; it does not change manifest parsing, state counts, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P335 Section 10 proposal stale-current wording:
The committed Section 10 presentation proposal should not preserve stale "current" language after P18 landed the four-row shelter-first presentation. The proposal now describes the old rows as the prior/pre-P18 state, uses the same locked-release rain/heat overlap sentence as the app, and says the locked score sorts the published shelter-map bundle. This is documentation and test coverage only; it does not change app rendering, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P336 heat presentation audit string alignment:
The heat-presentation analysis helper should audit the current app copy, not retired strings from earlier presentation phases. Its UI audit entries now use "Stronger heat-proxy evidence" and the locked-release rain/heat overlap sentence, and tests reject the old "Better heat-proxy score" and "currently share" strings. This is analysis metadata and test coverage only; it does not run bundle analysis, alter app rendering, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P337 readiness help published-bundle wording:
The safe-report help for `run.py readiness` should name the published shelter-map bundle rather than the generic current bundle. The docstring and help output now say readiness validates the published shelter-map bundle and release gates without scoring or deploying. This is operator help text and test coverage only; it does not run readiness, alter release gates, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P338 audit bundle help published-bundle wording:
The read-only active-bundle audit helper should use the same published shelter-map bundle wording as the rest of the operator surface. Its CLI description and `--state-only` help now name the published shelter-map bundle instead of the current bundle. This is operator help text and test coverage only; it does not run the audit, alter reports, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P339 targeted refresh absent-postal wording:
The targeted bundle refresh helper should name the published shelter-map bundle when selected postals are absent from the source bundle. Its early validation error now says none of the selected postals exist in the published shelter-map bundle instead of the current bundle. This is operator error text and test coverage only; it does not run refresh, scoring, export, alter reports, public data, pipeline inputs, or locked weights.

2026-08-21 - P340 compare-targeted published-bundle wording:
The targeted comparison operator surface should name the published shelter-map bundle rather than an active/static/current bundle. `run.py` and `scripts/compare_targeted_scores.py` now describe compare-targeted as comparing a targeted score report against the published shelter-map bundle. This is operator help text and test coverage only; it does not run comparison, scoring, export, alter reports, public data, pipeline inputs, or locked weights.

2026-08-21 - P341 P10 analysis legacy-bundle wording:
Reusable P10 analysis helpers should call the pre-provenance release the legacy published bundle, not the active bundle, because the later release standard distinguishes legacy provenance policy from artifact defects. The coordinate identity helper docstring and provenance coverage output now use legacy published bundle wording. This is analysis-script wording and test coverage only; it does not run analysis, alter reports, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P342 readiness locked-term status wording:
Production readiness should describe missing `subscore_status` capabilities as missing locked-term status in operator warnings, because the browser and docs now present the five weighted terms as locked terms rather than independent component scores. The underlying manifest field remains `subscore_status`; only the warning text changed. This is readiness copy and test coverage only; it does not run readiness, alter gates, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P343 Section 10 proposal locked-term wording:
The Section 10 proposal should use the same locked-term language as the app and readiness surfaces. It now says the prior five rows were locked-term rows rather than component-score rows, preserving the proposal's argument that the release should not present those terms as five independent measurements. This is proposal wording and test coverage only; it does not change app rendering, score values, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P344 freshness age threshold copy:
The browser freshness line should not freeze a decimal day age that drifts within the same dated manifest-only check. The latest zero-mutation freshness run still reports 12 current sources, 6 stale, 2 manual, and 1 unknown-age candidate source, with NParks Leaf Area Index as the oldest current source at 112.9 days of a 120-day threshold. The UI now says that source is just under its 120-day quarterly threshold instead of preserving the earlier 112.6-day number. This is web copy, evidence, and test coverage only; it does not probe upstream URLs, mutate inputs, alter source manifests, score, export, deploy, public data, or locked weights.

2026-08-21 - P345 recent-source gap percentage copy:
The browser and README recent-source disclosure should show the measured P19 miss rate, not only the raw 8-of-976 count. The copy now says `8 missing rows out of 976 (0.82%) HDB completion and MCST proxy rows from 2021-2026 with postals`, matching P19's `row_miss_rate: 0.008197` / batch-plan `missing_pct: 0.819672`. This is web and documentation copy with tests only; it does not call APIs, mutate QA caches, alter inputs, score, export, deploy, public data, or locked weights.

2026-08-21 - P346 locked-score availability exact share:
The browser's manifest-derived locked-score availability line should quantify the no-full-score share instead of only saying `roughly a quarter`. For the current manifest counts, 29,286 non-full records out of 124,443 is 23.5%, so the browser line now says `23.5%, roughly a quarter` and README mirrors `23.5% or roughly a quarter`. This is web/docs copy and tests only; it does not alter manifests, score values, scoring, exports, public data, pipeline inputs, or locked weights.

2026-08-21 - P348 greenery proxy source boundary:
The selected walk details should separate the sparse NParks route-geometry greenery proxy from NParks Leaf Area Index and measured thermal evidence. The browser now adds a detail-strip note that greenery proxy is sparse NParks route geometry for heat only, not measured temperature or Leaf Area Index. This is browser copy and test coverage only; it does not alter shade geometry, source manifests, freshness policy, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P349 shelter-first live announcement:
The score-card live region should follow the same hierarchy as the visual presentation: shelter evidence first, locked score second. Screen-reader status now announces covered-walkway ratio and exposed-gap total before the locked score, preserving the same visible layout and score values. This is browser accessibility copy and test coverage only; it does not alter rendering order, scoring, exports, public data, inputs, deployment, or locked weights.

2026-08-21 - P350 shelter-first share metadata:
Link previews should carry the same shelter-first product frame as the first view instead of relying on generic metadata fallbacks. The Next metadata now sets Open Graph and Twitter summary fields with the covered-walkway exposure-gap, night-lighting, and secondary locked-score description. This is browser metadata and test coverage only; it does not alter app rendering, scoring, exports, public data, inputs, deployment, or locked weights.

2026-08-21 - P351 transit picker straight-line caveat:
The nearby-transit comparison note should not imply the auto-picked stop is objectively best before shelter-map evidence is loaded for another selected stop. It now says a non-auto-picked stop is farther than the auto-picked stop on straight-line distance only, and that shelter evidence updates after selection. This is browser copy and test coverage only; it does not alter candidate selection, routing, scoring, exports, public data, inputs, deployment, or locked weights.

2026-08-21 - P352 shelter-map smoke locked-score check:
Browser-smoke scored-state output should expose a shelter-map-named locked-score check instead of forcing operators to read the legacy score-denominator key as canonical. The JSON now includes `shelter_map_has_locked_score` while retaining `score_has_max_denominator` as a compatibility alias for older QA artifacts and scripts. This is operator QA output naming and test coverage only; it does not alter browser rendering, score values, scoring, exports, public data, inputs, deployment, or locked weights.

2026-08-21 - P353 planning-area rank loading copy:
The visible planning-area rank loading row should name the selected evidence view, matching the live-region announcement. It now renders `Loading planning-area {rankMetricLabel} ranks.` instead of the generic `Loading planning-area ranks...`, so users see whether the panel is loading locked-score ranks or a specific evidence view. This is browser copy and test coverage only; it does not alter rank data, scoring, exports, public data, inputs, deployment, or locked weights.

2026-08-21 - P354 Leaf Area Index source note:
`pipeline/config/sources.yaml` should use the same Leaf Area Index policy as README, readiness, and batch-plan: LAI is a tracked freshness reference table only, not route-level geometry, shade-proxy geometry, score provenance, or rain shelter geometry. This aligns source metadata with the settled P23/P181 policy. It does not fetch sources, mutate inputs, alter shade proxy geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P355 P19 cache status age:
The read-only P19 cache-status output should report the age of its cached Overpass query and summary measurement, not only their timestamps. `uv run python run.py p19-gap-status` now adds `age_days` for those cached files while preserving `will_call_apis: false` and `will_write_files: false`. This is operator measurement-status reporting and test coverage only; it does not call data.gov.sg, OneMap, or Overpass, mutate `qa/p19`, load or mutate inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P356 P19 cache-age help:
Operator help and README onboarding should advertise that `p19-gap-status` reports cache ages, not only cached measurement status. The no-API/no-write boundary remains explicit in both surfaces. This is documentation and task-runner help text only; it does not run the P19 measurement, call data.gov.sg, OneMap, or Overpass, mutate `qa/p19`, load or mutate inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P357 P19 cache-age structured policy:
Structured source-policy reports should expose that `p19-gap-status` reports cache ages, not only that it is safe. The shared `recent_public_source_gap_sample` block now includes `cache_status_reports_age_days: true` alongside the existing no-API/no-write flags, so batch-plan and production readiness consumers can discover the age signal. This is reporting metadata and test coverage only; it does not run the P19 measurement, call data.gov.sg, OneMap, or Overpass, mutate `qa/p19`, load or mutate inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P358 P19 missing-postal status:
The read-only P19 cache-status command should expose which cached recent-source postals are missing from frozen v1, not only the aggregate 8-of-976 count. Its summary file status now includes `missing_postals_by_source` for HDB 2021-2026 geocoded rows and MCST 2021-2026 proxy rows, read from the existing cached summary. This is measurement-status reporting and test coverage only; it does not call data.gov.sg, OneMap, or Overpass, mutate `qa/p19`, load or mutate inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P359 P19 missing-postal structured policy:
Structured source-policy reports should carry the exact cached P19 missing-postal lists, not only the aggregate 8-of-976 miss count. The shared `recent_public_source_gap_sample` block now includes `missing_postals_by_source` for the HDB and MCST source groups surfaced by P358 status output. This is reporting metadata and test coverage only; it does not run the P19 measurement, call data.gov.sg, OneMap, or Overpass, mutate `qa/p19`, load or mutate inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P360 known P19 miss browser copy:
When a selected postal is one of the eight cached P19 recent-source misses, the browser should say that directly instead of showing only the aggregate 8-of-976 caveat. Generic no-result and other outside-bundle states keep the aggregate recent-source copy. This is web copy and test coverage only; it reads no protected data, runs no measurement, score, export, deploy, ingest, or network task, and does not touch locked weights.

2026-08-21 - P361 known P19 miss source-group coverage:
Known-miss browser copy must be tested for both cached P19 source groups, not only the HDB completion/geocoded branch. The focused render test now covers the MCST 2021-2026 proxy-row label as well. This is test coverage and evidence only; it does not change runtime behavior, read protected payloads, run measurements, score, export, deploy, ingest, network, or touch locked weights.

2026-08-21 - P362 known P19 miss public wording:
Browser copy for a known P19 missing postal should describe the public product limitation, not the cache implementation. The known-miss branch now says the postal is one of the 8 recent public-source postals missing from frozen v1, while keeping the HDB/MCST source-group label. This is web copy and test coverage only; it does not read protected payloads, run measurements, score, export, deploy, ingest, network, or touch locked weights.

2026-08-21 - P363 P19 known-miss drift guard:
The TypeScript browser list of known P19 missing postals must stay byte-for-byte aligned with the structured Python source-policy block. A focused batch-plan test now parses `web/app/page.tsx` and compares its known-miss postal/source mapping to `RECENT_PUBLIC_SOURCE_GAP_SAMPLE["missing_postals_by_source"]`, while also rejecting internal cache wording in browser source. This is test coverage and evidence only; it does not change runtime behavior, read protected payloads, run measurements, score, export, deploy, ingest, network, or touch locked weights.

2026-08-21 - P364 locked-score visual hierarchy guard:
The browser test for the locked score staying visually secondary should compare the actual CSS font sizes for the shelter exposure hero and locked-score badge, not only assert loose `font-size` substrings exist somewhere in the stylesheet. This is test coverage and evidence only; it does not change runtime behavior, score, export, deploy, ingest, network, public data, protected QA, or locked weights.

2026-08-21 - P365 unavailable locked-score copy:
When a record has no full locked score, the breakdown row should not repeat `No full locked score` as both value and metadata. The value remains the user-facing missing-score state, while the row metadata now says `Release sorting index unavailable`, and the live-region sentence says `Locked score unavailable in this bundle.` This is browser copy and accessibility test coverage only; it does not score, export, deploy, ingest, network, mutate public data or protected QA, or touch locked weights.

2026-08-21 - P366 locked-score manifest count guard:
The generated-data web test should prove the first-view locked-score availability disclosure from the actual configured bundle manifest, not only from a synthetic helper fixture. The test now pins the published manifest state counts, verifies they sum to the 124,443 record count, and checks the formatted availability line from that manifest. This is test coverage and evidence only; it does not mutate public data, score, export, deploy, ingest, network, or touch locked weights.

2026-08-21 - P367 title-card date-format guard:
The title-card shelter-map evidence date and bundle-generated date should be tested as formatted user-visible values, not only as source-code expressions. The formatter test pins the current manifest timestamps to the Singapore-rendered dates `2 Aug 2026` and `5 Aug 2026`, and preserves the `Unavailable` fallback when manifest dates are absent. This is web test coverage only; it does not mutate public data, score, export, deploy, ingest, network, or touch locked weights.

2026-08-21 - P368 walk QA issue label:
The copied walk QA JSON should use a walk-framed primary issue label. The browser payload now emits `issue: "user_reported_better_walk"` while preserving `route_mode` as a compatibility alias for the existing payload shape. Historical QA GeoJSON evidence still contains the old `user_reported_better_walk_route` label and is intentionally left untouched. This is browser payload copy and test coverage only; it does not mutate QA evidence, score, export, deploy, ingest, network, or touch locked weights.

2026-08-21 - P369 greenery proxy walk-adjacent copy:
The selected-walk details should not describe the heat greenery proxy as generic route geometry. The note now says `walk-adjacent greenery geometry`, keeping the feature framed as walk evidence while preserving the settled boundary that it is heat-only, sparse NParks geometry, not measured temperature and not Leaf Area Index. This is browser copy and test coverage only; it does not mutate shade geometry, source manifests, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P370 title-card night-lighting subtitle:
The first-view subtitle should name night lighting as the second map-evidence layer, not only the covered-walkway ratio and exposed gaps. The title card now says `See covered-walkway ratio, exposed gaps, and night lighting near transit`, matching the settled shelter-first product framing while keeping the locked score secondary. This is browser copy and test coverage only; it does not mutate lamp artifacts, public data, scoring, exports, deployment, or locked weights.

2026-08-21 - P373 P125 cached OSM status command:
Operators should be able to reprint the cached P125 OSM `addr:postcode` coverage measurement without rerunning Overpass or relying on an untracked absolute-path QA scratch script. `uv run python run.py p125-osm-status` now reads `qa/p125/overpass_sg_addr_postcode.json`, `qa/p125/overpass_sg_addr_postcode.query`, and the frozen v1 postal-universe parquet, reports coverage and safety flags, and declares `will_call_apis: false` / `will_write_files: false`. This is read-only reporting and test coverage only; it does not call Overpass, mutate cached P125/P19 evidence, alter inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P374 P125 status in structured source policy:
The structured batch-plan and production-readiness source-policy blocks should expose the same safe P125 status command as README and run.py, not only the static P125 coverage numbers. `osm_addr_postcode_registry` now includes `cache_status_command: uv run python run.py p125-osm-status`, no-API/no-write flags, cached query/output paths, and the 23 invalid distinct OSM postcode tag count. This is reporting metadata and test coverage only; it does not call Overpass, mutate cached P125/P19 evidence, alter inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P375 P125 cache-age reporting:
The P125 OSM status command should report the age of its cached Overpass query/output and frozen v1 universe file, matching the operational cache-age behavior already exposed for P19. `uv run python run.py p125-osm-status` now includes `mtime_utc` and `age_days` for existing files, and the structured P125 source-policy block declares `cache_status_reports_age_days: true`. This is read-only reporting and test coverage only; it does not call Overpass, mutate cached P125/P19 evidence, alter inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P376 P19 missing-row status:
The P19 recent public-source gap measurement should expose the actual cached missing rows, not only the aggregate 8-of-976 count and missing postcodes. `uv run python run.py p19-gap-status` now derives a read-only `missing_row_detail` block from `qa/p19/universe_gap_measurement_detail.json`, naming the six HDB 2026 block rows and two MCST proxy rows absent from frozen v1, plus the source and year distribution. The structured P19 source-policy block declares `cache_status_reports_missing_rows: true`. This is reporting and test coverage only; it does not call data.gov.sg, OneMap, or Overpass, does not mutate P19 caches/evidence, and does not alter inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P377 P19 missing-development clusters:
The P19 gap status should make the small recent-source miss signal judgeable at development level, because users and future v2 planning care whether missing rows are isolated or clustered. `uv run python run.py p19-gap-status` now derives `missing_development_clusters` from the cached P19 detail rows, showing that the eight missing rows collapse to four developments: SUN PLAZA SPRING (3 HDB rows), YISHUN BEACON (3 HDB rows), CANAAN (1 MCST proxy row), and MYRA (1 MCST proxy row). The structured P19 source-policy block declares `cache_status_reports_missing_development_clusters: true`. This is cache-derived reporting and test coverage only; it does not call APIs, mutate cached P19 evidence, build v2, score, export, deploy, or alter locked weights.

2026-08-21 - P378 P19 HDB cluster coordinates:
The P19 missing-development summary should locate the HDB clusters when cached OneMap geocode results already provide coordinates. `uv run python run.py p19-gap-status` now enriches HDB missing-development clusters with `coordinate_source`, `coordinate_count`, centroid, and bbox from `qa/p19/hdb_2021_2026_onemap_geocode_cache.json`. SUN PLAZA SPRING resolves to centroid 1.3584495, 103.9490744 and YISHUN BEACON resolves to centroid 1.4237757, 103.8363103; MCST proxy clusters remain unlocated because P19 did not cache geocodes for those rows. The structured P19 source-policy block declares `cache_status_reports_hdb_cluster_coordinates: true`. This is read-only cache-derived reporting and test coverage only; it does not call OneMap, mutate P19 caches/evidence, build v2, score, export, deploy, or alter locked weights.

2026-08-21 - P379 MCST missing-row location probe:
The two P19 MCST proxy rows absent from frozen v1 were checked with a bounded OneMap Search probe written to a new numbered `qa/p379/` cache/report, leaving the original P19 evidence untouched. Neither proxy postal was located by OneMap Search using the recorded location string or postal-only fallback. CANAAN's recorded `11 MATTAR ROAD 378720` query returned `11 MATTAR ROAD SINGAPORE 387720`, indicating a proxy postal mismatch or stale MCST row rather than a locatable missing v1 postal at 378720. MYRA's `9 MEYAPPA CHETTIAR ROAD 935456` and `935456` searches returned no candidates. This makes the P19 actionable gap narrower: the two HDB clusters are coordinate-backed; the two MCST proxy rows remain unlocated proxy evidence requiring separate source validation before any v2 promotion. This does not build v2, mutate P19 evidence, score, export, deploy, or alter locked weights.

2026-08-21 - P380 MCST proxy probe in source policy:
Structured source-policy reports should distinguish the coordinate-backed HDB P19 gap from the unvalidated MCST proxy rows. The shared P19 policy block now names the P379 MCST location probe, its cache/report paths, the 0 located / 2 unlocated result, CANAAN's conflicting candidate postal 387720 versus recorded 378720, and the no-score/no-export/no-P19-mutation boundary. This is reporting metadata and test coverage only; it does not call OneMap, mutate P19/P379 caches, build v2, score, export, deploy, or alter locked weights.

2026-08-21 - P381 MCST proxy browser caveat:
Browser outside-bundle copy should not present P19 MCST proxy rows as confirmed missing frozen-v1 postals after P379 showed they are unvalidated proxy evidence. HDB known-miss postals keep the confirmed recent-source missing-postal wording, while MCST proxy postals now say the row is unvalidated source-quality evidence rather than a confirmed missing address, naming MYRA's no-match result and CANAAN's postal conflict where applicable. This is browser copy and test coverage only; it does not mutate inputs, QA evidence, public data, scoring, exports, deployment, or locked weights.

2026-08-21 - P382 P19 aggregate caveat:
The aggregate recent-source gap copy should preserve the 8-of-976 measurement while exposing the evidence split discovered after P377-P379. Browser, README, CLAUDE, and production-readiness text now say the sample found 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy rows out of 976 (0.82%) public-source rows with postals. This is copy, documentation, readiness reporting, and test coverage only; it does not mutate inputs, QA evidence, public data, scoring, exports, deployment, or locked weights.

2026-08-21 - P383 P19 status MCST probe:
`p19-gap-status` should report the same MCST proxy validation boundary that structured source policy advertises. The cache-status command now reads the existing P379 report/cache and emits a `mcst_proxy_location_probe` block with report/cache presence, 0 located / 2 unlocated rows, unlocated developments, conflicting candidate postals, and the no-score/no-export/no-P19-mutation flags. This is read-only status reporting and test coverage only; it does not call OneMap, mutate P19/P379 caches, build v2, score, export, deploy, or alter locked weights.

2026-08-21 - P384 P19 evidence split in source policy:
Structured source-policy consumers should not have to infer the P19 evidence split from prose or nested status reports. The shared recent-public-source gap block now includes `evidence_split`: 6 coordinate-backed HDB missing rows, 2 unvalidated MCST proxy rows, 6 confirmed missing-address rows, and 2 source-quality-warning rows. This is reporting metadata and test coverage only; it does not mutate inputs, QA evidence, public data, scoring, exports, deployment, or locked weights.

2026-08-21 - P385 P19 status evidence split:
`p19-gap-status` should expose the same evidence split as batch-plan and readiness, not require operators to infer it from development clusters and the MCST probe. The cache-status report now includes top-level `evidence_split` derived from existing cached P19/P379 status blocks: 6 coordinate-backed/confirmed HDB missing rows and 2 unvalidated/source-quality MCST proxy rows. This is read-only reporting and test coverage only; it does not call APIs, mutate P19/P379 caches, build v2, score, export, deploy, or alter locked weights.

2026-08-21 - P386 readiness P19 evidence split:
Production readiness should expose the P19 evidence split as a direct feature field, not only buried inside the full source-policy block. `features.recent_public_source_gap_evidence_split` now aliases the structured source-policy split so operators can read the confirmed-address versus source-quality-warning counts without traversing nested policy metadata. This is readiness reporting and test coverage only; it does not mutate inputs, QA evidence, public data, scoring, exports, deployment, or locked weights.

2026-08-21 - P387 P19 status help evidence split:
Operator help should advertise that `p19-gap-status` reports the P19 evidence split, not only missing rows, MCST probe and cache ages. `run.py --help` and README now name the evidence split in the read-only P19 status command description. This is documentation/help text and test coverage only; it does not call APIs, mutate inputs or QA evidence, score, export, deploy, or alter locked weights.

2026-08-21 - P388 lamp overlay runner boundary:
`lamp-overlay` already existed as a `run.py` dispatch path for `pipeline.lamp_overlay`, but the visible runner help did not name it in the gated pipeline task list. The help text and README now expose it as a gated, owner-approved replacement-artifact command that must write a new numeric directory such as `web/public/data/lamp_posts_v2` and must not mutate `lamp_posts_v1`. This is operator documentation and test coverage only; it does not run the builder, write public data, score, export, deploy, or touch locked weights.

2026-08-21 - P389 structured lamp overlay replacement policy:
Batch-plan and production-readiness source policy should expose the same lamp-overlay replacement boundary as the runner and README. The structured `night_lighting_layer` policy now names the owner-approved replacement command example, marks replacement as owner-approval-required, and declares existing artifact mutation forbidden. This is reporting/test coverage only; it does not run the builder, write public data, score, export, deploy, or touch locked weights.

2026-08-21 - P390 night-lighting map legend:
The night-lighting overlay is the settled second map layer, so when it is enabled the visible map legend should name the lamp-post points instead of leaving them only in the toggle/status copy. The inline legend now adds `LTA lamp points` only while the lamp overlay is enabled, using the same yellow lamp marker color as the layer control. This is browser copy/styling and test coverage only; it does not rebuild the lamp artifact, write public data, score, export, deploy, or touch locked weights.

2026-08-21 - P391 distinct bus-stop map color:
The transit POI layer should let users visually distinguish MRT/LRT access points from bus stops while comparing walks to transit. Bus-stop dots and labels now use a distinct purple, and the inline legend bus dot matches that color; MRT/LRT dots remain hot pink. This is browser map styling and test coverage only; it does not mutate transit data, score, export, deploy, public data, or locked weights.

2026-08-21 - P392 exposed-gap legend wording:
The map legend should name the red dashed layer as `Exposed gaps`, not merely `Exposed`, because the exposure-gaps array with per-gap length and coordinates is the product's headline artifact. This is browser copy and test coverage only; it does not mutate route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P393 HDB shelter legend wording:
The map legend should name HDB inferred shelter as `HDB void-deck shelter` rather than `HDB inferred`, because users need to understand the physical shelter evidence instead of an implementation category. The source strip still keeps the more technical `HDB void-deck inference` label for evidence provenance. This is browser copy and test coverage only; it does not mutate route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P394 bridge shelter label:
Bridge and underpass route segments should be labelled as `Bridge/underpass shelter` in the visible map legend and source strip, because the product surface is explaining shelter evidence rather than infrastructure categories alone. This is browser copy and test coverage only; it does not mutate route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P395 access-walk source labels:
Route source-strip connector layers should render as `Postal access walk`, `Transit access walk`, and `Bus-stop access walk` instead of connector jargon. These labels describe the walk segment a resident sees while keeping the underlying source-layer identifiers unchanged for compatibility. This is browser copy and test coverage only; it does not mutate route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P396 access-link walk detail:
The selected-walk details strip should label the endpoint snap distance as `Access link` rather than `Snap connector`, because the latter is graph implementation jargon. The note now says it is the short walk from the postal or transit point onto the shelter-map walk. This is browser copy and test coverage only; it does not mutate route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P397 shortest-walk labels:
The walk display control and map legend should say `Shortest walk` instead of bare `Shortest`, because the user is comparing walks to transit rather than abstract route modes. The same-route legend state now says `Shortest walk (same)`. This is browser copy and test coverage only; it does not mutate route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P398 walk-display button labels:
The walk display segmented control should use parallel walk labels: `Sheltered walk`, `Both walks`, and `Shortest walk`. This keeps the control aligned with the shelter-first framing and avoids bare route-mode shorthand. This is browser copy and test coverage only; it does not mutate route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P399 direct-bus line label:
Direct bus fallback labels should say `Direct bus line estimate` rather than `Direct bus estimate`, because these records use a direct line to a bus stop while shelter-map walk verification is still pending. The existing caveat that the locked bus term remains 0 stays unchanged. This is browser copy and smoke/test coverage only; it does not mutate transit data, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P400 OneMap preview walk label:
Clicked-stop live preview metrics should say `OneMap preview walk` rather than generic `Preview walk`, because that selected-stop path is fetched from OneMap and is not part of the published shelter-map bundle. This is browser copy and test coverage only; it does not mutate live-preview routing, score values, exports, public data, deployment, or locked weights.

2026-08-21 - P401 selected transit stop badge:
The selected-stop badge should say `Viewing selected transit stop` rather than `Viewing selected stop`, because the selection changes the transit target used for the shelter-map walk comparison. This is browser copy and test coverage only; it does not mutate transit candidates, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P402 transit-target availability labels:
Transit target availability labels should say `current walk`, `published walk`, and `no published walk` instead of `selected walk`, `shelter-map walk`, and `no shelter-map walk`. This keeps the picker aligned with the published-bundle boundary while still showing which transit target has a usable walk. This is browser copy and test coverage only; it does not mutate transit target selection, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P403 selected transit stop preview copy:
OneMap preview status and preview-only caveat copy should say `selected transit stop` and `clicked transit stop` rather than generic stop wording. This keeps selected-stop preview copy aligned with the transit-target badge and makes clear that the clicked item changes the transit target, not the origin postal. This is browser copy and test coverage only; it does not mutate live-preview routing, transit candidates, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P404 walk display live-region labels:
The score-card live-region walk-display text should announce `sheltered walk` and `shortest walk` instead of bare `sheltered` and `shortest`, matching the visible walk display controls. Same-route shortest mode now announces `shortest walk same as sheltered walk`. This is accessibility copy and test coverage only; it does not mutate route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P405 exposure-gap live-region summary:
The score-card live region should announce the longest exposed gap as well as total exposed distance and gap count, because the longest gap is visible in the shelter evidence hero and is the most actionable part of the exposure-gaps array for non-visual users. This is accessibility copy and test coverage only; it does not mutate route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P406 traced walk segment counter:
The traced-correction feedback editor should count `walk segments` rather than generic `segments`, because the control is for user-suggested walking evidence corrections and now consistently uses walk-framed labels. This is browser copy and test coverage only; it does not mutate feedback JSON compatibility fields, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P407 traced walk segment selector labels:
The traced-correction feedback editor should label each segment selector as `Walk segment N` rather than generic `Segment N`, matching the walk-framed counter and correction actions. This is browser copy and test coverage only; it does not mutate feedback JSON compatibility fields, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P408 traced walk count grammar:
The traced-correction feedback editor should pluralize point and walk-segment counts correctly, because `2 points / 1 walk segments` is visibly unpolished in the user feedback flow. The counter now renders `1 point / 0 walk segments`, `2 points / 1 walk segment`, and plural segments beyond that. This is browser copy and test coverage only; it does not mutate feedback JSON compatibility fields, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P409 custom transit stop live-region wording:
The score-card live region should say `Custom transit stop selected` rather than generic `Custom stop selected`, matching the visible selected-transit-stop badge and clarifying that the user changed the transit target for the walk comparison. This is accessibility copy and test coverage only; it does not mutate live-preview routing, transit candidates, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P410 transit target picker heading:
The nearby-transit picker should introduce its selectable chips as `Nearby transit targets`, not just `Nearby transit` or `Nearby transit stops`, because choosing a chip changes the transit target for the shelter-map walk comparison. This is browser copy and test coverage only; it does not mutate transit candidates, live-preview routing, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P411 planning-area empty evidence copy:
The planning-area comparison empty state should match the selected comparison view. `No comparable full locked scores in this planning area` is accurate for the locked-score view but misleading after the user switches to rain-shelter, access, bus, heat, or crossing evidence. Non-overall evidence views now say `No comparable planning-area records for ...`, preserving the locked-score wording only for the locked-score sort. This is browser copy and test coverage only; it does not alter ranking data, ranking order, score values, exports, public data, deployment, or locked weights.

2026-08-21 - P412 published bundle caveats:
User-facing caveats about absent walks, disconnected transit, and missing full locked scores should name the `published shelter-map bundle`, not generic `this shelter-map bundle` or the unqualified bundle. The app is explaining what the shipped static artifact lacks, not a mutable local pipeline state. This is browser copy and test coverage only; it does not alter search behavior, route geometry, score values, exports, public data, deployment, or locked weights.

2026-08-21 - P413 published bundle missing-score wording:
Missing locked-score status should say `published shelter-map bundle`, including the live-region phrase and not-yet-scored visible reasons. Bare `in this bundle` copy is less precise than the settled published-artifact framing. This is browser copy, smoke-script alignment, and test coverage only; it does not alter score states, score values, search behavior, route geometry, exports, public data, deployment, or locked weights.

2026-08-21 - P414 transit candidate source contract:
The client-side nearest-transit helper should describe candidate-list limits as a property of the `published shelter-map bundle`, not the `current` bundle. These comments guide future browser work around straight-line candidate chips versus routed per-candidate evidence, so they should use the same artifact boundary as user-facing caveats. This is source-contract wording and test coverage only; it does not alter candidate derivation, transit selection, route geometry, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P415 outside-bundle heading:
The outside-bundle empty-state heading should say `Outside published shelter-map bundle`, matching the body copy and the settled published-artifact boundary. The previous `Outside shelter-map bundle` heading was accurate but less precise after P412/P413 moved the surrounding caveats to published-bundle wording. This is browser copy and test coverage only; it does not alter search behavior, route geometry, score values, exports, public data, deployment, or locked weights.
2026-08-21 - P416 footer headline evidence copy:

The page footer now says "Source-derived covered-walkway ratio, exposed gaps, and night-lighting map evidence." The prior "covered-walkway, exposure-gap" wording used an implementation-style singular adjective and did not match the settled product framing that the ratio and per-gap exposure evidence are the headline.

2026-08-21 - P417 shared metadata evidence framing:

The site metadata description now says "covered-walkway ratio, exposed gaps, night-lighting evidence" instead of "covered-walkway exposure gaps." Metadata is the share-card/search-snippet surface, so it should name the same distinct evidence artifacts as the first-view title and footer rather than compressing the ratio and gap evidence into one phrase.

2026-08-21 - P418 map accessible label headline evidence:

The empty-map aria label now names covered-walkway ratio and exposed gaps before transit stops and night-lighting evidence. Non-visual users should hear the same shelter-first evidence framing as sighted users before search, not only a transit-POI inventory.

2026-08-21 - P419 night lighting public copy:

Shared metadata, the first-view footer, and the empty-map aria label now use `night lighting evidence` instead of `night-lighting evidence`. The rest of the visible product surface already used plain `night lighting`, and the non-hyphenated noun phrase is clearer for users while preserving internal lamp-layer identifiers.

2026-08-21 - P420 docs night lighting public copy:

README and CLAUDE now use plain `night lighting` in the product introduction, local artifact description, and replacement-overlay boundary. This keeps documentation aligned with the browser copy from P419 while preserving the `lamp-overlay` task name, `lamp_posts_v1/` artifact path, and internal layer identifiers.

2026-08-21 - P421 structured night lighting policy copy:

The structured batch-plan/readiness source-policy role for `night_lighting_layer` now says `separate night lighting map layer`, matching browser and documentation copy. Machine-facing keys, `lamp-overlay`, `lamp_posts_v1/`, source identity, release gates, and scoring policy remain unchanged.

2026-08-21 - P422 night lighting layer note:

The visible note under the `Night lighting` map-layer control now starts with `Night lighting layer` instead of `LTA lamp-post layer`, while still naming the 126,144 LTA lamp-post points and source date. The control should present the user-facing layer first and the raw source second.

2026-08-21 - P423 HDB missing-row copy:

Known HDB outside-bundle postals now say they are one of the 6 coordinate-backed HDB missing rows from frozen v1, instead of one of 8 recent public-source postals. The 2 MCST proxy rows remain explicitly unvalidated source-quality evidence, so the browser copy preserves the P19/P379 evidence split at the individual-postal level.

2026-08-21 - P450 Section 10 reference status:

The tracked Section 10 presentation document now describes the P18 shelter-first browser layout as an implemented reference rather than a proposal-only artifact. The product direction is settled: lead with shelter-map walk exposure, keep the locked score visible but secondary, and treat the prior five locked-term rows as pre-P18 context. This is documentation/test alignment only; it does not change app rendering, scoring, exports, public data, deployment, or locked weights.

2026-08-21 - P455 DataMall discovery drift first-view copy:

The first-view Covered Linkway freshness caveat now carries the safe 21 Aug 2026 metadata-only DataMall discovery result: current shelter-layer discovery URLs differ from frozen v1, while no payload bytes were downloaded or compared. This distinction matters because the manifest-only freshness line truthfully says no upstream URLs were probed, but the separate discovery-only check is still a refresh signal. Frozen v1 remains untouched; any approved refresh must be a new numbered input version.

2026-08-21 - P456 named DataMall discovery drift copy:

The first-view DataMall discovery caveat should name the two drifted shelter layers rather than saying only `shelter-layer discovery URLs`. The measured discovery-only report named Covered Linkway and pedestrian bridge/underpass as changed, with traffic signals still matching, so the browser now says current Covered Linkway and bridge/underpass discovery URLs differ from frozen v1. This remains a copy/test clarification only; it does not fetch payloads, mutate inputs, score, export, deploy, or alter locked weights.

2026-08-21 - P457 dated P19 public-source check copy:

The cached P19 recent public-source miss measurement was generated on 16 Aug 2026, so browser caveats should not describe it only as `recent`. First-view, search no-result, outside-bundle, and known HDB missing-row copy now name the `16 Aug 2026 public-source check` while preserving the measured 6 coordinate-backed HDB rows, 2 unvalidated MCST proxy rows, 976-row denominator, and 0.82% rate. This is copy/test clarity only; it does not call APIs, mutate P19 evidence, alter inputs, score, export, deploy, or touch locked weights.

2026-08-21 - P459 dated P19 structured source policy:

Dry-run batch planning and production readiness should carry the cached P19 measurement date as structured data, not only in prose. The `recent_public_source_gap_sample` policy now names `P19 16 Aug 2026 public-source gap sample` and records `generated_at_utc: 2026-08-16T02:08:55.624822+00:00`. This is reporting/test alignment only; it does not call APIs, mutate P19 evidence, alter inputs, score, export, deploy, or touch locked weights.

2026-08-21 - P460 dated DataMall discovery source policy:

Dry-run batch planning and production readiness should carry the local check date for the DataMall geospatial discovery drift, matching the browser's first-view caveat. The `datamall_geospatial_discovery` policy now records `checked_at_local_date: 2026-08-21` while preserving the no-payload/no-manifest-write command, the changed Covered Linkway and bridge/underpass sources, and the new-numbered-input-version rule. This is reporting/test alignment only; it does not probe DataMall, fetch payloads, mutate manifests or inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P461 selected-stop preview source contract:

Transit-stop picker source comments should match the current selected-stop behavior. The published bundle still lacks a ranked per-stop candidate list, so chip comparisons remain straight-line only; however, selecting a candidate may update the displayed walk using precomputed candidate geometry or a live OneMap preview. The obsolete statement that the map route line stays on the auto-picked best transit stop is removed and guarded by tests. This is source-contract/test alignment only; it does not change runtime behavior, call OneMap, mutate public data, score, export, deploy, or touch locked weights.

2026-08-21 - P462 walk heat evidence copy:

The first-view Leaf Area Index caveat should use the settled walk-evidence frame instead of saying `route heat evidence`. The browser now says walk heat evidence uses shelter plus sparse walk-adjacent greenery geometry, while preserving that LAI is freshness-only and not measured temperature. This is browser copy/test coverage only; it does not alter heat scoring, inputs, exports, public data, deployment, or locked weights.

2026-08-21 - P463 clicked-stop preview scope guard:

Agent-facing scope guards should not forbid the clicked-stop OneMap preview surface that already exists. `CLAUDE.md` now says there is no turn-by-turn navigation, and that clicked-stop OneMap walk previews are evidence only and must not become live navigation or mutate locked scores. This preserves the static shelter-map product boundary while removing the contradictory `no live routing UI` phrase. This is documentation/test coverage only; it does not change browser behavior, call OneMap, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P464 dated README DataMall discovery guidance:

README operator guidance should carry the same dated DataMall geospatial discovery result now shown in the browser and readiness policy. It now says the 21 Aug 2026 metadata-only check found Covered Linkway and bridge/underpass discovery URLs differ from frozen v1, while traffic signals still matched, and preserves the no-payload/no-manifest-write command plus the new-numbered-input-version rule. This is documentation/test alignment only; it does not call DataMall, download payloads, mutate manifests or inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P465 browser DataMall matched-source boundary:

The first-view Covered Linkway freshness caveat should not make DataMall geospatial discovery drift look broader than measured. Browser copy now says the 21 Aug 2026 metadata-only check found Covered Linkway and bridge/underpass discovery URLs differ from frozen v1, while traffic signals still matched. This keeps the user-facing caveat aligned with README and readiness structured policy. It is copy/test alignment only; it does not call DataMall, download payloads, mutate manifests or inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P466 README legacy Leaf Area Index hash boundary:

README operator guidance should distinguish the legacy published bundle from the future score-provenance policy. The current published manifest carries `leaf_area_index` as a source hash, but P23/P181 settled that LAI is a non-score reference table and future score provenance excludes it. README now says the published legacy bundle may carry LAI as a non-score reference source hash, while LAI remains outside route geometry, shade-proxy geometry, and score evidence. This is documentation/test alignment only; it does not mutate public data, source manifests, score provenance, scoring, exports, deployment, or locked weights.

2026-08-21 - P467 OSM postcode total in product copy:

The P125 Overpass measurement should be described as a distinct-postcode measurement, not only as a frozen-v1 overlap count. README and browser first-view copy now state that P125 found 25,879 valid distinct OSM `addr:postcode` values, of which 25,873 overlap the 124,443 frozen v1 postals and 6 are valid OSM-only postcodes. This keeps the OSM source policy empirical while preserving the conclusion that OSM remains geometry evidence rather than the address registry. This is copy/test alignment only; it does not call Overpass, mutate cached P125 evidence, alter inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P468 readiness OSM postcode total:

Production-readiness human policy text should match the structured P125 OSM source-policy block. It now says P125 found 25,879 valid distinct live OSM `addr:postcode` values and 25,873 overlapping frozen postals, rather than only saying OSM covers 25,873 frozen postals. This is readiness copy/test alignment only; it does not call Overpass, mutate cached P125 evidence, alter inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P469 agent OSM postcode total:

Agent-facing startup guidance should carry the same P125 OSM measurement as README, browser copy, and readiness. `CLAUDE.md` now says P125 found 25,879 valid distinct live OSM `addr:postcode` values, 25,873 overlapping frozen v1, and 6 valid OSM-only postcodes, while preserving that OSM is geometry evidence rather than the primary address registry. This is documentation/test alignment only; it does not call Overpass, mutate cached P125 evidence, alter inputs, score, export, deploy, public data, or touch locked weights.

2026-08-21 - P470 lamp-post attribution status:

`ATTRIBUTION.md` should reflect the current shipped night lighting layer, not the older P1 audit state. Lamp posts now reach shipped artifacts through the separate `web/public/data/lamp_posts_v1/` night lighting map layer, so the attribution table lists `lamp_posts` as an LTA Singapore Open Data Licence source and the candidate-source note no longer says lamp posts are unshipped. `NOTICE` remains untouched because repo integrity pins its historical blob. This is attribution/documentation/test alignment only; it does not build lamp artifacts, mutate public data, score, export, deploy, or touch locked weights.

2026-08-21 - P471 NOTICE lamp-post attribution:

The public NOTICE attribution block should advance when the shipped source set advances. `NOTICE` now uses the S.H.I.O.K. Shelter Map name and lists `lamp_posts` as an LTA Singapore Open Data Licence source, matching the shipped `lamp_posts_v1` night lighting map layer. The repo-integrity expected NOTICE blob is intentionally updated to `5ccfd88ea706cb129bc602346d8db34fc8005781` so the sync-bot guard protects the newer attribution block rather than the older pre-night-lighting one. This is attribution/tripwire/test alignment only; it does not build lamp artifacts, mutate public data, score, export, deploy, or touch locked weights.

2026-08-22 - P473 P19 MCST probe safe default:

`run.py p19-mcst-locations` should be safe to inspect like the other P19/P125 status commands. The task runner now invokes `scripts.analysis.p19_mcst_missing_locations --cache-status-only`, which reads the existing P379 MCST probe cache/report and reports `will_call_apis: false` and `will_write_files: false` instead of defaulting to the write-capable OneMap probe. The underlying script still supports explicit direct refresh/probe runs, but operator policy and docs now mark the runner path as a read-only status command. This is measurement-tooling safety and documentation only; it does not call OneMap, mutate P19/P379 evidence, build v2, score, export, deploy, or touch locked weights.

2026-08-22 - P474 P379 direct-script safe default:

The P379 MCST probe script itself should be safe when invoked directly, not only through `run.py`. `scripts.analysis.p19_mcst_missing_locations` now defaults to the same cache-status-only report as the runner and requires explicit `--probe` before it may call OneMap or write the P379 cache/report. `--refresh-cache` is now documented as a `--probe` modifier. This preserves the ability to run the bounded two-row probe intentionally while making accidental direct script invocation read-only by default. This is measurement-tooling safety only; it does not call OneMap, mutate P19/P379 evidence, build v2, score, export, deploy, or touch locked weights.

2026-08-22 - P475 check task safe boundary:

The task runner should not let the short command `run.py check` look like a safe report while dispatching the upstream network/hash probe. `run.py check` now requires exactly one of `--freshness-only` or `--geospatial-discovery-only`; bare and ambiguous invocations fail before spawning `pipeline.fetch`. The deliberate low-level probe remains available as `uv run python -m pipeline.fetch check` for maintainers who explicitly choose it. This is operator-safety tooling only; it does not call upstream APIs, fetch payloads, mutate manifests or inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-22 - P476 readiness gate summary:

The readiness CLI should have a concise release-gate view because the full report is intentionally large: it validates thousands of existing static artifact files and then emits deeply nested batch, bundle, provenance, source-policy, and feature metadata. `scripts.production_readiness --gate-summary` now prints only the same computed gate verdict, checks, warnings, errors, and release-gate summary without changing any gate logic. This is operator-output ergonomics only; it does not skip validation, waive OneMap, mutate inputs or public data, score, export, deploy, protected QA evidence, or locked weights.

2026-08-22 - P477 readiness summary discoverability:

The concise readiness gate summary should be discoverable from the task runner and README, not only from the underlying module help. `run.py --help` and README now name `readiness --gate-summary`, and the task-runner test suite proves the flag is forwarded to `scripts.production_readiness`. This is operator documentation and routing coverage only; it does not change readiness gate logic, skip validation, mutate inputs or public data, score, export, deploy, protected QA evidence, or locked weights.

2026-08-22 - P478 P19 structured source labels:

The structured P19 source-policy block should carry the same private-strata caveat as the human-facing copy. Its source labels now say `HDB completion geocoded rows` and `BCA MCST constitution-date proxy rows`, with explicit limitations that HDB postals come from OneMap geocoding and BCA MCST constitution date is onboarding proxy evidence rather than TOP or completion date. This is structured reporting and test coverage only; it does not mutate P19/P379 evidence, call APIs, build v2, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-22 - P479 freshness timestamp timezone:

The browser source-freshness date should not present a UTC measurement date as if it were an unspecified local date. `run.py check --freshness-only` prints an ISO UTC timestamp; the current check time was `2026-08-21T16:47:08.896536+00:00`, which is 22 Aug in Singapore. The first-view browser copy now says `21 Aug 2026 UTC manifest-only check`. This is browser copy and test coverage only; it does not rerun freshness, probe upstream APIs, mutate manifests or inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-22 - P480 Leaf Area Index freshness framing:

The first-view freshness line should not make NParks Leaf Area Index sound like a core route-evidence freshness boundary. The manifest-only freshness report still names `leaf_area_index` as the oldest current source, but browser copy now leads with the count summary and explicitly calls Leaf Area Index a freshness-only reference table near its 120-day threshold. The separate LAI caveat remains in place. This is browser copy and test coverage only; it does not rerun freshness beyond the zero-mutation report, probe upstream APIs, mutate manifests or inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-22 - P481 README frozen-v1 status:

The README status line should name the frozen v1 universe before the reader reaches the longer universe-policy section. It now says the project is a live static shelter-map pilot over the frozen v1 124,443-record universe instead of the vaguer source-derived universe. This is documentation and test coverage only; it does not alter browser rendering, scoring, exports, inputs, public data, deployment, protected QA evidence, or locked weights.

2026-08-22 - P482 README universe provenance wording:

The README universe section should describe what v1 is made from instead of repeating `source-derived set`. It now says frozen v1 is 124,443 records built around a June 2020 OneMap-derived postal scrape plus later local route and source evidence. This is documentation and test coverage only; it does not alter browser rendering, scoring, exports, inputs, public data, deployment, protected QA evidence, or locked weights.

2026-08-22 - P483 browser OSM coverage check date:

The browser OSM postcode coverage line should not present a cached Overpass measurement as an undated live fact. P125 evidence records the Overpass OSM base timestamp as `2026-08-20T13:44:51Z`, so the first-view copy now starts `20 Aug 2026 OSM addr:postcode check`. This is browser copy and test coverage only; it does not call Overpass, mutate caches or inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-22 - P484 dated P125 policy surfaces:

Operator-facing docs and structured readiness/batch-plan policy should date the cached P125 Overpass postcode measurement instead of saying `live OSM` or `P125 live Overpass`. README, CLAUDE, production readiness, and batch-plan policy now name the P125 20 Aug 2026 Overpass check while preserving the measured counts. This is documentation, reporting copy, and test coverage only; it does not call Overpass, mutate caches or inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-22 - P485 P19 sample boundary wording:

P19 is a sampled 976-row public-source gap check, not a complete current-source census. Browser, README, CLAUDE, readiness, and batch-plan wording now call it a sampled check or a sampled current-source gap while preserving the 6 coordinate-backed HDB rows, 2 unvalidated MCST proxy rows, and 0.82% arithmetic. This is documentation, browser copy, reporting copy, and test coverage only; it does not call APIs, mutate P19/P379 caches or inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-22 - P486 browser P19 sample label:

The browser's P19 first-view label should carry the same sample boundary as the body copy. It now says `16 Aug 2026 public-source sample` instead of `16 Aug 2026 public-source check`, including the known-postal outside-bundle copy. This is browser copy and test coverage only; it does not call APIs, mutate P19/P379 caches or inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-22 - P487 freshness manual-source summaries:

The manifest-only freshness report should name manual-policy sources the same way it already names stale and unknown-age sources. `run.py check --freshness-only` now prints `Manual sources: train_station_codes, osm_extract` for the current local manifest, and the broader fetch check path uses the same summary helper. This is operator reporting and test coverage only; it does not probe upstream APIs, fetch, ingest, score, export, deploy, mutate manifests or inputs, public data, protected QA evidence, or locked weights.

2026-08-22 - P488 runner surface docs alignment:

README and `CLAUDE.md` should describe the same task split as `run.py --help`. They now include `readiness --gate-summary` in safe reports, include `score-batch` and `export-transit` in gated pipeline tasks, and describe `test` as a local test task rather than a gated pipeline task. This is documentation and test coverage only; it does not execute runner tasks beyond `--help`, call APIs, mutate inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-22 - P489 night lighting operator wording:

Readiness and analysis surfaces should use the same `night lighting` wording as the browser and docs. The heat-presentation UI audit now points at the current metadata string, and production readiness warning/error text says `night lighting` instead of `night-lighting`. This is operator/audit wording and test coverage only; it does not change the lamp overlay artifact, map rendering, inputs, scoring, exports, deployment, public data, protected QA evidence, or locked weights.

2026-08-22 - P490 heat-presentation audit line references:

The heat-presentation analysis should identify the exact current browser lines it audits, not only search for matching strings somewhere in the file. The UI audit line references now match current `web/app/layout.tsx`, `web/app/page.tsx`, and `web/lib/transit-popup.ts`, and the focused test asserts both string resolution and exact-line matches. This is analysis metadata and test coverage only; it does not change browser rendering, inputs, scoring, exports, deployment, public data, protected QA evidence, or locked weights.

2026-08-22 - P491 P19 sample wording alignment:

README, `CLAUDE.md`, and production readiness should use the same `public-source sample` wording as the browser for the 16 Aug 2026 P19 measurement. The headline source-policy text no longer calls the sampled measurement a `check`, while retaining the 6 coordinate-backed HDB missing rows, 2 unvalidated MCST proxy rows, 976-row denominator, and 0.82% miss-rate context. This is documentation/reporting copy and test coverage only; it does not call APIs, mutate P19/P379 caches, inputs, scoring, exports, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P492 P19 browser sample identifier:

Browser source should not name the 16 Aug 2026 P19 sample label as a `check` identifier after the product copy moved to `public-source sample`. `RECENT_PUBLIC_SOURCE_CHECK_LABEL` is renamed to `RECENT_PUBLIC_SOURCE_SAMPLE_LABEL` while preserving the rendered text and the measured P19 counts. This is browser source/test naming only; it does not change rendered copy, call APIs, mutate P19/P379 caches, inputs, scoring, exports, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P493 P19 release-policy status:

The cached P19 gap status report should expose the same release-policy classification as the browser/readiness copy: the measurement is the `16 Aug 2026 public-source sample`, coordinate-backed HDB rows are confirmed address-universe gaps, and unlocated MCST proxy rows are source-quality warnings. The read-only `p19-gap-status` output now derives a `release_policy` block from existing cached detail and P379 probe status without calling APIs or writing files. This is reporting/test coverage only; it does not mutate P19/P379 caches, inputs, scoring, exports, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P494 P125 OSM source-policy status:

The cached P125 OSM addr:postcode status and shared source-policy block should state OSM's product role explicitly: geometry evidence and coverage cross-check, not the address registry. The direct `p125-osm-status` output and the batch-plan/readiness policy now carry `source_role`, `registry_policy`, and the full verdict `not sufficient as primary Singapore address registry` while preserving the measured 25,879 valid distinct OSM postcodes, 25,873 overlap, 6 OSM-only postcodes, and 20.791045% v1 coverage. This is reporting/test coverage only; it does not call Overpass, mutate P125 caches, inputs, scoring, exports, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P495 P125 operator-help wording:

Runner help and README should describe `p125-osm-status` the same way as the structured P125 policy: a cached OSM addr:postcode coverage cross-check and registry-policy report, not a generic address-coverage measurement. The command documentation now states that it reports OSM as geometry evidence and coverage cross-check rather than the address registry, while retaining its no-API/no-write boundary. This is documentation/help/test coverage only; it does not call Overpass, mutate P125 caches, inputs, scoring, exports, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P496 P125 structured measurement label:

The P125 structured `measurement` label should not lag behind the settled OSM release policy. It now says `P125 20 Aug 2026 Overpass addr:postcode coverage cross-check`, matching the adjacent `source_role`, `registry_policy`, and verdict fields that classify OSM addr:postcode data as geometry evidence and a coverage cross-check rather than the address registry. This is reporting/test coverage only; it does not call Overpass, mutate P125 caches, inputs, scoring, exports, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P497 P125 copy cross-check wording:

User-facing and agent-facing P125 copy should use the same release-policy label as the structured status report. README, `CLAUDE.md`, production-readiness copy, and browser first-view source copy now describe the P125 result as an Overpass/OSM addr:postcode coverage cross-check, while preserving the measured 25,879 valid distinct OSM postcodes, 25,873 overlap, 6 OSM-only postcodes, and the statement that OSM is geometry evidence rather than the address registry. This is copy/test coverage only; it does not call Overpass, mutate P125 caches, inputs, scoring, exports, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P498 Overture unknown-age freshness naming:

The browser and README freshness caveat should name the source with unknown age rather than hiding it behind `1 candidate address source`. The zero-mutation freshness report names `overture_addresses_sg_candidate`, so README now records that the Overture Maps Addresses Singapore candidate has no timestamp in the cached manifest, and the browser first-view freshness line names `Overture Maps Addresses - Singapore candidate` directly. This is copy/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P499 source-freshness warning names:

Readiness warnings should be readable without forcing the operator to map source keys back through `sources.yaml`. Source-freshness warnings now keep structured `by_status` keys unchanged but include each non-current source's display name in the human warning string, for example `overture_addresses_sg_candidate (Overture Maps Addresses — Singapore candidate)`. This is operator reporting/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P500 non-score source hash warning labels:

Readiness score-provenance warnings should name known non-score reference source hashes without changing gate semantics. The active legacy bundle still reports structured `non_score_reference_source_hashes: ["leaf_area_index"]` and `unexpected_source_hashes: ["leaf_area_index"]`, but the human warning now says `leaf_area_index (NParks Leaf Area Index)` so operators can understand the LAI caveat without looking up the key. This is operator reporting/test coverage only; it does not mutate manifests, inputs, scoring, exports, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P501 P19 stale test literals:

Active tests should not preserve old exact P19 `8 missing rows` copy after the product wording moved to 6 coordinate-backed HDB missing rows plus 2 unvalidated MCST proxy warnings. Web and docs tests now rely on positive assertions for the current 6+2 copy and broader stale-label checks, while historical `decisions.md` entries remain append-only history. This is test/evidence cleanup only; it does not mutate P19/P379 evidence, inputs, scoring, exports, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P502 freshness summary source names:

The manifest-only freshness report should include source display names in grouped stale/manual/unknown-age summaries, not only source keys. This keeps `run.py check --freshness-only` actionable as an operator report without requiring the user to cross-reference `pipeline/config/sources.yaml`. This is operator reporting/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P503 UI freshness source names:

The browser first-view data-freshness line should use the same source display names as the manifest-only freshness report when listing stale sources. The stale list now names Traffic Signals, Planning Area Boundaries (MP2019 No Sea), NParks Nature Ways, NParks Tracks, NParks Heritage Trees, and NParks Heritage Road Green Buffers instead of a lowercased shorthand. This is copy/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P504 README freshness summary names:

README operator guidance should document that `run.py check --freshness-only` grouped action summaries include source display names, for example `traffic_signals (Traffic Signals)`, so the docs match the P502 CLI output and P503 first-view copy. This is docs/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P505 agent-doc freshness summary names:

Agent-facing docs should carry the same freshness-report boundary as README: `run.py check --freshness-only` is zero-mutation, reads only the local manifest and source config, probes no upstream APIs, and its grouped action summaries include source display names. This is docs/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P506 structured freshness policy named summaries:

The shared batch-plan/readiness source-freshness policy should machine-record that grouped freshness summaries include source display names. `SOURCE_FRESHNESS_POLICY` now carries `grouped_summaries_include_source_names: true`, matching the CLI, README, agent docs, and browser copy. This is structured reporting/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P507 run help freshness summary names:

`run.py --help` should carry the same freshness-only contract as the CLI output and docs: the report reads `raw/manifest.json`, probes no upstream URLs, writes no manifest, and groups action summaries with source names. This is runner help/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P508 fetch help freshness summary names:

The lower-level `pipeline.fetch check --help` text should match the public runner help because `run.py check --help` delegates there. Its `--freshness-only` help now states that the report avoids upstream probes, writes no manifest, and keeps source names in grouped action summaries. This is lower-level CLI help/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P509 positive fetch help freshness wording:

`pipeline.fetch check --help` should describe named freshness summaries positively. The `--freshness-only` help now says grouped action summaries include source names instead of saying the report avoids omitting names. This is lower-level CLI help/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P510 fetch help Shelter Map source wording:

`pipeline.fetch check --help` should use the S.H.I.O.K. Shelter Map product frame, not generic `SHIOK datasets` wording. The lower-level fetch/check description now says it fetches/checks upstream S.H.I.O.K. Shelter Map sources. This is lower-level CLI help/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P511 freshness stale action:

The manifest-only freshness report should print the release action for stale sources, not only the stale-source list. When stale sources exist, `run.py check --freshness-only` now prints `Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.` This is operator reporting/test coverage only; it does not probe upstream APIs beyond the manifest-only safe report, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P512 readiness stale freshness action:

Production-readiness source freshness warnings should carry the same stale-source action as `run.py check --freshness-only`, because readiness is the release-facing operator gate. When stale sources exist, the warning now appends `Stale freshness action: report and plan a versioned refresh; do not mutate frozen v1 in place.` This is operator reporting/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P513 freshness docs stale action:

README and agent-facing docs should carry the same stale-source action as `run.py check --freshness-only` and the production-readiness warning. When stale sources appear, operators should report them and plan a versioned refresh, not mutate frozen v1 in place. This is docs/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P514 browser stale freshness boundary:

The browser first-view freshness line should not only name stale sources; it should also preserve the same release boundary shown in operator reports and docs. The line now says stale-source refreshes require a new numbered input version, not an in-place frozen-v1 mutation. This is browser copy/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P515 freshness help refresh boundary:

`run.py --help` and `pipeline.fetch check --help` should expose the same stale-source boundary as the freshness report, readiness gate, docs, and browser copy. The help text now says stale sources require a versioned refresh while preserving the zero-mutation/no-upstream-probe contract. This is operator help/test coverage only; it does not probe upstream APIs, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P516 geospatial discovery help version boundary:

The metadata-only DataMall geospatial discovery command should expose the same new-version boundary as README. `run.py --help`, `pipeline.fetch check --help`, and CLAUDE now say changed discovery URLs require new-version inputs/new numbered input versions while preserving the no-payload-download and no-manifest-write contract. This is operator help/docs/test coverage only; it does not probe upstream APIs in this task, mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P517 geospatial discovery action output:

The DataMall geospatial discovery-only report should not stop at changed/error counts; it should print the release action when changed discovery URLs or errors are present. The report now prints `Geospatial discovery action: report and plan a new numbered input version; do not repair frozen v1 in place.` while preserving the metadata-only/no-payload/no-manifest-write boundary. This is operator reporting/test coverage only; it does not mutate manifests or inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P518 P19 help sample label:

`p19-gap-status` help should name the cached result as the P19 16 Aug 2026 public-source sample, not a generic measurement, because it is sampled gap evidence rather than a complete current-source census. The command remains read-only and reports existing cache status without API calls or file writes. This is runner help/test coverage only; it does not mutate P19/P379 caches, inputs, scoring, exports, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P519 P19 MCST help boundary:

`p19-mcst-locations` help and README should describe the cached P379 probe as status for unvalidated P19 MCST proxy rows, not confirmed missing addresses. The command remains cache-status-only by default and reports existing evidence without API calls or file writes. This is runner/docs/test coverage only; it does not mutate P19/P379 caches, inputs, scoring, exports, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P520 P125 help cross-check label:

`p125-osm-status` help should name the cached report as the P125 20 Aug 2026 Overpass `addr:postcode` coverage cross-check, not generic P125 Overpass output. The command remains read-only and frames OSM as geometry evidence rather than the address registry. This is runner help/test coverage only; it does not mutate P125 caches, inputs, scoring, exports, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P521 Overture candidate help boundary:

Overture Addresses SG command help should match the settled candidate-source policy: it is candidate-only postal-universe evidence and does not approve scoring or address-registry use. This is help/test coverage only; it does not run the Overture probe, mutate archives/caches/inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P522 postal-universe Overture policy help:

The postal-universe builder's `--include-overture-candidate` help and generated summary warning should carry the same Overture source boundary as the dedicated probe: archived Overture Addresses SG is candidate-only postal-universe evidence, not scoring or address-registry approval, and does not change defaults. This is help/warning/test coverage only; it does not build a universe, probe Overture, mutate archives/caches/inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P523 Overture source policy boundary:

The source config and readiness feature note should not imply that Overture Addresses SG is merely waiting on rescore time or generic promotion. It remains candidate-only postal-universe evidence, does not approve scoring or address-registry use, and requires raw archive, attribution, dedupe, coordinate-outlier review, and owner approval before any promotion. This is config/readiness wording and test coverage only; it does not probe Overture, build a universe, mutate archives/caches/inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P524 agent OneMap token controls:

Agent-facing startup guidance should carry the same postal-universe v2 OneMap Search boundary as README, batch-plan, and readiness: candidate validation is bounded by explicit token controls, 72-hour token refresh, and the current documented token-authenticated call-limit cap unless SLA approves a higher limit case-by-case. This is documentation/test coverage only; it does not call OneMap, mutate caches/inputs, build v2, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P525 runner batch-plan release boundary:

`run.py --help` should expose the same full-batch release boundary as README, CLAUDE, batch-plan, and readiness. `batch-plan` is a dry-run safe report, but the full-batch execution it plans remains one-attempt only, requires owner approval, and must keep bounded OneMap controls. This is runner help/test coverage only; it does not run batch planning, call APIs, mutate caches/inputs, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P526 geocode-universe versioned output guard:

Confirmed `geocode-universe` runs must obey the numbered-artifact rule before any cache/API work. Non-dry bounded OneMap geocode fills now refuse unversioned outputs and existing output/summary paths, so they cannot repair frozen v1 in place or overwrite an existing candidate artifact. Dry runs remain available for planning. This is command safety/test coverage only; it does not call OneMap, mutate caches/inputs, build v2, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P527 export output guard:

Write-capable export CLI actions must fail closed instead of using implicit default output directories. `pipeline.export export` and `export-transit` now require explicit `--output` and refuse non-empty targets, preserving the rule that release artifacts are written to fresh bundle directories rather than repaired in place. `refresh-provenance` now requires explicit `--output` and is documented as an in-place manifest mutation. `validate` remains read-only and keeps its default input. This is command safety/test coverage only; it does not score, export, mutate public data, deploy, modify protected QA evidence, or touch locked weights.

2026-08-22 - P528 score-batch output guard:

Non-dry score-batch CLI runs must name their output run directory explicitly. `pipeline.score_batch` no longer defaults non-dry CLI writes into `processed/score_batches`; it fails before loading inputs unless `--output-dir` is supplied. Dry runs still report the default target because they write nothing. This preserves the approved-script/direct-helper path where a run-specific directory is passed explicitly, while closing the accidental bare-command write path. This is command safety/test coverage only; it does not score, export, mutate processed data, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P529 bus-arrivals output guard:

Bus-arrival snapshot collection is an API-calling future reliability input and must be deliberate. `pipeline.bus_arrivals collect` now requires explicit `--output` before it can call LTA or append JSONL records, instead of defaulting to `raw/bus_arrivals/arrivals.jsonl`. Direct helper calls remain available for tests and explicitly named local snapshot files. This is command safety/test coverage only; it does not call LTA, mutate raw data, score, export, public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P530 targeted refresh confirmation guard:

Targeted bundle refresh is a scoring and bundle-mutation operation, not a report. Its CLI now requires `--confirm-targeted-refresh` before resolving the active bundle, copying a bundle, scoring selected postals, or replacing score/geometry shards. This preserves the helper for deliberate, confirmed scripts while closing the accidental bare-command path. This is command safety/test coverage only; it does not score, export, mutate public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P531 partial resnap confirmation guard:

Partial resnap comparison is a bounded scoring operation, not a report-only audit. `scripts.partial_resnap_rescore` now requires both `--confirm-rescore` and explicit `--output` before resolving the active bundle or calling `score_postals()`, instead of defaulting to the active bundle and `qa/partial_resnap_rescore_sample.json`. This is command safety/test coverage only; it does not score, export, mutate public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P532 OneMap outlier replay confirmation guard:

OneMap outlier replay is a bounded rescoring diagnostic, not a report-only audit. `scripts.replay_onemap_outliers` now requires both `--confirm-outlier-replay` and explicit `--output` before loading scoring context, calling `score_postal_gdf()`, or writing a replay report, instead of defaulting to `qa/onemap_outlier_replay_20260802.json`. This is command safety/test coverage only; it does not score, export, mutate public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P533 published bundle replay audit guard:

The full published-bundle audit can replay sampled records through scoring context, so it is not equivalent to the read-only `--state-only` report. `scripts.audit_current_bundle` now keeps `--state-only` available without output or confirmation, but non-state audits require explicit `--output`, and replay samples require `--confirm-replay-audit` before active-bundle lookup, scoring-context loading, or report writes. This is command safety/test coverage only; it does not score, export, mutate public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P534 OneMap triage explicit outputs:

OneMap outlier triage is report-only, but it writes five generated QA artifacts, so a bare command should not reuse historical filenames under `qa/`. `scripts.triage_onemap_outliers` now requires explicit paths for the queue JSON and all generated GeoJSON outputs before reading profile or validation inputs. This is command safety/test coverage only; it does not score, export, mutate protected QA evidence, public data, deployment, or locked weights.

2026-08-22 - P535 postal-universe measurement status:

Operators need one read-only answer for the current postal-universe measurement evidence before deciding whether v2 work is justified. `run.py universe-status` now consolidates the cached P19 public-source gap sample and P125 OSM addr:postcode coverage cross-check without APIs or writes. It sizes frozen-v1 gaps only; it does not approve a v2 build, scoring, export, input mutation, public-data mutation, deployment, or locked-weight changes.

2026-08-22 - P536 postal-universe measurement rates:

The consolidated postal-universe status should answer the measurement question directly, not only expose raw counts. `run.py universe-status` now reports P19 confirmed-missing and confirmed-plus-warning sample rates plus the P125 OSM-only-postcode share of frozen v1, still using cached evidence only and still not approving v2 build, scoring, export, input mutation, public-data mutation, deployment, or locked-weight changes.

2026-08-22 - P537 source freshness planning deltas:

Manifest-only freshness should help schedule versioned refreshes before a batch run, not only label sources current or stale. `run.py check --freshness-only` now reports days until stale for current timestamped sources and days past stale for stale sources, still reading only `raw/manifest.json` and `pipeline/config/sources.yaml`, probing no upstream URLs, writing no manifest, and preserving the rule that stale sources require a new numbered input version rather than frozen-v1 mutation.

2026-08-22 - P538 oldest-current freshness planning summary:

The freshness report's oldest-current summary is the first planning line operators scan before a batch run, so it must carry the same days-left signal as the per-source lines. `oldest_current_freshness_summary()` now includes days until stale, and the structured production-readiness `oldest_current_source` field receives the same text through the shared helper. This remains a manifest-only report and does not approve upstream probes, input mutation, scoring, export, deployment, public-data mutation, protected-QA mutation, or locked-weight changes.

2026-08-22 - P539 structured nearest freshness source:

Readiness consumers should not have to parse the oldest-current prose line to plan source refresh timing. `source_freshness_readiness()` now returns `nearest_current_source_to_stale` as structured fields (`source_key`, name, age basis, age days, threshold, days until stale, and cadence) while preserving the existing `oldest_current_source` text. This remains manifest-only and does not approve upstream probes, input mutation, scoring, export, deployment, public-data mutation, protected-QA mutation, or locked-weight changes.

2026-08-22 - P540 structured stale freshness sources:

Stale-source planning needs more than a prose warning and a list of keys. `source_freshness_readiness()` now returns `stale_sources` as structured fields (`source_key`, name, age basis, age days, threshold, days past stale, and cadence) while preserving the existing warning text and `by_status` key lists. This remains manifest-only and does not approve upstream probes, input mutation, scoring, export, deployment, public-data mutation, protected-QA mutation, or locked-weight changes.

2026-08-22 - P541 prioritized stale freshness sources:

Structured stale-source data should be immediately useful for refresh planning. `source_freshness_readiness()` now sorts `stale_sources` by `days_past_stale` descending and exposes `most_overdue_stale_source` as the first item, while preserving existing warning text and `by_status` key lists. This remains manifest-only and does not approve upstream probes, input mutation, scoring, export, deployment, public-data mutation, protected-QA mutation, or locked-weight changes.

2026-08-22 - P542 browser freshness priority copy:

The browser first-view data freshness line should match the prioritized manifest-only freshness report users are being asked to trust. It now states that NParks Leaf Area Index is 6.4 days from its 120-day threshold and lists stale sources by days past threshold, led by Planning Area Boundaries, then NParks Tracks, then NParks Heritage Road Green Buffers. This is copy/test work only; it does not approve upstream probes, input mutation, scoring, export, deployment, public-data mutation, protected-QA mutation, or locked-weight changes.

2026-08-22 - P543 partial lamp overlay tile failures:

The night lighting overlay is map evidence, so failed lamp-post tile loads must be visible as evidence availability problems rather than reported as a clean empty viewport. The browser now distinguishes fully loaded, partially loaded, empty, and unavailable lamp overlay states. This is web/test behavior only; it does not regenerate the lamp overlay artifact, score, export, mutate public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P544 first-view locked score availability wording:

The first-view bundle coverage disclosure is user-facing product honesty, not an operator sorting-control label. It now says that 95,157 of 124,443 records have a full locked score, while 29,286 records do not show one. The planning-area ranking UI still describes the locked score as a sorting index where that is the actual interaction. This is web copy/test work only; it does not score, export, mutate public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P545 record-level no-full-score badge:

When a selected postal has no full locked score in the published bundle, the score badge itself should say so instead of relying only on the explanatory state note. Null-score records now show a compact `No full score` / `Published bundle` badge, while numeric records still show `Locked score` with the 0-to-100 value. This is web copy/layout/test work only; it does not score, export, mutate public data, protected QA evidence, deployment, or locked weights.

2026-08-22 - P546 no-transit record state copy:

`NO_TRANSIT_IN_RANGE` records cover different situations, and the selected-record panel should not collapse them into a generic transit failure. The far-connected-walk title now says `Connected walk beyond 1.2 km`, while disconnected-candidate and no-candidate records keep distinct copy. Rendered tests pin all three no-transit shapes, and the browser smoke classifier accepts the new far-connected-walk text. This is web copy/test work only; it does not score, export, mutate public data, protected QA evidence, deployment, or locked weights.

2026-08-26 - P576 bus remodel model decision:
P574 repaired the DataMall bus-stop attachment defect (origin-aware snap repair, commit 4c96add; island rebuild network-qa all-pass) and P575 validated it on the frozen sorted-first-1200 subset against the published bundle: bus==0 fell 208 to 174, 34 records gained positive bus (23 without fallback provenance), zero records regressed positive-to-zero, median absolute total delta was 0.0 with max 22.8 concentrated in defect-fix rows, covered_ratio showed no decreasing row, and a twice-scored 50-record slice was byte-identical. Two independent delta computations agreed on every headline metric. Decision: subscores.bus becomes routed-or-null. Where scoring verifies a graph route from origin to a DataMall bus stop under the repaired attachment, publish the routed bus subscore; otherwise publish explicit null with the omitted-weight mass recorded in provenance.subscore_status, never a fabricated value. provenance.direct_bus_fallback continues to describe rejected candidates only and must never be promoted into positive bus evidence (extends the P3/P6 thread). Locked weights are untouched: bus stays 0.20; this decision changes semantics, not weighting. Records that previously scored through phantom routes may flip to NO_TRANSIT_IN_RANGE (1 of 1200 in P575); those enter the Wave 4 partial-evidence scope instead of carrying fabricated totals. Measured repaired-graph subset throughput (~14 s/record) supersedes legacy full-batch duration extrapolations; G1 must project from measured chunk timing.

2026-08-28 - P611 browser freshness copy must track the latest manifest-only check:

The browser title-card freshness copy should not keep saying the 21 Aug 2026 snapshot had current shelter sources after the 27 Aug 2026 manifest-only check showed Covered Linkway and Pedestrian Overhead Bridge / Underpass stale. The first-view copy now reports the latest manifest-only counts as 10 current, 8 stale, 2 manual, and 1 unknown-age candidate source; it lists the eight stale sources by days past threshold and states Leaf Area Index is 0.3 days from stale. The Covered Linkway discovery note no longer says `current Covered Linkway` because the manifest-only freshness status has crossed the 120-day threshold. This is browser copy and test coverage only; it does not probe upstream APIs, fetch sources, mutate inputs, score, export, deploy, mutate public data, mutate protected QA evidence, or touch locked weights.

2026-08-28 - P612 current sample does not approve postal-universe v2:

The P609/P610 universe-gap measurement is useful because it sizes the current-source gap, not because it authorizes a new universe. The cached 16 Aug 2026 sample shows 0.614754% confirmed missing address rows, or 0.819672% including source-quality warnings; directionally applied to 124,443 frozen-v1 postals, that is 765 confirmed rows or 1,020 including warnings, and it is explicitly not a measured full-universe gap. Batch-plan and readiness source-policy data now record this as `not_approved_from_current_sample`, while preserving that any later v2 must be candidate-source-first with bounded OneMap Search validation. This is reporting, decision, and test coverage only; it does not build v2, call APIs, mutate inputs, score, export, deploy, mutate public data, mutate protected QA evidence, or touch locked weights.

2026-08-28 - P732 freshness source coverage:

Freshness policy should cover every source already recorded in `raw/manifest.json`, not just score-adjacent sources. `pipeline/config/sources.yaml` now includes ACRA registered entities, other-UEN registered entities, and the June 2020 OneMap-derived postal-universe seed, so the manifest-only freshness check has no manifest-only source keys. Overture remains config-only and unknown-age because it has not been promoted into frozen v1. The browser freshness line now reports 11 current sources, 9 stale sources, 3 manual sources, and 1 unknown-age candidate source. This is config/browser copy/test coverage only; it does not probe upstream APIs, mutate inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-28 - P733 sampled universe gap qualifier:

The first-view recent public-source gap copy should not invite users to treat the 16 Aug 2026 sample rate as a measured full-universe gap. The title card now says the 6 confirmed HDB missing rows plus 2 MCST source-quality warnings out of 976 sampled rows are a sample, not a measured full-universe gap. This is browser copy/test coverage only; it does not change the cached P19/P125 measurements, address-universe artifacts, scoring, exports, public data, deployment, or locked weights.

2026-08-28 - P734 full-batch change readiness:

The dry-run batch planner should expose prerequisite evidence by bundled change, not only state that 1200-record subset proof is required somewhere. `run.py batch-plan` now emits `full_batch_change_readiness` for bus remodel, `NO_TRANSIT_IN_RANGE` partial-score fix, network conflation repair, and promoted postal-universe v2. Bus remodel and network repair are measured candidates but still require owner approval; `NO_TRANSIT_IN_RANGE` remains policy-decided but subset-proof-missing; postal-universe v2 remains not approved from the current sample. The planner keeps the full-batch gate closed when any bundled change lacks prerequisite subset evidence. This is dry-run reporting/test coverage only; it does not score, export, mutate inputs, mutate public data, deploy, or touch locked weights.

2026-08-28 - P735 decision path hygiene:

Scoring and export comments should point future maintainers to this repository's root `decisions.md`, not to a nonexistent `docs/decisions.md`. The best-transit picker rationale references in `pipeline/export.py`, `pipeline/scoring_integration.py`, and `tests/test_scoring_integration.py` now use the correct root decision path, and a source-text test guards against that stale pointer returning. This is comment/test/documentation hygiene only; it does not change scoring, exports, inputs, public data, deployment, protected evidence, or locked weights.

2026-08-28 - P736 bounded geocode cache versioning:

Confirmed non-dry bounded OneMap geocode fills must not mutate the unversioned legacy `raw/geocode_cache.db`. `pipeline.geocode_universe` now requires the mutable cache path to include a numeric version tag such as `_v2` before reading queued rows, opening the cache, or calling OneMap, while dry runs remain allowed. This is safety guard/test coverage only; it does not call OneMap, geocode, mutate raw inputs/caches, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-28 - P737 batch-plan completed geocode cache boundary:

Batch planning must not treat a historical completed bounded geocode fill backed by an unversioned mutable cache path as clean future full-batch evidence. `pipeline.batch_plan` now reports `completed_fill_cache_versioned` and adds a checkpoint blocker when a completed fill names an unversioned cache path, while still reading the historical summary and reporting unresolved rows. This is dry-run planning/test coverage only; it does not call OneMap, geocode, mutate raw inputs/caches, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-28 - P738 lamp-overlay runner confirmation gate:

`run.py lamp-overlay` is a writer because it builds a compact lamp-post artifact directory from existing raw lamp data. The runner now requires `--confirm-lamp-overlay` before invoking `pipeline.lamp_overlay`, strips that runner-only flag before forwarding, and names the requirement in the task documentation and stub text. This is runner guard/test coverage only; it does not build a lamp overlay, mutate raw inputs, mutate public data, score, export, deploy, protected QA evidence, or locked weights.

2026-08-28 - P739 runner-level writer gates:

The task runner should fail closed before launching dangerous modules, not rely on those modules to reject unsafe defaults after startup. `run.py` now prechecks confirmation flags for network builds, scoring, non-dry score batches, exports, transit exports, provenance refreshes, OneMap probes, non-dry bounded geocode fills, and publishes. Dry-run score batches and dry-run bounded geocode fills remain callable without confirmation. This is runner guard/test coverage only; it does not run scoring, export, rescore, subset scoring, ingest, network build, OneMap probe, public-data writes, deployment, protected QA evidence mutation, or locked weights.

2026-08-28 - P740 remaining runner confirmation gates:

P739's intent was correct but incomplete: an early `publish` branch still bypassed the new publish gate, and `bus-arrivals`, `bus-connector-diagnostics`, and `candidate-audit` still launched writer/network modules before runner-level confirmation. The runner now removes the publish bypass, prechecks those remaining confirmations, strips runner-only flags before forwarding where needed, and keeps read-only/dry-run reports callable. This is runner guard/test coverage only; it does not run bus-arrival collection, diagnostics, candidate audits, scoring, export, rescore, subset scoring, ingest, network build, OneMap probe, public-data writes, deployment, protected QA evidence mutation, or locked weights.

2026-08-28 - P741 postal-universe runner gate and lamp-overlay command hygiene:

`run.py postal-universe` is a writer because it emits a new postal-universe parquet and summary, and `--download-missing` can fetch source inputs. The runner now requires `--confirm-postal-universe` before launching `pipeline.postal_universe`, strips that runner-only flag before forwarding, and documents that boundary. Batch-plan, production-readiness, and README lamp-overlay replacement examples now include `--confirm-lamp-overlay` and no longer include the stray `--` separator that would be forwarded to the module. This is runner guard/documentation/test coverage only; it does not build a postal universe, download inputs, build a lamp overlay, mutate raw inputs, mutate processed artifacts, mutate public data, score, export, deploy, protected QA evidence, or locked weights.

2026-08-28 - P742 report and external-probe runner gates:

The task runner remains the safety boundary for commands that write diagnostic evidence, call external services, or replay local scoring analyses. `run.py` now requires confirmations before launching network-debug, OneMap validation collection, OneMap outlier replay, OneMap outlier triage, Overture address probing, and targeted score comparisons. Runner-only confirmation flags are stripped before modules that do not own them, while module-owned confirms remain forwarded. This is runner guard/test coverage only; it does not run scoring, export, rescore, subset scoring, ingest, network build, OneMap collection, Overture probing, public-data writes, protected QA evidence mutation, deployment, or locked weights.

2026-08-28 - P743 validate runner classification:

`run.py validate` is a read-only static-bundle verifier, not a writer or deployment action. It remains callable without a runner confirmation and is now documented with the safe reports rather than the gated pipeline tasks. `publish` remains gated separately and still runs validation before deployment. This is documentation/test alignment only; it does not validate the live bundle, export, score, rescore, mutate public data, mutate protected QA evidence, deploy, or touch locked weights.

2026-08-28 - P744 production deploy wrapper confirmations:

The production deploy wrapper must satisfy both safety boundaries: `run.py publish` requires the runner-owned `--confirm-publish`, and `pipeline.publish --deploy` requires the module-owned `--confirm-production`. `scripts/deploy-production.ps1` now passes both flags so an explicitly invoked release wrapper still reaches the publish module, while unconfirmed runner use remains blocked. This is script/test hygiene only; it does not deploy, validate a bundle, export, score, mutate public data, mutate protected QA evidence, or touch locked weights.

2026-08-28 - P745 agent publish instruction alignment:

`CLAUDE.md` still grouped `validate` with gated writer/deploy tasks and showed `run.py publish` without the required runner and module confirmations. The agent guide now mirrors the runner: `validate` is a read-only safe report, `publish` is the gated deploy boundary, and the documented publish invocation carries both `--confirm-publish` and `--confirm-production`. This is agent documentation/test coverage only; it does not deploy, validate a bundle, export, score, mutate public data, mutate protected QA evidence, or touch locked weights.

2026-08-28 - P746 postal-universe prep wrapper confirmations:

The postal-universe prep wrapper predates two runner guards: `run.py postal-universe` now requires `--confirm-postal-universe`, and non-dry bounded geocoding requires an explicitly versioned geocode cache. `scripts/prepare-postal-universe.ps1` now passes the postal-universe confirmation and derives `raw\geocode_cache_${Version}.db` for `geocode-universe --cache-db`, keeping the generated cache tied to the same numeric version as the candidate universe. This is wrapper/test hygiene only; it does not build a universe, geocode, call OneMap, mutate raw or processed artifacts, score, export, deploy, mutate protected QA evidence, or touch locked weights.

2026-08-28 - P747 legacy geocode entry point retired:

`pipeline/geocode.py` was a legacy direct CLI that could call OneMap and write the unversioned mutable `raw/geocode_cache.db` outside the guarded `run.py geocode-universe` path. Its importable helper functions remain for history, but direct invocation now exits with a retirement message pointing to the dry-run and confirmed versioned-cache flow. The runner also now forwards `geocode-universe` arguments to `pipeline.geocode_universe`, so the confirmed wrapper path reaches the module with its explicit input, output, and cache arguments. This is guard/test hygiene only; it does not call OneMap, geocode, mutate raw inputs/caches, score, export, deploy, protected QA evidence, or locked weights.

2026-08-28 - P748 postal-universe prep wrapper geocode flag:

The postal-universe prep wrapper must pass the cache path using the module's actual `--db` option, not the stale `--cache-db` spelling. The test now asserts the versioned cache path is supplied through `--db` and that `--cache-db` is absent, so future wrapper drift is caught without running geocoding. This is wrapper/test hygiene only; it does not build a universe, geocode, call OneMap, mutate raw or processed artifacts, score, export, deploy, protected QA evidence, or locked weights.

2026-08-28 - P749 direct bundle activation confirmation:

`scripts/activate-data-bundle.ps1` rewrites `web/data-bundle.json` and the Vercel allowlists, so direct invocation must require its own `-ConfirmActivation` gate instead of relying on the higher-level release wrapper's `-ConfirmProduction`. The release wrapper now passes `-ConfirmActivation` after production approval, preserving the approved release flow while making direct activation fail closed. This is release-wrapper guard/test hygiene only; it does not validate a bundle, activate a bundle, deploy, mutate public data, score, export, protected QA evidence, or locked weights.

2026-08-28 - P750 README DataMall discovery copy:

README operator guidance now matches the latest recorded P682/P683 DataMall discovery-only evidence: the 28 Aug 2026 check found Covered Linkway, bridge/underpass, and Traffic Signals URLs still match frozen v1. The stale-payload and new-numbered-input-version policy remains unchanged. This is documentation/test alignment only; it does not probe DataMall, fetch payloads, mutate raw inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-28 - P751 deploy wrapper confirmation guard:

Production deployment approval must be explicit at every wrapper boundary. `scripts/deploy-production.ps1` now defaults to a plan-only response unless `-ConfirmProduction` is supplied, `scripts/release-data-bundle.ps1` passes its existing production confirmation through to the deploy wrapper, and `scripts/full-rescore-production.ps1` requires a distinct `-ConfirmProductionDeploy` when `-Deploy` is requested because full-batch approval is not production publish approval. This is release-wrapper guard/test hygiene only; it does not deploy, validate a bundle, activate a bundle, export, score, mutate public data, protected QA evidence, or locked weights.

2026-08-28 - P752 full-rescore activation confirmation guard:

Full-batch approval is not bundle activation approval. `scripts/full-rescore-production.ps1` now requires `-ConfirmActivation` before rewriting `web/data-bundle.json` unless `-SkipActivateBundle` is supplied, and the guard runs before any partitioning, scoring, export, validation, activation, or deploy work starts. This is release-wrapper guard/test hygiene only; it does not run a full batch, export, validate, activate a bundle, deploy, mutate public data, protected QA evidence, or locked weights.

2026-08-28 - P753 full OneMap wrapper confirmation guard:

Full OneMap validation wrappers must not bypass runner-level approval by self-supplying collection confirmations. `scripts/full-onemap-validation.ps1` now returns a plan-only response unless `-ConfirmFullOnemapValidation` is supplied before it creates QA output or calls collection, and `scripts/watch-full-onemap-validation.ps1` requires the same approval before creating watchdog output or restarting the runner. This is wrapper guard/test hygiene only; it does not collect OneMap data, validate a report, mutate raw caches, public data, protected QA evidence, deploy, score, export, or touch locked weights.

2026-08-28 - P754 legacy network build direct-entry guard:

`scripts/run_network_build.py` is a legacy direct network builder and must not run outside an explicit network-build approval. Direct execution now requires `--confirm-network-build` before calling `run_build()`, and import-time creation of `qa/` and `processed/` has been removed so unit-test imports do not write output directories. This is guard/test hygiene only; it does not run a network build, score, export, mutate processed artifacts, public data, protected QA evidence, or locked weights.

2026-08-28 - P755 fetch ingest module confirmation guard:

`pipeline.fetch ingest` must own the same input-refresh approval as `run.py ingest` because direct module execution can mutate `raw/` and `raw/manifest.json`. The fetch module now requires `--confirm-input-refresh` for ingest and rejects unconfirmed ingest before source config loading, while `run.py` forwards the confirmation instead of stripping it. This is guard/test hygiene only; it does not ingest, refetch, rebuild inputs, probe upstream sources, mutate raw inputs, protected QA evidence, public data, or locked weights.

2026-08-28 - P756 bus-arrivals module confirmation guard:

`pipeline.bus_arrivals collect` must own an explicit collection approval because direct module execution can call DataMall and append local bus-arrival snapshots outside the runner. The module now requires `--confirm-bus-arrivals` before output checks or fetch calls, and `run.py bus-arrivals` forwards the same confirmation instead of stripping it so the runner and module gates agree. This is guard/test hygiene only; it does not collect DataMall bus arrivals, mutate raw inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-28 - P757 bus API direct-ingest confirmation guard:

`pipeline.bus ingest` is a legacy direct DataMall bus-source ingest path that can fetch bus stops, services, and routes, write hashed raw payloads, and update `raw/manifest.json` outside `run.py`. Direct ingest now requires `--confirm-input-refresh` and rejects before source config loading if the flag is missing. This is guard/test hygiene only; it does not ingest, call DataMall, mutate raw inputs, protected QA evidence, public data, score, export, deploy, or touch locked weights.

2026-08-28 - P758 postal-universe direct-build confirmation guard:

`pipeline.postal_universe` can write new processed postal-universe parquet/summary artifacts and, with `--download-missing`, fetch source inputs. Direct execution now requires `--confirm-postal-universe` before `build_universe()` runs, while confirmed invocations still keep the existing versioned-output and no-overwrite checks. This is guard/test hygiene only; it does not build a universe, download inputs, mutate raw or processed artifacts, protected QA evidence, public data, score, export, deploy, or touch locked weights.

2026-08-28 - P759 lamp-overlay direct-build confirmation guard:

`pipeline.lamp_overlay` can write a new compact lamp-post overlay artifact directory, usually under `web/public/data/`, outside the guarded runner path. Direct execution now requires `--confirm-lamp-overlay` before calling `build_lamp_overlay_artifact()`, and `run.py lamp-overlay` forwards the same module-owned confirmation instead of stripping it. This is guard/test hygiene only; it does not build a lamp overlay, mutate public data, protected QA evidence, raw inputs, score, export, deploy, or touch locked weights.

2026-08-28 - P760 export subcommand direct-write confirmation guards:

`pipeline.export export-transit` writes transit POI artifacts, and `pipeline.export refresh-provenance` mutates bundle manifest provenance. Direct execution now requires `--confirm-export` for `export-transit` and `--confirm-refresh-provenance` for `refresh-provenance`; `run.py` forwards those module-owned confirmations instead of stripping them. This is guard/test hygiene only; it does not export, refresh provenance, mutate public data, score, deploy, protected QA evidence, or touch locked weights.

2026-08-28 - P761 Overture direct-probe confirmation guard:

`pipeline.overture_addresses` can query remote Overture Maps address data, write candidate reports/GeoJSON, and archive hashed raw parquet evidence. Direct execution now requires `--confirm-overture-addresses` after the existing no-overwrite preflight and before any remote query or evidence write. `run.py overture-addresses` forwards the same module-owned confirmation instead of stripping it. This is guard/test hygiene only; it does not query Overture, archive raw evidence, mutate public data, protected QA evidence, score, export, deploy, or touch locked weights.

2026-08-28 - P762 network-debug direct-writer confirmation guard:

`scripts.rebuild_network_debug` can write compact network debug GeoJSON outside the guarded runner path. Direct execution now requires `--confirm-network-debug` after explicit-output validation and before reading QA input or writing output, and `run.py network-debug` forwards that module-owned confirmation instead of stripping it. This is guard/test hygiene only; it does not rebuild network debug artifacts, mutate QA evidence, processed artifacts, public data, score, export, deploy, or touch locked weights.

2026-08-28 - P763 production preflight wrapper confirmation guard:

`scripts/preflight-production.ps1` is a release-path wrapper that can run static bundle validation, network QA/preflight, web dependency setup, and web tests. Because `ensure-web-deps.ps1` may run `npm ci` when required bins are missing, direct production preflight is not guaranteed zero-write. The wrapper now defaults to a plan-only response unless `-ConfirmProductionPreflight` is supplied, and `scripts/release-data-bundle.ps1` passes that confirmation after `-ConfirmProduction`. This is wrapper/test hygiene only; it does not run preflight, install dependencies, validate a bundle, run web tests, deploy, mutate public data, score, export, protected QA evidence, or locked weights.

2026-08-28 - P764 legacy DataMall probe confirmation guard:

`pipeline.probe_datamall` is a legacy direct probe that calls live LTA DataMall API and geospatial listing endpoints. Direct execution now requires `--confirm-datamall-probe` before any HTTP request, while the underlying probe helper remains importable for explicit tests or approved probes. This is guard/test hygiene only; it does not call DataMall, fetch payloads, mutate raw inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-28 - P765 legacy data.gov.sg probe confirmation guards:

Legacy helper scripts `pipeline.verify_datagov_ids`, `pipeline.inspect_datagov`, `pipeline.resolve_datagov`, and `pipeline.resolve_datagov_ids` call live data.gov.sg endpoints to inspect or resolve dataset IDs. Direct execution now requires `--confirm-datagov-probe` before any HTTP request, while the underlying helper functions remain importable for approved probes and tests. This is guard/test hygiene only; it does not call data.gov.sg, fetch payloads, mutate raw inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-29 - P766 legacy DataMall static parser confirmation guard:

`pipeline.parse_static_datamall` calls the live LTA DataMall static-data page to inspect geospatial ZIP links. Direct execution now requires `--confirm-datamall-static-parse` before the HTTP request, while the underlying parser helper remains importable for approved probes and tests. This is guard/test hygiene only; it does not call DataMall, fetch payloads, mutate raw inputs, score, export, deploy, public data, protected QA evidence, or locked weights.

2026-08-29 - P776 planning-area rank label alignment:

Planning-area rank controls remain sortable over the locked bundle's stored fields, but their labels must not imply that every stored subscore is a first-class evidence axis. Rain is now labelled as covered-walkway evidence, access remains walk-distance evidence, and bus, heat, and crossing are labelled as locked-score factors. This keeps the shipped data and locked weights unchanged while aligning the rank panel with the shelter-first, four-row presentation. This is web copy/test hygiene only; it does not score, export, rescore, mutate public data, protected QA evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P777 exposed-gap disclosure:

The score card should keep the three longest exposed gaps immediately scannable, but the remaining recorded gaps must still be inspectable because the gap list is the project's distinctive shelter evidence. Hidden shorter gaps are now placed behind a compact disclosure in the same list, preserving the existing summary and focus-on-map behavior without changing any route, score, export, public-data payload, protected evidence, or locked weights.

2026-08-29 - P778 night-lighting detail priority:

Night lighting is the second product layer after shelter exposure, while the sparse greenery proxy is supporting heat caveat material. The score-card walk-details strip now lists Night lighting before Greenery proxy so the UI hierarchy matches the product hierarchy. This is browser ordering and test coverage only; it does not alter lamp overlay data, shade geometry, route geometry, score values, exports, public data, protected evidence, deployments, or locked weights.

2026-08-29 - P779 shelter-correction workflow copy:

The map tracing workflow is a shelter-evidence correction path, not generic route preference or internal QA. The score card now exposes a `Report missing shelter` action near exposed gaps, renames tracing/copy controls around shelter correction, and records `issue: user_reported_shelter_correction` while keeping a legacy issue field for compatibility. This is browser copy/interaction and test coverage only; it does not score, export, rescore, mutate public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P780 560234 shelter audit confirmation gate:

`scripts/audit_560234_shelter.py` is a direct historical diagnostic that reads raw, processed, and public-data bundle inputs and writes GeoJSON/Markdown audit reports. It now requires `--confirm-560234-shelter-audit` after explicit output/no-overwrite preflight and before the audit can load protected inputs. This is safety/test/evidence work only; it does not run the audit, read protected inputs beyond static code inspection, score, export, rescore, mutate public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P781 generated-data web test timeout:

The generated-bundle geometry postal-prefix consistency test reads the large local public-data index and every derived prefix shard. On Prawn-E14 the assertion itself remains valid, but the old 15-second per-test timeout failed intermittently during full-suite runs and direct runs. The timeout for that one disk-heavy test is now 60 seconds; global Vitest timing remains unchanged. This is test-infrastructure hygiene only; it reads but does not mutate public data, and it does not score, export, rescore, ingest, rebuild inputs, deploy, or touch locked weights.

2026-08-29 - P782 Mayflower QA summary protected output roots:

`scripts/mayflower_qa_summary.py` is a historical analysis helper whose reports are useful as scratch QA artifacts, but its explicit output paths must not be able to create new files under protected evidence or public-data payload roots. The CLI now refuses outputs under `web/public/data/`, `qa/releases/`, `qa/p6_*` through `qa/p10_*`, `qa/p11/`, and `checksums.json` before active bundle discovery or input reads. Normal explicit scratch outputs remain allowed and still use non-overwriting writes. This is guard/test hygiene only; it does not run the Mayflower analysis, score, export, rescore, mutate public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P783 shelter correction entry-point copy:

Shelter correction should be named consistently wherever the user starts it. The exposed-gap action and inactive overflow action now both say `Report missing shelter`, while the active tracing state remains `Done tracing shelter`. This is browser copy/test hygiene only; it does not score, export, rescore, mutate public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P784 heat presentation analysis protected output roots:

`scripts/analysis/analyze_heat_presentation.py` may overwrite explicit scratch reports when requested, but overwrite cannot be allowed to target protected evidence or public-data payloads. The report writer now refuses `web/public/data/`, `qa/releases/`, `qa/p6_*` through `qa/p10_*`, `qa/p11/`, and `checksums.json` before any write, even with `overwrite=True`. The script's UI audit line references were also refreshed after later score-card copy/layout edits. This is guard/test hygiene only; it does not run the analysis, score, export, rescore, mutate public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P785 shared analysis report output guard:

`scripts.analysis.report_io.write_new_text_report()` is the common writer for many scratch analysis helpers, so protected output refusal belongs there as well as in individual high-risk scripts. The shared writer now refuses `web/public/data/`, `qa/releases/`, `qa/p6_*` through `qa/p10_*`, `qa/p11/`, and `checksums.json` before creating parent directories or writing files. This keeps normal scratch reports available while making protected evidence and public-data payloads fail closed by default. This is guard/test hygiene only; it does not run analysis, score, export, rescore, mutate public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P786 shared report guard refactor:

Protected analysis output-path policy should have one implementation. `scripts/mayflower_qa_summary.py` and `scripts/analysis/analyze_heat_presentation.py` now call the shared `scripts.analysis.report_io.is_protected_report_path()` helper instead of maintaining local copies of the same root and prefix checks. This is refactor/test hygiene only; it does not change report semantics, run analysis, score, export, rescore, mutate public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P787 night-lighting detail action:

Night lighting is the second product layer after shelter exposure, so the selected-walk details should make the layer actionable where its state is described. When the night-lighting map layer is off, the walk-details strip now shows `Switch on night lighting`, wired to the existing lamp-overlay state. This is browser UI/test work only; it does not add or regenerate lamp data, score, export, rescore, mutate public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P788 shelter correction promotion target guard:

Approved shelter-correction promotion is intentionally possible only after human review and explicit confirmation, but that confirmation must not make protected evidence or public-data payload targets writable. `scripts/promote_audited_shelter_corrections.py` now refuses protected target paths inside `promote_corrections()` before reading the draft GeoJSON or creating parent directories. This is guard/test hygiene only; it does not promote corrections, score, export, rescore, mutate public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P789 hidden exposed-gap coordinate summary:

Hidden exposed gaps remain part of the route evidence and can still be map-focused when coordinates exist, so the collapsed shorter-gap disclosure should say how many hidden gaps carry map coordinates instead of only saying they are included in the total. This is browser copy/test/evidence work only; it does not alter route geometry, scores, exports, inputs, public data artifacts, deployments, or locked weights.

2026-08-29 - P790 active exposed-gap selected label:

Focused exposed-gap rows should expose their selected map state visibly, not only through styling and `aria-pressed`. A coordinate-backed gap now changes its action label from `Focus on map` to `Selected on map` after it is focused. This is browser copy/state/test work only; it does not alter route geometry, scores, exports, inputs, public data artifacts, deployments, or locked weights.

2026-08-29 - P791 walk comparison baseline copy:

The inline covered-walkway comparison should state what the alternate walk is higher or lower than. It now names the baseline walk in the percentage-point comparison, for example `14pp lower than sheltered walk`, while keeping the underlying route and score values unchanged. This is browser copy/test/evidence work only; it does not alter route geometry, scores, exports, inputs, public data artifacts, deployments, or locked weights.

2026-08-29 - P792 data-limits summary:

The first-card data-limits disclosure should reveal the highest-impact limitation before it is opened. Its summary now says `Data limits: frozen v1 address list`, making the June 2020 address-universe caveat visible without expanding the full evidence notes. This is browser copy/test/evidence work only; it does not alter manifests, route geometry, scores, exports, inputs, public data artifacts, deployments, or locked weights.

2026-08-29 - P793 score coverage line:

The score-availability line should read like product disclosure rather than an audit finding while still deriving every count from the manifest. It now leads with `Full locked scores`, then states the missing-full-score count and state breakdown. This is browser copy/test/evidence work only; it does not alter manifests, route geometry, scores, exports, inputs, public data artifacts, deployments, or locked weights.

2026-08-29 - P794 direct-bus fallback straight-line wording:

Direct-bus fallback displays must name the route-distance evidence as a `Straight-line bus estimate`, because the fallback is not a verified shelter-map walk to transit. The UI still says `direct bus service` where it describes the underlying service evidence and locked bus-score caveat. This is browser copy/test/evidence work only; it does not alter manifests, route geometry, scores, exports, inputs, public data artifacts, deployments, or locked weights.

2026-08-29 - P795 data-limits summary coverage:

The collapsed data-limits disclosure should expose both user-facing release limitations before expansion: the frozen v1 address list and incomplete locked-score coverage. The detailed body remains the place for source freshness, sampled address-universe gaps, OSM postcode coverage, and attribution. This is browser copy/test/evidence work only; it does not alter manifests, route geometry, scores, exports, inputs, public data artifacts, deployments, or locked weights.

2026-08-29 - P796 night-lighting layer toggle:

Night lighting is a map layer, not a locked-score factor. The layer toggle now says `Night-lighting layer off` and `Night-lighting layer on` instead of only `Night lighting off/on`, matching the surrounding source note and reducing the chance that users read the control as changing the composite. This is browser copy/test/evidence work only; it does not alter lamp data, manifests, route geometry, scores, exports, inputs, public data artifacts, deployments, or locked weights.

2026-08-29 - P797 Mayflower sample search:

The zero-input sample search should name the real place behind the postal code. The sample CTA and search value now say `Try Mayflower S560234`, preserving the existing direct postal-selection path while making the first example more concrete for a housing-location user. This is browser copy/test/evidence work only; it does not alter route geometry, scores, exports, inputs, public data artifacts, deployments, or locked weights.

2026-08-29 - P798 direct-bus fallback pending-walk metric:

Direct-bus fallback cards must not present `Extra walk: 0 m`, because that reads like a verified shortest-versus-sheltered route comparison. For direct-bus fallback only, the third summary metric now reads `Verified shelter-map walk: Pending`; normal routed records keep the existing `Extra walk` metric. This is browser copy/test/evidence work only; it does not alter route geometry, scores, exports, inputs, public data artifacts, deployments, or locked weights.

2026-08-29 - P808 P19 v2 operator status surfaces:

Operator-facing source-policy surfaces must use the current P19 v2 28 Aug 2026 public-source sample and its Overpass coverage summary, not the older P125 OSM-only status report, when consolidating postal-universe gap evidence. `p125-osm-status` remains available as a historical no-API/no-write report, but `universe-status`, README source-policy copy, and runner help now identify P19 v2 as the current surface with 25,919 valid OSM postcodes, 25,899 overlapping frozen v1, and 20 valid OSM-only postcodes. The P807 source-policy values came from `qa/p19/universe_gap_measurement_summary_v2.json`; `qa/p19/overpass_addr_postcodes_cache_v2.json` carries raw postcodes and query metadata. This is docs/status/test/evidence work only; it does not score, export, rescore, mutate public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P809 web freshness snapshot:

The first-view data-limits freshness copy should track the latest no-write manifest-only measurement when that measurement changes operator-relevant age windows. The 2026-08-28T22:21:36Z check kept the same classification counts as the earlier 11:52 UTC snapshot, but moved bus source inputs to 1.2 days from stale and HDB Existing Building to 68.8 days into its 120-day threshold with 51.2 days until stale. Browser copy and tests now use that newer measured snapshot. This is web copy/test/evidence work only; it does not probe upstream URLs beyond the manifest-only local report, fetch sources, mutate raw or processed inputs, score, export, deploy, mutate public data, protected evidence, or touch locked weights.

2026-08-29 - P810 agent docs P19 v2 alignment:

Agent-facing operating context should match the current P19 v2 source-policy surface instead of preserving older P125 coverage numbers. `CLAUDE.md` now names the P19 v2 28 Aug 2026 public-source sample and the same run's Overpass coverage values: 25,919 valid OSM addr:postcode values, 25,899 overlapping frozen v1, and 20 valid OSM-only postcodes. `p125-osm-status` remains listed as a historical safe report command. This is docs/test/evidence work only; it does not score, export, rescore, mutate public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P811 zero-gap evidence state:

Zero recorded exposed gaps are favorable shelter-map evidence, not absence of evidence. The score card now renders a compact `Exposed gap evidence` block for scored, non-preview, non-direct-bus-fallback walks with no recorded gaps, stating that no exposed gaps are recorded and that all recorded segments stay under covered-walkway or connector evidence. Routes with gaps keep the existing sorted gap list and map-focus actions. This is browser UI/test/evidence work only; it does not score, export, rescore, mutate route geometry, public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P812 active exposed-gap ARIA label:

Focused exposed-gap rows should expose the same selected-map state to screen-reader users that sighted users see. The gap button accessible label now changes from `Focus on map for...` to `Selected on map for...` when that gap is focused, while `aria-pressed` remains the machine-readable state. Both visible and hidden gap buttons use the same helper. This is browser accessibility/test/evidence work only; it does not score, export, rescore, mutate route geometry, public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P813 preview score announcement:

Clicked-transit OneMap preview walks are shelter-map evidence only, not published locked-score states. The visible preview summary already says `Locked score: Preview only`; the screen-reader announcement now says `Locked score preview only; published locked score unchanged` instead of routing through the generic unavailable published-bundle branch. This is browser accessibility/test/evidence work only; it does not score, export, rescore, mutate route geometry, public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P814 score-card evidence announcements:

The score-card evidence region should be named consistently for assistive technology, and direct-bus fallback announcements must not imply a verified shelter-map walk. Non-empty exposed-gap lists now carry the same `Exposed gap evidence` accessible label as the zero-gap evidence state. Direct-bus fallback status text now says `Straight-line bus estimate evidence` while ordinary routed walks keep `Shelter-map walk evidence`. This is browser accessibility/test/evidence work only; it does not score, export, rescore, mutate route geometry, public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P815 score-source hash gate:

The readiness gate must require the expected score-source hashes, not merely any source hash. A bundle with only non-score reference hashes such as `leaf_area_index` is now a provenance defect even though complete bundles may still carry that non-score reference hash as a warning. The current-bundle test fixture now includes the expected score-source hash set so positive tests exercise the same policy. This is readiness/test/evidence work only; it does not score, export, rescore, mutate route geometry, public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P816 direct-bus selected state:

Direct-bus fallback is published fallback evidence, not a published routed shelter-map walk. The score-card screen-reader announcement now says `Published direct-bus fallback evidence selected.` for fallback records while normal routed records keep `Published shelter-map walk selected.` This is browser accessibility/test/evidence work only; it does not score, export, rescore, mutate route geometry, public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P817 direct-bus region labels:

Direct-bus fallback source and reason regions must not be announced as shelter-map evidence regions. The score card now labels fallback source evidence as `Direct-bus fallback source evidence` and fallback reasons as `Direct-bus fallback evidence reasons`, while verified shelter-map walks keep the existing shelter labels. This is browser accessibility/test/evidence work only; it does not score, export, rescore, mutate route geometry, public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P818 partial modern provenance readiness gate:

Readiness should fail a bundle manifest that contains only part of the modern record-level provenance schema. Legacy artifacts with no record-level digest schema can remain `legacy`, but once any scoring-fingerprint, scoring-input, or network digest-count field appears, the matching algorithm, changed/mixed flags, completeness flag, digest maps, missing-map list, and missing-record count must also be present and clean. This closes the `refresh_score_provenance_manifest()` partial-refresh shape, where digest counts could be written without the full exporter integrity signals. This is readiness/test/evidence work only; it does not run scoring, export, rescore, ingest, network builds, deployment, public-data writes, protected evidence mutation, or locked-weight changes.

2026-08-29 - P819 direct-bus fallback estimate details:

Direct-bus fallback records are straight-line fallback evidence, not verified shelter-map walks. When fallback records have exposed gaps or access connectors, the score card should say `Where the estimate is exposed`, label the details region as `Direct-bus fallback details`, and describe the connector as joining the straight-line bus estimate. Verified shelter-map walks keep `Where the walk is exposed` and `Walk details`. This is browser copy/accessibility/test/evidence work only; it does not score, export, rescore, mutate route geometry, public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P820 network report runner classification:

`network-qa` and `network-preflight` are callable through `run.py` and should be classified in the operator-facing safe-report surface rather than left unlisted. `network-qa` validates existing conflation QA/debug artifacts and writes no repo files. `network-preflight` reads and hashes existing manifest/raw/processed/QA artifacts, may inspect geometry, and writes no repo files or network artifacts; geometry inspection can still be heavier than simple manifest checks, so operators should use `--skip-geometry-inspection` when they only need the hash/readiness report. This is docs/help/test/evidence work only; it does not run network QA/preflight, score, export, rescore, ingest, build networks, mutate inputs, public data, protected evidence, deploy, or touch locked weights.

2026-08-29 - P821 graph-disconnected transit-stop copy:

The graph-disconnected no-transit state should name concrete user-facing transit stops or exits, not generic "transit targets". This is browser copy/test/evidence work only; it does not score, export, rescore, mutate route geometry, public data, protected evidence, raw or processed inputs, deploy, or touch locked weights.

2026-08-29 - P822 retryable night-lighting manifest load:

The night-lighting map layer should cache a valid `lamp_posts_v1` manifest, but a transient failed manifest fetch should remain retryable on later layer updates instead of pinning the overlay unavailable until page reload. This is browser resilience/test/evidence work only; it does not modify lamp tiles, public data, inputs, scoring, exports, deployment, protected evidence, or locked weights.

2026-08-29 - P823 night-lighting pre-load claim:

The persistent title-card night-lighting note should not hardcode the exact lamp-post count or source date before the browser has loaded the runtime overlay artifact. The note now says LTA lamp-post locations load from the published night-lighting artifact, while exact count/date evidence stays in README/readiness surfaces that validate the artifact. This is browser copy/test/evidence work only; it does not modify lamp tiles, public data, inputs, scoring, exports, deployment, protected evidence, or locked weights.

2026-08-29 - P824 transit picker stop-or-exit wording:

The nearby transit picker is a user-facing selector over bus stops and MRT/LRT exits, not an internal "target" object. Its visible heading, group labels, reset action, straight-line comparison note, map summary, preview status, and selected-stop live status now say "transit stops and exits", "stop or exit", or "auto-picked stop or exit" while internal prop names remain unchanged. This is browser copy and accessibility-label work only; it does not alter candidate derivation, selected transit IDs, route geometry, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P825 section 10 stop-or-exit reference:

The implemented Section 10 presentation reference should use the same stop-or-exit vocabulary as the shipped transit picker. It now writes the walk-to-transit row as `{sheltered_m} to {stop_or_exit}` and describes the destination as a chosen MRT/LRT exit or bus stop, avoiding the internal `{transit_target}` placeholder. This is tracked documentation and test work only; it does not alter browser rendering, route geometry, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P826 browser-smoke transit selector:

The browser smoke launch script must query the same transit mode selector that the app renders. After P824 renamed the segmented control to `Transit stop or exit type`, the smoke script still queried `[aria-label="Transit target"] button`, so launch checks using `--transit-mode` could fail before testing the actual product state. The smoke script now uses `[aria-label="Transit stop or exit type"] button`, with deployment-test coverage guarding against the stale selector. This is launch QA script/test work only; it does not alter browser rendering, route geometry, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P827 selected stop-or-exit copy:

The selected custom-transit badge and live-region status should name the concrete destination as an MRT/LRT exit or bus stop. This keeps the copy inclusive of rail exits and bus stops without reverting to the internal `transit target` term. This is browser copy/accessibility/test/evidence work only; it does not alter transit selection, preview routing, route geometry, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P828 clicked preview destination copy:

The preview-only caveat should use the same concrete destination language as the selected custom-transit badge. It now says the clicked MRT/LRT exit or bus stop has shelter-map evidence, instead of the generic clicked stop-or-exit wording. This is browser copy/accessibility/test/evidence work only; it does not alter transit selection, preview routing, route geometry, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P829 destination-loaded announcement:

The score-card screen-reader fallback for a missing station name should say `MRT/LRT exit or bus stop loaded`, matching the concrete destination language used for selected and clicked transit destinations. The visible no-transit state keeps `No transit stop or exit loaded` because that state describes an unavailable destination, not a chosen one. This is browser accessibility copy/test/evidence work only; it does not alter transit selection, preview routing, route geometry, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P830 freshness manifest policy gaps:

Any source key present in `raw/manifest.json` but missing from `pipeline/config/sources.yaml` should be treated as a freshness policy gap, reported as `unknown_policy` by both `run.py check --freshness-only` and production readiness. The current manifest has no such gap, but future hand-copied or legacy manifest entries must be visible instead of silently omitted. Selected-source freshness checks continue to report only the requested configured source. This is source-policy reporting/test/evidence work only; it does not alter source inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-29 - P831 readiness stale-source warning order:

Production-readiness warning text should order stale source names by the same days-past-stale severity used by the structured `stale_sources` field and `most_overdue_stale_source`. The warning now starts with the most overdue stale source instead of source-key order, so the human-facing gate summary agrees with the machine-readable release-planning fields. This is readiness reporting/test/evidence work only; it does not alter source inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-29 - P832 browser stale-source detail order:

The browser's `Source freshness detail` disclosure should use the same stale-source severity order as production readiness. The copy now states that stale sources are ordered by days past threshold and starts with Planning Area Boundaries, NParks Tracks, and NParks Heritage Road Green Buffers before the less-overdue transport and greenery references. This is browser copy/test/evidence work only; it does not alter source inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-29 - P833 CLI stale-source summary order:

The `run.py check --freshness-only` grouped stale-source summary should use the same days-past-stale severity order as production readiness and browser freshness detail. Individual source lines still print in configured source order, but the action-oriented `Stale sources:` summary now starts with the most overdue source. This is CLI reporting/test/evidence work only; it does not alter source inputs, scoring, exports, public data, deployment, or locked weights.

2026-08-29 - P834 DataMall discovery policy alignment:

The structured `datamall_geospatial_discovery` policy used by batch-plan and production readiness should follow the latest tracked discovery-only evidence, not the superseded 21 Aug 2026 drift result. P682/P683/P750 recorded a 28 Aug 2026 safe discovery-only check where Covered Linkway, Pedestrian Overhead Bridge / Underpass, and Traffic Signals all matched frozen v1; stale payload ages still require a new numbered input version before refresh. This is source-policy reporting/test/evidence work only; it does not call DataMall, fetch payloads, mutate raw or processed inputs, score, export, public data, deployment, or locked weights.

2026-08-29 - P835 DataMall discovery operator surfaces:

Agent-facing docs and source notes should not preserve only the generic or superseded DataMall discovery wording after the structured policy was aligned to P682/P683/P750. `CLAUDE.md` and the Covered Linkway / bridge-underpass source notes now state that the 28 Aug 2026 discovery-only check matched frozen v1 after authenticated fallback, while still preserving the new-numbered-input-version rule for stale payload ages or future changed discovery URLs. `tests/test_fetch.py` also covers the matched-all discovery-report path so the current shape is guarded directly, not only through README/web copy. This is docs/config/test/evidence work only; it does not call DataMall, fetch payloads, mutate raw or processed inputs, score, export, public data, deployment, or locked weights.

2026-08-29 - P836 P19 v2 policy paths:

The structured P19 recent-public-source gap policy should name the versioned v2 evidence files that produced its current measurement. `RECENT_PUBLIC_SOURCE_GAP_SAMPLE` already reported the P19 v2 28 Aug 2026 sample, but still pointed `summary_path` and `detail_path` at the older unversioned P19 files. Batch-plan and production-readiness policy now point to `qa/p19/universe_gap_measurement_summary_v2.json` and `qa/p19/universe_gap_measurement_detail_v2.json`, matching `p19-gap-status` and P803/P808 evidence. This is source-policy metadata/test/evidence work only; it does not read or mutate P19 payload files, call APIs, score, export, public data, deployment, or locked weights.

2026-08-29 - P837 P19 dynamic currentness:

The P19 v2 measurement facts remain a durable recorded policy object, but `fresh_for_current_gap_sizing` is time-sensitive and must be derived from the read-only P19 cache status at report time. Batch-plan and production readiness now overlay the P19 currentness block from the same `p19-gap-status` machinery that operators use, so the reports stop treating the 28 Aug sample as fresh after its 7-day window expires. This is source-policy reporting/test/evidence work only; it does not call APIs, mutate P19 payload files, score, export, public data, deployment, or locked weights.

2026-08-29 - P838 browser P19 currentness copy:

Browser and README P19 copy should not embed an expiring `current until 4 Sep 2026` claim. The product-facing data-limits text now says the P19 v2 result is sampled evidence, not a measured full-universe gap or approval to promote v2; README directs operators to `uv run python run.py p19-gap-status` for live currentness under the 7-day sample policy. This is browser/README copy/test/evidence work only; it does not call APIs, mutate P19 payload files, score, export, public data, deployment, or locked weights.

2026-08-29 - P839 P19 base policy currentness:

The base `RECENT_PUBLIC_SOURCE_GAP_SAMPLE` literal must not itself claim that the P19 v2 sample is fresh, because that truth expires with time. The literal now records `runtime_status_required` and defaults `fresh_for_current_gap_sizing` to false; report callers use `recent_public_source_gap_sample_policy()` to overlay the live read-only P19 cache status when currentness is needed. This is source-policy reporting/test/evidence work only; it does not call APIs, mutate P19 payload files, score, export, public data, deployment, or locked weights.

2026-08-29 - P840 browser source-freshness snapshot copy:

Browser source-freshness detail should not describe dated days-to-stale values as live freshness. The copy now says that Bus Stops, Bus Services, Bus Routes, and HDB Existing Building had those statuses at the 28 Aug 2026 manifest-only check, and directs operators to the zero-mutation source-age check for live days-to-stale numbers before release work. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P841 browser freshness user copy:

Browser data-limit copy should not expose internal release-operator phrasing. After P840 removed live-sounding days-to-stale values, the browser now says freshness may have changed since the 28 Aug 2026 snapshot and that source refreshes use new versioned inputs instead of changing the frozen v1 bundle in place. README remains the operator surface for the exact zero-mutation status command. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P842 browser source-age summary:

The browser's dated freshness summary should lead with `Source-age snapshot`, not `Data freshness`, because the values are from the 28 Aug 2026 manifest-only check and are not live upstream status. The copy now says `11 sources were current` at that snapshot and keeps the no-upstream-probe caveat. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P843 data-limits score coverage summary:

The collapsed browser Data limits summary should name the scale of missing full locked scores, not only say `incomplete locked scores`. It now says roughly 1 in 4 records lack full locked scores, while the separate manifest-derived coverage line still provides exact counts after the manifest loads. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P844 browser source-inventory copy:

Browser data-limit copy should not expose repository filenames or administrative source keys when a user is trying to understand product evidence limits. The source-freshness detail now describes the source inventory by user-facing evidence categories while preserving the June 2020 OneMap-derived postal-universe seed and stale-source ordering. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P845 night-lighting layer copy:

Browser night-lighting copy should name the visible map layer instead of the internal artifact concept. The title-card note now says LTA lamp-post locations load from the published lamp-post layer while preserving the caveat that night lighting is a map layer only and not part of the locked score. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P846 shelter-source listing copy:

Browser source-freshness detail should describe dated LTA source checks without exposing DataMall discovery URL mechanics. Covered Linkway copy now says a 28 Aug 2026 source-listing check found the covered-linkway, bridge/underpass, and traffic-signal listings still matched frozen v1, while preserving the quarterly threshold and new-numbered-input-version refresh rule. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P847 browser source-age check wording:

Browser source-age copy should express the limitation as a product fact, not as manifest/probe mechanics. The summary now says the 28 Aug 2026 source-age snapshot was not a live source refresh, and the detail calls it a source-age check rather than a manifest-only check. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P848 first-card data date wording:

The first-card data date should name published data rather than bundle-generation mechanics. The line now says `Shelter-map evidence as of ...; published data built ...`, preserving both manifest-derived dates while keeping implementation terminology out of the primary UI. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P849 published shelter-map data copy:

Browser-visible empty states, preview caveats, and unavailable-score messages should call the release surface published shelter-map data rather than a published shelter-map bundle. Internal code and tests may still use bundle for packaged data artifacts, but product copy now frames the limitation as data coverage. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P850 data-limits June 2020 summary:

The collapsed Data limits summary should expose the user-relevant address age rather than internal v1 versioning. It now says `Data limits: June 2020 addresses; roughly 1 in 4 lack full locked scores`, while the expanded disclosure still states that the address universe is frozen v1 from a June 2020 OneMap-derived postal scrape. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P851 footer walk-evidence wording:

The browser footer should close with the product object, not provenance framing. It now says `Walk evidence: covered-walkway ratio and exposed gaps, plus the night-lighting map layer`, removing the `Source-derived` prefix while preserving the same evidence claim. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P852 expanded data-limits terminology:

Expanded browser data-limit copy should keep the versioning and stale-source caveats without leaking implementation terms. The source-age detail now says source refreshes do not change frozen v1 data in place, names the June 2020 OneMap-derived address seed instead of a postal-universe seed, and says stale source data requires a new numbered input version instead of stale payload ages. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P853 MCST address-warning copy:

Browser recent-source caveats should describe unconfirmed MCST rows as address candidates and address-quality warnings rather than proxy rows and source-quality evidence. This keeps the P19 sample limitation visible while using wording that a home-search user can understand. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P854 HDB missing-address caveat copy:

Postal-specific recent-source caveats should say the six confirmed HDB rows are missing from the June 2020 address list rather than missing from frozen v1. Versioning remains in the Data limits disclosure, while search-result copy uses the user's actual question: whether the address is in the published shelter-map data. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P855 nearby-greenery route detail copy:

Browser route details should label the inspectable heat supporting signal as nearby greenery rather than greenery proxy. The heat limitation still says heat proxy and not measured temperature, but the row label now names what the user sees near the walk instead of the modelling role. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P856 address-list UI terminology:

Browser data-limit and unavailable-address copy should say June 2020 address list instead of address universe, except where frozen v1 is kept as the version label inside the Data limits body. OpenStreetMap attribution now says it is not the address registry. This preserves the audit fact while using language a home-search user can understand. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P857 recent-source sample labels:

Postal-specific missing-address caveats should label the parenthesized source as a public-source sample rather than geocoded rows or proxy rows. The underlying P19 caveat remains unchanged, but the browser label now explains what kind of evidence the user is seeing. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P858 missing score-factor copy:

Browser locked-score caveats should say missing score factors instead of locked score inputs. The scoring rule is unchanged: missing factors still count as zero in the locked formula, but the displayed wording now describes the limitation in terms a home-search user can understand. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P859 no-score badge value:

When no full locked score is available, the browser badge should show Walk evidence as the value instead of Published data. That keeps the absent score secondary while pointing the user to the useful inspected artifact still available in the card. This is browser copy/test/evidence work only; it does not call APIs, mutate inputs, score, export, public data, deployment, protected evidence, or locked weights.

2026-08-29 - P875 address-limit copy:

The expanded Data limits address line should lead with the user-facing limitation rather than the internal frozen-v1 label. It now says the address list comes from a June 2020 OneMap-derived postal scrape and that newer developments may be missing. The frozen-v1/versioned-refresh policy remains elsewhere in the disclosure and operational docs. This is browser copy/test/evidence work only; it does not alter manifests, inputs, public data, exports, scoring, deployment, or locked weights.

2026-08-29 - P876 data-limit audit-term copy:

The browser Data limits detail should not require users to understand audit terms such as full-universe gap, frozen postals, frozen v1, promote v2, or numbered input versions. The copy now describes the same evidence as a sampled missing-address signal, June 2020 address-list overlap, published data freshness, and dated input versions. Operator-facing versioning remains in README, source policy, and evidence files. This is browser copy/test/evidence work only; it does not alter manifests, inputs, public data, exports, scoring, deployment, or locked weights.

2026-08-29 - P877 planning-area comparison wording:

The planning-area panel should describe itself as comparison rather than ranks. Numeric ordering still appears inside the opened list, but the button, lazy-load helper, and live status now say planning-area comparison so the control matches the product task: compare nearby records without making ranking the headline. This is browser copy/test/evidence work only; it does not alter ranking logic, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P878 mobile exposed-gap action layout:

Exposed-gap rows should remain legible on narrow screens because those gaps are the product's strongest inspectable artifact. Mobile CSS now keeps the gap distance and description in two columns and lets the map action wrap below the description instead of forcing a third column beside coordinate text. This is responsive CSS/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P879 night-lighting layer control copy:

The top map-layer control should read as a user action and map-evidence layer, not as a source or implementation status. The off state now says `Show night-lighting layer`, the active state says `Night-lighting layer shown`, and the note describes LTA lamp-post locations as map evidence outside the locked score. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P880 sorting-only score badge:

The numeric 0-to-100 composite remains visible but should not read as the primary product object. The header badge now says `Sorting-only score` when a full locked score exists, matching the breakdown row and keeping covered-walkway ratio and exposed gaps as the main evidence. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P881 sorting-only score announcement:

The screen-reader live status should match the visual score hierarchy. Scored records now announce `Sorting-only score ...` after shelter-map walk evidence, while clicked-stop previews still say `Locked score preview only; published locked score unchanged` to explain that preview walks do not alter published locked scores. This is browser accessibility copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P882 zero exposed-gap walk wording:

The no-exposed-gap state should describe the selected walk, not the UI display. It now says all recorded segments for the selected sheltered or shortest walk stay under covered-walkway or connector evidence. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P883 heat-estimate shelter note:

The shelter-exposure row and Section 10 reference should not describe the current heat term as heat comfort. They now say rain shelter and the heat estimate share mostly the same covered-walkway evidence, keeping the limitation aligned with the UI's `not measured temperature` caveat. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P884 address-list score availability denominator:

The full-score availability line should name its denominator as the June 2020 address-list records, not generic records. This keeps the roughly-quarter missing-score disclosure tied to the frozen address list instead of implying coverage of every current Singapore address. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P885 address-list missing-score count:

The full-score availability line should also name the missing-score count as address-list records, not generic records. The count is `29,286 address-list records`, derived from the same June 2020 address-list denominator as the `95,157 of 124,443` complete-score count. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P886 missing-score copy regression pin:

The browser copy tests should pin the missing-score count's address-list denominator, not only the complete-score denominator. A source-level assertion now checks the formatter still contains `address-list records (${pctText})`, so future copy edits cannot silently fall back to generic `records` for the missing-score count. This is test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P887 planning-area address comparison copy:

The browser planning-area comparison panel should speak in home-search terms rather than internal record terms. The panel now says `Compare nearby addresses`, and its empty/status copy says planning-area addresses instead of planning-area records. The ranking logic and locked score are unchanged. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P888 no-transit bus caveat address copy:

The no-transit bus-support caveat should describe addresses outside the locked 1.2 km transit range, not records outside it. The locked cutoff and zero-factor scoring rule remain visible, but the wording now matches the home-search object a user understands. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P889 comparison-helper address copy:

The opened planning-area comparison helper should match the address-facing heading. It now describes nearby-address comparison for the selected evidence or locked-score row, rather than a planning-area detail view. This is browser copy/test/evidence work only; it does not alter ranking logic, scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P890 MCST listed-postal caveat:

Postal-specific MCST caveats should describe the suspect value as the listed postal, not the recorded postal. `Listed postal` reads as source-listing language and keeps the warning understandable: OneMap did not confirm that listed address candidate as a missing address. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P891 exposed-gap map-location copy:

When an exposed gap cannot be focused on the map, the UI should say no map location is available rather than no map coordinates are recorded. The stored coordinates remain the underlying evidence, but the browser copy now speaks in terms of the user's action: whether the exposed gap can be located on the map. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P892 partial-score row copy:

Partial locked-score copy should refer to unavailable locked-score rows instead of missing score factors. The scoring behavior is unchanged: missing terms still count as zero in the locked rule, but the browser wording now points to the displayed rows a user can see. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P893 exposed-gap listed/mapped copy:

Exposed-gap copy should use listed and mapped language instead of recorded storage language. Zero-gap states now say no exposed gaps are listed, and the coverage confirmation says all mapped segments stay under covered-walkway or connector evidence. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P894 OneMap no-match copy:

Search empty-state copy should describe the user's outcome as no OneMap match, not no OneMap address result. The recovery action remains the same: try a 6-digit postal code, with the June 2020 address-list caveat still visible. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P895 transit stop-or-exit first-view copy:

The first-view promise should name the destination class users can inspect: a transit stop or exit. `Walk to transit` was too abstract now that the map and picker consistently distinguish MRT/LRT exits and bus stops. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P896 walk-to-stop-or-exit row label:

The four-row presentation should use the same destination vocabulary as the first-view promise. The access row now says `Walk to stop or exit` while retaining `35% locked walk-to-transit` as the scoring-term meta, so the product label is user-facing and the locked rule remains explicit. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P897 best-transit stop-or-exit label:

The default all-transit view should render the access destination as `transit stop or exit`, not abstract `transit`. Bus-only and MRT/LRT-only modes keep their specific labels, while the all-transit route notes and measured reasons now match the first-view and row-label vocabulary. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P898 access reason stop-or-exit copy:

Access reason copy should use the same user-facing destination vocabulary as the access row. The low/high descriptors now say `Longer walk to stop or exit` and `Short walk to stop or exit`, keeping reason chips aligned with the four-row presentation. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P899 unnamed transit fallback copy:

When a scored walk lacks a named best node, the browser should say the transit stop or exit is not named rather than not loaded. The route evidence can still exist; the missing part is display metadata, not necessarily the walk. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.

2026-08-29 - P900 stop/exit access source label:

Shelter-source evidence should label destination connector segments as `Stop/exit access walk` instead of `Transit access walk`. The underlying source-layer key is unchanged; only the browser-facing source label moves to the same stop-or-exit vocabulary as the first-view, access row, and route notes. This is browser copy/test/evidence work only; it does not alter scoring, exports, inputs, public data, deployment, or locked weights.
