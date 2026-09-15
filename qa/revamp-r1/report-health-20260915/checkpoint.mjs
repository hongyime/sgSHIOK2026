import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026'; assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const dir=resolve(root,'qa/revamp-r1/report-health-20260915');
const read=p=>JSON.parse(readFileSync(resolve(dir,p),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const failed=read('live-sbvIlY/summary.json'), live=read('live-Wpd1JP/summary.json'), tests=read('tests-Nfx9mm/summary.json'), clock=read('clock-A4cKDh/summary.json');
assert.equal(failed.accepted,false);assert.equal(failed.health.reason,'future_timestamp');
assert.equal(live.accepted,true);assert.equal(live.exit,1);assert.equal(live.health.status,'unobserved');
assert.equal(live.health.intake_enabled,false);assert.equal(live.health.cleanup_admission_ready,false);
assert.equal(tests.accepted,true);assert.equal(tests.exit,0);assert.equal(tests.testsPassed,102);
assert.deepEqual(live.before,live.after);assert.deepEqual(tests.before,tests.after);assert.deepEqual(live.before,tests.before);
for(const [p,h] of Object.entries(live.before))assert.equal(hash(readFileSync(resolve(root,p))),h,p);
assert.equal(clock.row.visible_job_count,1);assert.equal(clock.row.visible_run_count,0);assert.equal(clock.row.job_rls_active,false);assert.equal(clock.databaseAheadOfLocalEndMs,9);
const protectedData=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/report-operations-20260915/database-checkpoint.json'),'utf8'));
for(const a of protectedData.protectedAnchors){const b=readFileSync(resolve(root,a.path));assert.equal(b.length,a.bytes);assert.equal(hash(b),a.sha256);}
assert.equal(hash(readFileSync(resolve(root,'pipeline/config/weights.yaml'))),protectedData.weights);
const old=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/report-moderation-20260915/evidence.json'),'utf8')).after;
const evidencePath=resolve(root,'qa/verification/REVAMP-R1-core-walk.md');const before=readFileSync(evidencePath);
assert.equal(before.length,old.bytes);assert.equal(hash(before),old.sha256);
const integrity=execFileSync(resolve(root,'.venv/Scripts/python.exe'),['-B',resolve(root,'scripts/check_repo_integrity.py')],{cwd:root,encoding:'utf8',windowsHide:true,timeout:30000});
assert.match(integrity,/repo_integrity=ok/);
const result={root,host:process.env.COMPUTERNAME,receipts:{failed:'live-sbvIlY',clock:'clock-A4cKDh',accepted:'live-Wpd1JP',tests:'tests-Nfx9mm'},
  collectorCommand:live.command,collectorExit:live.exit,liveHealth:live.health,
  firstAttempt:{accepted:false,reason:failed.health.reason},clockProbe:clock,
  sourceBindings:live.before,tests:{command:tests.command,exit:0,passed:102,arithmetic:'54 initial health + 7 clock regressions + 41 docs/integrity = 102; 61 health + 41 = 102'},
  network:{collectorRequestsPerCompletedPass:3,clockProbeRequests:1,requestCountBasis:'Fixed verified code path, not packet tracing',arithmetic:'3 first collector + 1 diagnostic probe + 3 corrected collector = 7; no retries'},
  protectedAnchorsVerified:protectedData.protectedAnchors.length,weights:protectedData.weights,integrity,review:read('review.json'),
  findings:[
    'Actual read-only health collection accepted, with no resident rows, return_message or credentials emitted. The observed state is unobserved, not healthy.',
    'Initial HTTP200-only assumption was corrected before live collection; first live pass then exposed a 9ms database clock lead. Original failure preserved.',
    'DB-only5s skew allowance retains strict event ordering and conservative26h age. Neither retention nor scoring/hash tolerances changed.',
    'No monitor job or alert delivery activated; no PAT persisted, runtime secret configured, frontend deployed, frozen data mutated or pipeline run.',
  ],disagreements:[
    'Collector acceptance0 must not be confused with its CLI exit1 or reported unobserved cleanup. This is not operational release acceptance.',
    'No disagreement with30day retention. Full build-and-ship goal remains active; auth/queue integration, concurrency/navigation acceptance and release work remain.',
  ]};
const output=JSON.stringify(result,null,2);writeFileSync(resolve(dir,'checkpoint.json'),output+'\n',{flag:'wx'});
appendFileSync(evidencePath,'\n\n## 2026-09-15: Content-free cleanup health acceptance\n\n```json\n'+output+'\n```\n');
const after=readFileSync(evidencePath);assert.ok(after.subarray(0,before.length).equals(before));
writeFileSync(resolve(dir,'evidence.json'),JSON.stringify({before:old,after:{bytes:after.length,sha256:hash(after)},appendOnly:true},null,2)+'\n',{flag:'wx'});
console.log(output);
