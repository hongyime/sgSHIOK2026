$ErrorActionPreference = 'Stop'
$root = 'C:\sgSHIOK2026'
if ((Get-Location).Path -ne $root) { throw 'Wrong working root' }
$out = Join-Path $root 'qa\revamp-r1\cross-feature-20260909\preview-2.json'
if (Test-Path -LiteralPath $out) { throw 'Receipt already exists' }
$old = Invoke-RestMethod 'http://127.0.0.1:4328/__qa/status'
if ($old.build -ne 'Jlm6s3tx2ilhY-4awMRJN') { throw 'Unexpected preview; do not retire it' }
$proxy = Get-CimInstance Win32_Process -Filter "ProcessId=$($old.pid)"
$next = Get-CimInstance Win32_Process -Filter "ProcessId=$($old.nextPid)"
if ($proxy.Name -ne 'node.exe' -or -not $proxy.CommandLine.Contains('comparison-sharing-20260909/serve.mjs') -or -not $proxy.CommandLine.Contains('comparison-sharing-20260909-2')) { throw 'Proxy ownership mismatch' }
if ($next.Name -ne 'node.exe' -or -not $next.CommandLine.Contains('cached-release-comparison-sharing-20260909-2') -or -not $next.CommandLine.Contains('4327')) { throw 'Next ownership mismatch' }
$retired = @($proxy, $next) | Select-Object ProcessId, Name, CommandLine
Stop-Process -Id $next.ProcessId -Force
Stop-Process -Id $proxy.ProcessId -Force
$process = Start-Process -FilePath (Get-Command node).Source -ArgumentList @('C:/sgSHIOK2026/qa/revamp-r1/comparison-sharing-20260909/serve.mjs', 'cross-feature-20260909-2') -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $root 'qa\revamp-r1\cross-feature-20260909\serve-2.stdout.log') -RedirectStandardError (Join-Path $root 'qa\revamp-r1\cross-feature-20260909\serve-2.stderr.log')
$expected = (Get-Content -Raw -LiteralPath (Join-Path $root 'tmp\cached-release-cross-feature-20260909-2\web\.next\BUILD_ID')).Trim()
$until = [DateTime]::UtcNow.AddSeconds(90)
$current = $null
while ([DateTime]::UtcNow -lt $until) {
  try {
    $value = Invoke-RestMethod 'http://127.0.0.1:4328/__qa/status'
    if ($value.build -eq $expected -and $value.pid -eq $process.Id) { $current = $value; break }
  } catch { Start-Sleep -Milliseconds 500 }
}
if (-not $current) { throw 'New preview did not identify expected build within 90s' }
$receipt = [ordered]@{
  root = $root
  at = [DateTime]::UtcNow.ToString('o')
  retired = $retired
  build = $current.build
  snapshot = $current.snapshot
  pid = $current.pid
  nextPid = $current.nextPid
  preview = 'http://127.0.0.1:4328/'
  dataServerUntouched = 'localhost:4321'
}
$json = $receipt | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($out, $json + "`n", [System.Text.UTF8Encoding]::new($false))
$json
