# P421 structured night lighting policy copy

## Root guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## git rev-parse HEAD / origin main

```text
aa8623fafb0aac9a76cdd851e12c6e7cef6e2fa8
aa8623fafb0aac9a76cdd851e12c6e7cef6e2fa8	refs/heads/main
```

## git status --short before commit

```text
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

## Focused inspection

```text
pipeline\batch_plan.py:125:    "role": "separate night-lighting map layer",
tests\test_batch_plan.py:304:        "role": "separate night-lighting map layer",
tests\test_production_readiness.py:607:        "role": "separate night-lighting map layer",
```

## Focused tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 35 items

tests\test_batch_plan.py ..........                                      [ 28%]
tests\test_production_readiness.py .........................             [100%]

======================= 35 passed in 116.18s (0:01:56) ========================
```

## git check-ignore evidence path

```text
EXIT=1
```

## repo integrity

```text
repo_integrity=ok
EXIT=0
```

## protected path diff

```text
EXIT=0
```

## git diff --stat

```text
decisions.md                       | 4 ++++
pipeline/batch_plan.py             | 2 +-
tests/test_batch_plan.py           | 2 +-
tests/test_production_readiness.py | 2 +-
4 files changed, 7 insertions(+), 3 deletions(-)
```

## FINDINGS

1. Structured batch-plan/readiness source policy still emitted `separate night-lighting map layer` after browser and docs copy had aligned on `night lighting`.
2. The change preserves machine-facing keys, source identity, artifact path, `lamp-overlay`, release gates, and scoring policy.
3. This is structured policy copy/test/evidence only. It does not run scoring, export, rescore, subset, ingest, network, deploy, or public-data mutation.

## DISAGREEMENTS

1. None.
