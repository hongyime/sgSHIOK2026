```text
$ git rev-parse HEAD
3a39e1331b86868c13f195a517f702e146ad16fd
```

```text
$ git status --short --branch
## main...origin/main
?? qa/p6_rerun_cost_20260812_102712/
```

```text
$ git grep -n "untrusted_subscores" pipeline/scoring_integration.py
pipeline/scoring_integration.py:2663:                "untrusted_subscores": ["rain", "heat", "crossing"],
pipeline/scoring_integration.py:2699:                "untrusted_subscores": ["rain", "heat", "crossing"],
```

```text
$ git grep -n "untrusted" web/ || echo NO_WEB_MATCH
NO_WEB_MATCH
```

```text
$ python full_bundle_untrusted_counts.py
total_records=124443
state_counts={"NOT_YET_SCORED": 476, "NO_TRANSIT_IN_RANGE": 9827, "SCORED": 95157, "SCORED_PARTIAL": 18983}
scored_records=95157
untrusted_total=72587
untrusted_by_state={"SCORED": 53604, "SCORED_PARTIAL": 18983}
untrusted_scored_share=56.332167%
bus_split={"bus==0": 21169, "bus>0": 51418}
reason_split=
{"bus==0": 19876, "bus>0": 39036, "n": 58912, "reason": "implausible_graph_route_to_datamall_bus_stop_within_direct_radius"}
{"bus==0": 1070, "bus>0": 6698, "n": 7768, "reason": "multiple_implausible_graph_routes_to_datamall_bus_stops_within_direct_radius"}
{"bus==0": 59, "bus>0": 2598, "n": 2657, "reason": "dominant_unrouted_bus_endpoint_and_access_connectors"}
{"bus==0": 121, "bus>0": 1091, "n": 1212, "reason": "low_trust_bus_stop_road_centerline_route"}
{"bus==0": 42, "bus>0": 1024, "n": 1066, "reason": "large_unrouted_bus_stop_access_connector"}
{"bus>0": 958, "n": 958, "reason": "no_graph_routed_transit_candidate_but_datamall_bus_stop_within_direct_radius"}
{"bus==0": 1, "bus>0": 13, "n": 14, "reason": "dominant_unrouted_bus_endpoint_snap"}
```

```text
$ subagent_a_summary
reason,records,best_fallback_null_triplet,best_routed_numeric_triplet,other
dominant_unrouted_bus_endpoint_and_access_connectors,6744,1299,5445,0
dominant_unrouted_bus_endpoint_snap,68,28,40,0
implausible_graph_route_to_datamall_bus_stop_within_direct_radius,66390,17271,49119,0
large_unrouted_bus_stop_access_connector,2993,527,2466,0
low_trust_bus_stop_road_centerline_route,3718,976,2742,0
no_graph_routed_transit_candidate_but_datamall_bus_stop_within_direct_radius,958,958,0,0
```

```text
$ npm --prefix web test -- --runInBand lib/__tests__/p7-render-output.test.tsx --reporter=verbose
{
  "flagged_bus_zero": "Nearby bus evidence not route-verified ... 62% sheltered on covered route ... Walking network access was not verified, so this sub-score remains 0.",
  "flagged_bus_positive": "240 m to transit 62% sheltered on covered route ... Bus connectivity 100 20%",
  "unflagged_bus_zero": "Limited bus connectivity 240 m to transit ... Bus connectivity 0 20%",
  "unflagged_bus_positive": "240 m to transit 62% sheltered on covered route ... Bus connectivity 82 20%"
}
```

```text
$ python historical_blob_hash_search.py
PATH pipeline/scoring_integration.py
target=a7b4a8cbaefb4731e6711ffb8595e3241de654032e887691eef7bc91f5b975ae
historical_blob_count=36
matches=
909c9b8 2026-08-04 15:47:00 +0800 feat(pipeline): emit top-5 transit candidates per postal in score records
PATH pipeline/routing.py
target=8fb450690bf9d024b9c43dd02476a7d4e73805cd3b59b6ecbc2022dcc1a69e7c
historical_blob_count=13
matches=
97685b3 2026-08-03 06:17:37 +0800 fix: orient routed geometry in path order
```

```text
$ python sampled_fingerprint_sets.py
sampled_fingerprint_sets=1
count=2128
{"pipeline\\config\\params.yaml": "a05e9e9aac805de4a12217214ee574f6dc8813054d2fa8993a73e7d649bb1ce1", "pipeline\\config\\weights.yaml": "5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec", "pipeline\\routing.py": "8fb450690bf9d024b9c43dd02476a7d4e73805cd3b59b6ecbc2022dcc1a69e7c", "pipeline\\scoring.py": "255b4a225a625848e150673b01bccfbc679eea668a254667a9b01c2179bf610c", "pipeline\\scoring_integration.py": "a7b4a8cbaefb4731e6711ffb8595e3241de654032e887691eef7bc91f5b975ae"}
```

```text
$ git log --oneline --date=iso --format="%h %ci %s" 97685b3..3a39e13 -- pipeline/scoring_integration.py pipeline/routing.py pipeline/export.py pipeline/fetch.py pipeline/score_batch.py run.py
5db6ff4 2026-08-12 09:45:06 +0800 fix: fail ingest on source and count validation errors
dba7538 2026-08-12 07:50:58 +0800 refactor: remove dead route batch path
3a3244e 2026-08-11 15:29:31 +0800 perf: cache route path materialization
73add7c 2026-08-11 15:26:53 +0800 perf: reuse routing graph workers
648c53d 2026-08-05 21:11:50 +0800 fix(export): scope picker repick to SCORED_PARTIAL -> mrt_lrt promotion
04f51e2 2026-08-05 20:15:18 +0800 fix(export): stop h3 boundary drift from producing oversized geom shards
4f6e8ec 2026-08-05 19:04:48 +0800 fix(scoring): prefer routed SCORED over fallback SCORED_PARTIAL in best_transit
909c9b8 2026-08-04 15:47:00 +0800 feat(pipeline): emit top-5 transit candidates per postal in score records
a1698fd 2026-08-04 14:43:10 +0800 fix(routing): guard against snap-bug routes shorter than crow-flies
7770545 2026-08-03 07:28:57 +0800 chore: rebuild compact network debug artifact
4e21cd2 2026-08-03 07:19:05 +0800 fix: guard connector-heavy bus routes
e88a8e3 2026-08-03 07:00:25 +0800 fix: backfill scoring fingerprints in manifests
e87f91b 2026-08-03 06:50:31 +0800 fix: exclude over-cap bus routes from default selection
add705b 2026-08-03 06:38:43 +0800 qa: add postal candidate ranking audit
```

```text
$ python p6_scratch_classification.py
active_only_count=411
active_only_state_counts={"NOT_YET_SCORED": 157, "NO_TRANSIT_IN_RANGE": 15, "SCORED": 199, "SCORED_PARTIAL": 40}
active_only_area_counts_top10=UNKNOWN 157; BUKIT_TIMAH 38; BEDOK 38; NOVENA 33; SERANGOON 27; HOUGANG 22; MARINE_PARADE 20; TANGLIN 14; GEYLANG 12; TAMPINES 8
active_only_prefix_counts_top10=439 15; 299 14; 289 13; 308 10; 309 10; 249 9; 548 9; 418 8; 438 7; 489 7
moved_total_count=7527
delta_summary={"max": 71.4, "mean": 0.48423010495549357, "median": 0.09999999999999432, "min": -68.3, "p01": -31.843999999999998, "p05": -6.16, "p25": -0.1999999999999993, "p75": 0.20000000000000284, "p95": 13.5, "p99": 32.4}
abs_delta_summary={"max": 71.4, "mean": 3.2213630928656833, "median": 0.20000000000000107, "min": 0.09999999999999432, "p01": 0.09999999999999432, "p05": 0.09999999999999432, "p25": 0.10000000000000142, "p75": 1.3000000000000005, "p95": 20.5, "p99": 41.315999999999995}
subscore_moved_counts={"access": 5459, "bus": 643, "crossing": 1057, "heat": 5157, "rain": 4964}
state_move_counts={"('NO_TRANSIT_IN_RANGE', 'SCORED')": 22, "('NO_TRANSIT_IN_RANGE', 'SCORED_PARTIAL')": 6, "('SCORED', 'NO_TRANSIT_IN_RANGE')": 19, "('SCORED', 'SCORED_PARTIAL')": 149, "('SCORED_PARTIAL', 'NO_TRANSIT_IN_RANGE')": 11, "('SCORED_PARTIAL', 'SCORED')": 263}
```

```text
$ python p7_subset_setup.py
input_rows=124032
subset_rows=1000
subset_path=qa\p7_determinism_20260813\subset_1000.parquet
first_postal=000104
last_postal=059818
status_counts={"NEEDS_GEOCODE":49,"READY_TO_SCORE":951}
```

```text
$ p7_subset_run_status
run1_bundle files=0 chunks=0 batch_manifest=False bundle_manifest=False
run1_score files=1 chunks=1 batch_manifest=False bundle_manifest=False
chunk_00001_000104_058360.json 100672802 2026-08-13T10:16:58.058747
REMAINING
```

```text
$ git show 3a39e13:pipeline/scoring_integration.py | Select-String -Pattern 'SCORING_FINGERPRINT_FILES' -Context 0,6
SCORING_FINGERPRINT_FILES = (
    "pipeline/scoring.py",
    "pipeline/scoring_integration.py",
    "pipeline/routing.py",
    "pipeline/config/params.yaml",
    "pipeline/config/weights.yaml",
)
```

```text
$ python new_fingerprint_list.py
new_fingerprint_file_list=
pipeline/bus.py
pipeline/bus_arrivals.py
pipeline/connector_candidates.py
pipeline/export.py
pipeline/fetch.py
pipeline/geocode.py
pipeline/geocode_universe.py
pipeline/network.py
pipeline/osm_tags.py
pipeline/postal_universe.py
pipeline/routing.py
pipeline/score_batch.py
pipeline/scoring.py
pipeline/scoring_integration.py
pipeline/shade.py
pipeline/config/params.yaml
pipeline/config/weights.yaml
run.py
```

```text
$ uv run pytest tests/test_scoring_integration.py::test_bus_module_content_changes_scoring_fingerprint -q
.                                                                        [100%]
1 passed in 0.95s
```

```text
$ negative_control_without_pipeline_bus_py
FAILED tests/test_scoring_integration.py::test_bus_module_content_changes_scoring_fingerprint
KeyError: 'pipeline\\bus.py'
```

```text
$ python checksums_generation.py
bundle=generated_20260805_prefer_scored_routed
file_count=4848
manifest_sha256=7108e66e70628f3211883402fc753c2f5809db5a822d6a2415f6ae6459a1070e
output=checksums.json
```

```text
$ git show --stat --name-only 4332ab3
commit 4332ab3d0e0829b51569fd679c1eada2cd4dc77b
Author: GitHub Actions Sync <actions@github.com>
Date:   Wed Aug 12 03:34:33 2026 +0000

    chore(config): sync from sourcerepo [skip ci]

.github/workflows/bandit.yml
.github/workflows/labeler.yml
.github/workflows/trufflehog.yml
.vercelignore
AGENTS.md
NOTICE
```

```text
$ Test-Path .github\workflows\sync-repo-settings.yml; git ls-files .github/workflows/sync-repo-settings.yml
False
```

```text
$ git ls-files ATTRIBUTION.md NOTICE AGENTS.md; rg -n "OpenStreetMap contributors|OneMap|Singapore Land Authority" ATTRIBUTION.md NOTICE web/app/page.tsx
AGENTS.md
ATTRIBUTION.md
NOTICE
web/app/page.tsx:1783:              Sources: LTA/data.gov.sg, OneMap/SLA, © OpenStreetMap contributors (
NOTICE:7:- OneMap GreyLite basemap and OneMap Search/Routing APIs, published by the
NOTICE:8:  Singapore Land Authority and OneMap. OneMap API datasets are identified by
NOTICE:9:  OneMap API Terms as Singapore Open Data Licence v1.0 datasets; the GreyLite
NOTICE:10:  map display requires visible OneMap and Singapore Land Authority attribution.
NOTICE:49:  © OpenStreetMap contributors.
ATTRIBUTION.md:13:- OneMap: https://www.onemap.gov.sg/
ATTRIBUTION.md:14:- Singapore Land Authority: https://www.sla.gov.sg/
```

```text
$ uv run python run.py test
collected 316 items
============================ 316 passed in 35.35s =============================
```

```text
$ npm --prefix web test -- --runInBand
Test Files  21 passed (21)
Tests  103 passed (103)
```

```text
$ git diff 3a39e13..HEAD -- pipeline/config/weights.yaml pipeline/config/params.yaml
```

```text
$ git diff -- web/public/data/generated_20260805_prefer_scored_routed/ | Measure-Object -Line
Lines
-----
0
```

```text
$ Test-Path qa/p6_rerun_cost_20260812_102712
True
```
