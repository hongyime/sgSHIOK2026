import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { resolve, relative } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';

const root='C:\\sgSHIOK2026'; assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const base='0e2245180f7a4201408ce74dcb7a2097e343f3c8';
const prefix='qa/revamp-r1/keyboard-recovery-20260913';
const out=resolve(root,prefix);
const read=p=>readFileSync(resolve(root,p));
const json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const write=(p,value)=>writeFileSync(resolve(out,p),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true});
const build=json(`${prefix}/build-1/build.json`);
assert.equal(build.exitCode,0); assert.equal(build.sourceStable,true);
const testSnapshot='tmp/test-without-data-cMsEhc';
for(const s of build.sources){
  assert.equal(sha(read(s.path)),s.sha256,'Current/build mismatch '+s.path);
  assert.equal(sha(read(`${testSnapshot}/${s.path}`)),s.sha256,'Test/build mismatch '+s.path);
}
const anchors=[];
for(const s of Object.values(json('web/lib/__tests__/fixtures/published-walks.provenance.json').sources)){
  const bytes=read(s.path); const hash=sha(bytes);
  assert.equal(hash,s.sha256,'STOP input hash mismatch '+s.path);
  assert.equal(bytes.length,s.bytes); anchors.push({path:s.path,bytes:bytes.length,sha256:hash});
}
const weightSha256=sha(read('pipeline/config/weights.yaml'));
assert.equal(weightSha256,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec','STOP weights hash mismatch');
assert.equal(git('diff','--name-only',base,'--','pipeline','raw','processed','checksums.json','web/public/data','qa/p6_*','qa/p7_*','qa/p8_*','qa/p9_*','qa/p10_*','qa/p11/d_*','qa/releases').toString().trim(),'','Protected tracked changes');
const integrity=spawnSync('python',['scripts/check_repo_integrity.py'],{cwd:root,windowsHide:true,encoding:'utf8',timeout:60000});
write('integrity.json',{command:'python scripts/check_repo_integrity.py',exitCode:integrity.status,signal:integrity.signal,stdout:integrity.stdout,stderr:integrity.stderr,error:integrity.error?.message});
process.stdout.write(integrity.stdout??''); assert.equal(integrity.status,0);
assert.ok(integrity.stdout.includes('repo_integrity=ok'));
const evidence='qa/verification/REVAMP-R1-core-walk.md';
const before=git('show',`${base}:${evidence}`),after=read(evidence);
assert.equal(Buffer.compare(before,after.subarray(0,before.length)),0,'Evidence exact prefix');
const ignored=spawnSync('git',['check-ignore','-v',evidence],{cwd:root,windowsHide:true,encoding:'utf8'});
assert.equal(ignored.status,1); assert.equal(git('ls-files','--',evidence).toString().trim(),evidence);
const browser=[];
for(const name of ['baseline-qjdNNL','baseline-946wHM','baseline-CbZaYK','treatment-N3VGwc']){
  const raw=read(`${prefix}/${name}/browser.json`),data=JSON.parse(raw);
  const compressed=gzipSync(raw);assert.equal(Buffer.compare(gunzipSync(compressed),raw),0);
  writeFileSync(resolve(out,name,'browser.json.gz'),compressed,{flag:'wx'});
  const {entries,...receipt}=data;
  write(`${name}/receipt.json`,{...receipt,rawTrace:{file:'browser.json.gz',rawBytes:raw.length,rawSha256:sha(raw),compressedBytes:compressed.length,compressedSha256:sha(compressed),entryCount:entries.length}});
  for(const sample of data.samples??[]){assert.equal(sha(read(`${prefix}/${name}/${sample.name}.png`)),sample.sha256);}
  browser.push({name,ok:data.ok,checks:data.checks?.length??0,passed:data.checks?.filter(x=>x.pass).length??0,captures:data.samples?.length??0,elapsedMs:data.elapsedMs,cleanup:data.cleanup?.verified,focus:data.focusObservations});
}
const treatment=json(`${prefix}/treatment-N3VGwc/browser.json`);
assert.equal(treatment.ok,true);assert.equal(treatment.checks.length,10);assert.equal(treatment.samples.length,7);assert.equal(treatment.cleanup.verified,true);
assert.equal(treatment.preview.buildId,build.buildId);
for(const sample of treatment.samples){assert.equal(sample.state.count,/^geometry-retry-/.test(sample.name)?0:4);}
for(const p of ['checks-1789287331052','checks-1789287367862','checks-1789287840210'])assert.equal(json(`${prefix}/${p}/result.json`).exitCode,0,p);
const full=read(`${prefix}/checks-1789287367862/stdout.txt`).toString();
assert.ok(full.includes('1925 passed (1925)'));assert.ok(full.includes('72 passed (72)'));assert.ok(full.includes('tests 42'));assert.ok(full.includes('pass 42'));
const isolation=JSON.parse(full.slice(full.lastIndexOf('\n{')+1));
assert.equal(isolation.guardProbePassed,true);assert.equal(isolation.productionDataDirectoryAbsent,true);assert.equal(isolation.exitCode,0);
const identity=await(await fetch('http://127.0.0.1:4414/__qa/status',{signal:AbortSignal.timeout(10000)})).json();
assert.equal(identity.buildId,build.buildId);assert.equal(identity.readOnlyData,true);
const served=Buffer.from(await(await fetch('http://127.0.0.1:4414/postplan.html',{signal:AbortSignal.timeout(10000)})).arrayBuffer());
assert.equal(sha(served),sha(read('postplan.html')),'Stale task board');
const summary={root,hostname:hostname(),base,createdAt:new Date().toISOString(),
  tests:{focused:{tests:104,files:3,receipt:'checks-1789287331052/result.json'},isolated:{tests:1925,files:72,arithmetic:'1916+9=1925;71+1=72',dependencyGuards:42,receipt:'checks-1789287367862/result.json',isolation},typeScript:{exitCode:0,receipt:'checks-1789287840210/result.json'},retainedPython:{tests:955,rerun:false}},
  browser,review:json(`${prefix}/review.json`),build:{buildId:build.buildId,exitCode:0,sourceStable:true,testAndCurrentAndBuildSources:build.sources.length,protectedDataAbsent:build.protectedDataAbsent,productionIdentityVerified:false},
  evidence:{path:evidence,tracked:true,checkIgnoreExit:ignored.status,previousBytes:before.length,previousSha256:sha(before),bytes:after.length,addedBytes:after.length-before.length,exactPrefix:true},
  anchors,weightSha256,preview:identity,taskBoard:{url:'http://127.0.0.1:4414/postplan.html',sha256:sha(served),matches:true},
  findings:['Three current Home controls dropped keyboard focus to BODY; all retain owned visible heading focus after repair.','Pending geometry retry falsely claimed missing publication; it now reports loading.','Nine new regression cases and controlled browser recovery pass; initial failures remain recorded.','Reporting, active maintenance, physical acceptance and exact deployment remain open.'],
  disagreements:['Focused headless keyboard acceptance is not native zoom, assistive technology, physical phone or full-release acceptance.','The nominal commit of a dirty old deployment does not recover its exact runtime bytes.'],pipelineRuns:0,pipelineSeconds:0,installations:0,deployments:0};
write('summary.json',summary);
const files=[];
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())walk(path);else{
  const name=relative(out,path).replaceAll('\\','/');
  if(name.endsWith('/browser.json')||['preview.stdout.txt','preview.stderr.txt','next-2.stdout.txt','next-2.stderr.txt'].includes(name))continue;
  const bytes=readFileSync(path);files.push({path:`${prefix}/${name}`,bytes:bytes.length,sha256:sha(bytes)});
}}}
walk(out);write('artifact-index.json',{files});
write('stage-paths.json',[...files.map(f=>f.path),`${prefix}/artifact-index.json`,`${prefix}/stage-paths.json`]);
console.log(JSON.stringify({tests:summary.tests,build:summary.build,evidence:summary.evidence,browser:browser.map(({focus,...r})=>r),anchors:anchors.length,taskBoard:summary.taskBoard},null,2));
