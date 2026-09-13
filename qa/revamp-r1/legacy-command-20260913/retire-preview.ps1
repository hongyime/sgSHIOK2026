$ErrorActionPreference='Stop'
if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { throw 'Wrong root' }
$output='C:\sgSHIOK2026\qa\revamp-r1\legacy-command-20260913\preview-retirement.json'
if (Test-Path -LiteralPath $output) { throw 'Receipt already exists; do not repeat' }
$before=Invoke-RestMethod -Uri 'http://127.0.0.1:4420/__qa/status' -TimeoutSec 5
if ($before.buildId -ne 'l7V5uOArXwdDrUIe3Wc2s') { throw 'Current preview identity mismatch' }
$expected=@(
  @{Id=32160;Parent=22016;Text='C:\sgSHIOK2026\tmp\selection-recovery-20260913-build-1\web -p 4417 -H 127.0.0.1'},
  @{Id=22016;Parent=31376;Text='C:\sgSHIOK2026\qa\revamp-r1\selection-recovery-20260913\preview.mjs'}
)
$identified=@()
foreach($entry in $expected) {
  $p=Get-CimInstance Win32_Process -Filter "ProcessId=$($entry.Id)"
  if (-not $p -or $p.Name -ne 'node.exe' -or $p.ParentProcessId -ne $entry.Parent -or -not $p.CommandLine.EndsWith($entry.Text)) { throw "Owned preview identity failed: $($entry.Id)" }
  $identified+=@{Id=$p.ProcessId;Parent=$p.ParentProcessId;CommandLine=$p.CommandLine;CreationDate=$p.CreationDate}
}
$result=@{startedAt=[DateTime]::UtcNow.ToString('o');before=$before;identified=$identified;remaining=@();protectedIds=@(37188,5816,33360,35540);filesDeleted=0}
try {
  foreach($entry in $identified) {
    $live=Get-CimInstance Win32_Process -Filter "ProcessId=$($entry.Id)"
    if (-not $live -or $live.CreationDate -ne $entry.CreationDate -or $live.CommandLine -ne $entry.CommandLine) { throw "Identity changed before stop: $($entry.Id)" }
    Stop-Process -Id $entry.Id -Force
    Wait-Process -Id $entry.Id -Timeout 5 -ErrorAction SilentlyContinue
  }
  $result.remaining=@(Get-CimInstance Win32_Process -Filter 'ProcessId=22016 OR ProcessId=32160' | Select-Object ProcessId,CommandLine)
  if ($result.remaining.Count -ne 0) { throw 'Superseded preview still running' }
  $result.after=Invoke-RestMethod -Uri 'http://127.0.0.1:4420/__qa/status' -TimeoutSec 5
  if ($result.after.buildId -ne $before.buildId) { throw 'Current preview changed' }
  $result.ok=$true
} catch { $result.ok=$false;$result.error=$_.Exception.Message;throw }
finally {
  $result.finishedAt=[DateTime]::UtcNow.ToString('o')
  $bytes=[Text.Encoding]::UTF8.GetBytes(($result | ConvertTo-Json -Depth 8)+"`n")
  $file=[IO.File]::Open($output,[IO.FileMode]::CreateNew)
  try { $file.Write($bytes,0,$bytes.Length) } finally { $file.Dispose() }
  $result | ConvertTo-Json -Depth 8
}
