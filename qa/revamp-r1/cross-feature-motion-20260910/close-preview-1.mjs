import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const output=resolve(root,'qa/revamp-r1/cross-feature-motion-20260910/closed-preview-1.json');
if(existsSync(output))throw Error('Preserve receipt');
const r=await fetch('http://127.0.0.1:4352/__qa/status',{signal:AbortSignal.timeout(5000)});
const {nonce,...identity}=await r.json();
if(!r.ok||identity.pid!==115356||identity.buildB!=='U7gw5oevzyMB6cfPpbGMQ')throw Error('Wrong preview');
const stop=await fetch('http://127.0.0.1:4352/__qa/stop',{method:'POST',headers:{'x-shiok-qa':nonce},signal:AbortSignal.timeout(5000)});
if(stop.status!==204)throw Error('Proxy stop failed');
const script=`$p=Get-CimInstance Win32_Process -Filter 'ProcessId = 101520'
if (!$p -or $p.Name -ne 'node.exe' -or $p.CommandLine -notmatch 'cached-release-cross-feature-motion-20260910-1\\\\web --hostname 127.0.0.1 --port 4351') { throw 'Wrong owned Next process' }
$before=$p | Select-Object ProcessId,CreationDate,CommandLine
Stop-Process -Id $p.ProcessId -ErrorAction Stop
$gone=$null -eq (Get-Process -Id $p.ProcessId -ErrorAction SilentlyContinue)
if (!$gone) { throw 'Owned Next still alive' }
[pscustomobject]@{before=$before;gone=$gone} | ConvertTo-Json -Depth 4`;
const stdout=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{cwd:root,encoding:'utf8',windowsHide:true,timeout:30000});
const report={identity,stopStatus:stop.status,script,stdout,preserved:'4354 current preview, 4350 and all older user previews'};
writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(stdout);
