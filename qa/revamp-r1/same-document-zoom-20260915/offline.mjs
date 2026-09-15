import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { ROOT,BASE } from './contract.mjs';
assert.equal(process.cwd(),ROOT,'Wrong working root');
const out=mkdtempSync(resolve(BASE,'offline-'));
const env={...process.env,TEMP:out,TMP:out};
const report={scope:'Offline contracts, syntax and Win32 ABI only. No browser, keyboard injection, window manipulation, target requests, installation or remote calls.',out,startedAt:new Date().toISOString(),commands:[],sources:[],passed:false};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function run(exe,args,expected=0) {
  const started=Date.now(),result=spawnSync(exe,args,{cwd:ROOT,env,windowsHide:true,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
  const row={exe,args,exit:result.status,error:result.error?.message,stdout:result.stdout,stderr:result.stderr,elapsedMs:Date.now()-started};report.commands.push(row);
  assert.equal(row.exit,expected,row.stderr||row.error);return row;
}
try {
  for(const file of ['contract.mjs','contract.test.mjs','probes.mjs','browser.mjs','run.mjs','offline.mjs'])run(process.execPath,['--check',resolve(BASE,file)]);
  run(process.execPath,['--test',resolve(BASE,'contract.test.mjs')]);
  const abi=run('powershell.exe',['-NoProfile','-NonInteractive','-File',resolve(BASE,'native-shortcut.ps1'),'-SelfTest']);
  const result=JSON.parse(abi.stdout.replace(/^\uFEFF/,''));assert.equal(result.nativeCalls,0);assert.equal(result.inputBytes,result.pointerBytes===8?40:28);report.nativeAbi=result;
  run('powershell.exe',['-NoProfile','-NonInteractive','-Command',`$ErrorActionPreference='Stop'; if((Get-Location).Path -ne '${ROOT}'){throw 'Wrong root'}; $tokens=$null; $errors=$null; [void][System.Management.Automation.Language.Parser]::ParseFile('${BASE}\\processes.ps1',[ref]$tokens,[ref]$errors); if($errors.Count){throw ($errors | Out-String)}; Write-Output 'processes.ps1 syntax_ok'`]);
  const refused=run(process.execPath,[resolve(BASE,'browser.mjs')],1);assert.match(refused.stderr,/No browser without parent exact target/);report.noGoRefused=true;
  const supervisor=run(process.execPath,[resolve(BASE,'run.mjs')],1);assert.match(supervisor.stderr,/Explicit parent go required/);report.supervisorNoGoRefused=true;
  for(const file of ['contract.mjs','contract.test.mjs','probes.mjs','browser.mjs','run.mjs','native-shortcut.ps1','processes.ps1','offline.mjs']) {
    const bytes=readFileSync(resolve(BASE,file));report.sources.push({file,bytes:bytes.length,sha256:hash(bytes)});
  }
  report.passed=true;
}catch(error){report.failure=error.stack;}
finally {
  writeFileSync(resolve(out,'offline.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
}
