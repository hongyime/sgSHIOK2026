# P772 P19 measurement gate

Working root: `C:\sgSHIOK2026`
Machine: `Prawn-E14`

## Scope

Gate the direct P19 recent-public-source measurement path before it can call public APIs, read protected inputs, or write measurement files.

No P19 measurement, public API probe, scoring, export, rescore, subset run, ingest, network build, input mutation, protected payload write, deployment, or locked-weight change was performed.

## Evidence Commands

```text
uv run pytest tests/test_analysis_scripts.py -q
uv run pytest -q --collect-only | Select-Object -Last 1
python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
git diff -- pipeline/config/weights.yaml checksums.json
git check-ignore -v qa/verification/P772-p19-measurement-gate.md; Write-Output "exit=$LASTEXITCODE"
git diff --stat
```

## Command Output

```text
uv run pytest tests/test_analysis_scripts.py -q
......................                                                   [100%]
22 passed in 16.39s

uv run pytest -q --collect-only | Select-Object -Last 1
617 tests collected in 21.86s

python scripts/check_repo_integrity.py; Write-Output "exit=$LASTEXITCODE"
repo_integrity=ok
exit=0

git diff -- pipeline/config/weights.yaml checksums.json; if ($LASTEXITCODE -eq 0) { Write-Output 'protected_diff_check=ok' } else { Write-Output "protected_diff_check_exit=$LASTEXITCODE" }
protected_diff_check=ok

git check-ignore -v qa/verification/P772-p19-measurement-gate.md; Write-Output "exit=$LASTEXITCODE"
exit=1

git diff --stat
warning: in the working copy of 'decisions.md', CRLF will be replaced by LF the next time Git touches it
 decisions.md                                     |   3 +
 scripts/analysis/p19_universe_gap_measurement.py |  78 +++++++++++--
 tests/test_analysis_scripts.py                   | 139 +++++++++++++++++++++--
 3 files changed, 202 insertions(+), 18 deletions(-)
```

## FINDINGS

1. `scripts/analysis/p19_universe_gap_measurement.py --measure` could previously call data.gov.sg, OneMap, and Overpass and write fixed `qa/p19` measurement files without a confirmation flag.
2. The default P19 status path was already read-only and remains the default; only the write/API-capable path needed the stricter gate.
3. The new guard rejects missing confirmation, missing explicit outputs, historical fixed outputs, and existing outputs before loading the postal universe or calling APIs.

## DISAGREEMENTS

1. None for this slice.
