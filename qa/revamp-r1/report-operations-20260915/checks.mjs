import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const mode=process.argv[2];
const out=mkdtempSync(resolve(root,'qa/revamp-r1/report-operations-20260915',`checks-${mode}-`));
const tests=['published-walk-page.test.tsx','walk-recovery-focus.test.tsx','report-composer.test.tsx','report-submission.test.ts','reports.test.ts','accessibility-render.test.tsx','map-recovery-actions.test.tsx','map-first-shell.test.ts'];
const commands={
  focused:[process.execPath,'web/scripts/test-web.mjs',...tests.map(p=>`lib/__tests__/${p}`),'--reporter=json',`--outputFile=${resolve(out,'vitest.json')}`,'--testTimeout=15000'],
  full:[process.execPath,'web/scripts/test-without-production-data.mjs','--reporter=dot','--testTimeout=15000'],
  types:[process.execPath,'web/node_modules/typescript/bin/tsc','--project','web/tsconfig.json','--noEmit','--incremental','false'],
  docs:[resolve(root,'.venv/Scripts/python.exe'),'-B','-m','pytest','tests/test_readme.py','tests/test_agent_docs.py','tests/test_repo_integrity.py','-q','-p','no:cacheprovider'],
};
assert.ok(Object.hasOwn(commands,mode));
const paths=['web/app/page.tsx','web/components/report-composer.tsx','web/components/report-composer.module.css','web/lib/reports.ts','web/lib/report-submission.ts',...tests.map(p=>`web/lib/__tests__/${p}`)];
const hash=v=>createHash('sha256').update(v).digest('hex');
const sources=base=>Object.fromEntries(paths.map(p=>[p,hash(readFileSync(resolve(base,p)))]));
const before=sources(root),start=Date.now();
const command=commands[mode];
const run=spawnSync(command[0],command.slice(1),{cwd:root,windowsHide:true,encoding:'utf8',timeout:mode==='full'?900000:180000,maxBuffer:32*1024*1024});
for(const stream of ['stdout','stderr'])writeFileSync(resolve(out,`${stream}.txt`),run[stream]??'',{flag:'wx'});
const result={mode,command,exit:run.status,error:run.error?.code??null,elapsedMs:Date.now()-start,before,after:sources(root)};
result.sourceStable=JSON.stringify(result.before)===JSON.stringify(result.after);
if(mode==='focused')try{const v=JSON.parse(readFileSync(resolve(out,'vitest.json'),'utf8'));result.tests={passed:v.numPassedTests,failed:v.numFailedTests,files:v.testResults.length};}catch{result.reportParseFailed=true;}
if(mode==='full'){
  const match=run.stdout?.match(/\{\s*"snapshot":\s*"[^]*$/);
  if(match){result.isolation=JSON.parse(match[0]);result.snapshotSources=sources(result.isolation.snapshot);}
}
writeFileSync(resolve(out,'summary.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,...result},null,2));
process.exitCode=result.sourceStable?(run.status??1):1;
