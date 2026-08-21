# P387 P19 Help Evidence Split Evidence

## Root Guard

```powershell
PS C:\sgSHIOK2026> Get-Location; hostname; git rev-parse HEAD; git ls-remote origin main; git status --short

Path
----
C:\sgSHIOK2026

Prawn-E14
c2ef644c2092e6ecd8c48af88108af8b113647a0
c2ef644c2092e6ecd8c48af88108af8b113647a0	refs/heads/main
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

## Evidence Path Ignore Check

```powershell
PS C:\sgSHIOK2026> git check-ignore -v qa/verification/P387-p19-help-evidence-split.md; Write-Output "exit_code=$LASTEXITCODE"
exit_code=1
```

## Focused Tests

```powershell
PS C:\sgSHIOK2026> uv run pytest tests/test_run.py tests/test_readme.py -p no:cacheprovider
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\sgSHIOK2026
configfile: pyproject.toml
plugins: anyio-4.14.2, hypothesis-6.161.5
collected 13 items

tests\test_run.py .........                                              [ 69%]
tests\test_readme.py ....                                                [100%]

============================= 13 passed in 1.91s ==============================
```

## Help Output

```powershell
PS C:\sgSHIOK2026> uv run python run.py --help
usage: run.py [-h] task

S.H.I.O.K. task runner (cross-platform replacement for make).

Usage: uv run python run.py <task> [options]

Safe reports:
  check --freshness-only | check --geospatial-discovery-only | p19-gap-status | p125-osm-status | readiness | batch-plan
  check --freshness-only reads raw/manifest.json only; it probes no upstream URLs and writes no manifest.
  check --geospatial-discovery-only probes DataMall discovery metadata only; it downloads no payloads and writes no manifest.
  p19-gap-status reads cached P19 measurement status, evidence split, missing rows, MCST proxy probe and cache ages only; it calls no APIs and writes no files.
  p125-osm-status reads cached P125 Overpass output and frozen v1 universe only; it calls no APIs and writes no files.
  readiness validates the published shelter-map bundle and release gates without scoring or deploying.
  batch-plan dry-runs batch prerequisites and policy status without scoring.

Gated pipeline tasks:
  ingest | network | score | score-batch | export | export-transit | validate | publish

`publish` ALWAYS runs `validate` first — this gate is hard-coded and must never be removed.

positional arguments:
  task

options:
  -h, --help  show this help message and exit
```

## Findings

1. Before P387, help text lagged the implementation: `p19-gap-status` reported an evidence split, but help only named missing rows, MCST probe and cache ages.
2. `run.py --help` and README now explicitly name the evidence split as part of the read-only P19 status surface.
3. The safe command boundary remains explicit: no APIs and no writes.

## Disagreements

1. None.
