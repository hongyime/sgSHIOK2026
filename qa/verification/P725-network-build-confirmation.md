# P725 network build confirmation guard

## startup root

Command:

```powershell
$ErrorActionPreference='Stop'; if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { Set-Location 'C:\sgSHIOK2026' }; $root=(Get-Location).Path; $hostName=$env:COMPUTERNAME; if ($root -ne 'C:\sgSHIOK2026') { throw "Wrong root: $root" }; Write-Output "ROOT=$root"; Write-Output "HOST=$hostName"
```

Output:

```text
ROOT=C:\sgSHIOK2026
HOST=PRAWN-E14
```

## head and remote before change

Command:

```powershell
git rev-parse HEAD
git ls-remote origin main
```

Output:

```text
fa3c0d1686f5a3c8746742ac95f196e21cf68b3d
fa3c0d1686f5a3c8746742ac95f196e21cf68b3d	refs/heads/main
```

## evidence path ignore check

Command:

```powershell
git check-ignore -v qa/verification/P725-network-build-confirmation.md; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
exit_code=1
```

## inspected network write surface

Command:

```powershell
rg -n "confirm|output|resume|processed|parquet|to_parquet|to_file|mkdir|DEFAULT_|def main|argparse" C:\sgSHIOK2026\pipeline\network.py C:\sgSHIOK2026\scripts\run_network_build.py C:\sgSHIOK2026\pipeline\score_batch.py C:\sgSHIOK2026\tests\test_run.py C:\sgSHIOK2026\tests\test_score_batch.py
```

Relevant output:

```text
C:\sgSHIOK2026\pipeline\network.py:10:def main() -> int:
C:\sgSHIOK2026\scripts\run_network_build.py:38:PROCESSED_DIR = PROJECT_ROOT / "processed"
C:\sgSHIOK2026\scripts\run_network_build.py:40:QA_DIR.mkdir(exist_ok=True, parents=True)
C:\sgSHIOK2026\scripts\run_network_build.py:41:PROCESSED_DIR.mkdir(exist_ok=True, parents=True)
C:\sgSHIOK2026\scripts\run_network_build.py:1489:    QA_DIR.mkdir(exist_ok=True)
C:\sgSHIOK2026\scripts\run_network_build.py:1495:        "network.parquet" if scope == "pilot" else "network_island.parquet"
C:\sgSHIOK2026\scripts\run_network_build.py:2599:    debug_export.to_file(debug_path, driver="GeoJSON")
C:\sgSHIOK2026\scripts\run_network_build.py:2605:    edges_export.to_parquet(network_path)
C:\sgSHIOK2026\pipeline\score_batch.py:543:        "--confirm-full-batch",
```

## direct refusal proof

Command:

```powershell
uv run python run.py network; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
usage: network.py [-h] [--area {pilot,island}] [--confirm-network-build]
network.py: error: network build writes processed network artifacts and QA outputs; pass --confirm-network-build only after owner approval
exit_code=2
```

Command:

```powershell
uv run python -m pipeline.network; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
usage: network.py [-h] [--area {pilot,island}] [--confirm-network-build]
network.py: error: network build writes processed network artifacts and QA outputs; pass --confirm-network-build only after owner approval
exit_code=2
```

## tests and checks

Command:

```powershell
uv run pytest tests/test_network_cli.py tests/test_run.py -q
```

Output:

```text
.......................                                                  [100%]
23 passed in 10.81s
```

Command:

```powershell
uv run pytest -q --collect-only | Select-Object -Last 1
```

Output:

```text
513 tests collected in 27.85s
```

Command:

```powershell
python scripts/check_repo_integrity.py; Write-Output "exit_code=$LASTEXITCODE"
```

Output:

```text
repo_integrity=ok
exit_code=0
```

Command:

```powershell
git diff --check
```

Output:

```text
```

Command:

```powershell
git diff --numstat -- pipeline/config/weights.yaml web/public/data checksums.json qa/p6_rerun_cost_20260812_102712 qa/p7_determinism_20260813 qa/p8_provenance_repair_20260813 qa/p9_input_provenance_20260813 qa/p10_network_provenance_20260813 qa/p11/d_calibration_w2_0050 qa/p11/d_full_w2_1200 qa/p11/d_pilot_w2_0200_final qa/p11/d_pilot_w2_0200_retry3 qa/p11/d_pilot_w2_0200_retry4 qa/releases
```

Output:

```text
```

## diff stat

Command:

```powershell
git diff --stat
```

Output before adding untracked evidence/test file:

```text
 pipeline/network.py | 21 +++++++++++++++--
 run.py              |  3 ++-
 tests/test_run.py   | 66 +++++++++++++++++++++++++++++++++++++++++++++++++++++
 3 files changed, 87 insertions(+), 3 deletions(-)
```

## findings

1. `pipeline.network` previously ran `scripts.run_network_build.run_build()` with default `--area pilot` and no confirmation flag, and `run.py network` forwarded directly to that path.
2. `scripts.run_network_build.run_build()` writes QA outputs and processed network parquet files, so unconfirmed `run.py network` was inconsistent with the standing no-network-build-without-approval rule.
3. `pipeline.network` and `run.py network` now require `--confirm-network-build`; unconfirmed invocations exit 2 before `run_build()`.
4. Test collection moved from 509 to 513 because this phase adds four network confirmation-guard tests.

## disagreements

1. None.
