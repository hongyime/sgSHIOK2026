$ErrorActionPreference = 'Stop'
$root = 'C:\sgSHIOK2026'
if ((Get-Location).Path -ne $root) { throw 'Wrong working root' }
$directory = Join-Path $root 'qa\revamp-r1\automatic-upgrade-20260909'
$path = Join-Path $directory 'proxy-retirement-confirmed.json'
if (Test-Path -LiteralPath $path) { throw 'Preserve previous receipt' }
$prior = Get-Content -Raw -LiteralPath (Join-Path $directory 'proxy-retired.json') | ConvertFrom-Json
$ownedId = $prior.retired[0].ProcessId
$remaining = @(Get-Process -Id $ownedId -ErrorAction SilentlyContinue | Where-Object { -not $_.HasExited })
$responding = $false
try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:4330/__qa/status' -TimeoutSec 3 -UseBasicParsing; $responding = $true } catch { $probeError = $_.Exception.Message }
$result = @{ root=$root; retiredPid=$ownedId; at=[DateTime]::UtcNow.ToString('o'); remaining=@($remaining | Select-Object Id,ProcessName); proxyResponding=$responding; probeError=$probeError; previousImmediateCount=$prior.remaining.Count; ok=($remaining.Count -eq 0 -and -not $responding) }
$json = $result | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($path, $json + "`n", [System.Text.UTF8Encoding]::new($false))
$json
if (-not $result.ok) { exit 1 }
