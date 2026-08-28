# P771 script diagnostic retirement

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Retire historical standalone diagnostics under `scripts/` that directly opened raw geospatial inputs.

No scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.

## Evidence Commands

```text
uv run pytest tests/test_legacy_script_diagnostics.py -q
uv run pytest -q --collect-only | Select-Object -Last 1
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
git diff -- pipeline/config/weights.yaml checksums.json
git check-ignore -v qa/verification/P771-script-diagnostic-retirement.md; Write-Output "exit=$LASTEXITCODE"
rg -n --glob 'diagnostic_*.py' -F 'pyrosm' 'C:\sgSHIOK2026\scripts'
git diff --stat
```

## Command Output

```text
uv run pytest tests/test_legacy_script_diagnostics.py -q
.                                                                        [100%]
1 passed in 3.03s

uv run pytest -q --collect-only | Select-Object -Last 1
614 tests collected in 29.08s

python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0

git diff -- pipeline/config/weights.yaml checksums.json; if ($LASTEXITCODE -eq 0) { Write-Output 'protected_diff_check=ok' } else { Write-Output "protected_diff_check_exit=$LASTEXITCODE" }
protected_diff_check=ok

git check-ignore -v qa/verification/P771-script-diagnostic-retirement.md; Write-Output "exit=$LASTEXITCODE"
exit=1

rg -n --glob 'diagnostic_*.py' -F 'pyrosm' 'C:\sgSHIOK2026\scripts'; Write-Output "diagnostic_pyrosm_exit=$LASTEXITCODE"
diagnostic_pyrosm_exit=1

rg -n -F 'gpd.read_file' 'C:\sgSHIOK2026\scripts\classify_residuals.py' 'C:\sgSHIOK2026\scripts\diagnostic_battery.py' 'C:\sgSHIOK2026\scripts\diagnostic_coord.py' 'C:\sgSHIOK2026\scripts\diagnostic_gap.py' 'C:\sgSHIOK2026\scripts\diagnostic_snapping.py' 'C:\sgSHIOK2026\scripts\diagnostic_sportshub.py'; Write-Output "retired_gpd_read_file_exit=$LASTEXITCODE"
retired_gpd_read_file_exit=1

git diff --stat
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                    |   3 +
 scripts/classify_residuals.py   | 129 ++-----------------------
 scripts/diagnostic_battery.py   | 208 ++--------------------------------------
 scripts/diagnostic_coord.py     | 128 ++-----------------------
 scripts/diagnostic_gap.py       | 104 ++------------------
 scripts/diagnostic_snapping.py  | 127 ++----------------------
 scripts/diagnostic_sportshub.py | 139 ++-------------------------
 7 files changed, 54 insertions(+), 784 deletions(-)
```

## FINDINGS

1. `scripts/classify_residuals.py`, `scripts/diagnostic_battery.py`, `scripts/diagnostic_coord.py`, `scripts/diagnostic_gap.py`, `scripts/diagnostic_snapping.py`, and `scripts/diagnostic_sportshub.py` were still executable historical probes that directly read raw geospatial inputs.
2. `scripts/diagnostic_battery.py` and `scripts/diagnostic_snapping.py` extracted raw shapefile zips into temporary directories, increasing the chance that a casual diagnostic command does unexpected filesystem work.
3. These scripts predate the guarded runner pattern and should not remain as quiet alternate operator surfaces.

## DISAGREEMENTS

1. None for this slice.
