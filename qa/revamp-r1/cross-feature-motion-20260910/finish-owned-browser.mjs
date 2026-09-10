import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026'; if(process.cwd()!==root)throw Error('Wrong working root');
const directory=resolve(root,'qa/revamp-r1/cross-feature-motion-20260910');
const output=resolve(directory,'owned-browser-terminal.json');
if(existsSync(output))throw Error('Preserve prior receipt');
const report=JSON.parse(readFileSync(resolve(directory,'acceptance-6-DYmh0w/browser.json')));
if(report.ok!==false||!report.failure||!report.cleanup.verified)throw Error('Validation not finalized');
const script=`$p=Get-CimInstance Win32_Process -Filter 'ProcessId = 4528'
if ($p) {
  if ($p.Name -ne 'node.exe' -or $p.CommandLine -notmatch 'C:\\\\sgSHIOK2026\\\\qa\\\\revamp-r1\\\\cross-feature-motion-20260910\\\\browser-5.mjs acceptance-6 cross-feature-motion-20260910-2 4354') { throw 'Unexpected process owner' }
  $before=$p | Select-Object ProcessId,CreationDate,CommandLine
  Stop-Process -Id $p.ProcessId -ErrorAction Stop
  $gone=$null -eq (Get-Process -Id $p.ProcessId -ErrorAction SilentlyContinue)
  if (!$gone) { throw 'Owned process still alive' }
  [pscustomobject]@{ before=$before; stoppedAfterFinalReceipt=$true; gone=$gone } | ConvertTo-Json -Depth 4
} else { [pscustomobject]@{ alreadyExited=$true; gone=$true } | ConvertTo-Json }`;
const stdout=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{cwd:root,encoding:'utf8',windowsHide:true,timeout:30000});
const receipt={reason:'Completed failed browser receipt and verified Chrome cleanup; Node helper kept its execution session open. Stop only this exact owned helper, preserving the failed result.',script,stdout};
writeFileSync(output,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(stdout);
