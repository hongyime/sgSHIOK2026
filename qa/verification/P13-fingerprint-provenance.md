# P13 Fingerprint Provenance Evidence

## 1. Working Root

```text
PRAWN-E14
C:\sgSHIOK2026
```

## 2. Start State

```text
f58deed1ce6f124949d89ac5b943c526fac5103b
```

```text
f58deed1ce6f124949d89ac5b943c526fac5103b	refs/heads/main
```

```text
f58deed test: record P12 state consolidation evidence
c7ec7f0 docs: update agent state after P11 completion
ccc4e81 test: record P11 E14 relocation and determinism evidence
3ae01f1 docs: restore P11 migration evidence and portability notes
dc3ea6a docs: record P11 migration portability decision
52e03a8 fix: resolve diag script raw paths from repo root
```

```text
exit_code=1
```

## 3. Strand 1 Code Recovery

```text
PATH=pipeline\score_batch.py
X_PATH=X:\01 REPOSITORIES\sgSHIOK2026\pipeline\score_batch.py
SIZE=20360
SHA256=28dc5bc769744a993e26d1d03c70a6abe677eaf20a42d12ffd848a668a0776d0
TARGET=ad7522425faf70af11ad9ef4d14bfc344b936823c438e4e4d465e3b7b4d48ffc
MATCH=False
PATH=pipeline\scoring_integration.py
X_PATH=X:\01 REPOSITORIES\sgSHIOK2026\pipeline\scoring_integration.py
SIZE=120780
SHA256=29a24ee7f4613c811f4418ae3b8fdb0b28407d33ca51818fa216cfff2006e84d
TARGET=6cac1b392c0151c61c41b4833e3ff773e4a93b6038077b2e4f0117519e5bbfb3
MATCH=False
```

```text
filename_grep_exit_code=1
hash_grep_exit_code=1
```

```text
BASE_COMMIT d78a0a3
TARGET_PATH pipeline/score_batch.py
D78A0A3_SIZE 20360
SIZE_WINDOW_LOW 15270
SIZE_WINDOW_HIGH 25450
TARGET_SHA256 ad7522425faf70af11ad9ef4d14bfc344b936823c438e4e4d465e3b7b4d48ffc
TARGET_PATH pipeline/scoring_integration.py
D78A0A3_SIZE 120780
SIZE_WINDOW_LOW 90585
SIZE_WINDOW_HIGH 150975
TARGET_SHA256 6cac1b392c0151c61c41b4833e3ff773e4a93b6038077b2e4f0117519e5bbfb3
BATCH_ALL_OBJECTS_LINE_COUNT 3692
CANDIDATE_BLOB_COUNT_AFTER_SIZE_FILTER 126
CANDIDATE_BY_TARGET_BEGIN
pipeline/score_batch.py 104
pipeline/scoring_integration.py 22
CANDIDATE_BY_TARGET_END
BLOB_SWEEP_MATCHES_BEGIN
BLOB_SWEEP_MATCHES_END
BLOB_SWEEP_MATCH_COUNT 0
TEMP_CANDIDATE_DIR qa/p13/blob_candidates
```

```text
GIT_FSCK_DANGLING_EXIT_CODE 2
GIT_FSCK_DANGLING_LINE_COUNT 2778
GIT_FSCK_DANGLING_LINES_BEGIN
GIT_FSCK_DANGLING_LINES_END
DANGLING_COMMIT_COUNT 0
REFLOG_LINE_COUNT 88
REFLOG_UNIQUE_REV_COUNT 36
STASH_LINE_COUNT 2
STASH_REFS_BEGIN
stash@{0}
stash@{1}
STASH_REFS_END
REFS_TO_CHECK_COUNT 38
REFLOG_STASH_DANGLING_MATCHES_BEGIN
REFLOG_STASH_DANGLING_MATCHES_END
REFLOG_STASH_DANGLING_MATCH_COUNT 0
```

```text
stash@{0}: On p11-restore-main: local state after A
stash@{1}: On p11-wip-worktree: local state after C relocation
```

```text
X_GIT_FSCK_DANGLING_EXIT_CODE 2
X_GIT_FSCK_DANGLING_LINE_COUNT 2778
X_GIT_FSCK_DANGLING_LINES_BEGIN
X_GIT_FSCK_DANGLING_LINES_END
X_GIT_FSCK_FIRST_20_LINES_BEGIN
broken link from    tree e534cac1620eda11f8ae2f2e0bdb90dd6d12dabf
              to    blob 7229fbd80a1f641b97f588944ec2c6173ab726b5
broken link from    tree 16b3feab65661fc25d43660534ac4d280cf43076
              to    blob 72b79ae834f3a40e1392cdd473de6e9aaf9f7c61
broken link from    tree 16b3feab65661fc25d43660534ac4d280cf43076
              to    blob c632c1f7f37a01a735597c6b29b4e4a75c502672
broken link from    tree 44dd1934463e7102d2b4e9458a7766433b9a9eed
              to    blob 5c4711d15d9576970390a26b613a9dcc9670b03f
broken link from    tree 290f743c4026e733cf1139f89db1c0902de25abf
              to    blob e4abc9eca49c18eb5a833a27d6687c44ada8672a
broken link from    tree 3b325b776be94909a832c3072099dfdfe7b860e8
              to    blob f7751f569671caad7dd6cc2d9d4362563c198874
broken link from    tree 78a2c480fb4c89f6a404900c882ce5857bcd926a
              to    blob f55a45e83a7cd36cac9fa66cdc53a55b91d32e5c
broken link from    tree 746eef2aad02843d23ae7e97ebfd2dc7dc370f60
              to    blob 588186ef0cfe077c5671a334144cc19efee90ef9
broken link from    tree 2cdaaca0546de3297736967b4aef831871372900
              to    blob f6366c89938df973755bc3f0a047fd2ffef6c676
broken link from    tree cd0589a6956d319b30551b819094806c906267cf
              to    blob c425c7126a0b13e5e759c1d6eba2979aeedbf129
X_GIT_FSCK_FIRST_20_LINES_END
```

## 4. Strand 2 Bundle Fingerprint Sweep

```text
BUNDLE_COUNT 9
BUNDLES_BEGIN
qa/p10_network_provenance_20260813/exported_bundle
qa/p11/d_calibration_w2_0050/exported_bundle
qa/p11/d_full_w2_1200/exported_bundle
web/public/data/generated_20260803_safe_bus_route_honesty50_targeted
web/public/data/generated_20260803_safe_mayflower_560234_targeted
web/public/data/generated_20260804_205430_pre_picker_fix
web/public/data/generated_20260804_honesty200_candidate_targeted
web/public/data/generated_20260804_safe_bus_route_honesty55_targeted
web/public/data/generated_20260805_prefer_scored_routed
BUNDLES_END
BUNDLE_BEGIN qa/p10_network_provenance_20260813/exported_bundle
HAS_SCORING_FINGERPRINTS True
ENTRY_COUNT 18
MATCHED_COUNT 18
UNMATCHED_COUNT 0
UNMATCHED_BEGIN
UNMATCHED_END
P10_MATCHED_EXCLUDING_TWO_BEGIN
pipeline\bus.py	6134d0a40ea0f22042523604ae7ce117203a750c58760107ad9ae63336813573	example_commit=62a68749470daa45e88180889c3559022f13a50f	commits_with_path=4
pipeline\bus_arrivals.py	105953816ead1fa685714d659cd48d587fa9e06ad6b7e08a0f81c62068c00c6b	example_commit=12f0692b2739d70619c17e59a740a2eb4a7c33f2	commits_with_path=2
pipeline\config\params.yaml	a05e9e9aac805de4a12217214ee574f6dc8813054d2fa8993a73e7d649bb1ce1	example_commit=dba753826576a95a91c5829fef38d96cd15187ab	commits_with_path=21
pipeline\config\weights.yaml	5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec	example_commit=86bca7aa532c64b93d94a4137be7bad52da00e42	commits_with_path=1
pipeline\connector_candidates.py	84ecba57d6480b766f4bca655dea3d1d9b86eade5e13fdd3e5a596d242a48e55	example_commit=10e5dd6c7e350d89a32d0e508b9f779f74af6a5e	commits_with_path=3
pipeline\export.py	86ce19db3bcafa8e2dc9f439ed1ff08f8d98bdf111f3a02f8f121e8d0b65b14b	example_commit=d78a0a38b5c91c8a4e898008b99ff693243110a8	commits_with_path=35
pipeline\fetch.py	d4907049095fa6c46171f8748d1b8a490ece27acc14cde3a300bdb07c017e8e7	example_commit=5db6ff45446c0d3312b84c11bbba6ec6c5174cf2	commits_with_path=8
pipeline\geocode.py	dd11f23f8a854a37069a8481d8585585c008045aab4a2f85be1075a8ff4b8f41	example_commit=4ba42f68fe1677a2efc84750b515d82de7cd9565	commits_with_path=1
pipeline\geocode_universe.py	c377aa696dc51085d7bc4a32724e77e830ec31fb61966ba4381dddbf413e2b0b	example_commit=ee1fb6ba2b9c8a1cad0dd35a9495339852e91d4f	commits_with_path=1
pipeline\network.py	b4530c4f448ccea121c6f395ced5a9967017dd2f717c12b99c7a0d4312370c88	example_commit=a0bf6e994a6ecedc293ccb83eb206446976abb89	commits_with_path=4
pipeline\osm_tags.py	cfdee9e89f58b96b075ba8e0aae421fabe0fef7daaa1ffc3f686d0546cb92be5	example_commit=61400250fafb51f0ca683293f3e04f2fef77b0ac	commits_with_path=1
pipeline\postal_universe.py	6c07bd1a094cb2f94480f64c89f41e470ce0a4f1decf0aee25ce262beed8f672	example_commit=160e614d120bcce15ed3975ebec5c3d41639ce48	commits_with_path=5
pipeline\routing.py	3d16db9f83b0bf566844570217044a2adbda968d3e7a25b586cd5ebb1b18694c	example_commit=dba753826576a95a91c5829fef38d96cd15187ab	commits_with_path=13
pipeline\scoring.py	255b4a225a625848e150673b01bccfbc679eea668a254667a9b01c2179bf610c	example_commit=faa946c029cec376e3c2dc8ebff87c510a4b7011	commits_with_path=2
pipeline\shade.py	493e5c96db973687ffb5095741fdcac27f6ff928f852189aebf9060fc71b472a	example_commit=e2dc89a42afb9b489f7080600c51e37c3936fc08	commits_with_path=3
run.py	2cd24279208230165927dd86e7ed035a9369808c252b4a3f23807db5486b713f	example_commit=dba753826576a95a91c5829fef38d96cd15187ab	commits_with_path=25
P10_MATCHED_EXCLUDING_TWO_COUNT 16
P10_MATCHED_EXCLUDING_TWO_END
BUNDLE_END qa/p10_network_provenance_20260813/exported_bundle
BUNDLE_BEGIN qa/p11/d_calibration_w2_0050/exported_bundle
HAS_SCORING_FINGERPRINTS True
ENTRY_COUNT 18
MATCHED_COUNT 18
UNMATCHED_COUNT 0
UNMATCHED_BEGIN
UNMATCHED_END
BUNDLE_END qa/p11/d_calibration_w2_0050/exported_bundle
BUNDLE_BEGIN qa/p11/d_full_w2_1200/exported_bundle
HAS_SCORING_FINGERPRINTS True
ENTRY_COUNT 18
MATCHED_COUNT 18
UNMATCHED_COUNT 0
UNMATCHED_BEGIN
UNMATCHED_END
BUNDLE_END qa/p11/d_full_w2_1200/exported_bundle
BUNDLE_BEGIN web/public/data/generated_20260803_safe_bus_route_honesty50_targeted
HAS_SCORING_FINGERPRINTS True
ENTRY_COUNT 5
MATCHED_COUNT 5
UNMATCHED_COUNT 0
UNMATCHED_BEGIN
UNMATCHED_END
BUNDLE_END web/public/data/generated_20260803_safe_bus_route_honesty50_targeted
BUNDLE_BEGIN web/public/data/generated_20260803_safe_mayflower_560234_targeted
HAS_SCORING_FINGERPRINTS True
ENTRY_COUNT 0
MATCHED_COUNT 0
UNMATCHED_COUNT 0
UNMATCHED_BEGIN
UNMATCHED_END
BUNDLE_END web/public/data/generated_20260803_safe_mayflower_560234_targeted
BUNDLE_BEGIN web/public/data/generated_20260804_205430_pre_picker_fix
HAS_SCORING_FINGERPRINTS True
ENTRY_COUNT 5
MATCHED_COUNT 5
UNMATCHED_COUNT 0
UNMATCHED_BEGIN
UNMATCHED_END
BUNDLE_END web/public/data/generated_20260804_205430_pre_picker_fix
BUNDLE_BEGIN web/public/data/generated_20260804_honesty200_candidate_targeted
HAS_SCORING_FINGERPRINTS True
ENTRY_COUNT 0
MATCHED_COUNT 0
UNMATCHED_COUNT 0
UNMATCHED_BEGIN
UNMATCHED_END
BUNDLE_END web/public/data/generated_20260804_honesty200_candidate_targeted
BUNDLE_BEGIN web/public/data/generated_20260804_safe_bus_route_honesty55_targeted
HAS_SCORING_FINGERPRINTS True
ENTRY_COUNT 5
MATCHED_COUNT 5
UNMATCHED_COUNT 0
UNMATCHED_BEGIN
UNMATCHED_END
BUNDLE_END web/public/data/generated_20260804_safe_bus_route_honesty55_targeted
BUNDLE_BEGIN web/public/data/generated_20260805_prefer_scored_routed
HAS_SCORING_FINGERPRINTS True
ENTRY_COUNT 5
MATCHED_COUNT 5
UNMATCHED_COUNT 0
UNMATCHED_BEGIN
UNMATCHED_END
BUNDLE_END web/public/data/generated_20260805_prefer_scored_routed
```

```text
P10_PROVENANCE_FINGERPRINT_MAPS qa/p10_network_provenance_20260813/exported_bundle/manifest.json
P10_UNIQUE_PATHS 18
scoring_fingerprints TOTAL 18 MATCHED 18 UNMATCHED 0
scoring_fingerprints UNMATCHED_BEGIN
scoring_fingerprints UNMATCHED_END
scoring_fingerprints_at_export TOTAL 18 MATCHED 18 UNMATCHED 0
scoring_fingerprints_at_export UNMATCHED_BEGIN
scoring_fingerprints_at_export UNMATCHED_END
scoring_fingerprints_at_scoring_start TOTAL 18 MATCHED 18 UNMATCHED 0
scoring_fingerprints_at_scoring_start UNMATCHED_BEGIN
scoring_fingerprints_at_scoring_start UNMATCHED_END
scoring_fingerprints_by_digest_COUNT 2
scoring_fingerprints_by_digest[06a6d36c1c8cabf7a5f1052a] TOTAL 18 MATCHED 16 UNMATCHED 2
scoring_fingerprints_by_digest[06a6d36c1c8cabf7a5f1052a] UNMATCHED_BEGIN
pipeline\score_batch.py	ad7522425faf70af11ad9ef4d14bfc344b936823c438e4e4d465e3b7b4d48ffc
pipeline\scoring_integration.py	6cac1b392c0151c61c41b4833e3ff773e4a93b6038077b2e4f0117519e5bbfb3
scoring_fingerprints_by_digest[06a6d36c1c8cabf7a5f1052a] UNMATCHED_END
scoring_fingerprints_by_digest[1e312a49f13cdc8a42902b1e] TOTAL 18 MATCHED 18 UNMATCHED 0
scoring_fingerprints_by_digest[1e312a49f13cdc8a42902b1e] UNMATCHED_BEGIN
scoring_fingerprints_by_digest[1e312a49f13cdc8a42902b1e] UNMATCHED_END
P10_RECORD_DIGEST_OTHER_SIXTEEN_CONFIRMATION_BEGIN
P10_RECORD_DIGEST 06a6d36c1c8cabf7a5f1052a
P10_RECORD_OTHER_TOTAL 16
P10_RECORD_OTHER_MATCHED 16
P10_RECORD_OTHER_UNMATCHED 0
P10_RECORD_OTHER_UNMATCHED_BEGIN
P10_RECORD_OTHER_UNMATCHED_END
P10_RECORD_DIGEST_OTHER_SIXTEEN_CONFIRMATION_END
```

## 5. Strand 3 Appended Correction

~~~text
## Correction 2026-08-15, recorded in P13

```text
P10_RECORD_DIGEST 06a6d36c1c8cabf7a5f1052a
P10_RECORD_DIGEST_TOTAL 18
P10_RECORD_DIGEST_MATCHED_COMMITTED_HISTORY 16
P10_RECORD_DIGEST_UNMATCHED_COMMITTED_HISTORY 2
P10_RECORD_DIGEST_UNMATCHED_BEGIN
pipeline\score_batch.py	ad7522425faf70af11ad9ef4d14bfc344b936823c438e4e4d465e3b7b4d48ffc
pipeline\scoring_integration.py	6cac1b392c0151c61c41b4833e3ff773e4a93b6038077b2e4f0117519e5bbfb3
P10_RECORD_DIGEST_UNMATCHED_END
P11_E14_RECORD_DIGEST 1e312a49f13cdc8a42902b1e
P11_E14_RECORD_DIGEST_TOTAL 18
P11_E14_RECORD_DIGEST_MATCHED_COMMITTED_HISTORY 18
P11_E14_RECORD_DIGEST_UNMATCHED_COMMITTED_HISTORY 0
VALUE_FIELDS_CHANGED 0
RECORD_COUNT 1200
```

The Section D comparison was not a same-code comparison. Two of the eighteen fingerprinted files differed between the P10 base bundle records and the P11 E14 run: `pipeline\score_batch.py` and `pipeline\scoring_integration.py`.

```text
CODE_RECOVERY_RESULT_BEGIN
X_WORKING_TREE_MATCHES_TARGETS False
P11_DIFF_ARTIFACT_MATCHES_TARGETS False
C_OBJECT_STORE_SIZE_FILTERED_CANDIDATE_COUNT 126
C_OBJECT_STORE_TARGET_MATCH_COUNT 0
C_DANGLING_REFLOG_STASH_TARGET_MATCH_COUNT 0
X_FSCK_DANGLING_LINE_COUNT 0
CODE_RECOVERY_RESULT_END
```

The P10 base values for those two files correspond to no committed version found in local history, reachable refs, tags, reflog refs, stashes, C: size-filtered blob candidates, or X: working-tree files checked in P13. The code that produced the P10 baseline remains unrecovered from those cheap sources.

`value_fields_changed=0` across 1,200 records therefore establishes that two different code states produced identical score values for this subset. It does not establish cross-machine determinism of one single committed code state.

The originally designed cross-machine test cannot now be run as framed because the T14 machine and its `C:\shiok` working copy no longer exist. What remains provable is same-machine determinism on E14 from committed code by scoring the identical 1,200-record subset twice on E14 and comparing those two outputs. At the measured P11 full-subset cost:

```text
9300.743 seconds + 9300.743 seconds = 18601.486 seconds
18601.486 seconds / 3600 = 5.167079444444444 hours
5.167079444444444 hours = about 5 hours 10 minutes
PIPELINE_TIME_NOT_AGREED_OR_SCHEDULED True
```
~~~

## 6. Strand 4 Inventory Gap

```text
WORKING_DIRECTORY=C:\sgSHIOK2026
C_ROOT=C:\sgSHIOK2026
X_ROOT=X:\01 REPOSITORIES\sgSHIOK2026
EXCLUDED_DIRS=.git,.venv,node_modules,.next,__pycache__
P12_COVERED_PREFIXES=qa,processed,raw,data,web\public\data
C_TOP_LEVEL_UNCOVERED_DIRS_BEGIN
.agents
.codebuddy
.github
.hypothesis
.mypy_cache
.pytest_cache
.ruff_cache
.vscode
pipeline
scripts
tests
web
C_TOP_LEVEL_UNCOVERED_DIRS_END
X_TOP_LEVEL_UNCOVERED_DIRS_BEGIN
.agents
.codebuddy
.github
.hypothesis
.mypy_cache
.pytest_cache
.ruff_cache
.vscode
pipeline
scripts
tests
web
X_TOP_LEVEL_UNCOVERED_DIRS_END
INVENTORY drive=C scope=uncovered exists=True elapsed_seconds=55.696 file_count=1636
INVENTORY drive=X scope=uncovered exists=True elapsed_seconds=55.480 file_count=1632
X_ONLY_COUNT=0
X_ONLY_BEGIN
X_ONLY_END
SIZE_MISMATCH_COUNT=6
SIZE_MISMATCH_BEGIN
X=1580	C=791	.agents\STATE.md
X=1225	C=1404	.gitignore
X=13174	C=13173	decisions.md
X=2544	C=2956	scripts\check_repo_integrity.py
X=28843	C=28506	tests\test_production_readiness.py
X=1869	C=2429	tests\test_repo_integrity.py
SIZE_MISMATCH_END
TOTAL_X_ONLY_BYTES_ARITHMETIC=0
TOTAL_SIZE_MISMATCH_X_BYTES_ARITHMETIC=49235
TOTAL_BYTES_AT_ISSUE_ARITHMETIC=0 + 49235 = 49235
ONE_SENTENCE_ANSWER=No uncovered X-only files were found, but uncovered same-path size mismatches are listed above.
```

## 7. Strand 5 Branch and Bot Exposure

```text
f58deed1ce6f124949d89ac5b943c526fac5103b	refs/heads/main
9a136bb16f988d48ec9232ece7fa4417b6b15d97	refs/heads/shiok-honesty-performance-20260811
```

```text
To https://github.com/hongyime/sgSHIOK2026.git
 - [deleted]         shiok-honesty-performance-20260811
```

```text
f58deed1ce6f124949d89ac5b943c526fac5103b	refs/heads/main
```

```text
SYNC_COMMITS_BEGIN
5fd42ab36c09f688b6ea112a3f1f503346e394db	2026-08-03T16:43:10Z	chore(config): sync from sourcerepo [skip ci]
3e602cf70c060ce763ffaa4964ae3aecf9b58254	2026-08-04T11:17:52Z	chore(config): sync from sourcerepo [skip ci]
e385a044c221796d5d243849d80e09ade0897fd2	2026-08-10T14:59:30Z	chore(config): sync from sourcerepo [skip ci]
4332ab3d0e0829b51569fd679c1eada2cd4dc77b	2026-08-12T03:34:33Z	chore(config): sync from sourcerepo [skip ci]
13a26846d8a48c0a520db57b8d98a21b94f774de	2026-08-12T08:25:47Z	chore(config): sync from sourcerepo [skip ci]
d5538e63d240a2db3c324e68c24d854758c7a318	2026-08-13T01:56:53Z	chore(config): sync from sourcerepo [skip ci]
b21e927609817d4e72c03bb8b5c5eafa221f4beb	2026-08-14T03:32:59Z	chore(config): sync from sourcerepo [skip ci]
SYNC_COMMITS_END
SCHEDULED_RUNS_BEGIN
31792745487	2026-08-14T10:34:20Z	3ae01f1014e2d9c26c5b0704cadffa2ed46531f7	completed	success	schedule
31878048744	2026-08-15T09:51:19Z	ccc4e8199ea01cbc5735e45abd41178148a34aab	completed	success	schedule
SCHEDULED_RUNS_END
DETECTION_WINDOWS_BEGIN
5fd42ab	commit=2026-08-03T16:43:10Z	next_run=2026-08-14T10:34:20Z	elapsed_hours=(2026-08-14T10:34:20+00:00 - 2026-08-03T16:43:10+00:00) = 257.853	run_head=3ae01f1014e2d9c26c5b0704cadffa2ed46531f7	later_tree	conclusion=success	chore(config): sync from sourcerepo [skip ci]
3e602cf	commit=2026-08-04T11:17:52Z	next_run=2026-08-14T10:34:20Z	elapsed_hours=(2026-08-14T10:34:20+00:00 - 2026-08-04T11:17:52+00:00) = 239.274	run_head=3ae01f1014e2d9c26c5b0704cadffa2ed46531f7	later_tree	conclusion=success	chore(config): sync from sourcerepo [skip ci]
e385a04	commit=2026-08-10T14:59:30Z	next_run=2026-08-14T10:34:20Z	elapsed_hours=(2026-08-14T10:34:20+00:00 - 2026-08-10T14:59:30+00:00) = 91.581	run_head=3ae01f1014e2d9c26c5b0704cadffa2ed46531f7	later_tree	conclusion=success	chore(config): sync from sourcerepo [skip ci]
4332ab3	commit=2026-08-12T03:34:33Z	next_run=2026-08-14T10:34:20Z	elapsed_hours=(2026-08-14T10:34:20+00:00 - 2026-08-12T03:34:33+00:00) = 54.996	run_head=3ae01f1014e2d9c26c5b0704cadffa2ed46531f7	later_tree	conclusion=success	chore(config): sync from sourcerepo [skip ci]
13a2684	commit=2026-08-12T08:25:47Z	next_run=2026-08-14T10:34:20Z	elapsed_hours=(2026-08-14T10:34:20+00:00 - 2026-08-12T08:25:47+00:00) = 50.142	run_head=3ae01f1014e2d9c26c5b0704cadffa2ed46531f7	later_tree	conclusion=success	chore(config): sync from sourcerepo [skip ci]
d5538e6	commit=2026-08-13T01:56:53Z	next_run=2026-08-14T10:34:20Z	elapsed_hours=(2026-08-14T10:34:20+00:00 - 2026-08-13T01:56:53+00:00) = 32.624	run_head=3ae01f1014e2d9c26c5b0704cadffa2ed46531f7	later_tree	conclusion=success	chore(config): sync from sourcerepo [skip ci]
b21e927	commit=2026-08-14T03:32:59Z	next_run=2026-08-14T10:34:20Z	elapsed_hours=(2026-08-14T10:34:20+00:00 - 2026-08-14T03:32:59+00:00) = 7.022	run_head=3ae01f1014e2d9c26c5b0704cadffa2ed46531f7	later_tree	conclusion=success	chore(config): sync from sourcerepo [skip ci]
DETECTION_WINDOWS_END
SYNC_COMMIT_COUNT 7
SCHEDULED_RUN_COUNT 2
```

## 8. Checks

```text
328 tests collected in 55.96s
```

```text
repo_integrity=ok
exit_code=0
```

## 9. Options Not Implemented

1. Make Repository Integrity run on every sync-bot push regardless of `[skip ci]`.
2. Add branch protection or required status checks for automated writers to `main`.
3. Disable direct sync-bot pushes and require PR review for sourcerepo sync changes.
4. Re-run same-machine E14 determinism only when a five-hour pipeline budget is approved.
5. Treat P10 as value-parity evidence across dirty/committed code states, not as a same-code determinism baseline.

FINDINGS — "None" will be rejected

1. The code that produced the P10 record-level baseline fingerprint was not recovered from X working tree hashes, P11 diff artifacts, C object-store size-window blobs, C reflog/stash/dangling refs, or X read-only fsck dangling output.
2. Both C and X git object stores report 2,778 lines of fsck broken-link/missing-blob output and exit nonzero; no dangling commit/blob/tree lines were present in the parsed output.
3. Manifest-level `provenance.scoring_fingerprints` are clean across the nine surviving exported bundles checked: every nonempty manifest-level map entry matched committed history.
4. The dirty/unrecoverable fingerprint problem is confined to the P10 record digest map `06a6d36c1c8cabf7a5f1052a`: exactly `pipeline\score_batch.py` and `pipeline\scoring_integration.py` are unmatched; the other sixteen entries match committed content.
5. P11 Section D proved value parity across two different code states for the 1,200-record subset (`value_fields_changed=0`), not same-code cross-machine determinism.
6. The original cross-machine determinism test cannot now be run as framed because the T14 machine and its `C:\shiok` working copy are gone.
7. Same-machine E14 determinism remains possible but would cost about `9300.743 + 9300.743 = 18601.486` seconds, or about five hours ten minutes, of unapproved pipeline time.
8. The P12 inventory gap is closed for uncovered paths: no uncovered X-only files were found. Six same-path size mismatches remain, all in source/state files where X is the older copy.
9. The fully merged remote branch `shiok-honesty-performance-20260811` was deleted; the remote now advertises only `main`.
10. The sync-bot detection windows before the first observed scheduled Repository Integrity run ranged from 7.022 hours to 257.853 hours, and every listed sync commit's next scheduled run tested a later tree rather than the synced commit itself.
11. Subagents A and B completed the requested read-only Strand 1 and Strand 2 work. Subagents C and D could not be started because the subagent thread limit was reached, so Strands 3, 4, and 5 were executed locally.
12. Pipeline execution cost was 0 seconds: no scoring, export, rescore, subset run, ingest, check, or network command was run.

DISAGREEMENTS

1. I disagree with treating P11 Section D as cross-machine determinism of a single code state. The P10 base record-level fingerprint includes two unrecovered file hashes, so the comparison was not same-code.
2. I disagree with relying on this repository's current object database as a complete recovery source. `git fsck --dangling` reports thousands of missing-blob/broken-link lines on both C and X, so absence from the object-store sweep is evidence of non-recovery from available objects, not proof that the bytes never existed.
