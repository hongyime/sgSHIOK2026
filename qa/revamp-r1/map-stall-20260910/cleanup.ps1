param([Parameter(Mandatory=$true)][string]$Profile)
$ErrorActionPreference = 'Stop'
if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { throw 'Working root guard' }
if ($Profile -notmatch '^C:\\sgSHIOK2026\\tmp\\map-stall-browser-[a-zA-Z0-9]+$') { throw 'Not an owned profile' }
function Get-OwnedBrowser {
    @(Get-CimInstance -Query "SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name='chrome.exe'" -OperationTimeoutSec 20 |
        Where-Object { $_.CommandLine -and $_.CommandLine.Contains($Profile) })
}
$before = @(Get-OwnedBrowser)
foreach ($item in $before) {
    $live = Get-Process -Id $item.ProcessId -ErrorAction SilentlyContinue
    if ($live -and -not $live.HasExited) { Stop-Process -Id $item.ProcessId -Force }
}
$remaining = @(Get-OwnedBrowser)
@{ profile = $Profile; before = @($before | Select-Object ProcessId, CommandLine); remaining = @($remaining | Select-Object ProcessId, CommandLine); verified = ($remaining.Count -eq 0) } | ConvertTo-Json -Depth 4 -Compress
if ($remaining.Count -ne 0) { exit 1 }
