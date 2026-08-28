# P770 remaining diagnostic retirement

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Retire the remaining historical `pipeline.diag_*` exploratory scripts that still read raw geospatial or HDB inputs directly.

No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.

## Evidence Commands

```text
uv run pytest tests/test_legacy_diag_scripts.py -q
uv run pytest -q --collect-only
python scripts/check_repo_integrity.py
git diff -- pipeline/config/weights.yaml checksums.json
git diff --stat
```

## Command Output

```text
uv run pytest tests/test_legacy_diag_scripts.py -q
.                                                                        [100%]
1 passed in 1.47s

uv run pytest -q --collect-only | Select-Object -Last 1
613 tests collected in 14.71s

python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0

git diff -- pipeline/config/weights.yaml checksums.json; if ($LASTEXITCODE -eq 0) { Write-Output 'protected_diff_check=ok' } else { Write-Output "protected_diff_check_exit=$LASTEXITCODE" }
protected_diff_check=ok

git check-ignore -v qa/verification/P770-remaining-diag-retirement.md; Write-Output "exit=$LASTEXITCODE"
exit=1

rg -n --glob 'diag_*.py' "pyrosm|get_data_by_custom_criteria|gpd\.read_file|\.rglob\(" "C:\sgSHIOK2026\pipeline"; Write-Output "exit=$LASTEXITCODE"
exit=1

git diff --stat
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                      |   3 +
 pipeline/diag_c.py                | 112 +++----------------------------------
 pipeline/diag_c_fast.py           | 103 ++++------------------------------
 pipeline/diag_c_fix.py            | 114 +++-----------------------------------
 pipeline/diag_d3.py               |  78 ++++----------------------
 pipeline/diag_d6.py               |  70 ++++-------------------
 pipeline/diag_f3.py               |  32 +++++------
 pipeline/diag_traffic_signals.py  |  39 ++++---------
 tests/test_legacy_diag_scripts.py |   8 ++-
 9 files changed, 84 insertions(+), 475 deletions(-)
```

## FINDINGS

1. `pipeline/diag_c.py`, `pipeline/diag_c_fast.py`, `pipeline/diag_c_fix.py`, `pipeline/diag_d3.py`, and `pipeline/diag_d6.py` remained executable legacy diagnostics that directly opened raw geospatial inputs through network loaders and `pyrosm`.
2. `pipeline/diag_f3.py` and `pipeline/diag_traffic_signals.py` still read raw inputs at module import time.
3. The maintained surface for this project should be guarded runner tasks or tracked QA/status evidence, not unguarded legacy diagnostics that can silently read local raw data.

## DISAGREEMENTS

1. None for this slice.
