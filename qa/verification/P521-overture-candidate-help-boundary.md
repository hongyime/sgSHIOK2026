# P521 Overture candidate help boundary

Working root: C:\sgSHIOK2026
Host: Prawn-E14
Date: 2026-08-22

## Guard

```text
C:\sgSHIOK2026
Prawn-E14
9fd24afced2a0806e739aa8d1506b7cec3af3fdb
9fd24afced2a0806e739aa8d1506b7cec3af3fdb	refs/heads/main
 M pipeline/overture_addresses.py
 M run.py
 M tests/test_overture_addresses.py
 M tests/test_run.py
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
?? qa/p125/
?? qa/p13/
?? qa/p16/
?? qa/p19/
?? qa/p21/
?? qa/p379/
?? qa/p8_provenance_repair_20260813/
?? sgSHIOK2026-copy.log
```

## Evidence path ignore check

```text
check_ignore_exit=1
```

## Focused tests

Command:

```text
uv run pytest tests/test_overture_addresses.py tests/test_run.py -q
```

Output:

```text
.....................                                                    [100%]
21 passed in 2.19s
```

## Help probe

Command:

```text
uv run python -m pipeline.overture_addresses --help | Select-String -Pattern "candidate-only|address-registry|scoring"
```

Output:

```text

Probe Overture Addresses SG as candidate-only postal-universe evidence; does
not approve scoring or address-registry use.

```

Note: `run.py overture-addresses --help` is intercepted by the top-level runner help, so the module help is the command-specific help surface. The runner stub is covered by `tests/test_run.py`.

## FINDINGS

1. Overture Addresses help and runner listing described a generic postal-universe candidate even though the settled report policy is `candidate_not_scoring`.
2. The command now states that Overture Addresses SG is candidate-only postal-universe evidence and does not approve scoring or address-registry use.

## DISAGREEMENTS

1. None.
