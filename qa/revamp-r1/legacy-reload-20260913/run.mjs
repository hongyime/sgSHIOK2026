import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);const started=Date.now();
const dir=resolve(root,'qa/revamp-r1/legacy-reload-20260913');
const out=mkdtempSync(resolve(dir,'observed-')),profile=mkdtempSync(resolve(root,'tmp/layout-confirmation-browser-'));
writeFileSync(resolve(out,'controller.json'),JSON.stringify({pid:process.pid,out,profile,startedAt:new Date(started).toISOString()},null,2)+'\n',{flag:'wx'});
let child,cleaned;
try{
  const syntax=spawnSync(process.execPath,['--check',resolve(dir,'browser.mjs')],{cwd:root,windowsHide:true,encoding:'utf8',timeout:10000});assert.equal(syntax.status,0,syntax.stderr);
  const timeout=Math.min(240000,started+300000-Date.now()-60000);assert.ok(timeout>0);
  child=spawnSync(process.execPath,[resolve(dir,'browser.mjs'),out,profile],{cwd:root,windowsHide:true,encoding:'utf8',timeout,maxBuffer:4*1024*1024,env:{...process.env,TEMP:profile,TMP:profile}});
}catch(error){child={status:null,error,stdout:'',stderr:''};}
finally{cleaned=cleanup(profile);}
for(const stream of ['stdout','stderr'])writeFileSync(resolve(out,stream+'.txt'),child[stream]??'',{flag:'wx'});
const report={out,profile,exitCode:child.status,error:child.error?.message,cleanup:cleaned,elapsedMs:Date.now()-started,budgetMs:300000,arithmetic:'240000child+45000cleanup+15000reserve=300000ms; setup included by shrinking child timeout'};
writeFileSync(resolve(out,'supervisor.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report,null,2));process.exitCode=child.status===0&&cleaned.verified&&report.elapsedMs<=300000?0:1;
