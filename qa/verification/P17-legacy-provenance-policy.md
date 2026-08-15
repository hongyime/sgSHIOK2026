# P17 Legacy Provenance Policy

Date: 2026-08-16

Working root: `C:\sgSHIOK2026`

Machine: `Prawn-E14`

## Scope

P17 implements the release-standard decision made after P16: do not spend a full E14
rescore merely to backfill provenance fields for the live bundle. The readiness gate now
distinguishes:

- `passed`: current complete provenance.
- `legacy`: provenance capability was never recorded by the older bundle schema, with no
  internal inconsistency.
- `failed`: artifact defect or explicit internal provenance inconsistency.

No scoring, export, rescore, subset run, ingest, or network build was run.

## Startup Root

```text
Prawn-E14
C:\sgSHIOK2026
```

## X: Rescue And Cold Mirror

Rescue command output:

```text
source_exists=True
source_length=3405
source_sha256=6ca4383ffd5a56cf9f013eec5107381407d4785e2a5244c3f3965616cb1a1910
rescued_to=C:\sgSHIOK2026\qa\p17\section10-proposal-rescued-from-x.md
dest_sha256=6ca4383ffd5a56cf9f013eec5107381407d4785e2a5244c3f3965616cb1a1910
dest_length=3405
```

X: mirror command sequence:

```text
git fetch origin --prune
git checkout main
git reset --hard origin/main
git fsck --connectivity-only --no-dangling --no-progress
```

The first fsck still had many missing historical blobs, so P17 followed the instruction to
run one refetch:

```text
git fetch --refetch origin --tags
git fsck --connectivity-only --no-dangling --no-progress
```

Post-refetch output:

```text
broken link from    tree bbeeb579f27d7ec1f8924071876309bc78244553
              to    blob a0248a4938f3b6acfbfb6dbd30ede4fd77200509
broken link from    tree c27aa1dd48d1849a18a58c254039235df3712c76
              to    blob e6b6dfd0679c6052b6202b931ecdd01fb3d5c01d
missing blob a0248a4938f3b6acfbfb6dbd30ede4fd77200509
missing blob e6b6dfd0679c6052b6202b931ecdd01fb3d5c01d
fsck_exit=2
043dec00cbdaa54ec56cb51901119d73f50b0141
043dec00cbdaa54ec56cb51901119d73f50b0141
```

X: status after sync:

```text
?? qa/p10_network_provenance_20260813/
?? qa/p11/wip-worktree.diff
?? qa/p8_provenance_repair_20260813/
?? web/section10-presentation-proposal.md
main
043dec00cbdaa54ec56cb51901119d73f50b0141
043dec00cbdaa54ec56cb51901119d73f50b0141
```

X: is now a cold mirror on `main` at `origin/main`. Untracked files were not deleted.

## Readiness Gate States

Live bundle:

```text
web/public/data/generated_20260805_prefer_scored_routed
  ok=True
  state=legacy
  source_hash_count=14
  scoring_fingerprint_count=5
  legacy_missing_capabilities=['full 18-file scoring fingerprint set', 'record-level scoring fingerprint digests', 'record-level scoring input provenance', 'record-level network provenance']
  blocking_provenance_signals=[]
  warning_provenance_signals=[]
  warning=active bundle uses legacy provenance schema; missing capability: full 18-file scoring fingerprint set, record-level scoring fingerprint digests, record-level scoring input provenance, record-level network provenance; score values may be used as a verified legacy artifact, but this bundle cannot provide full record-level provenance evidence
```

P10 stale-resume bundle:

```text
qa/p10_network_provenance_20260813/exported_bundle
  ok=False
  state=failed
  source_hash_count=14
  scoring_fingerprint_count=18
  legacy_missing_capabilities=[]
  blocking_provenance_signals=['scoring_fingerprint_changed_during_run']
  warning_provenance_signals=[]
  warning=active bundle manifest lacks score source hashes, scoring code/config fingerprints, complete subscore status, or fails provenance integrity signals: blocking provenance signals: scoring fingerprint changed during run; regenerate/export the bundle with current code before using it as provenance evidence
```

## Export Projection Correction

P16's stop decision was correct, but the 16.606-hour projection treated fixed startup cost
as marginal per-record cost. The corrected roadmap estimate uses the known full-export
cost and the observed E14/T14 ratio.

```text
naive_fixed_cost_projection=96.081 * (124443 / 200) = 59783.039 seconds = 16.606 hours
machine_ratio_projection_low=3074.45 * 4.1 = 12605.245 seconds = 3.501 hours
machine_ratio_projection_high=3074.45 * 4.6 = 14142.470 seconds = 3.928 hours
three_hour_gate=3 * 3600 = 10800 seconds
```

The export-only path remains over the 3-hour P16 gate, but the correct estimate is closer
to 3.5-4.0 hours, not 16.6 hours.

## Tests

Focused readiness tests:

```text
................                                                         [100%]
16 passed in 139.75s (0:02:19)
```

Targeted lint:

```text
All checks passed!
```

Compile:

```text
uv run python -m py_compile scripts/production_readiness.py tests/test_production_readiness.py
```

Note: full Ruff on `scripts/production_readiness.py` reports an existing FURB162 warning
at line 127 unrelated to P17 changes. It was not changed in this task.

## Section 10 Proposal

The corrected proposal is now tracked at:

```text
web/section10-presentation-proposal.md
```

It is proposal-only copy/layout. No UI implementation is merged.

## Startup Guard

`.agents/STATE.md` now records the future-session guard:

```text
Mandatory startup guard for every future session: first assert the working directory is exactly `C:\sgSHIOK2026`; abort if it is not. Never use a relative path for a write. This belongs here, not only in `AGENTS.md`, because the sourcerepo sync bot has overwritten `AGENTS.md` seven times.
```

## FINDINGS

1. The readiness gate now reports the live published bundle as `state=legacy`, not
   `state=failed`, while naming the missing capabilities.
2. The P10 stale-resume shape still fails with
   `blocking_provenance_signals=['scoring_fingerprint_changed_during_run']`.
3. X: is now checked out to `main` at `origin/main` and is suitable as a synced cold
   mirror, but global fsck still reports two missing blobs held by stale local historical
   refs.
4. The rescued X: proposal content matched byte-for-byte after copying to
   `qa/p17/section10-proposal-rescued-from-x.md`.
5. The section 10 proposal is now a concrete review document under `web/`, not a UI
   implementation.
6. P16's export projection should not be carried forward; the better export-only estimate
   is 3.5-4.0 hours on E14, still above the prior 3-hour gate.

## DISAGREEMENTS

1. I do not disagree with the legacy-release-standard decision. It is the correct policy
   for an already independently verified bundle whose missing provenance was never
   recorded.
2. I do not disagree with the four-row section 10 framing. It is more honest than five
   rows because rain and heat share the same dominant evidence, crossing barely moves
   rankings, and bus remains partly a routing-trust signal.
