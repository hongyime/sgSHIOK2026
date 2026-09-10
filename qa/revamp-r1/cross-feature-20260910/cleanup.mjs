import { spawnSync } from 'node:child_process';
import { relative, isAbsolute, resolve, sep } from 'node:path';
const root = 'C:\\sgSHIOK2026';
export function cleanup(profile) {
  if (process.cwd() !== root) throw Error('Wrong working root');
  const part = relative(resolve(root, 'tmp'), profile);
  if (isAbsolute(part) || part.startsWith('..') || part.includes(sep) || !part.startsWith('layout-confirmation-browser-')) throw Error('Not an owned QA profile');
  const command = "$ErrorActionPreference='Stop'; $profile='" + profile.replaceAll("'", "''") + "'; function Owned { @(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($profile) }) }; $before=@(Owned | Select-Object ProcessId,Name,CommandLine); foreach($p in @(Owned)){ $live=Get-Process -Id $p.ProcessId -ErrorAction SilentlyContinue; if($live -and -not $live.HasExited){Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue} }; $until=[DateTime]::UtcNow.AddSeconds(20); do { $remaining=@(Owned | Where-Object { $p=Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; $p -and -not $p.HasExited }); if($remaining.Count -eq 0){break}; Start-Sleep -Milliseconds 250 } while([DateTime]::UtcNow -lt $until); @{before=$before;remaining=@($remaining | Select-Object ProcessId,Name,CommandLine)} | ConvertTo-Json -Depth 4 -Compress";
  const result = spawnSync('powershell.exe', ['-NoProfile','-NonInteractive','-Command',command], { cwd:root, windowsHide:true, encoding:'utf8', timeout:45000 });
  let verified = false;
  try { verified = result.status === 0 && JSON.parse(result.stdout).remaining.length === 0; } catch {}
  return { command, exitCode:result.status, stdout:result.stdout, stderr:result.stderr, verified };
}
