import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const dir=resolve(root,'qa/revamp-r1/legacy-preservation-20260914');
const start=Date.now();
const shell=spawnSync('powershell.exe',['-NoProfile','-Command',
  "for($i=0;$i -lt 3;$i++){ $os=Get-CimInstance Win32_OperatingSystem; $cpu=Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter \"Name='_Total'\"; $mem=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory; [pscustomobject]@{at=[DateTime]::UtcNow.ToString('o');availableMiB=$os.FreePhysicalMemory/1024;cpu=$cpu.PercentProcessorTime;pagesIn=$mem.PagesInputPerSec;pagesOut=$mem.PagesOutputPerSec}|ConvertTo-Json -Compress; if($i -lt 2){Start-Sleep -Seconds 2} }"],
  {cwd:root,windowsHide:true,encoding:'utf8',timeout:30000});
const samples=shell.stdout.trim().split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));
const hostPass=shell.status===0&&samples.length===3&&samples.every(s=>s.availableMiB>=1024&&Number.isFinite(s.cpu)&&s.cpu<85&&s.pagesIn===0&&s.pagesOut===0);
const paths=['browser.mjs','run.mjs','preservation.mjs','preservation.test.mjs'];
const sources=Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(readFileSync(resolve(dir,p))).digest('hex')]));
const receipt={root,createdAt:new Date().toISOString(),host:{status:shell.status,error:shell.error?.message,stdout:shell.stdout,stderr:shell.stderr,samples,elapsedMs:Date.now()-start,pass:hostPass,gate:'Three samples,each available>=1024MiB,CPU<85%,no observed paging. A conservative run-admission gate, not representative performance or causation proof.'},sources,pluginBootstrap:{error:'failed to write kernel assets: The system cannot find the path specified. (os error 3)',fallback:'Existing owned Chrome/CDP harness; no plugin retry'},tests:[]};
for(const p of ['browser.mjs','run.mjs']){
  const r=spawnSync(process.execPath,['--check',resolve(dir,p)],{cwd:root,windowsHide:true,encoding:'utf8',timeout:10000});
  receipt.tests.push({command:['node','--check',p],status:r.status,stdout:r.stdout,stderr:r.stderr});
}
const testFiles=[resolve(dir,'preservation.test.mjs'),resolve(root,'qa/revamp-r1/legacy-command-20260913/cdp-commands.test.mjs'),resolve(root,'qa/revamp-r1/legacy-reload-20260913/release-server-v2.test.mjs'),resolve(root,'qa/revamp-r1/legacy-reload-20260913/navigation-proof.test.mjs')];
const tests=spawnSync(process.execPath,['--test',...testFiles],{cwd:root,windowsHide:true,encoding:'utf8',timeout:30000});
receipt.tests.push({command:['node','--test',...testFiles],status:tests.status,stdout:tests.stdout,stderr:tests.stderr});
receipt.admitted=hostPass&&receipt.tests.every(r=>r.status===0);
writeFileSync(resolve(dir,'preflight.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(receipt,null,2));process.exitCode=receipt.admitted?0:1;
