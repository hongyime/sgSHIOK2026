$ErrorActionPreference = 'Stop'
if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { throw 'Working root guard' }
$profile = 'C:\sgSHIOK2026\tmp\layout-confirmation-browser-yRZiLJ'
function Get-OwnedBrowser {
    @(Get-CimInstance -Query "SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name='chrome.exe'" -OperationTimeoutSec 20 |
        Where-Object { $_.CommandLine -and $_.CommandLine.Contains($profile) })
}
$before = @(Get-OwnedBrowser)
foreach ($item in $before) {
    $process = Get-Process -Id $item.ProcessId -ErrorAction SilentlyContinue
    if ($process -and -not $process.HasExited) { Stop-Process -Id $item.ProcessId -Force }
}
$remaining = @(Get-OwnedBrowser)
@{ profile = $profile; before = @($before | Select-Object ProcessId, CommandLine); remaining = @($remaining | Select-Object ProcessId, CommandLine); verified = ($remaining.Count -eq 0) } | ConvertTo-Json -Depth 4
if ($remaining.Count -ne 0) { exit 1 }
