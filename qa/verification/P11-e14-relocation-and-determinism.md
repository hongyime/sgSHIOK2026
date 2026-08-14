# P11 E14 Relocation And Determinism Evidence

Date: 2026-08-14

Working root after relocation: `C:\sgSHIOK2026`

Hostname: E14-class Windows 11 laptop for this run.

## Section C

`X:\01 REPOSITORIES\sgSHIOK2026` was treated as read-only. Repository copy to `C:\sgSHIOK2026` completed with robocopy summary:

```text
Dirs :       310       307         3         0         0         0
Files :     37561     37561         0         0         0         1
Bytes :  56.197 g  56.197 g         0         0         0         0
Ended : Friday, 14 August 2026 5:32:17 pm
```

The requested root log path `C:\sgSHIOK2026-copy.log` was denied by Windows, so the successful log is `C:\sgSHIOK2026\sgSHIOK2026-copy.log`.

Absent on both `X:` and `C:`:

```text
qa\p6_rerun_cost_20260812_102712
qa\p7_determinism_20260813
qa\p9_input_provenance_20260813
```

Anchor hashes matched:

```text
uv.lock  032f0b86ca392342fd18a2a83624caa4f2c2095cbc9d7191078ca589b9fbf845
web/package-lock.json  04765d87615d6d3f835adcc311b0489665e82113744d1cf291836ef8ed3aeb4e
raw/manifest.json  9413e328228e9b79f577665783303509bb1a60cf414cb8d886d20580cf4190be
processed/network_island.parquet  19f3b55847cd1ad74878cdec580f07f5cc3110d1eb252b5b1ffe4c5c38b4ab65
qa/p8_provenance_repair_20260813/subset_1200_ready.parquet  8e524720d21acd0ff7f705dac22ff335412f6af615ccaa28f28557351a5d296d
```

The active web bundle manifest check covered 4,848 entries with `missing_count=0` and `mismatch_count=0`.

Five environment identity runs all matched the T14 baseline:

```text
Python 3.12.10 (tags/v3.12.10:0cc8128, Apr  8 2025, 12:21:36) [MSC v.1943 64 bit (AMD64)]
2.1.2 (3, 13, 1) 3.7.2 9.5.1 1.1.4 1.0.0 4.5.0 1.5.5 1.26.4 3.0.5
v26.5.0
12.0.2
```

Venv completeness and focused tests:

```text
venv_ok
tests\test_production_readiness.py ........                              [100%]
8 passed in 119.84s (0:01:59)
```

## Section A

Pushed commit:

```text
5bbcfb0 fix: restore NOTICE, AGENTS.md and .vercelignore after sourcerepo sync
```

Integrity output:

```text
116404a4b4192d6fd737e54f66f647f7d73fa22d
PRESENT durable project decisions live in `decisions.md`, not in `.agents/JOURNAL.md`
PRESENT ignores dot-directories unless they are explicitly allowlisted
PRESENT Do not put durable product decisions only in `.agents/`.
repo_integrity=ok
```

Repository Integrity workflow list returned only `event: push` rows. No scheduled run was present in the returned history.

## Section B

Pushed commits:

```text
fe6b6b8 fix: summarize failed OneMap readiness criteria
52e03a8 fix: resolve diag script raw paths from repo root
dc3ea6a docs: record P11 migration portability decision
3ae01f1 docs: restore P11 migration evidence and portability notes
```

Focused verification:

```text
repo_integrity=ok
14 passed in 75.20s (0:01:15)
```

Live OneMap gate determination from `qa/releases/20260811-full-onemap/onemap_validation_cached_report_full_scored_prefer_scored_routed_20260811.json`:

```text
gate_passed=False
sample_size=95157
cached_results=95095
missing_cache_results=0
invalid_cache_results=62
retryable_cache_results=0
complete_cache_coverage=False
median_abs_pct_delta=11.884
p95_abs_pct_delta=69.861
thresholds={"median_abs_pct_delta_max": 12.0, "p95_abs_pct_delta_max": 100.0}
```

The live gate fails on both cache coverage and subset thresholds. Overall median and p95 thresholds pass. No p95 value breaches the 100.0 maximum. The 62 invalid results are excluded from subset statistics because `pipeline/onemap_validation.py` appends invalid rows and continues before adding to `results`; `validation_subset_summary(results)` is computed only from valid cached results.

Remaining hardcoded absolute roots in `pipeline/` and `scripts/` after B2:

```text
No hits.
```

`decisions.md` was last modified before P11 at `e321c07`. P5, P6, P7, P8, P9, and P10 have no durable entries in `decisions.md`.

`git check-ignore -v` exit codes:

```text
P11-migration-parity.md_EXIT=1
P11-portability.md_EXIT=1
```

## Section D

Because `scripts/full-rescore-production.ps1` writes under protected `web/public/data`, Section D used `qa/p11/run_subset_rescore.ps1` to run the same partition, `score-batch`, combine, export, and validate flow under `qa/p11/`.

The 200-record pilot was slow on E14. The final 200-record scoring run reached complete worker manifests and valid export after manifest repair. Calibration plus pilot timings implied a roughly 2-hour budget for the 1,200-record run; actual 1,200 elapsed time was 9,300.743 seconds.

Workers 2, 1,200-record run:

```text
records=1200
state_counts={"NO_TRANSIT_IN_RANGE": 150, "SCORED": 850, "SCORED_PARTIAL": 200}
validate_ok=true
elapsed_sec=9,300.743
peak_rss_bytes=183377920
peak_rss_gib=0.171
```

The RSS value is undercounted by Windows process accounting for this spawned-process pattern and was not used as proof of 4-worker headroom. Workers 4 was skipped.

T14 target versus E14 workers-2 comparison using `scripts.analysis.p10_compare_subset_outputs`:

```text
base=qa/p10_network_provenance_20260813/exported_bundle
new=qa/p11/d_full_w2_1200/exported_bundle
base_records=1200
new_records=1200
common_records=1200
base_only=0
new_only=0
value_fields_changed=0
provenance_changed=1200
geom_files_changed=0
transit_files_changed=0
value_changed_postals=[]
geom_diffs=[]
transit_diffs=[]
```

Non-score differences:

```text
postal_universe=1200
scoring_fingerprint_digest=1200
scoring_input_digest=1200
```

Classification:

- `postal_universe`: run/partition path dependent, not score-relevant, reaches browser inside `public_score_record` provenance.
- `scoring_input_digest`: run/partition input dependent, not score-relevant, reaches browser inside `public_score_record` provenance.
- `scoring_fingerprint_digest`: record-level provenance bookkeeping difference; manifest-level scoring fingerprints match, score values do not move, reaches browser inside `public_score_record` provenance.

## Test Counts

Baseline supplied in handoff:

```text
Python: 327 tests / 40 files
Web: 103 tests / 21 files
```

After this task:

```text
Python: 328 tests / 39 files
Web: 103 tests / 21 files
```

Python movement is explained by adding one repo-integrity test while the current filename count under `tests/test_*.py` is 39. Web count is unchanged. Full web suite passes with `--testTimeout=30000`; the default 5s run timed out two tests on this slower machine, and those two passed when rerun with the longer timeout.

FINDINGS

1. `qa\p6_rerun_cost_20260812_102712`, `qa\p7_determinism_20260813`, and `qa\p9_input_provenance_20260813` are absent from the only surviving `X:` copy and therefore absent from `C:` after relocation.
2. Repository Integrity has a cron definition, but the returned workflow history showed only push events; no scheduled run was observed.
3. `scripts/full-rescore-production.ps1` cannot be used for Section D under the standing constraints because it writes to protected `web/public/data`.
4. `qa/island_debug.geojson` is absent, so `score-batch --full-batch` fails the full-batch network QA guard even though the subset can be scored with explicit per-partition limits.
5. E14 reproduced the 1,200 published score value fields exactly at workers 2: `value_fields_changed=0`.
6. Worker-count independence was not proven on E14 because workers 4 was skipped; the available RSS reading undercounted spawned Python memory and was not a reliable headroom signal.
7. Provenance fields differ for all 1,200 records, and those provenance fields reach the browser, but score values, geometry files, and transit files did not change.

DISAGREEMENTS

1. I did not use `scripts/full-rescore-production.ps1` directly for D because it would violate the explicit protected-path rule for `web/public/data`.
2. I did not run workers 4 because the pilot/full-run RSS measurement was not reliable enough to establish headroom on a 15.78 GiB machine.
