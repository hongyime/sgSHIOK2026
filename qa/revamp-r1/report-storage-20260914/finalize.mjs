import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);process.env.TEMP=process.env.TMP=resolve(root,'tmp');process.env.PYTHONDONTWRITEBYTECODE='1';
const out=mkdtempSync(resolve(root,'qa/revamp-r1/report-storage-20260914/final-'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const load=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const isolated=load('tmp/test-without-data-i8Kk2L/isolation.json');
assert.equal(isolated.exitCode,0);assert.equal(isolated.guardProbePassed,true);assert.equal(isolated.productionDataDirectoryAbsent,true);
const webSources=['web/lib/reports.ts','web/lib/__tests__/reports.test.ts','web/app/api/reports/store.ts','web/lib/__tests__/report-store.test.ts','web/lib/report-lifecycle.ts'];
const sources=webSources.map(path=>{const hash=sha(readFileSync(resolve(root,path)));assert.equal(hash,sha(readFileSync(resolve(isolated.snapshot,path))));return {path,sha256:hash};});
writeFileSync(resolve(out,'isolation.json'),JSON.stringify(isolated,null,2)+'\n',{flag:'wx'});
const anchors=load('qa/revamp-r1/weekly-metadata-20260914/summary.public.json').anchors;
for(const anchor of anchors){const bytes=readFileSync(resolve(root,anchor.path));assert.equal(bytes.length,anchor.bytes);assert.equal(sha(bytes),anchor.sha256);}
const commands=[['.venv/Scripts/python.exe','-B','-m','pytest','tests/test_readme.py','tests/test_agent_docs.py','tests/test_repo_integrity.py','-q','-p','no:cacheprovider'],['.venv/Scripts/python.exe','-B','scripts/check_repo_integrity.py'],['web/node_modules/typescript/bin/tsc','--project','web/tsconfig.json','--noEmit','--incremental','false']];
const checks=[];
for(const [i,[executable,...args]] of commands.entries()){
  const started=Date.now();const node=executable.endsWith('/tsc');
  const command=node?[process.execPath,resolve(root,executable),...args]:[resolve(root,executable),...args];
  const r=spawnSync(command[0],command.slice(1),{cwd:root,windowsHide:true,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
  for(const stream of ['stdout','stderr'])writeFileSync(resolve(out,`${i}.${stream}.txt`),r[stream]??'',{flag:'wx'});
  checks.push({command:[executable,...args],exit:r.status,elapsedMs:Date.now()-started,error:r.error?.code??null});
  console.log(r.stdout);if(r.status!==0){console.log(r.stderr);break;}
}
const result={sources,checks,anchorsMatched:anchors.length,postgresTests:14,focusedTests:116,isolatedFiles:3,dependencyGuards:42,
  appliedMigration:'20260914085103',applyReceipt:'apply-eTBjhP/summary.json',inspection:'inspection-kZ1dKh/summary.json',
  failedDatabaseExperiments:['database-Cu2gZb','database-0E2IaH'],
  findings:['Private schema is installed disabled and empty on the named Free project.','NUL validation mismatch corrected, failed experiments retained.','Existing transit table definitions unchanged; no resident data inspected or stored.'],
  disagreements:['Account PATs are not report runtime keys; rotate chat-disclosed credentials.'],
  remaining:['Public endpoint and trusted abuse bucket','Actual concurrent transactions and HTTP uncertain-commit recovery','Moderator authentication and queue','Retention/cleanup/deletion policy and implementation','Resident composition/receipt UI and browser acceptance'],
  pipelineRuns:0,frontendDeployments:0,fullWebSuiteRerun:false};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,...result},null,2));process.exitCode=checks.length===commands.length&&checks.every(c=>c.exit===0)?0:1;
