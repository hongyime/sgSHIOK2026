$ErrorActionPreference='Stop'
if((Get-Location).Path -ne 'C:\sgSHIOK2026'){throw 'Wrong working root'}
$base='C:\sgSHIOK2026\qa\revamp-r1\release-finalize-20260915'
$record=Get-Content -LiteralPath "$base\preview-Xdr3S7\preview.json" -Raw | ConvertFrom-Json
$node=Get-CimInstance Win32_Process -Filter "ProcessId=$($record.pid)"
$next=Get-CimInstance Win32_Process -Filter "ProcessId=$($record.nextPid)"
if ($node -and ($node.ExecutablePath -ne 'C:\Program Files\nodejs\node.exe' -or $node.CommandLine -notlike '*release-finalize-20260915\preview.mjs*frontend-brzm8xg4\build.json*')) {throw 'Preview identity changed'}
if ($next -and ($next.ParentProcessId -ne $record.pid -or $next.CommandLine -notlike '*frontend-release-20260915-0c6bzc1x*24317*')) {throw 'Next identity changed'}
$stopped=@()
foreach($process in @($next,$node)){
  if(-not $process){continue}
  $live=Get-Process -Id $process.ProcessId -ErrorAction SilentlyContinue
  if(-not $live){continue}
  $fresh=Get-CimInstance Win32_Process -Filter "ProcessId=$($process.ProcessId)"
  if(-not $fresh){continue}
  if($fresh.CreationDate.ToUniversalTime() -ne $process.CreationDate.ToUniversalTime() -or $fresh.CommandLine -cne $process.CommandLine){throw 'PID reused'}
  Stop-Process -InputObject $live -Force
  if(-not $live.WaitForExit(15000)){throw 'Owned process exit timeout'}
  $stopped+=$process.ProcessId
}
$result=@{stopped=$stopped;verified=$true;scope='Only exact preview and Next child from preview-Xdr3S7, not shared services'}
$out="$base\preview-Xdr3S7\parent-cleanup.json"
if(Test-Path -LiteralPath $out){throw 'Receipt exists'}
$text=$result|ConvertTo-Json
[IO.File]::WriteAllText($out,$text+"`n")
Write-Output $text
