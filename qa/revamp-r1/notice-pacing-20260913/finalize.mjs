import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { hostname } from 'node:os';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const base='7c9ab7b17a0ea94782e36ec77eb667957b62cd29';
const out=resolve(root,'qa/revamp-r1/notice-pacing-20260913');
const read=p=>readFileSync(resolve(root,p));
const json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true});
const runs=readdirSync(out,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>({path:e.name,...json(`qa/revamp-r1/notice-pacing-20260913/${e.name}/command.json`)}));
const full=runs.find(r=>r.path==='all-1789285553943');assert.equal(full.status,0);assert.ok(full.stdout.includes('955 passed'));
for(const [path,expected] of Object.entries(full.sourceHashes))assert.equal(sha(read(path)),expected,path);
const integrity=runs.find(r=>r.path==='integrity-1789285785704');assert.equal(integrity.status,0);
const evidence='qa/verification/REVAMP-R1-core-walk.md';
const before=git('show',`${base}:${evidence}`),after=read(evidence);
assert.equal(Buffer.compare(before,after.subarray(0,before.length)),0,'Evidence must retain its exact prefix');
assert.equal(git('diff','--name-only',base,'--','web','pipeline','checksums.json').toString().trim(),'');
const anchors=[];
for(const item of Object.values(json('web/lib/__tests__/fixtures/published-walks.provenance.json').sources)){
  const bytes=read(item.path),hash=sha(bytes);assert.equal(hash,item.sha256,'STOP protected input mismatch '+item.path);
  assert.equal(bytes.length,item.bytes);anchors.push({path:item.path,bytes:bytes.length,sha256:hash});
}
const weightSha256=sha(read('pipeline/config/weights.yaml'));
assert.equal(weightSha256,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec','STOP weights mismatch');
const identity=await(await fetch('http://127.0.0.1:4412/__qa/status',{signal:AbortSignal.timeout(10000)})).json();
assert.equal(identity.buildId,'T2PK7uLhsuXtK2oAxtakU');assert.equal(identity.readOnlyData,true);
const served=Buffer.from(await(await fetch('http://127.0.0.1:4412/postplan.html',{signal:AbortSignal.timeout(10000)})).arrayBuffer());
assert.equal(sha(served),sha(read('postplan.html')),'Task board is stale');
const summary={root,hostname:hostname(),createdAt:new Date().toISOString(),base,
  tests:{focused:955,files:11,arithmetic:'916 existing +28 request-budget +11 integration =955',
    receipt:full.path,elapsedMs:full.elapsedMs,sourceHashesMatch:true,
    wholeProjectPython:false,webRerun:false,retainedWeb:{tests:1916,files:71,dependencyGuards:42},browserRerun:false},
  attempts:runs.map(r=>({path:r.path,status:r.status,elapsedMs:r.elapsedMs})),
  review:json('qa/revamp-r1/notice-pacing-20260913/review.json'),
  evidence:{path:evidence,previousBytes:before.length,previousSha256:sha(before),bytes:after.length,addedBytes:after.length-before.length,exactPrefix:true},
  protectedAnchors:anchors,weightSha256,previewIdentity:identity,taskBoard:{url:'http://127.0.0.1:4412/postplan.html',sha256:sha(served),matches:true},
  findings:['Production GitHub delivery now requires retained request admission and cooldown state.',
    'Admission precedes a fresh notice claim, so cooldowns no longer strand unsent notices.',
    'A successful last-slot POST retains its returned ID while verification waits.',
    'Unknown requests remain blocking evidence; activation, durable hosting, operator recovery, real reporting, physical-device and exact-release gates remain open.'],
  disagreements:['GET-only verification now writes separate rate records; it does not mutate notice/source evidence.',
    'One local journal and shared batch object do not provide credential-wide coordination, rollback protection or a running service.'],
  realSourceRequests:0,realCommentRequests:0,realNoticesAcknowledged:0,pipelineRuns:0,pipelineSeconds:0,deployments:0};
writeFileSync(resolve(out,'summary-final.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
const artifacts=[];
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())walk(path);else{const bytes=readFileSync(path);artifacts.push({path:path.slice(out.length+1).replaceAll('\\','/'),bytes:bytes.length,sha256:sha(bytes)});}}}
walk(out);writeFileSync(resolve(out,'artifact-index-final.json'),JSON.stringify({artifacts},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({tests:summary.tests,evidence:summary.evidence,anchorCount:anchors.length,weightSha256,taskBoard:summary.taskBoard,pipelineRuns:0},null,2));
