import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const base=resolve(root,'qa/revamp-r1/report-operations-20260915');
const hash=x=>createHash('sha256').update(x).digest('hex');
const load=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const receipt=name=>load(`qa/revamp-r1/report-operations-20260915/${name}/summary.json`);
const prior=load('qa/revamp-r1/report-cleanup-20260915/after.json');
for(const anchor of prior.anchors){const bytes=readFileSync(resolve(root,anchor.path));assert.equal(bytes.length,anchor.bytes);assert.equal(hash(bytes),anchor.sha256,anchor.path);}
assert.equal(hash(readFileSync(resolve(root,'pipeline/config/weights.yaml'))),prior.weights);
const evidencePath=resolve(root,'qa/verification/REVAMP-R1-core-walk.md');
const evidence=readFileSync(evidencePath);
assert.equal(evidence.length,480586);assert.equal(hash(evidence),'aabc7cc482e5a71e3c21ebb37938d5af9a9019ea1668fc3f784325f91b29d47d');
const concurrent=receipt('test-cross-mxvP2K'),scheduler=receipt('scheduler-acceptance-3Uos6d'),activation=receipt('scheduler-activate-DGKfpe');
for(const r of [concurrent,scheduler,activation])assert.equal(r.passed,true);
assert.equal(concurrent.cases.length,10);assert.equal(scheduler.cases.length,3);
assert.equal(concurrent.productionUnchanged,true);assert.equal(scheduler.productionUnchanged,true);
assert.equal(concurrent.qaSchemaRemoved,true);assert.equal(concurrent.publicWrappersRemoved,true);assert.equal(scheduler.qaSchemaRemoved,true);
assert.ok(scheduler.jobs.every(j=>j.removed));
const races=concurrent.cases.filter(c=>c.first);
assert.equal(races.length,9);
for(const c of races){assert.notEqual(c.first.pid,c.second.pid);assert.ok(c.first.blocked.some(b=>b.pid===c.second.pid&&b.blockers.includes(c.first.pid)));}
const outcomes=readdirSync(base,{withFileTypes:true}).filter(d=>d.isDirectory()&&!d.name.startsWith('composer-')&&existsSync(resolve(base,d.name,'summary.json'))).map(d=>{
  const r=receipt(d.name);return {path:d.name,mode:r.mode??'scheduler-acceptance',passed:r.passed,requests:r.requests?.length??0,error:r.error??null,sourceSnapshot:existsSync(resolve(base,d.name,'runner.mjs'))};
});
const result={root,host:process.env.COMPUTERNAME,protectedAnchors:prior.anchors,weights:prior.weights,
  concurrency:{receipt:'test-cross-mxvP2K',races:races.map(c=>({name:c.name,holder:c.first.pid,contender:c.second.pid,blocked:c.first.blocked})),actualStatementCancellation:true,cases:10,normalizedAppliedFunctionBodies:4,productionUnchanged:true,qaRemoved:true},
  scheduler:{receipt:'scheduler-acceptance-3Uos6d',cases:scheduler.cases.map(c=>({name:c.name,passed:c.passed,status:c.runs[0].status,start:c.runs[0].start_time,end:c.runs[0].end_time})),productionUnchanged:true,qaRemoved:true},
  activation:{receipt:'scheduler-activate-DGKfpe',migration:'20260915023644',job:activation.activation[0],firstNaturalRunObserved:false},
  outcomes,managementRequestArithmetic:{terms:outcomes.map(o=>o.requests),sum:outcomes.reduce((n,o)=>n+o.requests,0)},
  previousEvidence:{bytes:evidence.length,sha256:hash(evidence)},
  findings:[
    'Nine actual blocked-session races plus one statement cancellation passed; expiry while blocked rejects PT410 without an extra quota debit.',
    'Three actual pg_cron cases passed. A caught deletion error yields cron succeeded while cleanup_failed_at is set; cron status alone is insufficient.',
    'Daily cleanup job1 activated at17:17UTC/01:17SGT, outer30s timeout. First natural run unobserved; initial empty cleanup advanced health/floor, intake remains false and policy null.',
    'Direct cron.job FOR UPDATE was denied before any activation write. Corrected with an explicitly checked serializable transaction and supported cron.alter_job, without ACL widening.',
    'Earlier pilots failed same-endpoint concurrency or permissions and remain failed. Only the narrower cross-endpoint observation was reused. First two pilots lack exact runner snapshots.',
    'No protected inputs changed, resident rows stored, runtime secrets saved, unrelated project calls, paid resources or pipeline/frontend deployments.'
  ],
  disagreements:[
    'No disagreement with30days; daily deletion and outages cannot promise physical erasure at the precise expiry instant.',
    'Actual scheduler tests do not establish natural daily execution, health alerting, resident submission, private moderation or complete release acceptance.'
  ],
  review:{agent:'Ohm',mode:'local read-only',accepted:'Final concurrency and three scheduler receipts; serializable activation design with explicit isolation assertion',residual:'Unexpired cleanup/retry harness cases should explicitly assert cleanup ok before future reuse; recorded results are actually true.'},
  next:'Finish resident integration, private moderator authentication, health monitoring and exact release/device acceptance. Keep full goal active.'};
writeFileSync(resolve(base,'database-checkpoint.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const section='\n\n## 2026-09-15: Actual report concurrency and daily cleanup\n\n```json\n'+JSON.stringify(result,null,2)+'\n```\n';
appendFileSync(evidencePath,section);
assert.equal(hash(readFileSync(evidencePath).subarray(0,evidence.length)),hash(evidence));
writeFileSync(resolve(base,'database-evidence.json'),JSON.stringify({before:result.previousEvidence,after:{bytes:readFileSync(evidencePath).length,sha256:hash(readFileSync(evidencePath))},appendOnly:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result,null,2));
