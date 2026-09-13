import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const dir=resolve(root,'qa/revamp-r1/legacy-command-20260913');
const files=['cdp-commands.mjs','cdp-commands.test.mjs','browser.mjs','run.mjs'];
const sources=files.map(path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(dir,path))).digest('hex')}));
const runs=[];
for(const args of [['--test',resolve(dir,'cdp-commands.test.mjs')],['--check',resolve(dir,'browser.mjs')],['--check',resolve(dir,'run.mjs')]]){
  const start=Date.now(),r=spawnSync(process.execPath,args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:60000,env:{...process.env,TEMP:resolve(root,'tmp'),TMP:resolve(root,'tmp')}});
  runs.push({command:[process.execPath,...args],exitCode:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.message,elapsedMs:Date.now()-start});
}
const report={sources,runs,ok:runs.every(r=>r.exitCode===0)};
writeFileSync(resolve(dir,'checks-'+Date.now()+'.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report,null,2));process.exitCode=report.ok?0:1;
