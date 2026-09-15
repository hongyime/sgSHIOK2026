import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';
assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const mode=process.argv[2];
assert.ok(['before','after'].includes(mode));
const dir=resolve(root,'qa/revamp-r1/report-cleanup-20260915');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const load=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const evidence=readFileSync(resolve(root,'qa/verification/REVAMP-R1-core-walk.md'));
const original=load('qa/revamp-r1/report-http-20260915/after.json').evidencePrefix;
assert.equal(sha(evidence.subarray(0,original.bytes)),original.sha256,'Evidence prefix changed');
if(mode==='before')assert.equal(evidence.length,original.bytes);
const weights=sha(readFileSync(resolve(root,'pipeline/config/weights.yaml')));
assert.equal(weights,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec','Locked weights differ; stop');
const anchors=Object.values(load('web/lib/__tests__/fixtures/published-walks.provenance.json').sources).map(source=>{
  const bytes=readFileSync(resolve(root,source.path));
  assert.equal(bytes.length,source.bytes,source.path);assert.equal(sha(bytes),source.sha256,source.path);
  return {path:source.path,bytes:bytes.length,sha256:sha(bytes)};
});
assert.equal(anchors.length,11);
const full=load('qa/revamp-r1/report-cleanup-20260915/checks-IONe84/summary.json');
assert.equal(full.exit,0);assert.equal(full.sourceStable,true);
assert.deepEqual(full.before,full.after);assert.deepEqual(full.before,full.snapshotSources);
for(const [path,hash] of Object.entries(full.before))assert.equal(sha(readFileSync(resolve(root,path))),hash,path);
const remotes=readdirSync(dir).filter(name=>name.startsWith('remote-')).sort().map(name=>{
  const record=JSON.parse(readFileSync(resolve(dir,name,'summary.json'),'utf8'));
  return {receipt:name,mode:record.mode,passed:record.passed,requests:record.requests.length,
    sqlGroups:record.checks?.filter(check=>check.passed).length??0,error:record.error??null};
});
const core=load('qa/revamp-r1/report-cleanup-20260915/remote-J5s5fs/summary.json');
const acl=load('qa/revamp-r1/report-cleanup-20260915/remote-nPm25K/summary.json');
assert.equal(core.passed,true);assert.equal(acl.passed,true);
const checks=readdirSync(dir).filter(name=>name.startsWith('checks-')).sort().map(name=>{
  const record=JSON.parse(readFileSync(resolve(dir,name,'summary.json'),'utf8'));
  return {receipt:name,mode:record.mode,exit:record.exit,elapsedMs:record.elapsedMs,sourceStable:record.sourceStable};
});
assert.ok(checks.some(check=>check.mode==='types'&&check.exit===0));
if(mode==='after')assert.ok(checks.some(check=>check.mode==='docs'&&check.exit===0));
const result={mode,root,hostname:process.env.COMPUTERNAME,head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}).trim(),
  weights,anchors,evidenceOriginalPrefix:original,evidence:{bytes:evidence.length,sha256:sha(evidence)},
  testedSourceCount:Object.keys(full.before).length,checks,remoteReceipts:remotes,
  managementRequests:{terms:remotes.map(row=>row.requests),total:remotes.reduce((sum,row)=>sum+row.requests,0)},
  sqlExecutedGroups:{terms:remotes.map(row=>row.sqlGroups),total:remotes.reduce((sum,row)=>sum+row.sqlGroups,0),uniqueCore:23,uniqueAcl:6},
  finalDatabaseState:core.after,advisors:core.advisors.lints.map(({name,level,metadata})=>({name,level,metadata})),
  publicRpcProbe:{receipt:'advisor-http-ypbKwc',requests:1,status:400,expected404Met:false,note:'Unsupported event_trigger response is not proof of no side effects; later ACL correction tested actual role denial.'},
  validation:{focused:476,focusedFiles:6,full:2387,fullFiles:77,dependencyGuards:42,delta:'2219 + 168 = 2387; 76 + 1 = 77 files; focused tests overlap full suite'},
  pipelineRuns:0,deployments:0,runtimeSecretsSaved:0,cronInstalled:false,intakeEnabled:false,
  findings:[
    'Exact720hour expiry, bounded UUIDv7 validity and monotone floor prevent normal post-purge recreation; early deletion remains separately gated.',
    'Post-lock UTC day binding prevents a queued request using a different daily HMAC bucket; saved receipts remain recoverable without debit.',
    'Unnecessary platform event-helper EXECUTE grants were removed; global advisor WARNs cleared without body/trigger/owner/service changes.',
    'Cleanup is applied/tested but unscheduled. Reports remain disabled; no resident form, moderation auth or release completion claim.'
  ],
  disagreements:[
    'No policy disagreement: daily cleanup cannot establish exact physical erasure at30days during scheduling intervals/outages.',
    'Rollback fixtures and function-local timeout are not concurrent-session or cancellation acceptance; full goal stays active.'
  ]};
writeFileSync(resolve(dir,`${mode}.json`),`${JSON.stringify(result,null,2)}\n`,{flag:'wx'});
console.log(JSON.stringify(result,null,2));
