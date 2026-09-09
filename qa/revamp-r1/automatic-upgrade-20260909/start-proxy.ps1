$ErrorActionPreference = 'Stop'
$root = 'C:\sgSHIOK2026'
if ((Get-Location).Path -ne $root) { throw 'Wrong working root' }
$directory = Join-Path $root 'qa\revamp-r1\automatic-upgrade-20260909'
$receipt = Join-Path $directory 'proxy.json'
$stdout = Join-Path $directory 'proxy.stdout.log'
$stderr = Join-Path $directory 'proxy.stderr.log'
foreach ($path in @($receipt, $stdout, $stderr)) {
  if (Test-Path -LiteralPath $path) { throw "Preserve previous output: $path" }
}
$child = Start-Process -FilePath (Get-Command node).Source -ArgumentList @('C:/sgSHIOK2026/qa/revamp-r1/automatic-upgrade-20260909/serve.mjs') -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
$until = [DateTime]::UtcNow.AddSeconds(45)
$current = $null
do {
  $child.Refresh()
  if ($child.HasExited) { throw "Owned proxy $($child.Id) exited; inspect logs without restarting" }
  try { $current = Invoke-RestMethod -Uri 'http://127.0.0.1:4330/__qa/status' -TimeoutSec 3 } catch { $current = $null }
  if ($current) {
    if ($current.pid -ne $child.Id -or $current.active -ne 'A') { throw 'Unexpected proxy identity; no existing process was stopped' }
    break
  }
  Start-Sleep -Milliseconds 500
} while ([DateTime]::UtcNow -lt $until)
if (-not $current) { throw "Owned proxy $($child.Id) did not become ready; inspect without restarting" }
$result = @{ root=$root; hostname=$env:COMPUTERNAME; current=$current; stdout=$stdout; stderr=$stderr; at=[DateTime]::UtcNow.ToString('o'); existingPreviewsUntouched=$true }
$json = $result | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($receipt, $json + "`n", [System.Text.UTF8Encoding]::new($false))
$json
