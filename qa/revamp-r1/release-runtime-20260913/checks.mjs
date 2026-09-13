import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const mode=process.argv[2];assert.ok(['focused','full','types'].includes(mode));
const out=resolve(root,'qa/revamp-r1/release-runtime-20260913/checks-'+mode+'-'+Date.now());mkdirSync(out);
const command=mode==='full'?['web/scripts/test-without-production-data.mjs','--reporter=dot','--testTimeout=15000']:
  mode==='types'?['web/node_modules/typescript/bin/tsc','--project','web/tsconfig.json','--noEmit','--incremental','false']:
  ['node_modules/vitest/vitest.mjs','run','--globals','--maxWorkers','1','--no-file-parallelism','--reporter=json',
    'lib/__tests__/transit-popup.test.ts','lib/__tests__/route-evidence-map-popup.test.ts'];
const cwd=mode==='focused'?resolve(root,'web'):root,start=Date.now();
const result=spawnSync(process.execPath,command,{cwd,windowsHide:true,encoding:'utf8',maxBuffer:32*1024*1024,timeout:300000});
const receipt={command:[process.execPath,...command],cwd,status:result.status,elapsedMs:Date.now()-start,error:result.error?.message};
if(mode==='focused'){
  try{const data=JSON.parse(result.stdout);receipt.counts={tests:data.numTotalTests,passed:data.numPassedTests,failed:data.numFailedTests};}catch{}
}
writeFileSync(resolve(out,'stdout.txt'),result.stdout||'',{flag:'wx'});
writeFileSync(resolve(out,'stderr.txt'),result.stderr||'',{flag:'wx'});
writeFileSync(resolve(out,'command.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,...receipt},null,2));process.exitCode=result.status??1;
