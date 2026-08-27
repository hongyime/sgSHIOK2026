# P580 NO_TRANSIT Walk Evidence

Working root: C:\sgSHIOK2026
Machine: PRAWN-E14

## Scope

Implement the P579 existing-schema Shape A contract for far-connected `NO_TRANSIT_IN_RANGE` records: when assembly receives an out-of-range routed evidence carrier, keep `state`, `total`, and `subscores` as no-transit/null while preserving `best_node`, `paths`, `exposure_gaps`, route options, and candidate summaries. Empty/disconnected no-transit records stay all-null and candidate-free.

## Commands

### Focused scoring-integration selection

```text
....................                                                     [100%]
20 passed, 45 deselected in 40.29s
```

### Diff check

```text
```

### Related Python tests

```text
........................................................................ [ 62%]
...........................................                              [100%]
115 passed in 386.98s (0:06:26)
```

### Python collect-only

```text
tests/test_triage_onemap_outliers.py::test_compact_row_preserves_user_facing_triage_fields
tests/test_triage_onemap_outliers.py::test_triage_cli_requires_explicit_outputs_before_input_reads
tests/test_triage_onemap_outliers.py::test_triage_cli_runs_with_explicit_outputs

439 tests collected in 123.12s (0:02:03)
```

### Repository integrity

```text
repo_integrity=ok
repo_integrity_exit=0
```

### Evidence check-ignore

```text
check_ignore_exit=1
```

### Protected path diff

```text
```

## Findings

1. `assemble_score_record` previously treated every no-numeric-candidate record the same and returned all-null route evidence, even when a caller could supply an honest out-of-range routed candidate with shelter-map walk evidence.
2. The P580 implementation preserves per-type route options for far-connected no-transit carriers, so a record with both out-of-range MRT and bus evidence can expose each option while keeping the top-level state `NO_TRANSIT_IN_RANGE` and score fields null.

## Disagreements

1. None.
