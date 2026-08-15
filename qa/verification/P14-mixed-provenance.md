# P14 Mixed Provenance Assessment

Date: 2026-08-15

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

Scope:
- Zero pipeline cost.
- No scoring, export, rescore, subset run, ingest, check, or network command was run.
- Protected evidence/data paths were read only.
- `X:\01 REPOSITORIES\sgSHIOK2026` was not used as a working directory.

## Start State

```text
Prawn-E14
C:\sgSHIOK2026
85819196dccd26b12aed985ae829fb894c26c62a
85819196dccd26b12aed985ae829fb894c26c62a	refs/heads/main
?? qa/p10_network_provenance_20260813/
?? qa/p11/d_calibration_w2_0050/
?? qa/p11/d_full_w2_1200/
?? qa/p11/d_pilot_w2_0200_final/
?? qa/p11/d_pilot_w2_0200_retry3/
?? qa/p11/d_pilot_w2_0200_retry4/
?? qa/p11/diffs/
?? qa/p11/subset_0050_ready.parquet
?? qa/p11/subset_0200_ready.parquet
?? qa/p11/wip-worktree.diff
?? qa/p12/
?? qa/p13/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
check_ignore_exit_code=1
```

## Exporter Code Path

`pipeline/export.py` keeps record digest counts and also exposes a top-level manifest fingerprint map. The legacy map is lossy for records with `scoring_fingerprints` because later records overwrite earlier values for the same key. Separately, when a score-batch start manifest exists, `build_manifest_provenance()` prefers the start fingerprint map for top-level `manifest.provenance.scoring_fingerprints`.

Relevant grep:

```text
613:    scoring_fingerprints: dict[str, str] = {}
614:    fingerprint_digest_counts: Counter[str] = Counter()
615:    fingerprint_maps_by_digest: dict[str, dict[str, str]] = {}
636:        raw_fingerprints = provenance.get("scoring_fingerprints")
637:        raw_digest = provenance.get("scoring_fingerprint_digest")
638:        if isinstance(raw_digest, str) and raw_digest:
639:            fingerprint_digest_counts[raw_digest] += 1
644:                    scoring_fingerprints[key] = value
646:            if clean_fingerprints and not isinstance(raw_digest, str):
647:                digest = scoring_fingerprint_digest(clean_fingerprints)
648:                fingerprint_digest_counts[digest] += 1
649:                fingerprint_maps_by_digest[digest] = dict(sorted(clean_fingerprints.items()))
683:        "scoring_fingerprint_digest_counts": dict(sorted(fingerprint_digest_counts.items())),
684:        "scoring_fingerprint_maps_by_digest": dict(sorted(fingerprint_maps_by_digest.items())),
685:        "scoring_fingerprints": dict(sorted(scoring_fingerprints.items())),
883:    legacy_fingerprints = score_provenance["scoring_fingerprints"]
884:    manifest_fingerprints = (
885:        scoring_start.get("scoring_fingerprints")
887:        and isinstance(scoring_start.get("scoring_fingerprints"), dict)
888:        else legacy_fingerprints or scoring_export["scoring_fingerprints"]
904:    fingerprints_by_digest.update(score_provenance["scoring_fingerprint_maps_by_digest"])
905:    if isinstance(start_digest, str) and start_digest and manifest_fingerprints:
906:        fingerprints_by_digest[start_digest] = dict(sorted(manifest_fingerprints.items()))
907:    if isinstance(export_digest, str) and export_digest:
908:        fingerprints_by_digest[export_digest] = scoring_export["scoring_fingerprints"]
984:        "scoring_fingerprints": dict(sorted(manifest_fingerprints.items())),
985:        "scoring_fingerprint_digest": start_digest or export_digest,
986:        "export_scoring_fingerprint_digest": export_digest,
987:        "scoring_fingerprint_digest_counts": digest_counts,
988:        "scoring_fingerprints_by_digest": dict(sorted(fingerprints_by_digest.items())),
998:        "scoring_fingerprint_changed_during_run": changed_during_run,
999:        "mixed_scoring_fingerprint_digests": len(observed_digests) > 1,
```

## P10, P11, And Live Bundle Digest Populations

Command output:

```text
SUBSET_PATH=C:\sgSHIOK2026\qa\p8_provenance_repair_20260813\subset_1200_ready.parquet
SUBSET_POSTAL_COUNT=1200
BUNDLE=C:\sgSHIOK2026\qa\p10_network_provenance_20260813\exported_bundle
MANIFEST_SCORING_FINGERPRINT_DIGEST_COUNTS={"06a6d36c1c8cabf7a5f1052a": 1200}
MANIFEST_MIXED_SCORING_FINGERPRINT_DIGESTS=False
MANIFEST_RECORDS_MISSING_SCORING_FINGERPRINT_DIGEST=0
MANIFEST_SCORING_FINGERPRINTS_BY_DIGEST_KEYS=["06a6d36c1c8cabf7a5f1052a", "1e312a49f13cdc8a42902b1e"]
RECORD_COUNT=1200
RECORD_DIGEST_COUNTS={"06a6d36c1c8cabf7a5f1052a": 1200}
RECORD_DIGEST_EXAMPLES={"06a6d36c1c8cabf7a5f1052a": ["530227", "560101", "560102", "560103", "560104"]}
SUBSET_RECORD_COUNT=1200
SUBSET_DIGEST_COUNTS={"06a6d36c1c8cabf7a5f1052a": 1200}
---
BUNDLE=C:\sgSHIOK2026\qa\p11\d_full_w2_1200\exported_bundle
MANIFEST_SCORING_FINGERPRINT_DIGEST_COUNTS={"1e312a49f13cdc8a42902b1e": 1200}
MANIFEST_MIXED_SCORING_FINGERPRINT_DIGESTS=False
MANIFEST_RECORDS_MISSING_SCORING_FINGERPRINT_DIGEST=0
MANIFEST_SCORING_FINGERPRINTS_BY_DIGEST_KEYS=["1e312a49f13cdc8a42902b1e"]
RECORD_COUNT=1200
RECORD_DIGEST_COUNTS={"1e312a49f13cdc8a42902b1e": 1200}
RECORD_DIGEST_EXAMPLES={"1e312a49f13cdc8a42902b1e": ["530227", "560101", "560102", "560103", "560104"]}
SUBSET_RECORD_COUNT=1200
SUBSET_DIGEST_COUNTS={"1e312a49f13cdc8a42902b1e": 1200}
---
BUNDLE=C:\sgSHIOK2026\web\public\data\generated_20260805_prefer_scored_routed
MANIFEST_SCORING_FINGERPRINT_DIGEST_COUNTS=null
MANIFEST_MIXED_SCORING_FINGERPRINT_DIGESTS=None
MANIFEST_RECORDS_MISSING_SCORING_FINGERPRINT_DIGEST=None
MANIFEST_SCORING_FINGERPRINTS_BY_DIGEST_KEYS=null
RECORD_COUNT=124443
RECORD_DIGEST_COUNTS={"<missing>": 124443}
RECORD_DIGEST_EXAMPLES={"<missing>": ["530227", "560101", "560102", "560103", "560104"]}
SUBSET_RECORD_COUNT=1200
SUBSET_DIGEST_COUNTS={"<missing>": 1200}
---
```

Conclusion: the P10 exported 1,200-record baseline is not mixed across record-level scoring fingerprint digests. All 1,200 P10 records carry `06a6d36c1c8cabf7a5f1052a`. The 1,200 P11 E14 records all carry `1e312a49f13cdc8a42902b1e`.

The live published bundle cannot show the same record-level mixture because its public score records do not carry `scoring_fingerprint_digest` at all.

## P10 Manifest Shape

Command output:

```text
PATH qa/p10_network_provenance_20260813/exported_bundle/manifest.json
scoring_fingerprint_digest "1e312a49f13cdc8a42902b1e"
export_scoring_fingerprint_digest "1e312a49f13cdc8a42902b1e"
scoring_fingerprint_digest_counts {"06a6d36c1c8cabf7a5f1052a": 1200}
scoring_fingerprint_changed_during_run true
mixed_scoring_fingerprint_digests false
records_missing_scoring_fingerprint_digest 0
scoring_fingerprint_provenance_complete true
scoring_fingerprint_digests_missing_maps []
DIGEST_MAP_KEYS ["06a6d36c1c8cabf7a5f1052a", "1e312a49f13cdc8a42902b1e"]
START_SCORE_BATCH 28dc5bc769744a993e26d1d03c70a6abe677eaf20a42d12ffd848a668a0776d0
START_SCORING_INTEGRATION 29a24ee7f4613c811f4418ae3b8fdb0b28407d33ca51818fa216cfff2006e84d
EXPORT_SCORE_BATCH 28dc5bc769744a993e26d1d03c70a6abe677eaf20a42d12ffd848a668a0776d0
EXPORT_SCORING_INTEGRATION 29a24ee7f4613c811f4418ae3b8fdb0b28407d33ca51818fa216cfff2006e84d
---
PATH qa/p11/d_full_w2_1200/exported_bundle/manifest.json
scoring_fingerprint_digest "1e312a49f13cdc8a42902b1e"
export_scoring_fingerprint_digest "1e312a49f13cdc8a42902b1e"
scoring_fingerprint_digest_counts {"1e312a49f13cdc8a42902b1e": 1200}
scoring_fingerprint_changed_during_run false
mixed_scoring_fingerprint_digests false
records_missing_scoring_fingerprint_digest 0
scoring_fingerprint_provenance_complete true
scoring_fingerprint_digests_missing_maps []
DIGEST_MAP_KEYS ["1e312a49f13cdc8a42902b1e"]
START_SCORE_BATCH 28dc5bc769744a993e26d1d03c70a6abe677eaf20a42d12ffd848a668a0776d0
START_SCORING_INTEGRATION 29a24ee7f4613c811f4418ae3b8fdb0b28407d33ca51818fa216cfff2006e84d
EXPORT_SCORE_BATCH 28dc5bc769744a993e26d1d03c70a6abe677eaf20a42d12ffd848a668a0776d0
EXPORT_SCORING_INTEGRATION 29a24ee7f4613c811f4418ae3b8fdb0b28407d33ca51818fa216cfff2006e84d
---
```

P10 has an internally inconsistent manifest:
- top-level `scoring_fingerprint_digest` and `export_scoring_fingerprint_digest` are `1e312a49f13cdc8a42902b1e`;
- record digest counts are `{"06a6d36c1c8cabf7a5f1052a": 1200}`;
- `scoring_fingerprint_changed_during_run` is `true`;
- `mixed_scoring_fingerprint_digests` is `false`.

That is not a mixed-record bundle. It is a score-record digest versus score-batch/export digest mismatch.

## P10 Resume Mechanism

Command output:

```text
P10_SCORE_BATCH_MANIFEST_PATH qa/p10_network_provenance_20260813/score/batch_manifest.json
resume true
chunks_skipped_existing 3
chunks_written 0
records_written 1200
selected_postals 1200
ready_postals_selected 1200
chunk_count 3
chunk_size 500
generated_at "2026-08-13T09:18:23.378799+00:00"
CHUNK_STATUS_COUNTS_BEGIN
{"skipped_existing": 3}
CHUNK_STATUS_COUNTS_END
FIRST_CHUNKS_BEGIN
{"index": 1, "path": "qa\\p10_network_provenance_20260813\\score\\chunks\\chunk_00001_000135_415837.json", "records": 500, "status": "skipped_existing"}
{"index": 2, "path": "qa\\p10_network_provenance_20260813\\score\\chunks\\chunk_00002_415927_688254.json", "records": 500, "status": "skipped_existing"}
{"index": 3, "path": "qa\\p10_network_provenance_20260813\\score\\chunks\\chunk_00003_688259_828629.json", "records": 200, "status": "skipped_existing"}
FIRST_CHUNKS_END
```

This is the best mechanism found: P10 score-batch ran with `resume=true`, skipped all three existing chunks, wrote zero chunks, but rebuilt the score-batch manifest under the newer clean digest. The exported score records therefore retained the older `06a6d36c1c8cabf7a5f1052a` per-record digest while the batch/export manifest reported newer start/export fingerprints.

## Production Readiness Blind Spot

Command output:

```text
BUNDLE qa/p10_network_provenance_20260813/exported_bundle
ok True
source_hash_count 14
scoring_fingerprint_count 18
missing_scoring_fingerprints []
missing_subscore_status []
mixed_scoring_fingerprint_digests False
incomplete_scoring_fingerprint_provenance False
warning None
---
BUNDLE qa/p11/d_full_w2_1200/exported_bundle
ok True
source_hash_count 14
scoring_fingerprint_count 18
missing_scoring_fingerprints []
missing_subscore_status []
mixed_scoring_fingerprint_digests False
incomplete_scoring_fingerprint_provenance False
warning None
---
BUNDLE web/public/data/generated_20260805_prefer_scored_routed
ok False
source_hash_count 14
scoring_fingerprint_count 5
missing_scoring_fingerprints ['pipeline\\bus.py', 'pipeline\\bus_arrivals.py', 'pipeline\\connector_candidates.py', 'pipeline\\export.py', 'pipeline\\fetch.py', 'pipeline\\geocode.py', 'pipeline\\geocode_universe.py', 'pipeline\\network.py', 'pipeline\\osm_tags.py', 'pipeline\\postal_universe.py', 'pipeline\\score_batch.py', 'pipeline\\shade.py', 'run.py']
missing_subscore_status []
mixed_scoring_fingerprint_digests False
incomplete_scoring_fingerprint_provenance False
warning active bundle manifest lacks score source hashes, scoring code/config fingerprints, complete subscore status, single-run scoring fingerprints, or complete fingerprint digest provenance; regenerate/export the bundle with current code before using it as provenance evidence
---
```

`bundle_score_provenance_status()` accepts P10 as `ok=True` even though P10 says `scoring_fingerprint_changed_during_run=true` and its top-level digest differs from every exported record's digest. That is a real gate blind spot.

Decision: this is worth fixing, but not in P14. The right zero-pipeline P15 change is to make the manifest schema and readiness gate distinguish record digest, score-batch start digest, and export digest explicitly. That is small code/test work, but it should be a deliberate schema change because existing consumers may already read `manifest.provenance.scoring_fingerprint_digest` as if it names the record population.

## Local Git Object Store

Partial/filtered clone checks:

```text
extensions.partialClone.exit=1
remote.origin.promisor.exit=1
remote.origin.partialclonefilter.exit=1
count: 180
size: 423
in-pack: 6623
packs: 7
size-pack: 15801
prune-packable: 23
garbage: 1
size-garbage: 0
warning: garbage found: .git/objects/pack/tmp_pack_dGAYJs
```

Reachability and fsck checks:

```text
rev_list_all_line_count=4625
rev_list_all_missing_count=926
?0900e70a44f6dd90efb52143cf71dcc64188ef9e
?4400ae43c991b6ea7fd99dd6e99f3022b96c8a74
?5600d620f42c0f3795bf33d2146fe03f4dd71dac
?5700e9c22280d07960752e98def88210ab4965e9
?d6008f45788b03e53dcd37f0b00aa111dba792fa
?db00b533124cde90bd344d9799c6d53a66bb2f81
?0a01c0ea8921e9a1b1ed54190095efb451f2d965
?1901081c562722127e64ffa7424e45dba33b83bb
?1a01fbc1dc4eb41c7523c136515668a535d232cc
?e501118511d247667796bde6c1301c11dd6bc2db
?280238b43cb70d52d8d6d29ce695e63c6ab9001c
?7302a156498e8cd6a3a8f5204916d874f9fd06c9
?8002a62fcfb5770f6d4a9e4b97ae6ab0430a5890
?5505e53ad684d3c990ba366f747ba2fe9d09f92e
?7d054c4f2e78b87c5e2e5ff883b44d63e9255604
?e105a17a71ae9a1d5a8d6c656b2153ce0345d8d1
?fe052f5fbbf3869ceb86fd32fb5c1df082de1fd2
?0a0644ec60449ef028c0a2c5489b7e0cd99b5344
?c306843a79c59ddacbc392c8aa04806a9a5c6fe3
?c906a84add7163e2502d6c6de6344d8c6b9d0315
exit_code=0
rev_list_reflog_line_count=4629
rev_list_reflog_missing_count=926
?0900e70a44f6dd90efb52143cf71dcc64188ef9e
?4400ae43c991b6ea7fd99dd6e99f3022b96c8a74
?5600d620f42c0f3795bf33d2146fe03f4dd71dac
?5700e9c22280d07960752e98def88210ab4965e9
?d6008f45788b03e53dcd37f0b00aa111dba792fa
?db00b533124cde90bd344d9799c6d53a66bb2f81
?0a01c0ea8921e9a1b1ed54190095efb451f2d965
?1901081c562722127e64ffa7424e45dba33b83bb
?1a01fbc1dc4eb41c7523c136515668a535d232cc
?e501118511d247667796bde6c1301c11dd6bc2db
?280238b43cb70d52d8d6d29ce695e63c6ab9001c
?7302a156498e8cd6a3a8f5204916d874f9fd06c9
?8002a62fcfb5770f6d4a9e4b97ae6ab0430a5890
?5505e53ad684d3c990ba366f747ba2fe9d09f92e
?7d054c4f2e78b87c5e2e5ff883b44d63e9255604
?e105a17a71ae9a1d5a8d6c656b2153ce0345d8d1
?fe052f5fbbf3869ceb86fd32fb5c1df082de1fd2
?0a0644ec60449ef028c0a2c5489b7e0cd99b5344
?c306843a79c59ddacbc392c8aa04806a9a5c6fe3
?c906a84add7163e2502d6c6de6344d8c6b9d0315
exit_code=0
```

```text
FSCK_EXIT_CODE 2
FSCK_LINE_COUNT 2778
FSCK_CLASS_COUNTS_BEGIN
broken link from=926
missing blob=926
missing link target line=926
FSCK_CLASS_COUNTS_END
FSCK_FIRST_20_BEGIN
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
FSCK_FIRST_20_END
```

Current tree check:

```text
HEAD_HISTORY_MISSING_OBJECT_COUNT 923
HEAD_CURRENT_TREE_BLOB_COUNT 797
HEAD_CURRENT_TREE_MISSING_BLOB_COUNT 0
HEAD_CURRENT_TREE_MISSING_BLOBS_BEGIN
HEAD_CURRENT_TREE_MISSING_BLOBS_END
```

Named-object sample:

```text
broken link from    tree e534cac1620eda11f8ae2f2e0bdb90dd6d12dabf (HEAD@{1786241434}~23:web/lib/__tests__/)
              to    blob 7229fbd80a1f641b97f588944ec2c6173ab726b5 (HEAD@{1786241434}~23:web/lib/__tests__/route-evidence-map-interaction.test.ts)
broken link from    tree 16b3feab65661fc25d43660534ac4d280cf43076 (HEAD@{1786241434}~23:web/app/)
              to    blob 72b79ae834f3a40e1392cdd473de6e99f3022b96c8a74 (HEAD@{1786241434}~23:web/app/page.module.css)
broken link from    tree 16b3feab65661fc25d43660534ac4d280cf43076 (HEAD@{1786241434}~23:web/app/)
              to    blob c632c1f7f37a01a735597c6b29b4e4a75c502672 (HEAD@{1786241434}~23:web/app/page.tsx)
broken link from    tree 44dd1934463e7102d2b4e9458a7766433b9a9eed (HEAD@{1786241434}~22:web/app/)
              to    blob 5c4711d15d9576970390a26b613a9dcc9670b03f (HEAD@{1786241434}~22:web/app/page.tsx)
broken link from    tree 290f743c4026e733cf1139f89db1c0902de25abf (HEAD@{1786241434}~21:web/lib/__tests__/)
              to    blob e4abc9eca49c18eb5a833a27d6687c44ada8672a (HEAD@{1786241434}~21:web/lib/__tests__/route-evidence-map-interaction.test.ts)
```

Conclusion: this C: repository is not a partial or filtered clone. Its current checkout is readable, but its local object database is incomplete for historical ancestors reachable from current history and reflogs. Because the owner verified a fresh GitHub clone fscks clean, the safest model is local object-store corruption or a bad copied clone, not remote corruption.

Practical impact:
- Current source work, tests, commits, and pushes can continue if they only need current blobs.
- Historical checkout/diff/recovery work in this clone is not trustworthy.
- P13's object-store recovery sweep was necessarily incomplete, as already noted in P13.
- The durable fix is to move future code work to a fresh clean clone of `origin/main` and attach/copy only the untracked data/evidence directories after separately preserving them.

## P15 Recommendation And Cost

Recommended P15:
1. Free tier, zero pipeline cost: fix provenance schema and gates.
   - Add tests for the P10 resume/stale-chunk shape.
   - Make `manifest.provenance` explicitly distinguish record digest counts from score-batch start and export digests.
   - Fail or warn readiness when `scoring_fingerprint_changed_during_run=true`, or when one observed record digest exists but differs from the top-level/start/export digest.
   - Stop presenting top-level `scoring_fingerprints` as sufficient evidence when record digest counts disagree.
2. Free tier, zero pipeline cost: create a clean code clone for future work and verify it fscks clean, then plan data attachment. Do not delete this working copy until untracked evidence/data is preserved.
3. Export-only tier, roughly 50 minutes: only after the schema fix, export a corrected bundle from existing score records so the manifest exposes the inconsistency accurately. This does not establish new scores.
4. Pipeline tier: do not spend five hours ten minutes on same-machine E14 determinism yet. It would show reproducibility of the current E14 code on E14, but it cannot answer the original T14-vs-E14 same-code question because T14 and `C:\shiok` are gone. I would only run it if future work depends on E14 repeatability rather than published-baseline comparability.
5. Full rescore tier: defer. Old T14 cost was about 16 hours; E14 plausibly 65 to 73 hours. Nothing in P14 justifies that cost.

## FINDINGS

1. P10's 1,200 exported records do not split across two record-level scoring fingerprint digests. All 1,200 carry `06a6d36c1c8cabf7a5f1052a`.
2. The second P10 digest, `1e312a49f13cdc8a42902b1e`, appears in score-batch/export manifest metadata, not in the P10 exported record population.
3. P10 `score/batch_manifest.json` shows `resume=true`, `chunks_skipped_existing=3`, `chunks_written=0`, and all chunks `skipped_existing`, which is the likely mechanism for old per-record digest values being exported with newer score-batch/export metadata.
4. The live published bundle has 124,443 public score records with no per-record `scoring_fingerprint_digest`, so the P10/P11 record-digest comparison cannot be performed against the live public records.
5. `bundle_score_provenance_status()` returns `ok=True` for the P10 exported bundle even though `scoring_fingerprint_changed_during_run=true` and the top-level digest differs from every exported record's digest. This is a readiness blind spot.
6. The manifest-level `scoring_fingerprints` field is insufficient provenance evidence by itself. In P10 it names the newer start/export map while `scoring_fingerprint_digest_counts` names the older record population.
7. The local C: repository is not a partial/promisor clone, but `git fsck` reports 926 missing blobs and 926 broken links. Current HEAD's tree has zero missing blobs, so current work is operational, but historical recovery/diff work in this clone is not trustworthy.
8. P13's conclusion that the P10 code bytes were unrecovered remains true, but the best model is now stale resumed score chunks plus newer manifest/export metadata, not a mixed-record exported bundle.
9. Pipeline cost for P14 was zero seconds.

## DISAGREEMENTS

1. I disagree that P10 was a mixed-code exported record bundle in the sense of records split across two scoring fingerprint digests. The exported records are uniform: 1,200 of 1,200 carry `06a6d36c1c8cabf7a5f1052a`.
2. I agree with rejecting the earlier "single dirty tree" model, but the replacement model is narrower: P10 appears to be a resumed/stale score-chunk export where all records came from the old digest and the batch/export metadata came from the newer clean digest.
3. I disagree with treating a five-hour-ten-minute E14 same-machine determinism run as the next best use of pipeline time. It is useful only for future E14 repeatability; it cannot recover the original T14 cross-machine same-code claim.
