import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
const ROOT='C:\\sgSHIOK2026';assert.equal(process.cwd(),ROOT);
const out=mkdtempSync(resolve(ROOT,'qa/revamp-r1/release-finalize-20260915/shell-'));
const env=Object.fromEntries(['SystemRoot','WINDIR','SystemDrive','USERPROFILE','APPDATA','LOCALAPPDATA','ProgramData','ProgramFiles','ProgramFiles(x86)','ProgramW6432','PATH','ComSpec','PSModulePath'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
env.TEMP=env.TMP=out;
const command='C:\\Program Files\\PowerShell\\7\\pwsh.exe',start=Date.now(),result={command,out,passed:false};
try{
  result.stdout=execFileSync(command,['-NoProfile','-NonInteractive','-Command',
    "if ((Get-Location).Path -ne 'C:\\sgSHIOK2026') { throw 'Wrong working root' }; [pscustomobject]@{ version=$PSVersionTable.PSVersion.ToString(); freeKiB=(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory; chromeCount=@(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\").Count } | ConvertTo-Json -Compress"],
    {cwd:ROOT,env,windowsHide:true,encoding:'utf8',timeout:15000,maxBuffer:1024*1024});
  result.values=JSON.parse(result.stdout);assert.ok(result.values.freeKiB>=1048576);result.passed=true;
}catch(error){result.error=error.message;}
result.elapsedMs=Date.now()-start;writeFileSync(resolve(out,'receipt.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result,null,2));process.exitCode=result.passed?0:1;
