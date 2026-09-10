param([Parameter(Mandatory=$true)][string]$Profile)
$ErrorActionPreference = 'Stop'
if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { throw 'Working root guard' }
if ($Profile -notmatch '^C:\\sgSHIOK2026\\tmp\\map-stall-browser-[a-zA-Z0-9]+$') { throw 'Not an owned profile' }
$before = @(Get-CimInstance -Query "SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name='chrome.exe'" -OperationTimeoutSec 20 |
    Where-Object { $_.CommandLine -and $_.CommandLine.Contains($Profile) })
$stopped = @()
foreach ($item in $before) {
    $live = Get-Process -Id $item.ProcessId -ErrorAction SilentlyContinue
    if ($live -and -not $live.HasExited) {
        Stop-Process -InputObject $live -Force
        $stopped += $live
    }
}
$deadline = [DateTime]::UtcNow.AddSeconds(30)
foreach ($live in $stopped) {
    $remainingMs = [Math]::Max(1, ($deadline - [DateTime]::UtcNow).TotalMilliseconds)
    $null = $live.WaitForExit([int]$remainingMs)
}
$remaining = @($before | Where-Object {
    $live = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue
    $live -and -not $live.HasExited
})
@{ profile = $Profile; before = @($before | Select-Object ProcessId, CommandLine); remaining = @($remaining | Select-Object ProcessId, CommandLine); verified = ($remaining.Count -eq 0) } | ConvertTo-Json -Depth 4 -Compress
if ($remaining.Count -ne 0) { exit 1 }
