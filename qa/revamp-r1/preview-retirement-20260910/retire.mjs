import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import os from 'node:os';
import assert from 'node:assert/strict';
const root='C:\\sgSHIOK2026';
if(process.cwd()!==root)throw Error('Wrong working root');
const out=resolve(root,'qa/revamp-r1/preview-retirement-20260910/result.json');
if(existsSync(out))throw Error('Preserve prior retirement result');
const report={startedAt:new Date().toISOString(),root,host:os.hostname(),freeMiBBefore:os.freemem()/1048576,commands:[]};
const get=async port=>{
  const r=await fetch(`http://127.0.0.1:${port}/__qa/status`,{signal:AbortSignal.timeout(10000)});
  assert.equal(r.status,200);return r.json();
};
try {
  const old=await get(4354),current=await get(4362);
  assert.equal(old.pid,105140);assert.equal(old.buildB,'jNTP8fdVgYwcHrBSMHG0l');
  assert.equal(old.sourceB,resolve(root,'tmp/cached-release-cross-feature-motion-20260910-2'));
  assert.equal(current.pid,98236);assert.equal(current.buildId,'sou6pZfEMMmsCl52vdXg4');
  const source=readFileSync(resolve(root,'qa/revamp-r1/worker-alignment-20260910/preview.mjs'),'utf8');
  assert.ok(source.includes("const port = url.pathname.startsWith('/data/') ? 4321 : 4361;"));
  assert.ok(!source.includes('4353')&&!source.includes('4354'));
  const {nonce,requests,...identity}=old;
  report.before={old:identity,oldRequestCount:requests.length,current,currentProxySha256:createHash('sha256').update(source).digest('hex')};
  const stop=await fetch('http://127.0.0.1:4354/__qa/stop',{method:'POST',headers:{'x-shiok-qa':nonce},signal:AbortSignal.timeout(15000)});
  report.proxyStopStatus=stop.status;assert.equal(stop.status,204);
  const run=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-File',resolve(root,'qa/revamp-r1/preview-retirement-20260910/stop-owned-next.ps1')],{cwd:root,windowsHide:true,encoding:'utf8',timeout:60000});
  report.commands.push({args:['stop-owned-next.ps1'],exitCode:run.status,stdout:run.stdout,stderr:run.stderr,error:run.error?.message});
  assert.equal(run.status,0);assert.ok(JSON.parse(run.stdout).gone);
  report.currentAfter=await get(4362);assert.deepEqual(report.currentAfter,current);
  const data=await fetch('http://localhost:4321/data/generated_20260805_prefer_scored_routed/manifest.json',{signal:AbortSignal.timeout(15000)});
  report.dataAfter={status:data.status};await data.body?.cancel();assert.equal(data.status,200);
  const handles=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
    "$old=@(Get-Process -Id 105140,93692 -ErrorAction SilentlyContinue | Where-Object {-not $_.HasExited});$keep=@(Get-Process -Id 97544,98236,108948 -ErrorAction Stop | Where-Object {-not $_.HasExited});@{oldAlive=@($old.Id);oldCount=$old.Count;preserved=@($keep.Id);preservedCount=$keep.Count}|ConvertTo-Json -Compress;if($old.Count -ne 0 -or $keep.Count -ne 3){exit 1}"],{cwd:root,windowsHide:true,encoding:'utf8',timeout:45000});
  report.commands.push({args:['exact captured old/preserved live handles'],exitCode:handles.status,stdout:handles.stdout,stderr:handles.stderr,error:handles.error?.message});
  assert.equal(handles.status,0);
  report.ok=true;
} catch(error){report.ok=false;report.error=String(error.stack??error);process.exitCode=1;}
finally{
  report.finishedAt=new Date().toISOString();report.freeMiBAfter=os.freemem()/1048576;
  writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(report));
}
