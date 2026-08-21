# P420 docs night lighting public copy

## Root guard

```text
C:\sgSHIOK2026
Prawn-E14
```

## git rev-parse HEAD / origin main

```text
7e44ff51120d96e514657f56dc0d66a638ab355a
7e44ff51120d96e514657f56dc0d66a638ab355a	refs/heads/main
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
README.md:5:covered-walkway ratio and exposed gaps on real routed walks, adds night-lighting
README.md:43:beyond locked transit range, or are awaiting scoring. The night-lighting map
README.md:53:If a replacement night-lighting overlay is approved, run
CLAUDE.md:6:night-lighting evidence as a map layer, and keeps the locked SHIOK score visible
```

## Focused tests

```text
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 5 items

tests\test_readme.py ....                                                [ 80%]
tests\test_agent_docs.py .                                               [100%]

============================== 5 passed in 3.40s ==============================
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
CLAUDE.md                | 2 +-
README.md                | 6 +++---
decisions.md             | 4 ++++
tests/test_agent_docs.py | 2 ++
tests/test_readme.py     | 6 ++++++
5 files changed, 16 insertions(+), 4 deletions(-)
```

## FINDINGS

1. README and CLAUDE still used hyphenated `night-lighting` in the product introduction and README local-artifact boundary after browser copy had moved to plain `night lighting`.
2. The `lamp-overlay` command, `lamp_posts_v1/` artifact path, and internal layer identifiers remain unchanged.
3. This is documentation/test/evidence only. It does not run scoring, export, rescore, subset, ingest, network, deploy, or public-data mutation.

## DISAGREEMENTS

1. None.
