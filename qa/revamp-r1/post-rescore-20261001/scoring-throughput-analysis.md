# Scoring throughput analysis: why the 2026-09-17 full rescore took 13.5 days, and what makes the next one fast

Date: 2026-10-03. Author: Sisyphus (opencode). Scope: measurement and ranked fixes only. Nothing here changes a score; every proposed fix is required to produce byte-identical exports, checked by `tests/test_export.py::test_export_from_projected_records_is_byte_identical_to_raw` and the parallel-equals-serial tests added today.

## 1. What actually happened

| | value | source |
|---|---|---|
| Records scored | 124,443 (57,299 SCORED / 65,416 SCORED_PARTIAL / 1,252 NO_TRANSIT / 476 NOT_YET) | `qa/revamp-r1/full-rescore-20260917/full_rescore_delta_report.json` |
| Chunks | 249 x 500 records, 47.2 GB on disk (90-695 MB each, median 161 MB) | chunk directory stat |
| Wall clock | first chunk 18 Sep 09:05, last chunk 1 Oct 22:03 = 13.5 days | chunk mtimes |
| Of which not computing | pause 22 Sep 20:55 -> 23 Sep 08:18; exit -1 on 21 Sep 21:30 -> resume 22:23; Windows Update reboot 27 Sep 23:11 -> resume 23:50; shard switch 30 Sep 09:02 | `rescore.log` |
| Single-worker rate (chunks 1-166) | median 90 min per chunk = 10.8 s per record | consecutive chunk mtimes, n=164 |
| 3-shard rate (chunks 167-249) | 77 / 79 / 68 min per chunk per worker = 8.2-9.5 s per record; aggregate ~20 records/min vs 5.5 single | per-shard mtime series |
| CPU budget | ~10 s x 124,443 = ~350 CPU-hours | derived |

Two things fall out immediately. The scorer is CPU-bound on one core by default: the three shards each ran as fast as the lone worker had, so aggregate throughput tripled with no contention. And the shards were started 12.5 days in. Had the run been sharded from day one on 3 of the 4 physical cores it would have taken ~4.5 days of compute instead of ~12.

## 2. Where the bytes go

Measured on chunk_00079 (161 MB, 500 records):

| key | share of serialized bytes |
|---|---|
| `_candidate_geometries` | 52.7% |
| `_geometry_options` | 33.7% |
| `_geometry` | 9.6% |
| everything the public export keeps (scores, subscores, provenance, paths) | ~4% |

Per record: median 5 routed MRT/LRT candidates plus bus candidates, 3 geometry options, 118 KB of geometry as WKT strings inside `indent=2` pretty-printed JSON (`pipeline/score_batch.py:68`). The export reduces that 118 KB to ~38 KB of encoded polylines per record (`geom_record`), i.e. 96% of what was written to disk exists only to be re-read once and re-encoded.

## 3. Where the export time goes (measured today)

Profile of `geom_record` on chunk_00183 (108 MB, 500 records), single process:

| step | time per 500 records |
|---|---|
| `read_json` (parse the chunk) | 3.7 s |
| `public_score_record` x 500 | 0.0 s |
| `geom_record` x 500 | **126.4 s** |

Inside `geom_record` (cProfile, 60 records, 16.5 s): `route_segment_geometries` 9.7 s, of which `shapely.wkt.loads` 2.5 s over 25k calls, `is_empty` 2.8 s over 58,781 calls, `encode_polyline` 1.8 s, `merged_geometry` 5.9 s cumulative; shapely's Python-level decorator wrapper alone accounts for 5.7 s across 116k calls. This is pure-Python overhead on many small shapely objects, not GEOS work.

Consequence: the first full export this morning projected 10.5 h on one core (4% of 43.9 GB in 27 min at 95% of a core). With `--workers 3` (commit 278e655) it is tracking ~2.5 h with ~1 GB per worker; output verified byte-identical on a 3-chunk rehearsal (81/81 files).

## 4. Where the scoring time goes (inferred; measurement pending)

Per-record scoring has no timing fields in the records and the live network graph cannot be loaded for a profile while the export holds the machine's RAM, so this section is inference from code structure and the byte profile, to be confirmed by the profile in section 6 step 0.

`score_postal_row` (`pipeline/scoring_integration.py:2520`) per postal: nearest-node snap, select MRT/LRT exit candidates (5) and bus-stop candidates within the 300 m envelope, then for each candidate a routed path on the island network (`route_with_endpoint_snap_connectors`, `route_with_bus_stop_access_connector`, `route_with_mrt_lrt_exit_access_connector`), then exposure-gap and crossing analysis on the chosen route geometries, then serialization of every candidate's geometry as WKT. At ~10 s per record and roughly 8-12 routed paths per record, the budget is on the order of 1 s per routed path including its connector construction and geometry assembly, which is slow for a 50 MB network and points at per-path Python work (connector building, shapely merging, WKT dumping) rather than the shortest-path search itself. Adjacent postals in the same HDB block share an origin node, so identical shortest-path trees are recomputed thousands of times.

## 5. Ranked fixes (all score-neutral by construction)

| # | fix | expected effect | risk / cost | verification |
|---|---|---|---|---|
| 1 | **Parallel scoring by default.** `score_batch --workers N` as an in-process pool over chunks, built on the existing `--shard-index/--shard-count` partitioning (which already proved 3x with zero contention), N defaulting to physical cores minus one. | 12 days -> ~4 days at 3 workers; ~3.3 days at 4 | low; same code path as the shards that produced chunks 167-249. RAM per worker is one network graph + one chunk; three ran comfortably. | shard a 3-chunk sample both ways, compare chunk bytes |
| 2 | **Write `geom_record` at scoring time, drop raw WKT.** Compute the export projection in the scorer and store `_geom_record` (what the export already consumes via `PRECOMPUTED_GEOM_KEY`) instead of `_geometry*` WKT. Keep raw WKT only behind an opt-in debug flag. | chunk bytes 47 GB -> ~2.5 GB; export load 126 s/chunk -> ~4 s; the whole export becomes minutes, no `--workers` needed | medium: `geom_record` logic moves earlier in the pipeline; the existing byte-identity test covers the output. Loses raw WKT for ad-hoc QA unless the debug flag is used. | `test_export_from_projected_records_is_byte_identical_to_raw` plus a scorer-side test that `_geom_record` equals `geom_record(raw)` |
| 3 | **Compact chunk serialization.** `indent=2` -> compact separators, optionally gzip. | ~2x fewer bytes written and re-read; a few % of scoring time; resume-safety unchanged | trivial; readers use `json.load`/`iter_json_array` which are whitespace-agnostic | chunk round-trip test |
| 4 | **Per-origin-node route cache inside a chunk.** Memoize shortest-path trees keyed by origin node for the chunk's lifetime. | depends on block density; HDB-heavy chunks may halve | low if routing is deterministic (it is: same graph, same weights); must not cache across network digests | score equality on a mixed chunk with cache on/off |
| 5 | **Vectorize geometry post-processing.** Replace per-object `is_empty`/`wkt.loads` loops with shapely 2.0 array ops (`shapely.from_wkt(array)`, `shapely.is_empty(array)`), or skip emptiness checks on geometries the scorer already validated. | ~30-40% of `geom_record`; moot if fix 2 lands since it runs once | low | byte-identity test |
| 6 | **Keep** chunk size 500 and resume-by-default. They cost nothing and saved the run three times (exit -1, owner pause, OS reboot). | | | |

Fixes 1 + 2 together are the answer to "how long should this take": roughly 3-4 days of unattended scoring on this machine, and an export measured in minutes, instead of 13.5 days plus a 10-hour export. Fix 1 is a small change to code that already exists and should land first.

## 6. Open measurements

0. Profile `score_postal_row` on ~20 real postals once the export has finished and RAM is free (`cProfile`, sort by cumulative): confirm the split between shortest-path search, connector construction, exposure-gap/crossing analysis, and WKT serialization. This decides whether fix 4 is worth doing at all.
1. Measure worker RSS with the island network loaded, to set the default worker count for fix 1 on a 15.8 GB machine.
