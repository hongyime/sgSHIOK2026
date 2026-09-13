import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const out=mkdtempSync(resolve(root,'qa/revamp-r1/report-lifecycle-20260913/checks-'));
const mode=process.argv[2]??'focused';
const sources=['web/lib/report-lifecycle.ts','web/lib/__tests__/report-lifecycle.test.ts'].map(path=>({path,exists:existsSync(resolve(root,path)),sha256:existsSync(resolve(root,path))?createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex'):null}));
const args=mode==='full'?['web/scripts/test-without-production-data.mjs','--reporter=dot','--testTimeout=15000']:mode==='types'?['web/node_modules/typescript/bin/tsc','--project','web/tsconfig.json','--noEmit','--incremental','false']:['web/node_modules/vitest/vitest.mjs','run','--root',resolve(root,'web'),'--globals','--maxWorkers','1','--no-file-parallelism','--reporter=json','lib/__tests__/report-lifecycle.test.ts','lib/__tests__/reports.test.ts'];
const start=Date.now(),r=spawnSync(process.execPath,args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:600000,maxBuffer:32*1024*1024});
for(const name of ['stdout','stderr'])writeFileSync(resolve(out,name+'.txt'),r[name]??'',{flag:'wx'});
const result={mode,sources,command:[process.execPath,...args],exitCode:r.status,error:r.error?.message,elapsedMs:Date.now()-start};
if(mode==='focused')try{const parsed=JSON.parse(r.stdout);result.counts={tests:parsed.numTotalTests,passed:parsed.numPassedTests,failed:parsed.numFailedTests,suites:parsed.numTotalTestSuites};result.failureMessages=parsed.testResults.filter(t=>t.status==='failed').map(t=>({name:t.name,message:t.message,assertions:t.assertionResults.filter(a=>a.status==='failed').map(a=>({name:a.fullName,messages:a.failureMessages}))}));}catch{result.tail=r.stdout?.slice(-1500);}
writeFileSync(resolve(out,'result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({out,...result},null,2));process.exitCode=r.status??1;
