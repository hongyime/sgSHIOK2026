# P16 Bundle Shipping Gate

Date: 2026-08-16

Working root: `C:\sgSHIOK2026`

Machine: `Prawn-E14`

## Scope

P16 attempted the cheapest shipping path for a corrected bundle: re-export from existing
score-batch chunks with `pipeline/export.py --records-dir`, with no scoring, no rescore,
no ingest, no network rebuild, no Vercel deploy, and no mutation of the existing published
bundle.

The conclusion is that the export path exists, but the preserved score chunks are legacy
provenance chunks. A re-export can preserve score values, but it cannot create a
provenance-clean publishable bundle without falsifying score provenance.

## Git Object Store Repair

Command:

```text
git fetch --prune origin
git remote prune origin
git fsck --connectivity-only --no-dangling --no-progress
Write-Output "fsck_exit=$LASTEXITCODE"
```

Output:

```text
broken link from    tree bbeeb579f27d7ec1f8924071876309bc78244553
              to    blob a0248a4938f3b6acfbfb6dbd30ede4fd77200509
broken link from    tree c27aa1dd48d1849a18a58c254039235df3712c76
              to    blob e6b6dfd0679c6052b6202b931ecdd01fb3d5c01d
missing blob a0248a4938f3b6acfbfb6dbd30ede4fd77200509
missing blob e6b6dfd0679c6052b6202b931ecdd01fb3d5c01d
fsck_exit=2
From https://github.com/hongyime/sgSHIOK2026
 - [deleted]         (none)     -> origin/dependabot/github_actions/actions/setup-node-7
 - [deleted]         (none)     -> origin/dependabot/github_actions/actions/upload-artifact-7
 - [deleted]         (none)     -> origin/shell/standardise
```

Remaining missing blobs are held by stale local Dependabot branch refs, not by the live
remote:

```text
refs/heads/dependabot/github_actions/actions/checkout-7 3134eeee2fce3e867b603926a842e6a0056e245f
refs/heads/dependabot/github_actions/trufflesecurity/trufflehog-3.96.0 33d61c89e1882323e04a5176e6077a4762206905
refs/remotes/origin/main 13b2986178815eeeabd888130d1d99ddf012c1cd
13b2986178815eeeabd888130d1d99ddf012c1cd	refs/heads/main
```

These remaining blobs do not affect `HEAD`, `origin/main`, or the provenance tags used in
recent work. I did not delete local branches in P16.

## Score Batch Survival

Inventory:

```text
combined/chunks	exists=True	files=252	bytes=23276017621
  first=chunk_part01_00001_000104_089362.json	96480521
  last=chunk_part04_00063_824176_917699.json	19299591
part01_of04/chunks	exists=True	files=63	bytes=5823579570
  first=chunk_00001_000104_089362.json	96480521
  last=chunk_00063_824173_918104.json	19289008
part02_of04/chunks	exists=True	files=63	bytes=5825558370
  first=chunk_00001_000105_089363.json	94550669
  last=chunk_00063_824174_918141.json	19878200
part03_of04/chunks	exists=True	files=44	bytes=4540921439
  first=chunk_00001_000106_089364.json	95772731
  last=chunk_00044_575790_578146.json	131632068
part04_of04/chunks	exists=False	files=0	bytes=0
partitions	exists=True	files=4	bytes=6892813
  first=part01_of04.parquet	1730915
  last=part04_of04.parquet	1724172
```

Manifest and combined summary:

```text
part01_of04	manifest_chunks=63	manifest_records_sum=31111	manifest_bytes_sum=5823579570	records_written=31111	chunks_written=63	chunks_skipped_existing=0
part02_of04	manifest_chunks=63	manifest_records_sum=31111	manifest_bytes_sum=5825558370	records_written=31111	chunks_written=63	chunks_skipped_existing=0
part03_of04	manifest_chunks=63	manifest_records_sum=31111	manifest_bytes_sum=5820032445	records_written=31111	chunks_written=63	chunks_skipped_existing=0
combined summary:
combined_chunks=252 combined_bytes=23276017621
part01	files=63	bytes=5823579570
part02	files=63	bytes=5825558370
part03	files=63	bytes=5820032445
part04	files=63	bytes=5806847236
combined first/last:
chunk_part01_00001_000104_089362.json	96480521
chunk_part01_00002_089366_118164.json	68379256
chunk_part01_00003_118169_127855.json	110109780
chunk_part04_00061_806017_808433.json	15191760
chunk_part04_00062_808437_824172.json	58839381
chunk_part04_00063_824176_917699.json	19299591
```

Part 4 count check:

```text
chunk_part04_00001_000135_089365.json	records=500	bytes=98282505	seconds=4.986
chunk_part04_00002_089369_118168.json	records=500	bytes=66312779	seconds=4.085
chunk_part04_00061_806017_808433.json	records=500	bytes=15191760	seconds=1.088
chunk_part04_00062_808437_824172.json	records=500	bytes=58839381	seconds=3.999
chunk_part04_00063_824176_917699.json	records=110	bytes=19299591	seconds=1.464
part04_inferred_records=31110
total_inferred_records=124443
```

Arithmetic:

```text
31111 + 31111 + 31111 + 31110 = 124443
5823579570 + 5825558370 + 5820032445 + 5806847236 = 23276017621 bytes
```

The complete preserved source is `combined/chunks`. The separate `part03_of04` directory
is short on disk and `part04_of04` is absent, so those per-part directories should not be
used as the recovery source.

## Chunk Provenance Shape

Sampled records from the preserved chunks:

```text
processed/score_batches/full_rescore_20260804_205430/combined/chunks/chunk_part01_00001_000104_089362.json
postal 000104
provenance_keys ['coordinate_source', 'postal_universe', 'reason', 'source_status', 'sources']
scoring_fingerprint_digest NoneType None
scoring_fingerprints NoneType None
scoring_input_digest NoneType None
scoring_input NoneType None
network_digest NoneType None
network NoneType None
source_hashes NoneType None
subscore_status NoneType None
processed/score_batches/full_rescore_20260804_205430/combined/chunks/chunk_part04_00063_824176_917699.json
postal 824176
provenance_keys ['bus_connectivity', 'bus_stop_access_connector', 'candidate_selection', 'direct_bus_fallback', 'manifest', 'mrt_lrt_exit_access_connector', 'origin_snap_distance_m', 'postal_universe', 'routing', 'routing_diagnostics', 'scoring_fingerprints', 'source_hashes', 'subscore_status', 'transit_node_set']
scoring_fingerprint_digest NoneType None
scoring_fingerprints dict 5 ['pipeline\\config\\params.yaml', 'pipeline\\config\\weights.yaml', 'pipeline\\routing.py', 'pipeline\\scoring.py', 'pipeline\\scoring_integration.py']
scoring_input_digest NoneType None
scoring_input NoneType None
network_digest NoneType None
network NoneType None
source_hashes dict 14 ['bus_routes', 'bus_services', 'bus_stops', 'covered_linkway', 'leaf_area_index']
subscore_status dict 5 ['access', 'bus', 'crossing', 'heat', 'rain']
```

This is the core blocker: the chunk records do not contain the complete scoring fingerprint,
scoring-input, or network provenance required by the P15 readiness gate.

## Pilot Export

Pilot input:

```text
{
  "chunk_bytes": 25171535,
  "first_postal": "000104",
  "last_postal": "059194",
  "pilot_output_dir": "qa\\p16\\pilot_export_20260816_003335",
  "pilot_records_dir": "qa\\p16\\pilot_records_20260816_003335",
  "record_count": 200,
  "source_chunk": "processed\\score_batches\\full_rescore_20260804_205430\\combined\\chunks\\chunk_part01_00001_000104_089362.json",
  "stamp": "20260816_003335"
}
```

Export output:

```text
exit_code=0
elapsed_seconds=96.081
peak_working_set_bytes=26714112
stdout_path=qa\p16\pilot_export_20260816_003335.stdout.txt
stderr_path=qa\p16\pilot_export_20260816_003335.stderr.txt
{
  "file_count": 22,
  "geom_shard_count": 11,
  "output_dir": "qa\\p16\\pilot_export_20260816_003335",
  "record_count": 200,
  "score_area_count": 5,
  "score_shard_count": 5,
  "state_counts": {
    "NOT_YET_SCORED": 12,
    "NO_TRANSIT_IN_RANGE": 1,
    "SCORED": 186,
    "SCORED_PARTIAL": 1
  },
  "written_files": {
    "geom/h3/886520d86dfffff.json": 3814325,
    "geom/h3/886520d94bfffff.json": 38753,
    "geom/h3/886520db07fffff.json": 29869,
    "geom/h3/886520db15fffff.json": 33257,
    "geom/h3/886520db17fffff.json": 83138,
    "geom/h3/886520db31fffff.json": 160663,
    "geom/h3/886520db33fffff.json": 2848756,
    "geom/h3/886520db35fffff.json": 70906,
    "geom/h3/886520db37fffff.json": 42480,
    "geom/h3/886520db39fffff.json": 32573,
    "geom/h3/886520db3bfffff.json": 426549,
    "geom/index.json": 277,
    "geom/postal-index.json": 5799,
    "manifest.json": 12010,
    "scores/DOWNTOWN_CORE.json": 468037,
    "scores/MARINA_SOUTH.json": 14774,
    "scores/OUTRAM.json": 1111527,
    "scores/SINGAPORE_RIVER.json": 845073,
    "scores/UNKNOWN.json": 6975,
    "scores/index.json": 2915,
    "scores/prefix-index.json": 564,
    "transit/pois.json": 4236220
  }
}
```

Projection:

```text
96.081 * (124443 / 200) = 59783.039 seconds
59783.039 / 3600 = 16.606 hours
3 * 3600 = 10800 seconds
```

Gate decision: the full export was not run because the pilot projection exceeds the
three-hour gate.

## Pilot Value Identity Against Live Bundle

Live bundle compared:

```text
https://sgshiok.vercel.app/data/generated_20260805_prefer_scored_routed/
```

Output:

```text
pilot_postals=200
pilot_score_files=5
pilot_score_files_list=DOWNTOWN_CORE,MARINA_SOUTH,OUTRAM,SINGAPORE_RIVER,UNKNOWN
live_score_files_needed=5
live_score_files_list=DOWNTOWN_CORE_PART_001,MARINA_SOUTH,OUTRAM_PART_001,SINGAPORE_RIVER_PART_001,UNKNOWN
live_records_found=200
missing_live=0
value_fields_changed=0
provenance_changed=188
first_postal=000104
last_postal=059194
```

The sampled score values are identical to live. Provenance changes because current
`public_score_record` derives a digest from the legacy five-file fingerprint map where it
can.

## Pilot Validation And Readiness

Validation:

```text
{
  "errors": [],
  "file_count": 22,
  "geometry_postals": 187,
  "geometry_postals_with_route_segments": 187,
  "indexed_postals": 200,
  "input_dir": "qa\\p16\\pilot_export_20260816_003335",
  "ok": true,
  "score_prefixes": 14,
  "transit_features": 6011,
  "warnings": []
}
validate_exit=0
```

Readiness:

```text
ok=False
source_hash_count=14
missing_scoring_fingerprints=['pipeline\\bus.py', 'pipeline\\bus_arrivals.py', 'pipeline\\connector_candidates.py', 'pipeline\\export.py', 'pipeline\\fetch.py', 'pipeline\\geocode.py', 'pipeline\\geocode_universe.py', 'pipeline\\network.py', 'pipeline\\osm_tags.py', 'pipeline\\postal_universe.py', 'pipeline\\score_batch.py', 'pipeline\\shade.py', 'run.py']
missing_subscores=None
mixed_scoring_fingerprint_digests=False
scoring_fingerprint_provenance_complete=None
blocking_provenance_signals=['incomplete_scoring_fingerprint_provenance', 'incomplete_scoring_input_provenance', 'incomplete_network_provenance']
warning_provenance_signals=[]
warning=active bundle manifest lacks score source hashes, scoring code/config fingerprints, complete subscore status, or fails provenance integrity signals: scoring code/config fingerprints: pipeline\bus.py, pipeline\bus_arrivals.py, pipeline\connector_candidates.py, pipeline\export.py, pipeline\fetch.py, pipeline\geocode.py, pipeline\geocode_universe.py, pipeline\network.py, pipeline\osm_tags.py, pipeline\postal_universe.py, pipeline\score_batch.py, pipeline\shade.py, run.py; blocking provenance signals: incomplete scoring fingerprint provenance, incomplete scoring input provenance, incomplete network provenance; regenerate/export the bundle with current code before using it as provenance evidence
```

Conclusion: re-exporting these chunks can produce a structurally valid bundle with stable
score values, but it does not produce a provenance-clean bundle. Running the full export
would spend hours to reproduce the same readiness failure at full scale.

## Section 10 Proposal Stop

The secondary proposal work was stopped. A relative `apply_patch` invocation targeted the
session root on `X:` and created:

```text
X:\01 REPOSITORIES\sgSHIOK2026\web\section10-presentation-proposal.md
```

Read-only confirmation from `C:\sgSHIOK2026`:

```text
True

FullName                                                              Length LastWriteTime
--------                                                              ------ -------------
X:\01 REPOSITORIES\sgSHIOK2026\web\section10-presentation-proposal.md   3405 16/8/2026 12:38…
```

I did not delete, edit, move, or copy that file after discovering it, because `X:` is
read-only for this task. No section 10 proposal is committed on C: in P16.

## Checks

Final checks:

```text
uv run pytest -q --collect-only
338 tests collected

python scripts/check_repo_integrity.py
repo_integrity=ok

git diff --name-only -- pipeline/config/weights.yaml

```

No scoring, export beyond the 200-record pilot, rescore, subset run, ingest, network build,
Vercel deploy, or mutation of the existing live bundle was performed. One unintended write
to `X:` occurred through a relative patch path and is recorded above.

## FINDINGS

1. The existing `--records-dir` export path works mechanically: the 200-record pilot wrote
   artifacts, validated cleanly, and had `value_fields_changed=0` against the live bundle.
2. The preserved score chunks are not sufficient to produce a corrected provenance-clean
   publishable bundle. They carry legacy provenance: scored records have only five scoring
   fingerprints and no scoring-input or network provenance; not-yet-scored records can have
   no scoring provenance at all.
3. The full 124,443-record export was gated off by cost: the 200-record pilot took 96.081 s,
   projecting to 59,783.039 s, or 16.606 h, above the 3 h P16 budget.
4. The complete score source survived only as `combined/chunks`. The separate per-part
   directories are not complete on C: (`part03_of04/chunks` has 44 of 63 files and
   `part04_of04/chunks` is absent).
5. `git fetch --prune origin` and `git remote prune origin` removed stale remote-tracking
   refs, but global fsck still fails on two missing blobs held by stale local Dependabot
   branch refs. Current important refs are not affected.
6. A tooling/path mistake created `X:\01 REPOSITORIES\sgSHIOK2026\web\section10-presentation-proposal.md`.
   It was left untouched after discovery because `X:` is read-only.

## DISAGREEMENTS

1. I disagree that the project can publish a corrected provenance-clean bundle from the
   preserved full-rescore chunks alone. They can reproduce values, but they cannot supply
   provenance that was never recorded in those records.
2. I disagree with spending the full export time on E14 before solving the provenance-source
   issue. The pilot already shows both the value-identity success and the readiness failure,
   and the full export projects over the approved budget.
