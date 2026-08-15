# P12 State Consolidation Evidence

## Root and Host

```text
PRAWN-E14
C:\sgSHIOK2026
```

## Git State After Strand 1 State Commit

```text
c7ec7f0a4d968eba22fe55977237ba6b165ebd0c
```

```text
c7ec7f0a4d968eba22fe55977237ba6b165ebd0c	refs/heads/main
```

```text
c7ec7f0 docs: update agent state after P11 completion
ccc4e81 test: record P11 E14 relocation and determinism evidence
3ae01f1 docs: restore P11 migration evidence and portability notes
dc3ea6a docs: record P11 migration portability decision
52e03a8 fix: resolve diag script raw paths from repo root
fe6b6b8 fix: summarize failed OneMap readiness criteria
5bbcfb0 fix: restore NOTICE, AGENTS.md and .vercelignore after sourcerepo sync
b21e927 chore(config): sync from sourcerepo [skip ci]
cf3879c docs: track agent handoff state
8014acf docs: capture T14 machine baseline for migration
```

```text
exit_code=1
```

## Strand 1 Tag and Branch Retirement

Remote tags before:

```text
41d91397aa485f14f434fe9fc980afad288d8a81	refs/tags/p11-wip
```

Tag push:

```text
To https://github.com/hongyime/sgSHIOK2026.git
 * [new tag]         p11-worktree-superseded -> p11-worktree-superseded
```

Remote tags after:

```text
41d91397aa485f14f434fe9fc980afad288d8a81	refs/tags/p11-wip
ca0ef5b37f469c90fc996bbf84539a43de6cb76e	refs/tags/p11-worktree-superseded
c34d95ff2500bd79475d5169066b2101d38370f4	refs/tags/p11-worktree-superseded^{}
```

Branch deletion:

```text
To https://github.com/hongyime/sgSHIOK2026.git
 - [deleted]         p11-wip-worktree
```

Remote branches after:

```text
  origin/HEAD -> origin/main
  origin/dependabot/github_actions/actions/setup-node-7
  origin/dependabot/github_actions/actions/upload-artifact-7
  origin/main
  origin/shell/standardise
  origin/shiok-honesty-performance-20260811
```

## Strand 2 Superset Inventory

```text
WORKING_DIRECTORY=C:\sgSHIOK2026
C_ROOT=C:\sgSHIOK2026
X_ROOT=X:\01 REPOSITORIES\sgSHIOK2026
EXCLUDED_DIRS=.git,.venv,node_modules,.next,__pycache__
INVENTORY drive=C tree=qa exists=True elapsed_seconds=3.339 file_count=1396
INVENTORY drive=X tree=qa exists=True elapsed_seconds=1.769 file_count=866
QA_X_P6_P7_P9_FILE_COUNT=0
GATE_PASS qa_elapsed_limit_seconds=600 C_elapsed_seconds=3.339 C_file_count=1396 X_elapsed_seconds=1.769 X_file_count=866
INVENTORY drive=C tree=processed exists=True elapsed_seconds=0.830 file_count=497
INVENTORY drive=X tree=processed exists=True elapsed_seconds=0.799 file_count=497
INVENTORY drive=C tree=raw exists=True elapsed_seconds=12.011 file_count=12555
INVENTORY drive=X tree=raw exists=True elapsed_seconds=23.657 file_count=12555
INVENTORY drive=C tree=data exists=True elapsed_seconds=0.030 file_count=1
INVENTORY drive=X tree=data exists=True elapsed_seconds=0.051 file_count=1
INVENTORY drive=C tree=web\public\data exists=True elapsed_seconds=52.008 file_count=21607
INVENTORY drive=X tree=web\public\data exists=True elapsed_seconds=24.370 file_count=21607
X_ONLY_COUNT=0
X_ONLY_BEGIN
X_ONLY_END
SIZE_MISMATCH_COUNT=1
SIZE_MISMATCH_BEGIN
X=2955	C=12596	qa\verification\P11-migration-parity.md
SIZE_MISMATCH_END
HASH_TARGETS_BEGIN
SIZE_MISMATCH_SHA256_X=f74f1ceda86cec0ae3b894f114426939b1d427df6311dd9465928e7768742e63	SHA256_C=8244f9a88078b47fd899fad94b7e7d7dfdb1927a96c4cf438ed96e6747f24815	X_SIZE=2955	C_SIZE=12596	qa\verification\P11-migration-parity.md
HASH_TARGETS_END
TOTAL_X_ONLY_BYTES_ARITHMETIC=0
TOTAL_SIZE_MISMATCH_X_BYTES_ARITHMETIC=2955
TOTAL_BYTES_REQUIRING_HASH_ARITHMETIC=0 + 2955 = 2955
ONE_SENTENCE_ANSWER=No X-only files; among qa/, processed/, raw/, data/, and web/public/data/, every file on X: exists on C:, but same-path size mismatches were found and are listed above.
```

## Strand 3 Fingerprint Provenance

```text
POSTAL 000135
BASE_FILE qa/p10_network_provenance_20260813/exported_bundle/scores/BISHAN.json
P11_FILE qa/p11/d_full_w2_1200/exported_bundle/scores/BISHAN.json
BASE_P10_PROVENANCE_BEGIN
{
  "bus_connectivity": {
    "expected_wait_min": null,
    "nearest_routed_m": null,
    "routed_stop_count": 0,
    "service_count": 0,
    "straight_line_stop_count": 3
  },
  "candidate_selection": {
    "node_set_eligible_count": 5,
    "reason": "excluded_graph_routed_bus_candidates_beyond_routed_cap_from_default_choice",
    "selected_total_rank": 3,
    "skipped_ineligible_count": 3
  },
  "manifest": "raw/manifest.json",
  "network_digest": "e459daf2085fc291773765c1",
  "origin_snap_distance_m": 13.3,
  "postal_universe": "qa\\p8_provenance_repair_20260813\\subset_1200_ready.parquet",
  "routing": {
    "detour_budget": 1.25,
    "network": "processed\\network_island.parquet",
    "shelter_lambda": 2.0
  },
  "routing_diagnostics": {
    "candidate_destination_nodes": 8,
    "candidate_scores": 8,
    "nearest_routed_m": 264.9,
    "route_results": 8,
    "routes_within_access_range": 8
  },
  "scoring_fingerprint_digest": "06a6d36c1c8cabf7a5f1052a",
  "scoring_input_digest": "2f7ec7ede5ff5ecebd5f85eb",
  "source_hashes": {
    "bus_routes": "a52a1503aa2d68a0a9e59703ea96a9c0e6cff1720e10d0479384c6f97a88f829",
    "bus_services": "2d2b12b89ed2b2314be7d1ac2738afbdcd2af10a07a7cb6db1fb890d56348e2f",
    "bus_stops": "0362ab970c661de6b322a3372c9ab980faf49805921891a7a1da260687a16a4a",
    "covered_linkway": "d943fe2a992ad50c449c40484e0c642da480598b17f6008907c7b253d87b19ee",
    "leaf_area_index": "26281dbacf4d8707df48d40b83060c65bf81c3f1a39ff81aebaefb8fd628c899",
    "mrt_lrt_exits": "a7eaa90f30991dc0ac4aa970d704123ce3ec9e60c82b42c32a32e74be7dc0327",
    "nparks_heritage_road_green_buffers": "87238ae673f898a30b1fcbf5b5527625b4c49c7aa1769567adb92b93b9b685b5",
    "nparks_heritage_trees": "7f9a1b6413735824704993994b5491c30dcb9d1b746e80a5c17a6f59629d835f",
    "nparks_nature_ways": "9b4e0e1e9d868cc9bff468e1b3028214707f2a41661bc8f279c61e88094f2d11",
    "nparks_park_connector_loop": "83c1838bea9ee355d2ba52c2060eb185612dd0e2e3fdb113aff9cdd6e5c27efd",
    "nparks_tracks": "2df9d9170d716ceefc2e82aa8889a21a27a3a086996bf330a6ab6b21cb1f0627",
    "osm_extract": "0cd4f995c2ab6b38b2985ba9417861e93dc1f58c8ffae06c3deecc37f259128d",
    "overhead_bridge_underpass": "bfa4a0a08a32c72a1ca35aad30e89f940a59ef6fdc137ddf8135a50760d7d444",
    "traffic_signals": "942ff2506603f431f0782a3acdc70fec75d4b15c73b54f1a983c804c60d818af"
  },
  "subscore_status": {
    "access": "real_routed_shortest_distance",
    "bus": "real",
    "crossing": "real_traffic_signals_with_grade_separated_exemption",
    "heat": "provisional_covered_plus_nparks_shade_proxy_heat_only",
    "rain": "real_routed_covered_length_ratio"
  },
  "transit_node_set": {
    "bus_stop_candidate_radius_m": 300.0,
    "bus_stop_candidate_selection_radius_m": 305.0,
    "bus_stop_candidate_tolerance_m": 5.0,
    "bus_stop_candidates_direct": 3,
    "mrt_lrt_exit_candidates": 5
  }
}
BASE_P10_PROVENANCE_END
BASE_P10_FINGERPRINT_MAPPING_FOR_RECORD_DIGEST_BEGIN
{
  "pipeline\\bus.py": "6134d0a40ea0f22042523604ae7ce117203a750c58760107ad9ae63336813573",
  "pipeline\\bus_arrivals.py": "105953816ead1fa685714d659cd48d587fa9e06ad6b7e08a0f81c62068c00c6b",
  "pipeline\\config\\params.yaml": "a05e9e9aac805de4a12217214ee574f6dc8813054d2fa8993a73e7d649bb1ce1",
  "pipeline\\config\\weights.yaml": "5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec",
  "pipeline\\connector_candidates.py": "84ecba57d6480b766f4bca655dea3d1d9b86eade5e13fdd3e5a596d242a48e55",
  "pipeline\\export.py": "86ce19db3bcafa8e2dc9f439ed1ff08f8d98bdf111f3a02f8f121e8d0b65b14b",
  "pipeline\\fetch.py": "d4907049095fa6c46171f8748d1b8a490ece27acc14cde3a300bdb07c017e8e7",
  "pipeline\\geocode.py": "dd11f23f8a854a37069a8481d8585585c008045aab4a2f85be1075a8ff4b8f41",
  "pipeline\\geocode_universe.py": "c377aa696dc51085d7bc4a32724e77e830ec31fb61966ba4381dddbf413e2b0b",
  "pipeline\\network.py": "b4530c4f448ccea121c6f395ced5a9967017dd2f717c12b99c7a0d4312370c88",
  "pipeline\\osm_tags.py": "cfdee9e89f58b96b075ba8e0aae421fabe0fef7daaa1ffc3f686d0546cb92be5",
  "pipeline\\postal_universe.py": "6c07bd1a094cb2f94480f64c89f41e470ce0a4f1decf0aee25ce262beed8f672",
  "pipeline\\routing.py": "3d16db9f83b0bf566844570217044a2adbda968d3e7a25b586cd5ebb1b18694c",
  "pipeline\\score_batch.py": "ad7522425faf70af11ad9ef4d14bfc344b936823c438e4e4d465e3b7b4d48ffc",
  "pipeline\\scoring.py": "255b4a225a625848e150673b01bccfbc679eea668a254667a9b01c2179bf610c",
  "pipeline\\scoring_integration.py": "6cac1b392c0151c61c41b4833e3ff773e4a93b6038077b2e4f0117519e5bbfb3",
  "pipeline\\shade.py": "493e5c96db973687ffb5095741fdcac27f6ff928f852189aebf9060fc71b472a",
  "run.py": "2cd24279208230165927dd86e7ed035a9369808c252b4a3f23807db5486b713f"
}
BASE_P10_FINGERPRINT_MAPPING_FOR_RECORD_DIGEST_END
BASE_P10_RECOMPUTED_DIGEST 06a6d36c1c8cabf7a5f1052a
P11_E14_PROVENANCE_BEGIN
{
  "bus_connectivity": {
    "expected_wait_min": null,
    "nearest_routed_m": null,
    "routed_stop_count": 0,
    "service_count": 0,
    "straight_line_stop_count": 3
  },
  "candidate_selection": {
    "node_set_eligible_count": 5,
    "reason": "excluded_graph_routed_bus_candidates_beyond_routed_cap_from_default_choice",
    "selected_total_rank": 3,
    "skipped_ineligible_count": 3
  },
  "manifest": "raw/manifest.json",
  "network_digest": "e459daf2085fc291773765c1",
  "origin_snap_distance_m": 13.3,
  "postal_universe": "qa\\p11\\d_full_w2_1200\\partitions\\part01_of02.parquet",
  "routing": {
    "detour_budget": 1.25,
    "network": "processed\\network_island.parquet",
    "shelter_lambda": 2.0
  },
  "routing_diagnostics": {
    "candidate_destination_nodes": 8,
    "candidate_scores": 8,
    "nearest_routed_m": 264.9,
    "route_results": 8,
    "routes_within_access_range": 8
  },
  "scoring_fingerprint_digest": "1e312a49f13cdc8a42902b1e",
  "scoring_input_digest": "876938d7a1cee98febc7234a",
  "source_hashes": {
    "bus_routes": "a52a1503aa2d68a0a9e59703ea96a9c0e6cff1720e10d0479384c6f97a88f829",
    "bus_services": "2d2b12b89ed2b2314be7d1ac2738afbdcd2af10a07a7cb6db1fb890d56348e2f",
    "bus_stops": "0362ab970c661de6b322a3372c9ab980faf49805921891a7a1da260687a16a4a",
    "covered_linkway": "d943fe2a992ad50c449c40484e0c642da480598b17f6008907c7b253d87b19ee",
    "leaf_area_index": "26281dbacf4d8707df48d40b83060c65bf81c3f1a39ff81aebaefb8fd628c899",
    "mrt_lrt_exits": "a7eaa90f30991dc0ac4aa970d704123ce3ec9e60c82b42c32a32e74be7dc0327",
    "nparks_heritage_road_green_buffers": "87238ae673f898a30b1fcbf5b5527625b4c49c7aa1769567adb92b93b9b685b5",
    "nparks_heritage_trees": "7f9a1b6413735824704993994b5491c30dcb9d1b746e80a5c17a6f59629d835f",
    "nparks_nature_ways": "9b4e0e1e9d868cc9bff468e1b3028214707f2a41661bc8f279c61e88094f2d11",
    "nparks_park_connector_loop": "83c1838bea9ee355d2ba52c2060eb185612dd0e2e3fdb113aff9cdd6e5c27efd",
    "nparks_tracks": "2df9d9170d716ceefc2e82aa8889a21a27a3a086996bf330a6ab6b21cb1f0627",
    "osm_extract": "0cd4f995c2ab6b38b2985ba9417861e93dc1f58c8ffae06c3deecc37f259128d",
    "overhead_bridge_underpass": "bfa4a0a08a32c72a1ca35aad30e89f940a59ef6fdc137ddf8135a50760d7d444",
    "traffic_signals": "942ff2506603f431f0782a3acdc70fec75d4b15c73b54f1a983c804c60d818af"
  },
  "subscore_status": {
    "access": "real_routed_shortest_distance",
    "bus": "real",
    "crossing": "real_traffic_signals_with_grade_separated_exemption",
    "heat": "provisional_covered_plus_nparks_shade_proxy_heat_only",
    "rain": "real_routed_covered_length_ratio"
  },
  "transit_node_set": {
    "bus_stop_candidate_radius_m": 300.0,
    "bus_stop_candidate_selection_radius_m": 305.0,
    "bus_stop_candidate_tolerance_m": 5.0,
    "bus_stop_candidates_direct": 3,
    "mrt_lrt_exit_candidates": 5
  }
}
P11_E14_PROVENANCE_END
P11_E14_FINGERPRINT_MAPPING_FOR_RECORD_DIGEST_BEGIN
{
  "pipeline\\bus.py": "6134d0a40ea0f22042523604ae7ce117203a750c58760107ad9ae63336813573",
  "pipeline\\bus_arrivals.py": "105953816ead1fa685714d659cd48d587fa9e06ad6b7e08a0f81c62068c00c6b",
  "pipeline\\config\\params.yaml": "a05e9e9aac805de4a12217214ee574f6dc8813054d2fa8993a73e7d649bb1ce1",
  "pipeline\\config\\weights.yaml": "5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec",
  "pipeline\\connector_candidates.py": "84ecba57d6480b766f4bca655dea3d1d9b86eade5e13fdd3e5a596d242a48e55",
  "pipeline\\export.py": "86ce19db3bcafa8e2dc9f439ed1ff08f8d98bdf111f3a02f8f121e8d0b65b14b",
  "pipeline\\fetch.py": "d4907049095fa6c46171f8748d1b8a490ece27acc14cde3a300bdb07c017e8e7",
  "pipeline\\geocode.py": "dd11f23f8a854a37069a8481d8585585c008045aab4a2f85be1075a8ff4b8f41",
  "pipeline\\geocode_universe.py": "c377aa696dc51085d7bc4a32724e77e830ec31fb61966ba4381dddbf413e2b0b",
  "pipeline\\network.py": "b4530c4f448ccea121c6f395ced5a9967017dd2f717c12b99c7a0d4312370c88",
  "pipeline\\osm_tags.py": "cfdee9e89f58b96b075ba8e0aae421fabe0fef7daaa1ffc3f686d0546cb92be5",
  "pipeline\\postal_universe.py": "6c07bd1a094cb2f94480f64c89f41e470ce0a4f1decf0aee25ce262beed8f672",
  "pipeline\\routing.py": "3d16db9f83b0bf566844570217044a2adbda968d3e7a25b586cd5ebb1b18694c",
  "pipeline\\score_batch.py": "28dc5bc769744a993e26d1d03c70a6abe677eaf20a42d12ffd848a668a0776d0",
  "pipeline\\scoring.py": "255b4a225a625848e150673b01bccfbc679eea668a254667a9b01c2179bf610c",
  "pipeline\\scoring_integration.py": "29a24ee7f4613c811f4418ae3b8fdb0b28407d33ca51818fa216cfff2006e84d",
  "pipeline\\shade.py": "493e5c96db973687ffb5095741fdcac27f6ff928f852189aebf9060fc71b472a",
  "run.py": "2cd24279208230165927dd86e7ed035a9369808c252b4a3f23807db5486b713f"
}
P11_E14_FINGERPRINT_MAPPING_FOR_RECORD_DIGEST_END
P11_E14_RECOMPUTED_DIGEST 1e312a49f13cdc8a42902b1e
KEYS_ONLY_IN_BASE_BEGIN
KEYS_ONLY_IN_BASE_END
KEYS_ONLY_IN_P11_BEGIN
KEYS_ONLY_IN_P11_END
VALUE_DIFFERENCES_BEGIN
pipeline\score_batch.py
BASE ad7522425faf70af11ad9ef4d14bfc344b936823c438e4e4d465e3b7b4d48ffc
P11  28dc5bc769744a993e26d1d03c70a6abe677eaf20a42d12ffd848a668a0776d0
pipeline\scoring_integration.py
BASE 6cac1b392c0151c61c41b4833e3ff773e4a93b6038077b2e4f0117519e5bbfb3
P11  29a24ee7f4613c811f4418ae3b8fdb0b28407d33ca51818fa216cfff2006e84d
VALUE_DIFFERENCES_END
REL pipeline/score_batch.py
C_PROJECT_DISPLAY_PATH pipeline\score_batch.py
X_PROJECT_DISPLAY_PATH X:\01 REPOSITORIES\sgSHIOK2026\pipeline\score_batch.py
REL pipeline/scoring_integration.py
C_PROJECT_DISPLAY_PATH pipeline\scoring_integration.py
X_PROJECT_DISPLAY_PATH X:\01 REPOSITORIES\sgSHIOK2026\pipeline\scoring_integration.py
REL pipeline/config/weights.yaml
C_PROJECT_DISPLAY_PATH pipeline\config\weights.yaml
X_PROJECT_DISPLAY_PATH X:\01 REPOSITORIES\sgSHIOK2026\pipeline\config\weights.yaml
```

## Strand 4 Repository Integrity Schedule

```text
[{"conclusion":"success","createdAt":"2026-08-15T09:51:19Z","databaseId":31878048744,"event":"schedule","headSha":"ccc4e8199ea01cbc5735e45abd41178148a34aab","status":"completed"},{"conclusion":"success","createdAt":"2026-08-14T10:34:20Z","databaseId":31792745487,"event":"schedule","headSha":"3ae01f1014e2d9c26c5b0704cadffa2ed46531f7","status":"completed"}]
```

```text
{"total_count":2,"workflow_runs":[{"conclusion":"success","createdAt":"2026-08-15T09:51:19Z","databaseId":31878048744,"event":"schedule","headSha":"ccc4e8199ea01cbc5735e45abd41178148a34aab","status":"completed"},{"conclusion":"success","createdAt":"2026-08-14T10:34:20Z","databaseId":31792745487,"event":"schedule","headSha":"3ae01f1014e2d9c26c5b0704cadffa2ed46531f7","status":"completed"}]}
```

## Strand 5 Counts and Notes

```text
REV 5346ad6
TEST_STAR_PY_COUNT 39
ALL_TESTS_PY_COUNT 40
NON_TEST_PY
tests/__init__.py
REV 8014acf
TEST_STAR_PY_COUNT 39
ALL_TESTS_PY_COUNT 40
NON_TEST_PY
tests/__init__.py
REV cf3879c
TEST_STAR_PY_COUNT 39
ALL_TESTS_PY_COUNT 40
NON_TEST_PY
tests/__init__.py
REV b21e927
TEST_STAR_PY_COUNT 39
ALL_TESTS_PY_COUNT 40
NON_TEST_PY
tests/__init__.py
REV 5bbcfb0
TEST_STAR_PY_COUNT 39
ALL_TESTS_PY_COUNT 40
NON_TEST_PY
tests/__init__.py
REV fe6b6b8
TEST_STAR_PY_COUNT 39
ALL_TESTS_PY_COUNT 40
NON_TEST_PY
tests/__init__.py
REV 52e03a8
TEST_STAR_PY_COUNT 39
ALL_TESTS_PY_COUNT 40
NON_TEST_PY
tests/__init__.py
REV dc3ea6a
TEST_STAR_PY_COUNT 39
ALL_TESTS_PY_COUNT 40
NON_TEST_PY
tests/__init__.py
REV 3ae01f1
TEST_STAR_PY_COUNT 39
ALL_TESTS_PY_COUNT 40
NON_TEST_PY
tests/__init__.py
REV ccc4e81
TEST_STAR_PY_COUNT 39
ALL_TESTS_PY_COUNT 40
NON_TEST_PY
tests/__init__.py
```

```text
PARENT
17:def test_repo_integrity_accepts_current_tripwire_files(tmp_path: Path):
23:def test_repo_integrity_rejects_notice_revert(tmp_path: Path):
32:def test_repo_integrity_rejects_agents_override_revert(tmp_path: Path):
44:def test_repo_integrity_rejects_vercelignore_allowlist_revert(tmp_path: Path):
53:def test_repo_integrity_workflow_has_schedule_trigger():
COMMIT
18:def test_repo_integrity_accepts_current_tripwire_files(tmp_path: Path):
24:def test_repo_integrity_rejects_notice_revert(tmp_path: Path):
33:def test_repo_integrity_rejects_agents_override_revert(tmp_path: Path):
45:def test_repo_integrity_rejects_vercelignore_allowlist_revert(tmp_path: Path):
54:def test_repo_integrity_rejects_gitignore_vercelignore_allowlist_revert(tmp_path: Path):
67:def test_repo_integrity_workflow_has_schedule_trigger():
```

```text
5bbcfb0050fa92e5f47a97e206b4d57e4c2355da
fix: restore NOTICE, AGENTS.md and .vercelignore after sourcerepo sync

tests/test_repo_integrity.py
```

```text
  46:         $partitionScriptPath,
  47:         $partitionScript.Replace([string][char]0xFEFF, ""),
  48:         [System.Text.UTF8Encoding]::new($false)
  49:     )
  50:     uv run python $partitionScriptPath $UniversePath $PartitionDir $Workers
  51:     if ($LASTEXITCODE -ne 0) { throw "partitioning failed" }
  52: 
  53:     $processes = @()
  54:     for ($index = 1; $index -le $Workers; $index++) {
  55:         $partName = "part{0:D2}_of{1:D2}.parquet" -f $index, $Workers
  56:         $partPath = Join-Path $PartitionDir $partName
  57:         $partOut = Join-Path $RunRootPath ("part{0:D2}_of{1:D2}" -f $index, $Workers)
  58:         $stdout = Join-Path $LogDir ("part{0:D2}.out.log" -f $index)
  95: skills/
  96: skills-lock.json
  97: docs/
```

```text
328 tests collected in 27.60s
```

```text
repo_integrity=ok
exit_code=0
```

```text
commit b21e927609817d4e72c03bb8b5c5eafa221f4beb
Author: GitHub Actions Sync <actions@github.com>
Date:   Fri Aug 14 03:32:59 2026 +0000

    chore(config): sync from sourcerepo [skip ci]
```

FINDINGS — "None" will be rejected

1. The C: copy is a superset of X: for the requested trees: X-only file count is 0 across `qa/`, `processed/`, `raw/`, `data/`, and `web/public/data/`.
2. The only same-path size mismatch is `qa\verification\P11-migration-parity.md`: X has the truncated 2,955-byte file with sha256 `f74f1ceda86cec0ae3b894f114426939b1d427df6311dd9465928e7768742e63`, while C has the restored 12,596-byte file with sha256 `8244f9a88078b47fd899fad94b7e7d7dfdb1927a96c4cf438ed96e6747f24815`.
3. No files under `qa/p6_*`, `qa/p7_*`, or `qa/p9_*` were found on X: during the requested `qa/` inventory.
4. The Repository Integrity schedule is no longer purely decorative: two scheduled runs exist, both successful. The 2026-08-14 scheduled run happened at 10:34:20Z on `3ae01f1`, so it did not test the damaged `b21e927` tree.
5. The P11 `scoring_fingerprint_digest` difference is not a root-path bookkeeping difference. Keys are identical and relative on both sides; the digest changes because the P10 bundle records fingerprint older dirty-worktree hashes for `pipeline\score_batch.py` and `pipeline\scoring_integration.py`.
6. `tests/test_*.py` stayed at 39 files across all requested commits; the 40th Python file under `tests/` is `tests/__init__.py`. The 327 to 328 test-count movement is `test_repo_integrity_rejects_gitignore_vercelignore_allowlist_revert`, added in `5bbcfb0`.
7. `qa/p11/run_subset_rescore.ps1` derives partition count from `$Workers`, so changing workers from 2 to 4 also changes partition layout from two files to four and cannot isolate worker-count determinism.
8. `.gitignore` still ignores `skills/`, `skills-lock.json`, and `docs/` on main; this was recorded and not changed.

DISAGREEMENTS

1. I disagree with the P11 evidence classification that `scoring_fingerprint_digest` differences are merely record-level provenance bookkeeping caused by machine/path state. The raw mapping diff shows two code-file hash values differ in the P10 record-level fingerprint.
