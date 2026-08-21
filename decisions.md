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
