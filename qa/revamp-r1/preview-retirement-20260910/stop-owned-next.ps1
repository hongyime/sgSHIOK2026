$ErrorActionPreference = 'Stop'
if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { throw 'Wrong working root' }
$expected = '"C:\Program Files\nodejs\node.exe" C:\sgSHIOK2026\web\node_modules\next\dist\bin\next start C:\sgSHIOK2026\tmp\cached-release-cross-feature-motion-20260910-2\web --hostname 127.0.0.1 --port 4353'
$p = Get-CimInstance -Query 'SELECT ProcessId, Name, CommandLine, CreationDate FROM Win32_Process WHERE ProcessId=93692' -OperationTimeoutSec 20
if (-not $p) { throw 'Expected obsolete Next process missing; inspect rather than retarget' }
if ($p.Name -ne 'node.exe' -or $p.CommandLine -cne $expected) { throw 'Unexpected process identity' }
$expectedTime = [DateTimeOffset]::Parse('2026-09-10T15:59:31.493328+08:00').UtcDateTime
if ($p.CreationDate.ToUniversalTime().Ticks -ne $expectedTime.Ticks) { throw 'PID creation time differs' }
$live = Get-Process -Id 93692 -ErrorAction Stop
$before = @{ pid=$p.ProcessId; commandLine=$p.CommandLine; creationDate=$p.CreationDate; workingSetBytes=$live.WorkingSet64; privateBytes=$live.PrivateMemorySize64 }
Stop-Process -InputObject $live -Force
$waited = $live.WaitForExit(30000)
$remaining = Get-Process -Id 93692 -ErrorAction SilentlyContinue
$gone = -not $remaining -or $remaining.HasExited
@{before=$before; waited=$waited; gone=$gone} | ConvertTo-Json -Depth 4 -Compress
if (-not $gone) { exit 1 }
