# P11 T14 Baseline Missing From Fresh Git Clone

- `processed/network_island.parquet`
  bytes: 52240373
  exists_on_t14: True
  git_check_ignore: .gitignore:8:processed/	processed/network_island.parquet
  reason: P10 batch_manifest network input; score_batch/load_scoring_context reads it with pandas.read_parquet.
- `qa\p8_provenance_repair_20260813\subset_1200_ready.parquet`
  bytes: 88944
  exists_on_t14: True
  git_check_ignore: <not ignored>
  reason: P10 batch_manifest postal_universe input; score_batch reads it with pandas.read_parquet.
- `qa/p10_network_provenance_20260813/score`
  bytes: 187313839
  exists_on_t14: True
  git_check_ignore: <not ignored>
  reason: P10 export reproduction input when re-exporting from records-dir; contains batch_manifest and chunk JSON records.
- `qa/p10_network_provenance_20260813/exported_bundle`
  bytes: 53908541
  exists_on_t14: True
  git_check_ignore: <not ignored>
  reason: P10 E14 comparison target requested by this migration task.
- `C:\shiok\processed\postal_universe_candidate_full_registered_geocoded_part01_of04.parquet`
  bytes: 1641315
  exists_on_t14: True
  git_check_ignore: .gitignore:8:processed/	"C:\\\\shiok\\\\processed\\\\postal_universe_candidate_full_registered_geocoded_part01_of04.parquet"
  reason: P6 scratch 124,032-row split partition input named by P6 batch_manifest.
- `C:\shiok\processed\postal_universe_candidate_full_registered_geocoded_part02_of04.parquet`
  bytes: 1602557
  exists_on_t14: True
  git_check_ignore: .gitignore:8:processed/	"C:\\\\shiok\\\\processed\\\\postal_universe_candidate_full_registered_geocoded_part02_of04.parquet"
  reason: P6 scratch 124,032-row split partition input named by P6 batch_manifest.
- `C:\shiok\processed\postal_universe_candidate_full_registered_geocoded_part03_of04.parquet`
  bytes: 1590093
  exists_on_t14: True
  git_check_ignore: .gitignore:8:processed/	"C:\\\\shiok\\\\processed\\\\postal_universe_candidate_full_registered_geocoded_part03_of04.parquet"
  reason: P6 scratch 124,032-row split partition input named by P6 batch_manifest.
- `C:\shiok\processed\postal_universe_candidate_full_registered_geocoded_part04_of04.parquet`
  bytes: 1557148
  exists_on_t14: True
  git_check_ignore: .gitignore:8:processed/	"C:\\\\shiok\\\\processed\\\\postal_universe_candidate_full_registered_geocoded_part04_of04.parquet"
  reason: P6 scratch 124,032-row split partition input named by P6 batch_manifest.
- `raw\5d18dbe22516ee9ce4f3ad9e86f54dbe8ae1b2306e2bc9b3ec03fc8bd9aae892\acra_registered_entities.csv`
  bytes: 231948757
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\5d18dbe22516ee9ce4f3ad9e86f54dbe8ae1b2306e2bc9b3ec03fc8bd9aae892\\\\acra_registered_entities.csv"
  reason: raw/manifest.json existing source file for acra_registered_entities; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\7c987511548de3a82da403cabca02702031e02ade8703a9e401417883dfeb702\building_points.geojson`
  bytes: 57012074
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\7c987511548de3a82da403cabca02702031e02ade8703a9e401417883dfeb702\\\\building_points.geojson"
  reason: raw/manifest.json existing source file for building_points; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\a52a1503aa2d68a0a9e59703ea96a9c0e6cff1720e10d0479384c6f97a88f829\bus_routes.json`
  bytes: 6211748
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\a52a1503aa2d68a0a9e59703ea96a9c0e6cff1720e10d0479384c6f97a88f829\\\\bus_routes.json"
  reason: raw/manifest.json existing source file for bus_routes; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\2d2b12b89ed2b2314be7d1ac2738afbdcd2af10a07a7cb6db1fb890d56348e2f\bus_services.json`
  bytes: 185358
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\2d2b12b89ed2b2314be7d1ac2738afbdcd2af10a07a7cb6db1fb890d56348e2f\\\\bus_services.json"
  reason: raw/manifest.json existing source file for bus_services; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\0362ab970c661de6b322a3372c9ab980faf49805921891a7a1da260687a16a4a\bus_stops.json`
  bytes: 719050
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\0362ab970c661de6b322a3372c9ab980faf49805921891a7a1da260687a16a4a\\\\bus_stops.json"
  reason: raw/manifest.json existing source file for bus_stops; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\d943fe2a992ad50c449c40484e0c642da480598b17f6008907c7b253d87b19ee\covered_linkway.zip`
  bytes: 1096785
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\d943fe2a992ad50c449c40484e0c642da480598b17f6008907c7b253d87b19ee\\\\covered_linkway.zip"
  reason: raw/manifest.json existing source file for covered_linkway; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\2b552c1429aaf93c544209df3da68838d708a78ec5ae86dcd2852c10b0589f29\lamp_posts.geojson`
  bytes: 41907845
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\2b552c1429aaf93c544209df3da68838d708a78ec5ae86dcd2852c10b0589f29\\\\lamp_posts.geojson"
  reason: raw/manifest.json existing source file for lamp_posts; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\26281dbacf4d8707df48d40b83060c65bf81c3f1a39ff81aebaefb8fd628c899\leaf_area_index.xlsx`
  bytes: 204855
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\26281dbacf4d8707df48d40b83060c65bf81c3f1a39ff81aebaefb8fd628c899\\\\leaf_area_index.xlsx"
  reason: raw/manifest.json existing source file for leaf_area_index; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\a7eaa90f30991dc0ac4aa970d704123ce3ec9e60c82b42c32a32e74be7dc0327\mrt_lrt_exits.geojson`
  bytes: 213057
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\a7eaa90f30991dc0ac4aa970d704123ce3ec9e60c82b42c32a32e74be7dc0327\\\\mrt_lrt_exits.geojson"
  reason: raw/manifest.json existing source file for mrt_lrt_exits; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\87238ae673f898a30b1fcbf5b5527625b4c49c7aa1769567adb92b93b9b685b5\nparks_heritage_road_green_buffers.geojson`
  bytes: 254367
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\87238ae673f898a30b1fcbf5b5527625b4c49c7aa1769567adb92b93b9b685b5\\\\nparks_heritage_road_green_buffers.geojson"
  reason: raw/manifest.json existing source file for nparks_heritage_road_green_buffers; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\7f9a1b6413735824704993994b5491c30dcb9d1b746e80a5c17a6f59629d835f\nparks_heritage_trees.geojson`
  bytes: 149987
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\7f9a1b6413735824704993994b5491c30dcb9d1b746e80a5c17a6f59629d835f\\\\nparks_heritage_trees.geojson"
  reason: raw/manifest.json existing source file for nparks_heritage_trees; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\9b4e0e1e9d868cc9bff468e1b3028214707f2a41661bc8f279c61e88094f2d11\nparks_nature_ways.geojson`
  bytes: 208278
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\9b4e0e1e9d868cc9bff468e1b3028214707f2a41661bc8f279c61e88094f2d11\\\\nparks_nature_ways.geojson"
  reason: raw/manifest.json existing source file for nparks_nature_ways; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\83c1838bea9ee355d2ba52c2060eb185612dd0e2e3fdb113aff9cdd6e5c27efd\nparks_park_connector_loop.geojson`
  bytes: 2008356
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\83c1838bea9ee355d2ba52c2060eb185612dd0e2e3fdb113aff9cdd6e5c27efd\\\\nparks_park_connector_loop.geojson"
  reason: raw/manifest.json existing source file for nparks_park_connector_loop; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\2df9d9170d716ceefc2e82aa8889a21a27a3a086996bf330a6ab6b21cb1f0627\nparks_tracks.geojson`
  bytes: 25252264
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\2df9d9170d716ceefc2e82aa8889a21a27a3a086996bf330a6ab6b21cb1f0627\\\\nparks_tracks.geojson"
  reason: raw/manifest.json existing source file for nparks_tracks; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\0cd4f995c2ab6b38b2985ba9417861e93dc1f58c8ffae06c3deecc37f259128d\osm_extract.osm.pbf`
  bytes: 248783590
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\0cd4f995c2ab6b38b2985ba9417861e93dc1f58c8ffae06c3deecc37f259128d\\\\osm_extract.osm.pbf"
  reason: raw/manifest.json existing source file for osm_extract; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\8d2b048866a8af3109299e60eb67fbcdca99d6a8a001861abc3da05a909264b1\other_uen_registered_entities.csv`
  bytes: 3149224
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\8d2b048866a8af3109299e60eb67fbcdca99d6a8a001861abc3da05a909264b1\\\\other_uen_registered_entities.csv"
  reason: raw/manifest.json existing source file for other_uen_registered_entities; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\bfa4a0a08a32c72a1ca35aad30e89f940a59ef6fdc137ddf8135a50760d7d444\overhead_bridge_underpass.zip`
  bytes: 478973
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\bfa4a0a08a32c72a1ca35aad30e89f940a59ef6fdc137ddf8135a50760d7d444\\\\overhead_bridge_underpass.zip"
  reason: raw/manifest.json existing source file for overhead_bridge_underpass; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\f23856251b467089f788d0fff72ef5a38e753f21aa69b4352401d7ed50d380cc\planning_area_boundary.geojson`
  bytes: 2092229
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\f23856251b467089f788d0fff72ef5a38e753f21aa69b4352401d7ed50d380cc\\\\planning_area_boundary.geojson"
  reason: raw/manifest.json existing source file for planning_area_boundary; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\847ceebce6a9a8f5ca7e8ee32f6d857583c8d8025a0606be685411899ba59841\postal_universe_onemap_2020.json.gz`
  bytes: 5945389
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\847ceebce6a9a8f5ca7e8ee32f6d857583c8d8025a0606be685411899ba59841\\\\postal_universe_onemap_2020.json.gz"
  reason: raw/manifest.json existing source file for postal_universe_onemap_2020; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\a520d2a54bf628c83a11c21ca63ee1cd46386fc0aadb896911133c0742150271\sla_dwelling_information.geojson`
  bytes: 610849
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\a520d2a54bf628c83a11c21ca63ee1cd46386fc0aadb896911133c0742150271\\\\sla_dwelling_information.geojson"
  reason: raw/manifest.json existing source file for sla_dwelling_information; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\942ff2506603f431f0782a3acdc70fec75d4b15c73b54f1a983c804c60d818af\traffic_signals.zip`
  bytes: 1337159
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\942ff2506603f431f0782a3acdc70fec75d4b15c73b54f1a983c804c60d818af\\\\traffic_signals.zip"
  reason: raw/manifest.json existing source file for traffic_signals; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\2d518f326e0e76444722caa96e784b5b86f8767652a2f730417294f1b4c4f2b6\train_station_codes.zip`
  bytes: 16598
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\2d518f326e0e76444722caa96e784b5b86f8767652a2f730417294f1b4c4f2b6\\\\train_station_codes.zip"
  reason: raw/manifest.json existing source file for train_station_codes; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
- `raw\9d249959b4010d00a7d91f8161f22188bbb0203a27185f91f46b41595f4884f0\ura_no_dwelling_units.geojson`
  bytes: 38686242
  exists_on_t14: True
  git_check_ignore: .gitignore:5:raw/*	"raw\\\\9d249959b4010d00a7d91f8161f22188bbb0203a27185f91f46b41595f4884f0\\\\ura_no_dwelling_units.geojson"
  reason: raw/manifest.json existing source file for ura_no_dwelling_units; scoring/export code resolves raw_file_from_manifest for transit/crossing/bus/planning-area sources.
