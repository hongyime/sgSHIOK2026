# P815 Score-Source Hash Gate

## Startup Guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## Trackability

```text
exit=1
```

`git check-ignore -v qa/verification/P815-score-source-hash-gate.md` returned exit 1, so this evidence file is trackable.

## Subagents

Read-only subagents were restarted.

Product subagent finding, queued for a separate coherent UI commit:

```text
Direct-bus fallback screen-reader status still says a published shelter-map walk is selected.
```

Provenance subagent finding, implemented here:

```text
source provenance can pass with the wrong source hashes
```

## Focused Test Failure Before Fixture Fix

```text
5 failed, 22 passed in 61.64s (0:01:01)
```

The failures came from current-bundle fixtures that omitted required score-source hashes. The shared fixture now populates the expected score-source hash set.

## Focused Test Output

```text
27 passed in 134.81s (0:02:14)
```

## Collect-Only Output

```text
630 tests collected in 44.36s
```

## Repository Integrity Output

```text
repo_integrity=ok
exit=0
```

## Protected Diff Guard

Command:

```text
git diff --name-only -- pipeline/config/weights.yaml checksums.json web/public/data qa/releases ':(glob)qa/p6_*' ':(glob)qa/p7_*' ':(glob)qa/p8_*' ':(glob)qa/p9_*' ':(glob)qa/p10_*' ':(glob)qa/p11/d_*'
```

Output:

```text
```

## Change

- `scripts/production_readiness.py` now treats `missing_expected_score_source_hashes` as blocking.
- The failure warning names the missing score-source hash keys when a manifest has some source hashes but not the required score-source set.
- `tests/test_production_readiness.py` now gives current-bundle fixtures the expected score-source hash set.
- A regression test covers the bad shape: only `leaf_area_index` present, all expected score-source hashes missing.

## FINDINGS

1. The readiness gate previously allowed a manifest with a non-empty but wrong `source_hashes` map to pass score-source provenance. A bundle containing only `leaf_area_index` could avoid the `source_hash_count <= 0` failure even while every expected score-source hash was absent.
2. Several current-bundle tests were weaker than the intended release policy because their shared fixture did not populate `source_hashes`; fixing the gate exposed that fixture gap immediately.
3. A separate direct-bus fallback screen-reader issue remains queued: the selected-state sentence can still say `Published shelter-map walk selected.` for fallback records.

## DISAGREEMENTS

1. None.
