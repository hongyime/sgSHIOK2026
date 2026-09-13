import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { hostname } from 'node:os';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const out=resolve(root,'qa/revamp-r1/append-only-notices-20260913');
const base='73935b2a10e5e2f5d3cb3e727d911da9f88e2a09';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFileSync(resolve(root,p));
const json=p=>JSON.parse(read(p));
const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true});
const runs=readdirSync(out,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>({path:e.name,...json(`qa/revamp-r1/append-only-notices-20260913/${e.name}/command.json`)}));
const accepted=runs.filter(r=>r.path.startsWith('all-')&&r.status===0).at(-1);assert.ok(accepted);
for(const [path,expected] of Object.entries(accepted.sourceHashes))assert.equal(sha(read(path)),expected,path);
assert.ok(accepted.stdout.includes('719 passed'));
const evidence='qa/verification/REVAMP-R1-core-walk.md';
const before=git('show',`${base}:${evidence}`),after=read(evidence);
assert.equal(Buffer.compare(after.subarray(0,before.length),before),0,'Evidence must be byte-prefix-preserving');
const checks=[];
for(const value of Object.values(json('web/lib/__tests__/fixtures/published-walks.provenance.json').sources)){
  const bytes=read(value.path),actual=sha(bytes);checks.push({path:value.path,bytes:bytes.length,sha256:actual});
  assert.equal(actual,value.sha256,'STOP hash mismatch '+value.path);assert.equal(bytes.length,value.bytes);
}
const weightSha=sha(read('pipeline/config/weights.yaml'));
assert.equal(weightSha,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec','STOP weights hash mismatch');
assert.equal(git('diff','--name-only',base,'--','web','pipeline','checksums.json').toString().trim(),'','No frontend or pipeline mutation');
const planBody=await (await fetch('http://127.0.0.1:4412/postplan.html',{signal:AbortSignal.timeout(10000)})).arrayBuffer();
assert.equal(sha(Buffer.from(planBody)),sha(read('postplan.html')),'Preview task board must match current source');
const identity=await (await fetch('http://127.0.0.1:4412/__qa/status',{signal:AbortSignal.timeout(10000)})).json();
assert.equal(identity.buildId,'T2PK7uLhsuXtK2oAxtakU');
assert.equal(identity.readOnlyData,true);
const summary={root,hostname:hostname(),createdAt:new Date().toISOString(),base,
  tests:{focused:719,arithmetic:'376 existing +65 core/journal +278 adapter =719',files:8,
    receipt:accepted.path,scope:accepted.scope,web:{retainedTests:1916,retainedFiles:71,newRun:false},
    browserRerun:false,wholeProjectPython:false,workerTimeoutMeasured:false},
  attempts:runs.map(r=>({path:r.path,status:r.status,elapsedMs:r.elapsedMs})),
  appendOnly:{path:evidence,baseBytes:before.length,baseSha256:sha(before),newBytes:after.length,addedBytes:after.length-before.length,exactPrefix:true},
  anchors:checks,weightSha,taskBoard:{url:'http://127.0.0.1:4412/postplan.html',sha256:sha(read('postplan.html')),matches:true},
  previewIdentity:identity,pipelineRuns:0,pipelineSeconds:0,externalNoticeWrites:0,deployments:0,
  findings:[
    'Local append-only delivery replaces the unsupported GitHub issue PATCH CAS activation assumption.',
    'Exclusive retained intents allow at most one automatic POST attempt; uncertain delivery is not blindly resent.',
    'Review caught offset-pagination false uniqueness, orphan-journal repair, contradictory pagination and wrong-ID adapter acceptance; all corrected.',
    'Known POST IDs are retained unverified for direct GET recovery. Unknown IDs require one complete page or operator reconciliation.',
    'Reporting service, hosted persistence, delivery pacing/cooldowns, monitor acknowledgement integration, schedule, phone acceptance and release remain incomplete.'
  ],
  disagreements:[
    'Passing local tests is not activated maintenance or live notice delivery.',
    'This is not exactly-once delivery, rollback-proof storage or a sandbox against a hostile concurrent local directory writer.'
  ]};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
const artifacts=[];
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())walk(path);else {const data=readFileSync(path);artifacts.push({path:path.slice(out.length+1).replaceAll('\\','/'),bytes:data.length,sha256:sha(data)});}}}
walk(out);writeFileSync(resolve(out,'artifact-index.json'),JSON.stringify({artifacts},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({tests:summary.tests,appendOnly:summary.appendOnly,anchorCount:checks.length,weightSha,taskBoard:summary.taskBoard,pipelineRuns:0},null,2));
