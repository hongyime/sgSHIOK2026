import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026'; assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const mode=process.argv[2]??'focused';
const out=mkdtempSync(resolve(root,'qa/revamp-r1/report-storage-20260914/checks-'));
const args=mode==='types'?['web/node_modules/typescript/bin/tsc','--project','web/tsconfig.json','--noEmit','--incremental','false']
  :mode==='full'?['web/scripts/test-without-production-data.mjs','--reporter=dot','--testTimeout=15000']
  :['web/node_modules/vitest/vitest.mjs','run','--root',resolve(root,'web'),'--globals','--maxWorkers','1','--no-file-parallelism','--reporter=json','lib/__tests__/report-store.test.ts','lib/__tests__/reports.test.ts','lib/__tests__/report-lifecycle.test.ts'];
const started=Date.now(),r=spawnSync(process.execPath,args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:600000,maxBuffer:32*1024*1024});
for(const stream of ['stdout','stderr'])writeFileSync(resolve(out,stream+'.txt'),r[stream]??'',{flag:'wx'});
const result={mode,command:['node',...args],exit:r.status,elapsedMs:Date.now()-started,error:r.error?.code??null};
if(mode==='focused')try{const j=JSON.parse(r.stdout);result.tests=j.numTotalTests;result.passed=j.numPassedTests;result.failed=j.numFailedTests;result.files=j.testResults.length;result.failures=j.testResults.flatMap(t=>t.assertionResults.filter(a=>a.status==='failed').map(a=>({test:a.fullName,messages:a.failureMessages})));}catch{result.parseFailure=true;}
writeFileSync(resolve(out,'summary.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,...result},null,2));process.exitCode=r.status??1;
