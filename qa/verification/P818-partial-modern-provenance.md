# P818 Partial Modern Provenance Gate

## Startup

```text
C:\sgSHIOK2026
Prawn-E14
a0694e837aa28dcb60e5c0b9f6325fbf5f549521
a0694e837aa28dcb60e5c0b9f6325fbf5f549521	refs/heads/main
```

## Evidence Path Ignore Check

```text
exit=1
```

## Focused Test Before Fixture Completion

```text
10 failed, 18 passed in 116.44s (0:01:56)
```

## Focused Test After Fix

```text
28 passed in 106.24s (0:01:46)
```

## Diff Check

```text
warning: in the working copy of 'tests/test_production_readiness.py', CRLF will be replaced by LF the next time Git touches it
```

## FINDINGS

1. `refresh_score_provenance_manifest()` can write digest-count fields without the matching modern completeness flags and digest maps; before this fix, readiness treated that as modern enough to avoid the legacy bucket but not incomplete enough to fail.
2. Existing positive readiness fixtures were not full modern provenance fixtures; tightening the gate exposed that test gap, so the helper now carries algorithm fields, digest counts, digest maps, missing-map lists, missing-record counts, and changed/mixed/completeness flags.
3. Direct-bus fallback copy still has smaller walk-wording leaks in the exposure hero and route-details region; that is separate from this release-gate defect and should be fixed as its own commit.

## DISAGREEMENTS

1. None.
