param(
    [Parameter(Mandatory = $true)][string]$PostalUniverse,
    [Parameter(Mandatory = $true)][string]$RunRoot,
    [int]$Workers = 2,
    [int]$ChunkSize = 500
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$UniversePath = Resolve-Path (Join-Path $RepoRoot $PostalUniverse)
$NetworkPath = Resolve-Path (Join-Path $RepoRoot "processed\network_island.parquet")
$RunRootPath = Join-Path $RepoRoot $RunRoot
$PartitionDir = Join-Path $RunRootPath "partitions"
$LogDir = Join-Path $RunRootPath "logs"
$CombinedDir = Join-Path $RunRootPath "combined"
$CombinedChunksDir = Join-Path $CombinedDir "chunks"
$ExportDir = Join-Path $RunRootPath "exported_bundle"

if ($Workers -lt 1 -or $Workers -gt 8) { throw "Workers must be between 1 and 8." }
if (Test-Path $RunRootPath) { throw "Run directory already exists: $RunRootPath" }

New-Item -ItemType Directory -Force -Path $PartitionDir, $LogDir, $CombinedChunksDir | Out-Null

Push-Location $RepoRoot
try {
    $start = Get-Date
    $partitionScript = @'
from pathlib import Path
import sys
import pandas as pd

universe = Path(sys.argv[1])
out_dir = Path(sys.argv[2])
workers = int(sys.argv[3])
rows = pd.read_parquet(universe)
rows["postal_code"] = rows["postal_code"].astype(str).str.zfill(6)
rows = rows.sort_values("postal_code", kind="stable").reset_index(drop=True)
for index in range(workers):
    part = rows.iloc[index::workers].copy()
    part_path = out_dir / f"part{index + 1:02d}_of{workers:02d}.parquet"
    part.to_parquet(part_path, index=False)
    print(f"{part_path} rows={len(part)} ready={(part['status'] == 'READY_TO_SCORE').sum()}")
'@
    $partitionScriptPath = Join-Path $RunRootPath "partition_subset.py"
    [System.IO.File]::WriteAllText(
        $partitionScriptPath,
        $partitionScript.Replace([string][char]0xFEFF, ""),
        [System.Text.UTF8Encoding]::new($false)
    )
    uv run python $partitionScriptPath $UniversePath $PartitionDir $Workers
    if ($LASTEXITCODE -ne 0) { throw "partitioning failed" }

    $processes = @()
    for ($index = 1; $index -le $Workers; $index++) {
        $partName = "part{0:D2}_of{1:D2}.parquet" -f $index, $Workers
        $partPath = Join-Path $PartitionDir $partName
        $partOut = Join-Path $RunRootPath ("part{0:D2}_of{1:D2}" -f $index, $Workers)
        $stdout = Join-Path $LogDir ("part{0:D2}.out.log" -f $index)
        $stderr = Join-Path $LogDir ("part{0:D2}.err.log" -f $index)
        $args = @(
            "run", "python", "run.py", "score-batch",
            "--postal-universe", $partPath,
            "--network", $NetworkPath,
            "--output-dir", $partOut,
            "--limit", "999999",
            "--chunk-size", "$ChunkSize"
        )
        $processes += Start-Process -FilePath "uv" -ArgumentList $args -WorkingDirectory $RepoRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    }

    $peakBytes = 0L
    while ($true) {
        $alive = @($processes | Where-Object { -not $_.HasExited })
        $sampleBytes = 0L
        foreach ($proc in $alive) {
            try {
                $sampleBytes += (Get-Process -Id $proc.Id -ErrorAction Stop).WorkingSet64
                $children = Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $proc.Id }
                foreach ($child in $children) {
                    $sampleBytes += (Get-Process -Id $child.ProcessId -ErrorAction SilentlyContinue).WorkingSet64
                }
            }
            catch {
            }
        }
        $scoreProcesses = Get-CimInstance Win32_Process | Where-Object {
            ($_.Name -match '^(python|python.exe|uv|uv.exe)$') -and
            ($_.CommandLine -match 'score-batch|run.py')
        }
        foreach ($scoreProcess in $scoreProcesses) {
            $sampleBytes += (Get-Process -Id $scoreProcess.ProcessId -ErrorAction SilentlyContinue).WorkingSet64
        }
        if ($sampleBytes -gt $peakBytes) { $peakBytes = $sampleBytes }
        if (-not $alive) { break }
        Start-Sleep -Seconds 2
    }

    foreach ($process in $processes) { $process.WaitForExit() }
    $failed = @($processes | Where-Object { $_.ExitCode -ne 0 })
    if ($failed) {
        $recoverable = $true
        for ($index = 1; $index -le $Workers; $index++) {
            $partOut = Join-Path $RunRootPath ("part{0:D2}_of{1:D2}" -f $index, $Workers)
            $manifestPath = Join-Path $partOut "batch_manifest.json"
            $chunkDir = Join-Path $partOut "chunks"
            if (-not (Test-Path $manifestPath) -or -not (Test-Path $chunkDir)) {
                $recoverable = $false
                break
            }
            $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
            $chunkCount = @(Get-ChildItem $chunkDir -Filter "chunk_*.json").Count
            if (
                -not $manifest.ok -or
                [int]$manifest.records_written -ne [int]$manifest.selected_postals -or
                [int]$manifest.chunk_count -ne [int]$chunkCount
            ) {
                $recoverable = $false
                break
            }
        }
        if ($recoverable) {
            Write-Warning "One or more worker processes returned non-zero, but all batch manifests and chunks are complete; continuing to combine/export."
        }
        else {
            throw "One or more score-batch workers failed: $($failed.Id -join ', ')"
        }
    }

    for ($index = 1; $index -le $Workers; $index++) {
        $partOut = Join-Path $RunRootPath ("part{0:D2}_of{1:D2}" -f $index, $Workers)
        $chunkDir = Join-Path $partOut "chunks"
        Get-ChildItem $chunkDir -Filter "chunk_*.json" | Sort-Object Name | ForEach-Object {
            $targetName = "chunk_part{0:D2}_{1}" -f $index, $_.Name.Substring(6)
            Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $CombinedChunksDir $targetName)
        }
    }

    $manifestScript = @'
from pathlib import Path
import json
import sys

combined = Path(sys.argv[1])
run_root = combined.parent
chunks = sorted((combined / "chunks").glob("chunk_*.json"))
records = 0
states = {}
for path in chunks:
    payload = json.loads(path.read_text(encoding="utf-8"))
    records += len(payload)
    for item in payload:
        state = str(item.get("state"))
        states[state] = states.get(state, 0) + 1
manifest = {"ok": True, "chunk_count": len(chunks), "records": records, "state_counts": dict(sorted(states.items()))}
for part_manifest_path in sorted(run_root.glob("part*_of*/batch_manifest.json")):
    part_manifest = json.loads(part_manifest_path.read_text(encoding="utf-8"))
    for key in ("scoring_fingerprints_by_digest", "scoring_inputs_by_digest", "networks_by_digest"):
        if isinstance(part_manifest.get(key), dict):
            manifest.setdefault(key, {}).update(part_manifest[key])
    if "scoring_provenance_at_start" not in manifest and isinstance(part_manifest.get("scoring_provenance_at_start"), dict):
        manifest["scoring_provenance_at_start"] = part_manifest["scoring_provenance_at_start"]
for name in ("combined_manifest.json", "batch_manifest.json"):
    (combined / name).write_text(
        json.dumps(manifest, indent=2, sort_keys=True),
        encoding="utf-8",
    )
print(json.dumps({"chunk_count": len(chunks), "records": records, "state_counts": dict(sorted(states.items()))}, indent=2, sort_keys=True))
'@
    $manifestScriptPath = Join-Path $RunRootPath "combined_manifest.py"
    [System.IO.File]::WriteAllText(
        $manifestScriptPath,
        $manifestScript.Replace([string][char]0xFEFF, ""),
        [System.Text.UTF8Encoding]::new($false)
    )
    uv run python $manifestScriptPath $CombinedDir
    if ($LASTEXITCODE -ne 0) { throw "combined manifest failed" }

    uv run python run.py export --records-dir $CombinedDir --output $ExportDir --full-batch --confirm-full-batch --postal-universe $UniversePath --network $NetworkPath
    if ($LASTEXITCODE -ne 0) { throw "export failed" }

    uv run python run.py validate --input $ExportDir
    if ($LASTEXITCODE -ne 0) { throw "validate failed" }

    $end = Get-Date
    $elapsed = ($end - $start).TotalSeconds
    Write-Output ("run_root={0}" -f $RunRootPath)
    Write-Output ("workers={0}" -f $Workers)
    Write-Output ("elapsed_sec={0:N3}" -f $elapsed)
    Write-Output ("peak_rss_bytes={0}" -f $peakBytes)
    Write-Output ("peak_rss_gib={0:N3}" -f ($peakBytes / 1GB))
    Write-Output ("export_dir={0}" -f $ExportDir)
}
finally {
    Pop-Location
}
