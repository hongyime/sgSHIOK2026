import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026'; assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const mode=process.argv[2], directory=resolve(root,'qa/revamp-r1/moderator-console-20260915');
assert.ok(['focused','full','types','docs'].includes(mode));
const out=mkdtempSync(resolve(directory,`${mode}-`));
const paths=['web/app/api/moderation/session.ts','web/app/api/moderation/login/route.ts','web/app/api/moderation/logout/route.ts',
  'web/app/api/moderation/auth.ts','web/app/api/moderation/http.ts','web/app/api/moderation/store.ts',
  'web/components/moderation-console.tsx','web/components/moderation-console.module.css','web/components/report-location-preview.tsx',
  'web/app/moderation/page.tsx','web/next.config.js','web/lib/moderator-client.ts','web/lib/reports.ts',
  'web/lib/__tests__/moderator-session.test.ts','web/lib/__tests__/moderator-client.test.ts','web/lib/__tests__/moderation-console.test.tsx','web/lib/__tests__/moderation-route.test.ts'];
const hash=x=>createHash('sha256').update(x).digest('hex');
const sources=base=>Object.fromEntries(paths.map(p=>[p,hash(readFileSync(resolve(base,p)))]));
const commands={
  focused:[process.execPath,'web/scripts/test-web.mjs','lib/__tests__/moderator-session.test.ts','lib/__tests__/moderator-client.test.ts','lib/__tests__/moderation-console.test.tsx','lib/__tests__/moderation-route.test.ts',
    '--reporter=json',`--outputFile=${resolve(out,'vitest.json')}`,'--testTimeout=15000'],
  full:[process.execPath,'web/scripts/test-without-production-data.mjs','--reporter=dot','--testTimeout=15000'],
  types:[process.execPath,'web/node_modules/typescript/bin/tsc','--project','web/tsconfig.json','--noEmit','--incremental','false'],
  docs:[resolve(root,'.venv/Scripts/python.exe'),'-B','-m','pytest','tests/test_readme.py','tests/test_agent_docs.py','tests/test_repo_integrity.py','-q','-p','no:cacheprovider'],
};
const anchors=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/report-operations-20260915/database-checkpoint.json'),'utf8'));
function protect(){for(const a of anchors.protectedAnchors){const b=readFileSync(resolve(root,a.path));assert.equal(b.length,a.bytes,a.path);assert.equal(hash(b),a.sha256,a.path);}assert.equal(hash(readFileSync(resolve(root,'pipeline/config/weights.yaml'))),anchors.weights);}
protect(); const before=sources(root), command=commands[mode], started=Date.now();
writeFileSync(resolve(out,'runner.mjs'),readFileSync(new URL(import.meta.url)),{flag:'wx'});
const run=spawnSync(command[0],command.slice(1),{cwd:root,windowsHide:true,encoding:'utf8',timeout:mode==='full'?900000:240000,maxBuffer:32*1024*1024});
for(const stream of ['stdout','stderr'])writeFileSync(resolve(out,`${stream}.txt`),run[stream]??'',{flag:'wx'});
const result={mode,command,exit:run.status,error:run.error?.code??null,elapsedMs:Date.now()-started,before,after:sources(root),protectedAnchorsVerified:anchors.protectedAnchors.length,weights:anchors.weights};
result.sourceStable=JSON.stringify(result.before)===JSON.stringify(result.after);
if(mode==='focused'){try{const v=JSON.parse(readFileSync(resolve(out,'vitest.json'),'utf8'));result.tests={passed:v.numPassedTests,failed:v.numFailedTests,pending:v.numPendingTests,files:v.testResults.length};}catch{result.reportParseFailed=true;}}
if(mode==='full'){const match=run.stdout?.match(/\{\s*"snapshot":\s*"[^]*$/);if(match){result.isolation=JSON.parse(match[0]);result.snapshotSources=sources(result.isolation.snapshot);result.snapshotMatches=JSON.stringify(result.snapshotSources)===JSON.stringify(result.before);}else result.reportParseFailed=true;}
protect();result.accepted=result.exit===0&&result.sourceStable&&result.snapshotMatches!==false&&!result.reportParseFailed;
writeFileSync(resolve(out,'summary.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({out,...result},null,2));process.exitCode=result.accepted?0:1;
