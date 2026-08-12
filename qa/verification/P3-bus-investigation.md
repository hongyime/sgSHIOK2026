P3 bus sub-score defect investigation

Command: git log --oneline -6
Output:
```text
d4a2508 test: add bus fallback blast radius evidence
844bd49 test: add bus zero audit evidence
8c21591 docs: correct params fingerprint decision
4410686 docs: keep P2 absence greps meaningful
0692551 docs: record P2 cleanup evidence
d247717 fix: announce dynamic web state
```

Command: git diff --stat 4410686..HEAD
Output:
```text
 decisions.md                                       |   2 +-
 .../bus_fallback_blast_radius_20260812.txt         | Bin 0 -> 7352 bytes
 qa/verification/bus_zero_audit_20260812.txt        | Bin 0 -> 4726 bytes
 scripts/analysis/bus_fallback_blast_radius.py      | 458 +++++++++++++++++++++
 scripts/analysis/bus_zero_audit.py                 | 366 ++++++++++++++++
 5 files changed, 825 insertions(+), 1 deletion(-)
```

Command: python byte-level params.yaml hash check
Output:
```text
e728a67: a05e9e9aac805de4a12217214ee574f6dc8813054d2fa8993a73e7d649bb1ce1
ce8eb34: dc56cbd5c3cc87ec6aaa7c346e8514b4c5b450a76f05f1ac3e76fa604c46f6b7
working: a05e9e9aac805de4a12217214ee574f6dc8813054d2fa8993a73e7d649bb1ce1
```

Command: Invoke-RestMethod live manifest scoring fingerprints
Output:
```json
{
  "pipeline\\config\\params.yaml": "a05e9e9aac805de4a12217214ee574f6dc8813054d2fa8993a73e7d649bb1ce1",
  "pipeline\\config\\weights.yaml": "5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec",
  "pipeline\\routing.py": "8fb450690bf9d024b9c43dd02476a7d4e73805cd3b59b6ecbc2022dcc1a69e7c",
  "pipeline\\scoring.py": "255b4a225a625848e150673b01bccfbc679eea668a254667a9b01c2179bf610c",
  "pipeline\\scoring_integration.py": "a7b4a8cbaefb4731e6711ffb8595e3241de654032e887691eef7bc91f5b975ae"
}
```

Corrected decisions.md text:
```text
2026-08-12 - P2 Strand 1 dead route-batch cleanup decision:
The unused route batch entry point and its pool initializer helpers were removed from `pipeline/routing.py`; `route_worker` remains because `pipeline/bus.py` calls it for bus-connector routing. The deleted `routing:` block in `pipeline/config/params.yaml` only configured those removed batch helpers and had no remaining code reader after the cleanup. No scoring formula, routing algorithm, weights, or export shape changed. P3 verification corrected the fingerprint note: commit 73add7c added this dead `routing:` block after the last publish, so removing it realigned `params.yaml` with the published bundle fingerprint `a05e9e9aac805de4a12217214ee574f6dc8813054d2fa8993a73e7d649bb1ce1`. The `pipeline/routing.py` fingerprint did change because the dead route-batch code was removed; that routing-code fingerprint delta is expected on the next provenance refresh.
```

Command: Get-Content qa\verification\bus_zero_audit_20260812.txt
Output:
```text
Bus-zero audit for generated_20260805_prefer_scored_routed
bundle_source: local:C:\shiok\web\public\data\generated_20260805_prefer_scored_routed
manifest_record_count: 124443
processed_record_count: 124443
score_shard_count: 304
manifest_state_counts: {"NOT_YET_SCORED": 476, "NO_TRANSIT_IN_RANGE": 9827, "SCORED": 95157, "SCORED_PARTIAL": 18983}

normal_bus_curve: score=100 when wait<=2 min, score=0 when wait>=15 min, linear interpolation between; bus weight=0.20

A1 total records by state
- SCORED: 95157 (76.466%)
- SCORED_PARTIAL: 18983 (15.254%)
- NO_TRANSIT_IN_RANGE: 9827 (7.897%)
- NOT_YET_SCORED: 476 (0.383%)

A2 count/% of SCORED with bus == 0
- SCORED records: 95157
- SCORED with bus == 0: 39786 (41.811%)

A3 among SCORED bus == 0, direct_bus_fallback.best_expected_wait_min present
- present: 21169 (53.207%)
- wait_min summary: count=21169, min=0.087, p25=0.538, median=0.779, p75=1.337, p90=3, p95=4.65, max=15
- wait_min buckets:
- [0,2): 17716 (83.688%)
- [2,5): 2610 (12.329%)
- [5,10): 839 (3.963%)
- [15,+inf): 4 (0.019%)

A4 composite points restored if fallback wait were scored through normal bus curve
- restored_points summary: count=21169, min=0, p25=20, median=20, p75=20, p90=20, p95=20, max=20
- restored_points buckets:
- [15,20]: 20467 (96.684%)
- [10,15): 684 (3.231%)
- [5,10): 14 (0.066%)
- 0: 4 (0.019%)

A5 per-planning-area hit-rate table sorted by SCORED bus-zero hit rate
planning_area,total,scored,scored_bus_zero,scored_bus_zero_pct,fallback_wait_present,fallback_wait_present_pct_of_scored_bus_zero
CENTRAL_WATER_CATCHMENT,20,1,1,100.000%,0,0.000%
MARINA_EAST,8,1,1,100.000%,0,0.000%
MARINA_SOUTH,6,5,5,100.000%,2,40.000%
STRAITS_VIEW,5,4,4,100.000%,2,50.000%
NEWTON,623,568,422,74.296%,155,36.730%
BUKIT_TIMAH,11870,8394,5491,65.416%,1666,30.341%
TANGLIN,2265,1644,1025,62.348%,384,37.463%
BISHAN,3831,3703,2271,61.329%,1472,64.817%
RIVER_VALLEY,826,803,485,60.399%,339,69.897%
NOVENA,3815,3228,1887,58.457%,786,41.653%
HOUGANG,8052,6088,3541,58.164%,1524,43.039%
SOUTHERN_ISLANDS,579,26,15,57.692%,0,0.000%
WESTERN_WATER_CATCHMENT,354,121,67,55.372%,0,0.000%
BUKIT_PANJANG,1749,1503,727,48.370%,540,74.278%
MARINE_PARADE,3820,3661,1606,43.868%,1015,63.200%
SELETAR,302,76,33,43.421%,0,0.000%
QUEENSTOWN,2713,2295,990,43.137%,595,60.101%
ANG_MO_KIO,5633,4217,1818,43.111%,1251,68.812%
BEDOK,15570,13432,5735,42.697%,3382,58.971%
YISHUN,2871,2189,926,42.302%,318,34.341%
BUKIT_BATOK,2577,2107,855,40.579%,489,57.193%
TUAS,1671,725,288,39.724%,137,47.569%
SERANGOON,11902,6523,2568,39.368%,1451,56.503%
TAMPINES,3155,2793,1094,39.169%,894,81.718%
MANDAI,284,190,70,36.842%,0,0.000%
TOA_PAYOH,2979,2781,1022,36.749%,661,64.677%
CLEMENTI,2692,1480,538,36.351%,158,29.368%
BOON_LAY,279,84,29,34.524%,0,0.000%
SINGAPORE_RIVER,446,445,150,33.708%,133,88.667%
PIONEER,842,430,134,31.163%,78,58.209%
SUNGEI_KADUT,964,256,77,30.078%,2,2.597%
SEMBAWANG,2374,1469,436,29.680%,223,51.147%
WOODLANDS,1914,1519,450,29.625%,364,80.889%
PUNGGOL,1209,1191,350,29.387%,263,75.143%
GEYLANG,5422,5229,1487,28.438%,1028,69.132%
BUKIT_MERAH,1651,1416,382,26.977%,235,61.518%
KALLANG,2762,2712,686,25.295%,378,55.102%
SENGKANG,1768,1733,427,24.639%,354,82.904%
PAYA_LEBAR,130,38,9,23.684%,0,0.000%
JURONG_EAST,822,447,105,23.490%,53,50.476%
ROCHOR,2367,2367,515,21.757%,185,35.922%
CHANGI,460,153,32,20.915%,1,3.125%
JURONG_WEST,2762,1600,333,20.812%,209,62.763%
LIM_CHU_KANG,158,5,1,20.000%,0,0.000%
MUSEUM,130,130,24,18.462%,17,70.833%
CHOA_CHU_KANG,1469,1167,210,17.995%,185,88.095%
ORCHARD,167,167,29,17.365%,15,51.724%
DOWNTOWN_CORE,483,475,70,14.737%,52,74.286%
PASIR_RIS,3232,1974,256,12.969%,81,31.641%
OUTRAM,1413,1412,107,7.578%,92,85.981%
TENGAH,325,180,2,1.111%,0,0.000%
CHANGI_BAY,4,0,0,n/a,0,n/a
NORTH_EASTERN_ISLANDS,40,0,0,n/a,0,n/a
SIMPANG,2,0,0,n/a,0,n/a
UNKNOWN,498,0,0,n/a,0,n/a
WESTERN_ISLANDS,178,0,0,n/a,0,n/a

A6 direct_bus_fallback.reason distribution for SCORED bus == 0 records with fallback provenance
- implausible_graph_route_to_datamall_bus_stop_within_direct_radius: 19876 (93.892%)
- multiple_implausible_graph_routes_to_datamall_bus_stops_within_direct_radius: 1070 (5.055%)
- low_trust_bus_stop_road_centerline_route: 121 (0.572%)
- dominant_unrouted_bus_endpoint_and_access_connectors: 59 (0.279%)
- large_unrouted_bus_stop_access_connector: 42 (0.198%)
- dominant_unrouted_bus_endpoint_snap: 1 (0.005%)

A7 nearest_direct_m distribution for affected records
- nearest_direct_m summary: count=21169, min=14.2, p25=134.9, median=186.9, p75=239.4, p90=275.6, p95=289.8, max=305
- nearest_direct_m buckets:
- [150,200): 5131 (24.238%)
- [200,250): 4971 (23.482%)
- [100,150): 4491 (21.215%)
- [250,305]: 4293 (20.280%)
- [50,100): 2027 (9.575%)
- [0,50): 256 (1.209%)
```

Subagent B OneMap credential check command:
```powershell
@(Get-ChildItem Env: | Where-Object { $_.Name -match 'ONEMAP|DATAMALL|LTA' }).Count
```
Output:
```text
0
```

Subagent B 20-postal OneMap comparison table:
```text
postal | planning area | nearest_direct_m | our graph result | OneMap walking distance | verdict
478938 | TAMPINES | 110.0 | best MRT 1091.6m; nearest bus direct_bus_fallback_unrouted 110.0m | UNVERIFIABLE | UNVERIFIABLE
478939 | TAMPINES | 110.0 | best MRT 1091.6m; nearest bus direct_bus_fallback_unrouted 110.0m | UNVERIFIABLE | UNVERIFIABLE
478940 | TAMPINES | 119.4 | best MRT 563.1m; nearest bus direct_bus_fallback_unrouted 119.4m | UNVERIFIABLE | UNVERIFIABLE
478941 | TAMPINES | 119.4 | best MRT 563.1m; nearest bus direct_bus_fallback_unrouted 119.4m | UNVERIFIABLE | UNVERIFIABLE
530227 | ANG_MO_KIO | 99.1 | best MRT 871.9m; nearest bus direct_bus_fallback_unrouted 99.1m | UNVERIFIABLE | UNVERIFIABLE
410104 | BEDOK | 158.7 | best MRT 888.3m; nearest bus direct_bus_fallback_unrouted 158.7m | UNVERIFIABLE | UNVERIFIABLE
000135 | BISHAN | 170.6 | best MRT 522.0m; nearest bus graph_routed_bus_stop 289.9m | UNVERIFIABLE | UNVERIFIABLE
618301 | BOON_LAY | 256.8 | best bus 411.7m; nearest bus graph_routed_bus_stop 426.9m | UNVERIFIABLE | UNVERIFIABLE
588192 | BUKIT_BATOK | 140.7 | best MRT 462.2m; nearest bus direct_bus_fallback_unrouted 140.7m | UNVERIFIABLE | UNVERIFIABLE
080009 | BUKIT_MERAH | 219.5 | best MRT 395.7m; nearest bus graph_routed_bus_stop 344.6m | UNVERIFIABLE | UNVERIFIABLE
587761 | BUKIT_PANJANG | null | best MRT 1037.6m; no bus candidate in exported candidates | UNVERIFIABLE | UNVERIFIABLE
259240 | BUKIT_TIMAH | 91.8 | best MRT 824.3m; nearest bus direct_bus_fallback_unrouted 91.8m | UNVERIFIABLE | UNVERIFIABLE
729826 | CENTRAL_WATER_CATCHMENT | 159.9 | best bus 268.8m; nearest bus graph_routed_bus_stop_with_access_connector 268.8m | UNVERIFIABLE | UNVERIFIABLE
498807 | CHANGI | 246.4 | best bus 307.0m; nearest bus graph_routed_bus_stop 306.3m | UNVERIFIABLE | UNVERIFIABLE
677727 | CHOA_CHU_KANG | 115.4 | best MRT 342.1m; nearest bus direct_bus_fallback_unrouted 115.4m | UNVERIFIABLE | UNVERIFIABLE
120101 | CLEMENTI | 232.2 | best MRT 1009.5m; nearest bus graph_routed_bus_stop 317.0m | UNVERIFIABLE | UNVERIFIABLE
018906 | DOWNTOWN_CORE | 178.2 | best MRT 392.1m; nearest bus direct_bus_fallback_unrouted 178.2m | UNVERIFIABLE | UNVERIFIABLE
309849 | GEYLANG | 72.6 | best MRT 1068.8m; nearest bus direct_bus_fallback_unrouted 72.6m | UNVERIFIABLE | UNVERIFIABLE
530015 | HOUGANG | 161.2 | best MRT 1091.1m; nearest bus direct_bus_fallback_unrouted 161.2m | UNVERIFIABLE | UNVERIFIABLE
600025 | JURONG_EAST | 199.2 | best bus 346.6m; nearest bus graph_routed_bus_stop 295.1m | UNVERIFIABLE | UNVERIFIABLE
```

Subagent B stated position:
```text
B1/B2 mostly defeat the "bus 0.0 should be null" claim. The design intent is explicit: null means bus data unavailable/pending; 0.0 means real bus data was available and scored as no qualifying/zero-credit bus connectivity. B3 live OneMap result: UNVERIFIABLE because ONEMAP_EMAIL / ONEMAP_PASSWORD are unavailable.
```

Command: Get-Content qa\verification\bus_fallback_blast_radius_20260812.txt
Output:
```text
Bus fallback blast-radius analysis
bundle: generated_20260805_prefer_scored_routed
bundle_dir: C:\shiok\web\public\data\generated_20260805_prefer_scored_routed
manifest_record_count: 124443
processed_record_count: 124443
manifest_state_counts: {"NOT_YET_SCORED": 476, "NO_TRANSIT_IN_RANGE": 9827, "SCORED": 95157, "SCORED_PARTIAL": 18983}
processed_state_counts: {"NOT_YET_SCORED": 476, "NO_TRANSIT_IN_RANGE": 9827, "SCORED": 95157, "SCORED_PARTIAL": 18983}

hypothesis:
- For SCORED records where published subscores.bus == 0 and provenance.direct_bus_fallback.best_expected_wait_min is numeric, replace bus with the normal wait curve and recompute only the published total in memory.
- Normal wait curve: score=100 when wait<=2 min, score=0 when wait>=15 min, linear interpolation between; bus weight=0.20; published total rounded to 1 decimal.

C1 movement and ranking
- numeric published totals considered for ranking: 114140
- SCORED records: 95157
- SCORED records with published bus == 0: 39786 (41.811%)
- SCORED bus==0 records with fallback wait and numeric total: 21169 (53.207%)
- published totals that move after 1-decimal rounding: 21165
- published totals unchanged after 1-decimal rounding: 4
- delta summary, all eligible fallback-wait records: count=21169, min=0, p25=20, median=20, p75=20, p90=20, p95=20, p99=20, max=20
- delta summary, positive moved records only: count=21165, min=9.6, p25=20, median=20, p75=20, p90=20, p95=20, p99=20, max=20
- Spearman rank correlation vs current published totals: 0.924322063
- top-100 overlap: 99/100 (99.000%)
- top-1000 overlap: 987/1000 (98.700%)
- current top-100 boundary score: 99.5
- hypothetical top-100 boundary score: 99.5
- current top-100 boundary tie count: 43
- hypothetical top-100 boundary tie count: 43
- current top-1000 boundary score: 98.3
- hypothetical top-1000 boundary score: 98.3
- current top-1000 boundary tie count: 85
- hypothetical top-1000 boundary tie count: 87

top-100 entrants under hypothesis:
["822624"]
top-100 exits under hypothesis:
["760145"]

largest total increases:
postal,current_total,hypothetical_total,delta,wait_min,fallback_bus
018906,51.9,71.9,20,0.226,100
018981,53.9,73.9,20,0.225,100
039594,60.4,80.4,20,0.293,100
049419,45.4,65.4,20,0.387,100
049421,45.9,65.9,20,0.387,100
049850,47.4,67.4,20,0.387,100
049851,47.4,67.4,20,0.387,100
068728,47.9,67.9,20,0.273,100
069111,47.9,67.9,20,0.618,100
078883,50.9,70.9,20,0.618,100
080108,57.9,77.9,20,0.577,100
081110,62.4,82.4,20,0.577,100
098740,46.4,66.4,20,0.345,100
099279,44.4,64.4,20,0.337,100
099280,46.4,66.4,20,0.337,100
117836,54.4,74.4,20,0.668,100
117843,49.4,69.4,20,0.668,100
117930,46.9,66.9,20,0.668,100
117932,45.4,65.4,20,0.668,100
118028,48.4,68.4,20,0.668,100

C2 state classification
- state changes under this scoring-from-fallback-wait hypothesis: 0
- Separate null/SCORED_PARTIAL alternative: if the same fallback-wait records were treated as unavailable bus evidence instead of scored bus evidence, 21169 currently-SCORED records would be candidates for SCORED_PARTIAL/null-bus treatment. That is not included in C1.

C3 tests expected to fail
- Expected failing tests under the narrow hypothesis, if implemented with an explicit provenance.direct_bus_fallback.best_expected_wait_min gate: none found.
- Current verification run after this analysis: uv run pytest -q -> 312 passed in 17.55s.
- Current verification run after this analysis: npm test in web -> 93 passed in 727ms.
- Coverage gap: no existing test covers a currently-SCORED selected record with subscores.bus == 0 plus fallback wait provenance being used to recompute bus/total.
- Nearby guard tests for P5: tests/test_scoring_integration.py:386 test_record_assembly_scores_real_zero_bus_as_zero_not_partial; tests/test_scoring_integration.py:422 test_direct_bus_fallback_scores_partial_without_routed_shelter_geometry; tests/test_scoring_integration.py:2419 test_assemble_score_record_prefers_routed_mrt_over_direct_bus_fallback; tests/test_scoring_integration.py:2435 test_repick_best_transit_flips_legacy_fallback_record_to_routed_mrt.
- If P5 instead applies route_options.bus fallback unconditionally rather than requiring fallback-wait provenance, the 2419/2435 routed-MRT preference tests are the likely failures because they assert the selected routed total stays 38.0/37.8.

C4 P5 touch list
- pipeline/scoring.py:44 normal bus wait curve; reuse, do not rewrite formula.
- pipeline/scoring.py:98 composite sum behavior; reuse bus weight contribution semantics.
- pipeline/config/params.yaml:51-52 bus wait thresholds; verify unchanged.
- pipeline/config/weights.yaml:4 bus_connectivity weight 0.20; verify unchanged.
- pipeline/scoring_integration.py:1975 assemble_score_record entry point; add the selected-record fallback bus substitution here or in a small helper.
- pipeline/scoring_integration.py:2001-2005 best/best_mrt/best_bus selection; source the eligible bus fallback candidate without changing best_transit election.
- pipeline/scoring_integration.py:2005-2017 route_options publication; keep route_options.bus honest and avoid making fallback the selected route.
- pipeline/scoring_integration.py:2021-2025 record state/total/subscores/best_node/paths; only total/subscores.bus should move under this hypothesis, state and selected path should not.
- pipeline/scoring_integration.py:2612-2662 and 2672-2698 direct_bus_fallback provenance writers; preserve best_expected_wait_min and add any audit marker here if needed.
- pipeline/export.py:717, 825-826, 890-891, 1422, 1448 export/manifest refresh; state counts remain unchanged under C1 but refreshed score shards/manifests must reflect totals.
- tests/test_scoring_integration.py:386, 422, 2419, 2435 plus one new regression test for SCORED bus-zero with fallback wait provenance.
- tests/test_export.py:181 and 628, tests/test_onemap_validation.py:32, web/lib/__tests__/data.test.ts:48-52; verify exported schema, refreshed manifest, validation sample loading, and web score-record assumptions.
- scripts/production_readiness.py:469-555, scripts/launch-check.ps1:220-243, scripts/release-data-bundle.ps1:36-48 and 87; operational gates to rerun/verify, not necessarily code changes.
- Generated bundle artifacts in web/public/data/<new-bundle>/scores/*.json, manifest.json, *.gz, plus web/data-bundle.json only at owner-approved activation time.
- decisions.md: append dated rationale if P5 changes the scoring contract.

C5 recorded rerun/republish cost
- Prior full OneMap validation status timestamps: qa/onemap_full_validation_20260808_full_scored/status.json was created 2026-08-08 18:32:54 SGT and completed 2026-08-11 02:14:31 SGT, about 55h 41m 37s wall clock.
- Fresh no-cache OneMap floor from recorded config: 95,157 rows * 2s delay = 190,314s = 52h 51m 54s before overhead.
- Final recorded batch was mostly cached: batch 90 queued 132 requests, wrote 132, 02:09:24 to 02:14:07 SGT progress, then status complete at 02:14:31.
- Release/test/build after a validated bundle is minutes-scale: prior release log shows 310 Python tests in 22.63s, web tests around 0.8-1.3s, Next build compile/type/static steps sub-second to about 1s each, and a 188MB Vercel upload. The log does not record a precise total release wall clock.
- I did not find a recorded full scoring/export wall-clock for regenerating the bundle itself.
```

Recommendation:
```text
Recommendation: (iii) the defect is real but the true root cause is network conflation and the right fix is in the network build, not a scoring-only substitution.

Confidence: medium-high for the defect existing; medium for root cause because B3 live OneMap routing is UNVERIFIABLE in this environment.

Reason: 21,169 currently SCORED records publish bus=0 while their own provenance has fallback wait evidence, median wait 0.779 min and median potential bus contribution +20 composite points. The dominant reason is implausible_graph_route_to_datamall_bus_stop_within_direct_radius at 93.892%, and nearest_direct_m median is 186.9m. That is too structured and too close-distance-heavy to treat as ordinary no-transit access. However, direct_bus_fallback was intentionally designed as unrouted/partial evidence, and without OneMap B3 confirmation we should not simply promote it to authoritative bus scoring as P5. The most defensible P5 starts by repairing/validating graph conflation around DataMall bus stops, then either scores the now-routed bus path or explicitly marks unresolved cases partial/null.

Evidence that would change this: OneMap B3 showing most sampled cases cannot route to the nearest DataMall bus stop at plausible walking distance would weaken the defect claim and support current graph rejection. OneMap showing routable 120-300m walks for most samples would upgrade confidence and point to network conflation as the immediate fix.
```

FINDINGS:
```text
1. OneMap B3 is UNVERIFIABLE in this environment because no ONEMAP/DATAMALL/LTA environment variables are present.
2. The user-provided 56-shard measurement understated the full-bundle impact: all 304 score shards contain 95,157 SCORED rows, 39,786 SCORED rows with bus==0, and 21,169 rows with fallback wait provenance.
3. Current tests do not cover the exact case of a selected SCORED record with bus==0 plus direct_bus_fallback.best_expected_wait_min provenance.
4. A narrow fallback-wait substitution would move 21,165 published totals after rounding and materially lower Spearman to 0.924322063, so P5 cannot be treated as a small cosmetic correction.
```

DISAGREEMENTS:
```text
No disagreement with the investigation premise. The only unresolved premise is B3 because OneMap credentials are unavailable here.
```
