$ErrorActionPreference = 'Stop'
if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { throw 'Wrong working root' }
$root = 'C:\sgSHIOK2026'
$receipt = "$root\qa\revamp-r1\completion-20260913\preview-retirement.json"
if (Test-Path -LiteralPath $receipt) { throw 'Preserve prior receipt' }
$identityPath = "$root\qa\revamp-r1\completion-20260913\preview-1.json"
$old = Get-Content -LiteralPath $identityPath -Raw | ConvertFrom-Json
$new = Invoke-RestMethod -Uri 'http://127.0.0.1:4412/__qa/status' -TimeoutSec 5
if ($new.buildId -ne 'T2PK7uLhsuXtK2oAxtakU' -or $new.dataPort -eq $old.dataPort) { throw 'Replacement identity/dependency mismatch' }
$liveOld = Invoke-RestMethod -Uri 'http://127.0.0.1:4410/__qa/status' -TimeoutSec 5
if ($liveOld.pid -ne $old.pid -or $liveOld.nextPid -ne $old.nextPid -or $liveOld.buildId -ne $old.buildId) { throw 'Old live identity mismatch' }
$expected = @(
  @{ Id = [int]$old.nextPid; Fragment = 'C:\sgSHIOK2026\tmp\completion-20260913-build-1\web' },
  @{ Id = [int]$old.pid; Fragment = 'C:\sgSHIOK2026\qa\revamp-r1\completion-20260913\preview.mjs' }
)
$before = @()
foreach ($item in $expected) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($item.Id)"
  if (-not $process -or -not $process.CommandLine.Contains($item.Fragment)) { throw 'Owned command mismatch' }
  $age = ((Get-Item -LiteralPath $identityPath).CreationTimeUtc - $process.CreationDate.ToUniversalTime()).TotalSeconds
  if ($age -lt -2 -or $age -gt 60) { throw 'Process creation does not match original identity receipt' }
  $before += $process | Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine
}
foreach ($item in $expected) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($item.Id)"
  if ($process) {
    if (-not $process.CommandLine.Contains($item.Fragment)) { throw 'PID changed before stop' }
    Stop-Process -Id $item.Id -Force
  }
}
$remaining = @(Get-CimInstance Win32_Process -Filter "ProcessId=$($old.pid) OR ProcessId=$($old.nextPid)")
$verifiedNew = Invoke-RestMethod -Uri 'http://127.0.0.1:4412/__qa/status' -TimeoutSec 5
$report = @{ before=$before; remaining=$remaining.Count; current=$verifiedNew; filesDeleted=0; oldBuild=$old.buildId; completedAt=[DateTime]::UtcNow.ToString('o') }
$json = $report | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($receipt, $json + "`n")
Write-Output $json
if ($remaining.Count -ne 0 -or $verifiedNew.buildId -ne $new.buildId) { throw 'Retirement not verified' }
