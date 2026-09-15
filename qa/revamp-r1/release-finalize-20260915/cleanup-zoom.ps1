$ErrorActionPreference='Stop'
if ((Get-Location).Path -ne 'C:\sgSHIOK2026') { throw 'Wrong working root' }
$base='C:\sgSHIOK2026\qa\revamp-r1\same-document-zoom-20260915'
$out="$base\observed-KpEl8F"
$profile="$out\profile"
$child=Get-Content -LiteralPath "$out\owned-child.json" -Raw | ConvertFrom-Json
if ($child.profile -cne $profile -or $child.pid -ne 48204) { throw 'Unexpected browser' }
$path="$out\owned-before-close.json"
if (-not (Test-Path -LiteralPath $path)) { throw 'Original snapshot missing' }
$before=Get-Content -LiteralPath $path -Raw
$result=& "$base\processes.ps1" -Profile $profile -BrowserPid $child.pid -Phase cleanup -Receipt $path
$exit=$LASTEXITCODE
$record=[ordered]@{ scope='Direct current-shell recovery after child-shell cleanup timeout'; before=($before|ConvertFrom-Json); result=($result|ConvertFrom-Json); exit=$exit }
$receipt='C:\sgSHIOK2026\qa\revamp-r1\release-finalize-20260915\zoom-cleanup.json'
if (Test-Path -LiteralPath $receipt) { throw 'Recovery receipt already exists' }
$text=$record | ConvertTo-Json -Depth 10
[IO.File]::WriteAllText($receipt,$text+"`n")
Write-Output $text
if ($exit -ne 0) { throw 'Cleanup failed' }
