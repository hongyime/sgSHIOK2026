# P773 P379 probe gate

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Gate the direct P379 MCST proxy location probe before it can call OneMap or write cache/report files.

No P379 probe, public API call, scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.

## Evidence Commands

```text
uv run pytest tests/test_analysis_scripts.py -q
uv run pytest -q --collect-only | Select-Object -Last 1
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
git diff -- pipeline/config/weights.yaml checksums.json
git check-ignore -v qa/verification/P773-p379-probe-gate.md; Write-Output "exit=$LASTEXITCODE"
git diff --stat
```

## Command Output

```text
uv run pytest tests/test_analysis_scripts.py -q
.......................                                                  [100%]
23 passed in 24.22s

uv run pytest -q --collect-only | Select-Object -Last 1
618 tests collected in 38.53s

python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0

git diff -- pipeline/config/weights.yaml checksums.json; if ($LASTEXITCODE -eq 0) { Write-Output 'protected_diff_check=ok' } else { Write-Output "protected_diff_check_exit=$LASTEXITCODE" }
protected_diff_check=ok

git check-ignore -v qa/verification/P773-p379-probe-gate.md; Write-Output "exit=$LASTEXITCODE"
exit=1

git diff --stat
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                                   |  3 +++
 scripts/analysis/p19_mcst_missing_locations.py | 24 ++++++++++++++++++-
 tests/test_analysis_scripts.py                 | 32 ++++++++++++++++++++++++++
 3 files changed, 58 insertions(+), 1 deletion(-)
```

## FINDINGS

1. `scripts/analysis/p19_mcst_missing_locations.py --probe` previously required explicit paths but not a confirmation flag before OneMap calls and cache/report writes.
2. The default P379 cache-status path was already read-only and remains the default.
3. The direct probe path now requires `--confirm-p379-probe` in addition to explicit non-historical output paths.

## DISAGREEMENTS

1. None for this slice.
