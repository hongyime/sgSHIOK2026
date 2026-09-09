$ErrorActionPreference = 'Stop'
$root = 'C:\sgSHIOK2026'
if ((Get-Location).Path -ne $root) { throw 'Wrong working root' }
$directory = Join-Path $root 'qa\revamp-r1\map-download-recovery-20260909'
$receipt = Join-Path $directory 'preview.json'
$stdout = Join-Path $directory 'preview.stdout.log'
$stderr = Join-Path $directory 'preview.stderr.log'
foreach ($path in @($receipt, $stdout, $stderr)) {
  if (Test-Path -LiteralPath $path) { throw "Preserve previous output: $path" }
}
$name = 'map-download-20260909-1'
$build = (Get-Content -Raw -LiteralPath (Join-Path $root "tmp\cached-release-$name\web\.next\BUILD_ID")).Trim()
$old = Invoke-RestMethod -Uri 'http://127.0.0.1:4328/__qa/status' -TimeoutSec 10
if ($old.build -ne 'SVecGwN37beSg--Bqaksv' -or $old.pid -ne 100888 -or $old.nextPid -ne 104764) { throw 'Unexpected previous preview ownership' }
$processes = @(Get-CimInstance Win32_Process -Filter 'ProcessId=100888 OR ProcessId=104764')
if ($processes.Count -ne 2) { throw 'Expected both owned preview processes' }
foreach ($process in $processes) {
  if ($process.ProcessId -eq 100888 -and $process.CommandLine -notlike '*C:/sgSHIOK2026/qa/revamp-r1/comparison-sharing-20260909/serve.mjs cross-feature-20260909-2*') { throw 'Proxy identity mismatch' }
  if ($process.ProcessId -eq 104764 -and $process.CommandLine -notlike '*C:\sgSHIOK2026\tmp\cached-release-cross-feature-20260909-2\web -p 4327 -H 127.0.0.1*') { throw 'Next identity mismatch' }
}
$retired = @($processes | Select-Object ProcessId, ParentProcessId, CommandLine)
foreach ($process in $processes) { Stop-Process -Id $process.ProcessId -Force }
$child = Start-Process -FilePath (Get-Command node).Source -ArgumentList @('C:/sgSHIOK2026/qa/revamp-r1/comparison-sharing-20260909/serve.mjs', $name) -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
$until = [DateTime]::UtcNow.AddSeconds(90)
$current = $null
do {
  $child.Refresh()
  if ($child.HasExited) { throw 'New owned preview exited during startup' }
  try {
    $current = Invoke-RestMethod -Uri 'http://127.0.0.1:4328/__qa/status' -TimeoutSec 3
    if ($current.build -ne $build -or $current.pid -ne $child.Id) { throw 'Unexpected preview identity' }
    $page = Invoke-WebRequest -Uri 'http://127.0.0.1:4328/' -TimeoutSec 8 -UseBasicParsing
    if ($page.StatusCode -eq 200) { break }
  } catch { $current = $null }
  Start-Sleep -Milliseconds 500
} while ([DateTime]::UtcNow -lt $until)
if (-not $current) { throw "Owned preview $($child.Id) did not become ready; inspect this process, do not restart blindly" }
$result = @{ root=$root; hostname=$env:COMPUTERNAME; retired=$retired; current=$current; dataServerPort=4321; dataServerUntouched=$true; stdout=$stdout; stderr=$stderr; pageStatus=$page.StatusCode; at=[DateTime]::UtcNow.ToString('o') }
$json = $result | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($receipt, $json + "`n", [System.Text.UTF8Encoding]::new($false))
$json
