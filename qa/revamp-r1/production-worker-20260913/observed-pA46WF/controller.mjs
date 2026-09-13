import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const started=Date.now(),dir=resolve(root,'qa/revamp-r1/production-worker-20260913');
const out=mkdtempSync(resolve(dir,'observed-')),profile=mkdtempSync(resolve(root,'tmp/layout-confirmation-browser-'));
const write=(name,data)=>writeFileSync(resolve(out,name),typeof data==='string'?data:JSON.stringify(data,null,2)+'\n',{flag:'wx'});
const sha=b=>createHash('sha256').update(b).digest('hex');
const driver=resolve(dir,'observe-worker.mjs');
const cleanupSourceSha256=sha(readFileSync(resolve(dir,'../cross-feature-20260910/cleanup.mjs')));
assert.equal(cleanupSourceSha256,'aeb861991582e086eef2253a01118673f5f902903ff8c03e0efad7d9754b7b7c');
const controller={root,pid:process.pid,out,profile,startedAt:new Date(started).toISOString(),
  childTimeoutMs:150000,cleanupTimeoutMs:45000,totalBudgetMs:210000,
  cleanupSourceSha256,
  arithmetic:'150000 child maximum + 45000 independent profile cleanup + 15000 receipt/setup reserve = 210000 ms',
  files:['observe-worker.mjs','network-boundary.mjs','worker-observer.js'].map(file=>({file,sha256:sha(readFileSync(resolve(dir,file)))}))};
write('controller.json',controller);write('controller.mjs',readFileSync(new URL(import.meta.url),'utf8'));
const child=spawnSync(process.execPath,[driver,out,profile],{cwd:root,windowsHide:true,encoding:'utf8',maxBuffer:2*1024*1024,timeout:controller.childTimeoutMs,
  env:{...process.env,TEMP:profile,TMP:profile}});
write('stdout.txt',child.stdout??'');write('stderr.txt',child.stderr??'');
// The child has terminated (normally or by its process timeout) before cleanup.
// This second process-scoped cleanup also handles a child stuck inside finally.
const cleaned=cleanup(profile);
let observation;try{observation=JSON.parse(readFileSync(resolve(out,'observation.json')));}catch{}
const elapsedMs=Date.now()-started;
const result={...controller,childPid:child.pid,childStatus:child.status,childSignal:child.signal,error:child.error?{name:child.error.name,message:child.error.message,code:child.error.code}:null,
  cleanup:cleaned,elapsedMs,totalBudgetMet:elapsedMs<=controller.totalBudgetMs,observationPresent:!!observation,
  outcome:observation?.outcome,runCompleted:child.status===0&&observation?.runCompleted===true&&cleaned.verified&&elapsedMs<=controller.totalBudgetMs,appAcceptance:false};
write('supervisor.json',result);
console.log(JSON.stringify({out,childStatus:child.status,childError:result.error,outcome:result.outcome,runCompleted:result.runCompleted,cleanup:cleaned.verified,elapsedMs,totalBudgetMet:result.totalBudgetMet},null,2));
process.exitCode=result.runCompleted?0:1;
