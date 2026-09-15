param([int]$BrowserPid,[string]$Profile,[ValidateSet('discover','snapshot','cleanup')][string]$Phase='snapshot',[string]$Receipt)
$ErrorActionPreference='Stop'
if((Get-Location).Path -ne 'C:\sgSHIOK2026'){throw 'Wrong working root'}
$base='C:\sgSHIOK2026\qa\revamp-r1\same-document-zoom-20260915'
$env:TEMP=$base
$env:TMP=$base
if($Profile -cnotmatch ('^'+[regex]::Escape($base)+'\\observed-[A-Za-z0-9]{6}\\profile$')){throw 'Unowned profile'}
$profilePattern='(?:^|\s)"?--user-data-dir='+[regex]::Escape($Profile)+'(?:"?(?:\s|$))'
if($Phase -eq 'discover'){
  $roots=@(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -cmatch $profilePattern -and $_.CommandLine -notmatch '(?:^|\s)--type=' })
  if($roots.Count -gt 1){throw 'Multiple browser roots; refusing discovery'}
  @{pids=@($roots | ForEach-Object {[int]$_.ProcessId})} | ConvertTo-Json -Depth 3 -Compress
  exit 0
}
if($BrowserPid -le 0){throw 'No owned browser PID'}
function Creation($p){$p.CreationDate.ToUniversalTime().ToString('o')}
function Inventory {
  $all=@(Get-CimInstance Win32_Process -Filter "Name='chrome.exe'")
  $root=@($all | Where-Object { $_.ProcessId -eq $BrowserPid })
  if($root.Count -and ($root[0].CommandLine -cnotmatch $profilePattern)){throw 'PID reused or browser identity changed'}
  $owned=@($all | Where-Object { $_.CommandLine -cmatch $profilePattern })
  $ids=[System.Collections.Generic.HashSet[uint32]]::new()
  foreach($p in $owned){[void]$ids.Add([uint32]$p.ProcessId)}
  for($depth=0;$depth -lt 12;$depth++){
    $added=$false
    foreach($p in $all){if($ids.Contains([uint32]$p.ParentProcessId)-and -not $ids.Contains([uint32]$p.ProcessId)){[void]$ids.Add([uint32]$p.ProcessId);$owned+=$p;$added=$true}}
    if(-not $added){break}
  }
  @($owned | ForEach-Object { @{pid=[int]$_.ProcessId;parent=[int]$_.ParentProcessId;created=Creation $_;executable=$_.ExecutablePath;profile=$Profile} })
}
if($Phase -eq 'snapshot'){@{owned=@(Inventory)} | ConvertTo-Json -Depth 5 -Compress;exit 0}
if($Receipt -cne (Split-Path -Parent $Profile)+'\owned-before-close.json'){throw 'Unowned process receipt'}
$record=Get-Content -LiteralPath $Receipt -Raw | ConvertFrom-Json
$candidates=@($record.owned)+@(Inventory)
$stopped=@()
foreach($candidate in $candidates | Sort-Object pid -Unique){
  if($candidate.profile -cne $Profile -or $candidate.executable -ne 'C:\Program Files\Google\Chrome\Application\chrome.exe'){throw 'Invalid owned process receipt'}
  $live=Get-CimInstance Win32_Process -Filter "ProcessId=$($candidate.pid)"
  if(-not $live){continue}
  if((Creation $live)-cne $candidate.created -or $live.ExecutablePath -ne $candidate.executable){throw 'PID identity changed; refusing stop'}
  Stop-Process -Id $candidate.pid -Force -ErrorAction Stop
  $stopped+=$candidate.pid
}
$end=[DateTime]::UtcNow.AddSeconds(15)
do {
  $remaining=@()
  foreach($candidate in $candidates | Sort-Object pid -Unique){
    $live=Get-CimInstance Win32_Process -Filter "ProcessId=$($candidate.pid)"
    if($live -and (Creation $live)-ceq $candidate.created){$remaining+=$candidate.pid}
  }
  $remaining+=@(Inventory | ForEach-Object pid)
  if($remaining.Count -eq 0){break}
  Start-Sleep -Milliseconds 200
}while([DateTime]::UtcNow -lt $end)
@{verified=$remaining.Count -eq 0;stopped=$stopped;remaining=@($remaining | Sort-Object -Unique)} | ConvertTo-Json -Depth 5 -Compress
if($remaining.Count){exit 1}
