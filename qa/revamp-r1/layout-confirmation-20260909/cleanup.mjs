import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { relative, isAbsolute, resolve, sep } from 'node:path';

const root = 'C:\\sgSHIOK2026';
export function cleanup(profile) {
  if (process.cwd() !== root) throw Error('Wrong working root');
  const part = relative(resolve(root, 'tmp'), profile);
  if (isAbsolute(part) || part.startsWith('..') || part.includes(sep) || !part.startsWith('layout-confirmation-browser-')) throw Error('Not an owned QA profile');
  const command = "$ErrorActionPreference='Stop'; $profile='" + profile.replaceAll("'", "''") + "'; function Owned { @(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($profile) }) }; $before=@(Owned | Select-Object ProcessId,Name,CommandLine); foreach($p in @(Owned)){ $live=Get-Process -Id $p.ProcessId -ErrorAction SilentlyContinue; if($live -and -not $live.HasExited){Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue} }; $remaining=@(Owned | Where-Object { $p=Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; $p -and -not $p.HasExited }); @{before=$before;remaining=@($remaining | Select-Object ProcessId,Name,CommandLine)} | ConvertTo-Json -Depth 4 -Compress";
  const result = spawnSync('powershell.exe', ['-NoProfile','-NonInteractive','-Command',command], { cwd:root, windowsHide:true, encoding:'utf8', timeout:45000 });
  let verified=false;
  try { verified=result.status===0 && JSON.parse(result.stdout).remaining.length===0; } catch {}
  return { command, exitCode:result.status, stdout:result.stdout, stderr:result.stderr, verified };
}
if (process.argv[2]) {
  const file = resolve(process.argv[2]);
  if (!file.startsWith(resolve(root,'qa/revamp-r1/layout-confirmation-20260909') + sep) || !file.endsWith(sep+'browser.json')) throw Error('Wrong receipt');
  const receipt=readFileSync(file,'utf8'), result=cleanup(JSON.parse(receipt).profile);
  writeFileSync(resolve(file,'../cleanup-after.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(result)); process.exitCode=result.verified?0:1;
}
