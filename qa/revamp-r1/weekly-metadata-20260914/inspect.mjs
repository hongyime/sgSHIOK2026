import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { hostname } from 'node:os';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026', dir = resolve(root, 'qa/revamp-r1/weekly-metadata-20260914');
assert.equal(process.cwd(), root);
const hash = data => createHash('sha256').update(data).digest('hex');
const previous = JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/maintenance-runner-20260913/summary.json')));
const anchors = previous.anchors.map(a => {
  const data=readFileSync(resolve(root,a.path)), sha256=hash(data);
  assert.equal(sha256,a.sha256,`STOP hash mismatch ${a.path}: ${sha256}`);
  assert.equal(data.length,a.bytes);
  return {...a,match:true};
});
const weights=hash(readFileSync(resolve(root,'pipeline/config/weights.yaml')));
assert.equal(weights,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec');
const pins=JSON.parse(readFileSync(resolve(root,'source-metadata-catalog.json'))).anchors;
for (const [path,expected] of Object.entries(pins)) assert.equal(hash(readFileSync(resolve(root,path))),expected,`STOP ${path}`);
const evidence=readFileSync(resolve(root,'qa/verification/REVAMP-R1-core-walk.md'));
const commands=[
 ['git',['rev-parse','HEAD']], ['git',['ls-remote','origin','main']],
 ['git',['diff','--check']], ['python',['-B','scripts/check_repo_integrity.py']],
 ['gh',['issue','view','34','--repo','hongyime/sgSHIOK2026','--json','number,url,title,state,assignees,body']],
 ['gh',['api','users/github-actions[bot]','--jq','{id,login,type}']],
 ['gh',['secret','list','--repo','hongyime/sgSHIOK2026','--json','name,updatedAt']],
];
const results=commands.map(([command,args])=>{
 const started=Date.now();
 const result=spawnSync(command,args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:60000,maxBuffer:1000000,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1',TEMP:resolve(root,'tmp'),TMP:resolve(root,'tmp')}});
 return {command:[command,...args],exitCode:result.status,error:result.error?.message,stdout:result.stdout,stderr:result.stderr,elapsedMs:Date.now()-started};
});
const receipt={root,hostname:hostname(),at:new Date().toISOString(),anchors,weights,metadataPins:pins,evidenceBefore:{bytes:evidence.length,sha256:hash(evidence)},commands:results,pipelineRuns:0};
const path=resolve(dir,`inspection-${Date.now()}.json`);
writeFileSync(path,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({path,anchorCount:anchors.length,allCommandsPassed:results.every(r=>r.exitCode===0),evidenceBefore:receipt.evidenceBefore,commands:results}));
process.exitCode=results.every(r=>r.exitCode===0)?0:1;
