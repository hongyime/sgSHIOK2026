import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';
assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const mode=process.argv[2];
const files=['report-http','report-store','reports','report-lifecycle','report-submission','report-request-id'].map(name=>`lib/__tests__/${name}.test.ts`);
const commands={
  focused:[process.execPath,'web/node_modules/vitest/vitest.mjs','run','--root',resolve(root,'web'),'--globals','--maxWorkers','1','--no-file-parallelism','--reporter=json',...files],
  full:[process.execPath,'web/scripts/test-without-production-data.mjs','--reporter=dot','--testTimeout=15000'],
  types:[process.execPath,'web/node_modules/typescript/bin/tsc','--project','web/tsconfig.json','--noEmit','--incremental','false'],
  docs:[resolve(root,'.venv/Scripts/python.exe'),'-B','-m','pytest','tests/test_readme.py','tests/test_agent_docs.py','tests/test_repo_integrity.py','-q','-p','no:cacheprovider'],
};
assert.ok(Object.hasOwn(commands,mode));
const paths=['web/app/api/reports/http.ts','web/app/api/reports/store.ts','web/app/api/reports/route.ts',
  'web/lib/reports.ts','web/lib/report-submission.ts','web/lib/report-request-id.ts',...files.map(path=>`web/${path}`)];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const hashes=base=>Object.fromEntries(paths.map(path=>[path,digest(readFileSync(resolve(base,path)))]));
const before=hashes(root),started=Date.now();
const out=mkdtempSync(resolve(root,'qa/revamp-r1/report-cleanup-20260915/checks-'));
const command=commands[mode];
const run=spawnSync(command[0],command.slice(1),{cwd:root,windowsHide:true,encoding:'utf8',timeout:mode==='full'?900000:180000,maxBuffer:32*1024*1024});
for(const stream of ['stdout','stderr'])writeFileSync(resolve(out,`${stream}.txt`),run[stream]??'',{flag:'wx'});
const result={mode,command,exit:run.status,error:run.error?.code??null,elapsedMs:Date.now()-started,before,after:hashes(root)};
result.sourceStable=JSON.stringify(result.before)===JSON.stringify(result.after);
if(mode==='focused')try{
  const report=JSON.parse(run.stdout);
  result.tests={passed:report.numPassedTests,failed:report.numFailedTests,files:report.testResults.length};
}catch{result.reportParseFailed=true;}
if(mode==='full'){
  const match=run.stdout?.match(/\{\s*"snapshot":\s*"[^]*$/);
  if(match){result.isolation=JSON.parse(match[0]);result.snapshotSources=hashes(result.isolation.snapshot);}
}
writeFileSync(resolve(out,'summary.json'),`${JSON.stringify(result,null,2)}\n`,{flag:'wx'});
console.log(JSON.stringify({out,...result},null,2));
process.exitCode=result.sourceStable?(run.status??1):1;
