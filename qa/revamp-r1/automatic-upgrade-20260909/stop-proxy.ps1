$ErrorActionPreference = 'Stop'
$root = 'C:\sgSHIOK2026'
if ((Get-Location).Path -ne $root) { throw 'Wrong working root' }
$directory = Join-Path $root 'qa\revamp-r1\automatic-upgrade-20260909'
$receipt = Join-Path $directory 'proxy-retired.json'
if (Test-Path -LiteralPath $receipt) { throw 'Preserve previous retirement receipt' }
$launch = Get-Content -Raw -LiteralPath (Join-Path $directory 'proxy.json') | ConvertFrom-Json
$current = Invoke-RestMethod -Uri 'http://127.0.0.1:4330/__qa/status' -TimeoutSec 10
if ($current.pid -ne $launch.current.pid) { throw 'Unexpected proxy identity' }
$owned = Get-CimInstance Win32_Process -Filter "ProcessId=$($current.pid)"
if (-not $owned -or $owned.CommandLine -notlike '*C:/sgSHIOK2026/qa/revamp-r1/automatic-upgrade-20260909/serve.mjs*') { throw 'Proxy command-line identity mismatch' }
Stop-Process -Id $owned.ProcessId -Force
$remaining = Get-Process -Id $owned.ProcessId -ErrorAction SilentlyContinue
$preview = Invoke-RestMethod -Uri 'http://127.0.0.1:4328/__qa/status' -TimeoutSec 10
if ($preview.pid -ne 104608 -or $preview.nextPid -ne 83636) { throw 'User preview identity changed' }
$result = @{ root=$root; at=[DateTime]::UtcNow.ToString('o'); retired=@($owned | Select-Object ProcessId,CommandLine); remaining=@($remaining | Select-Object Id); serverAfter=$current; userPreview=$preview }
$json = $result | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($receipt, $json + "`n", [System.Text.UTF8Encoding]::new($false))
@{retiredPid=$owned.ProcessId; remaining=@($remaining).Count; preview='http://127.0.0.1:4328/'; previewPid=$preview.pid; nextPid=$preview.nextPid} | ConvertTo-Json
