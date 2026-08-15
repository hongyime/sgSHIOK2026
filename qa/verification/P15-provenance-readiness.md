# P15 Provenance Readiness And Free-Tier Cleanup

Date: 2026-08-15

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

Scope:
- Zero pipeline cost.
- No scoring, export, rescore, subset run, ingest, check, or network command was run.
- Protected evidence/data paths were read only.
- `X:\01 REPOSITORIES\sgSHIOK2026` was not used as a working directory.
- `pipeline/config/weights.yaml` was not modified.

## Commits

```text
0d9181a fix: block stale score provenance in readiness gate
57b96fa fix: read shade proxy constants from params
2233475 docs: backfill P5 through P10 decisions
```

## Object Store Repair

P14 found 926 missing blobs. P15 tried the cheap repair in-place on C: with `git fetch --refetch origin --tags`.

```text
fetch_exit_code=0
fsck_exit_code=2
full_fsck_exit_code=2
```

Remaining missing refs:

```text
ALL_MISSING_COUNT 3
MISSING 151c1804c3248cd9adffcd39cbd1b030fa57ffe5
MISSING a0248a4938f3b6acfbfb6dbd30ede4fd77200509
MISSING e6b6dfd0679c6052b6202b931ecdd01fb3d5c01d
REFS_WITH_MISSING_BEGIN
refs/heads/dependabot/github_actions/actions/checkout-7 3134eeee2fce3e867b603926a842e6a0056e245f missing=1 ?e6b6dfd0679c6052b6202b931ecdd01fb3d5c01d
refs/heads/dependabot/github_actions/trufflesecurity/trufflehog-3.96.0 33d61c89e1882323e04a5176e6077a4762206905 missing=1 ?a0248a4938f3b6acfbfb6dbd30ede4fd77200509
refs/remotes/origin/dependabot/github_actions/actions/setup-node-7 4212ba24f5706e71cb2229491ba21f3e85e523c8 missing=1 ?151c1804c3248cd9adffcd39cbd1b030fa57ffe5
REFS_WITH_MISSING_END
```

Important refs are now clean:

```text
HEAD	missing=0	exit=0
refs/remotes/origin/main	missing=0	exit=0
refs/tags/p11-wip	missing=0	exit=0
refs/tags/p11-worktree-superseded	missing=0	exit=0
```

Gated plan not executed:
1. Preserve a fresh inventory of untracked data/evidence directories.
2. With owner approval only, delete/prune stale local Dependabot refs or move future code work to a clean clone.
3. Re-run `git fsck --connectivity-only --no-dangling --no-progress`.
4. Do not delete or move this working copy until ignored and untracked payloads are separately preserved.

## Provenance Gate

Policy landed:
- Blocking: scoring fingerprint changed during run, mixed scoring fingerprint digests, incomplete scoring fingerprint provenance, incomplete scoring input provenance, network changed during run, mixed network digests, incomplete network provenance.
- Non-blocking warning: scoring input changed during run and mixed scoring input digests when scoring input provenance remains complete, because partitioned runs legitimately carry more than one partition input digest.

Real bundle status after the fix:

```text
BUNDLE qa/p10_network_provenance_20260813/exported_bundle
ok=False
scoring_fingerprint_changed_during_run=True
scoring_input_changed_during_run=False
network_changed_during_run=False
mixed_scoring_fingerprint_digests=False
mixed_scoring_input_digests=False
mixed_network_digests=False
incomplete_scoring_fingerprint_provenance=False
incomplete_scoring_input_provenance=False
incomplete_network_provenance=False
blocking_provenance_signals=['scoring_fingerprint_changed_during_run']
warning_provenance_signals=[]
warning=active bundle manifest lacks score source hashes, scoring code/config fingerprints, complete subscore status, or fails provenance integrity signals: blocking provenance signals: scoring fingerprint changed during run; regenerate/export the bundle with current code before using it as provenance evidence
---
BUNDLE qa/p11/d_full_w2_1200/exported_bundle
ok=True
scoring_fingerprint_changed_during_run=False
scoring_input_changed_during_run=True
network_changed_during_run=False
mixed_scoring_fingerprint_digests=False
mixed_scoring_input_digests=True
mixed_network_digests=False
incomplete_scoring_fingerprint_provenance=False
incomplete_scoring_input_provenance=False
incomplete_network_provenance=False
blocking_provenance_signals=[]
warning_provenance_signals=['scoring_input_changed_during_run', 'mixed_scoring_input_digests']
warning=active bundle manifest has non-blocking provenance signals: non-blocking provenance signals: scoring input changed during run, mixed scoring input digests; verify digest maps before treating it as single-input evidence
---
BUNDLE web/public/data/generated_20260805_prefer_scored_routed
ok=False
scoring_fingerprint_changed_during_run=False
scoring_input_changed_during_run=False
network_changed_during_run=False
mixed_scoring_fingerprint_digests=False
mixed_scoring_input_digests=False
mixed_network_digests=False
incomplete_scoring_fingerprint_provenance=False
incomplete_scoring_input_provenance=False
incomplete_network_provenance=False
blocking_provenance_signals=[]
warning_provenance_signals=[]
warning=active bundle manifest lacks score source hashes, scoring code/config fingerprints, complete subscore status, or fails provenance integrity signals: scoring code/config fingerprints: pipeline\bus.py, pipeline\bus_arrivals.py, pipeline\connector_candidates.py, pipeline\export.py, pipeline\fetch.py, pipeline\geocode.py, pipeline\geocode_universe.py, pipeline\network.py, pipeline\osm_tags.py, pipeline\postal_universe.py, pipeline\score_batch.py, pipeline\shade.py, run.py; regenerate/export the bundle with current code before using it as provenance evidence
---
```

Schema clarification landed in fixtures:
- `record_scoring_fingerprint_digest`
- `score_batch_start_scoring_fingerprint_digest`
- existing `export_scoring_fingerprint_digest`

The legacy `scoring_fingerprint_digest` remains unchanged for compatibility.

## Shade Parameters

`pipeline/shade.py` now reads NParks shade proxy constants from `pipeline/config/params.yaml`.

```text
SHADE_CONFIG {'line_buffer_m': 8.0, 'point_buffer_m': 6.0, 'shade_weight': 0.5}
SHADE_IN_SCORING_FINGERPRINT_FILES True
SCORING_FINGERPRINT_FILE_COUNT 18
```

The tests compare the default configured call with the previous explicit constants `line_buffer_m=8.0`, `point_buffer_m=6.0`, and `shade_weight=0.5`. The computed default geometries and weights are unchanged.

Touching `pipeline/shade.py` changes future scoring fingerprint manifests because `pipeline/shade.py` is one of the eighteen `SCORING_FINGERPRINT_FILES`, even though the defaults preserve computed values.

## Decisions And README

`README.md` now says the live pilot is over a `124,443`-record source-derived universe.

`decisions.md` now has concise P5 through P10 backfill entries pointing to the existing verification evidence.

## Checks

Focused Python tests:

```text
........................                                                 [100%]
24 passed in 193.33s (0:03:13)
```

Ruff on touched Python files:

```text
All checks passed!
```

Python collection:

```text
338 tests collected in 42.33s
```

Repository integrity:

```text
repo_integrity=ok
exit_code=0
```

Web tests:

```text
Test Files  2 failed | 19 passed (21)
Tests  2 failed | 101 passed (103)
```

The default run failed only on Vitest 5s timeouts in `score-prefix-index.test.ts` and `typescript-contract.test.ts`. The same suite passed with a 30s timeout:

```text
Test Files  21 passed (21)
Tests  103 passed (103)
```

Weights file check:

```text
git diff --name-only -- pipeline/config/weights.yaml
```

No output.

## P16 Recommendation

P16 should be a free-tier release-readiness cleanup, not the section 10 presentation change yet.

Recommended order:
1. Free tier: decide whether to prune stale local Dependabot refs or switch future code work to a clean clone while preserving untracked payloads. This is operational hygiene, not pipeline work.
2. Free tier: add a production-readiness fixture for the live published bundle's legacy provenance shape, so future reports keep naming missing record-level provenance plainly.
3. Export-only tier, roughly fifty minutes: if the owner wants a publishable provenance-clean bundle, run an export-only refresh from existing score records after approval. This should not move score values, but it is still an export and was not run in P15.
4. Section 10 presentation change: do next only after the owner supplies copy decisions. It is lower priority than making the release/provenance gate honest because it changes product framing on top of a bundle the gate now correctly rejects as provenance-incomplete.
5. Full rescore tier: still deferred. Old T14 cost was about sixteen hours; E14 remains plausibly sixty-five to seventy-three hours.

## FINDINGS

1. The P10 stale-resume issue is now caught by readiness: `qa/p10_network_provenance_20260813/exported_bundle` returns `ok=False` with `blocking_provenance_signals=['scoring_fingerprint_changed_during_run']`.
2. `scoring_input_changed_during_run` and `mixed_scoring_input_digests` are not safe blocking signals by themselves: the real P11 partitioned run has both while complete input maps remain available.
3. The live published bundle still fails provenance readiness because its manifest has only five scoring fingerprint entries and public records carry no digest fields.
4. The local C: object store was mostly repaired by `git fetch --refetch origin --tags`, dropping missing blobs from 926 to 3, but global `git fsck` still fails on stale local Dependabot refs no longer advertised by origin.
5. Important refs are clean after the fetch: `HEAD`, `origin/main`, `p11-wip`, and `p11-worktree-superseded` all report zero missing objects.
6. README's 124,032-record status line was stale; it now records 124,443.
7. `decisions.md` now has durable P5 through P10 backfill entries.
8. NParks shade proxy constants now have one source of truth in `params.yaml`, and tests prove the default values remain `8.0`, `6.0`, and `0.5`.
9. Touching `pipeline/shade.py` changes future scoring fingerprints because it is one of the eighteen fingerprinted scoring files.
10. P15 pipeline execution cost was zero seconds.

## DISAGREEMENTS

1. I disagree with making mixed scoring-input digests a release blocker when the digest maps are complete. Partitioned scoring naturally creates multiple input digests; this should warn, not fail.
2. I disagree that the section 10 presentation change outranks provenance/release hygiene right now. The gate now correctly says the live bundle is provenance-incomplete, which is more foundational than presentation sequencing.
