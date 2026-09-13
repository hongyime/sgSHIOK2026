import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const dir=resolve(root,'qa/revamp-r1/legacy-preservation-20260914');
const previous=JSON.parse(readFileSync(resolve(dir,'admission.json')));
assert.equal(previous.admitted,true);
const preflight=JSON.parse(readFileSync(resolve(dir,'preflight.json')));
const sha=b=>createHash('sha256').update(b).digest('hex');
const sources=Object.fromEntries(Object.keys(preflight.sources).map(p=>[p,sha(readFileSync(resolve(dir,p)))]));
const checks=[];
for(const p of ['browser.mjs','run.mjs']) {
  const r=spawnSync(process.execPath,['--check',resolve(dir,p)],{cwd:root,windowsHide:true,encoding:'utf8',timeout:10000});
  checks.push({command:['node','--check',p],status:r.status,stdout:r.stdout,stderr:r.stderr});
}
const tests=['preservation.test.mjs','../legacy-command-20260913/cdp-commands.test.mjs',
  '../legacy-reload-20260913/release-server-v2.test.mjs','../legacy-reload-20260913/navigation-proof.test.mjs'].map(p=>resolve(dir,p));
const r=spawnSync(process.execPath,['--test',...tests],{cwd:root,windowsHide:true,encoding:'utf8',timeout:30000});
checks.push({command:['node','--test',...tests],status:r.status,stdout:r.stdout,stderr:r.stderr});
const result={createdAt:new Date().toISOString(),supersedes:'admission.json',reason:'Peer required synchronous validation of captured storage/cache sentinels before release switch;11regressions added.',sources,checks,admitted:checks.every(c=>c.status===0),hostAdmission:previous,resampled:false};
writeFileSync(resolve(dir,'revised-admission.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result,null,2));process.exitCode=result.admitted?0:1;
