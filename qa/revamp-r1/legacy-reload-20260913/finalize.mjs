import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { hostname } from 'node:os';
import { resolve, relative } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import { publicTrace } from './publish-trace.mjs';

const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const base='88e7ae5ca7761cf1e1219f859fd2a88e9fc97ad4';
const prefix='qa/revamp-r1/legacy-reload-20260913',out=resolve(root,prefix);
const read=p=>readFileSync(resolve(root,p)),json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const write=(p,value)=>writeFileSync(resolve(out,p),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true,maxBuffer:32*1024*1024});
assert.equal(git('rev-parse','HEAD').toString().trim(),base);
assert.equal(git('rev-parse','origin/main').toString().trim(),base);
const previous='qa/revamp-r1/selection-recovery-20260913';
const build=json(`${previous}/build-2/build.json`),full=json(`${previous}/checks-lnq1fY/result.json`);
const stdout=read(`${previous}/checks-lnq1fY/stdout.txt`).toString();
assert.equal(build.exitCode,0);assert.equal(full.exitCode,0);
assert.ok(stdout.includes('1945 passed (1945)')&&stdout.includes('72 passed (72)'));
assert.ok(stdout.includes('tests 42')&&stdout.includes('pass 42'));
const isolation=JSON.parse(stdout.slice(stdout.lastIndexOf('\n{')+1));
assert.equal(isolation.guardProbePassed,true);assert.equal(isolation.productionDataDirectoryAbsent,true);
for(const s of build.sources){assert.equal(sha(read(s.path)),s.sha256,s.path);assert.equal(sha(readFileSync(resolve(isolation.snapshot,s.path))),s.sha256,'Test snapshot '+s.path);}
for(const s of full.sources)assert.equal(sha(read(s.path)),s.sha256,s.path);
const types=json(`${previous}/checks-1l0OqM/result.json`);assert.equal(types.exitCode,0);
const protectedDiff=git('diff','--name-only',base,'--','pipeline','raw','processed','checksums.json','web/public/data','qa/p6_*','qa/p7_*','qa/p8_*','qa/p9_*','qa/p10_*','qa/p11/d_*','qa/releases').toString();
assert.equal(protectedDiff.trim(),'');
const anchors=Object.values(json('web/lib/__tests__/fixtures/published-walks.provenance.json').sources).map(s=>{
  const b=read(s.path);assert.equal(sha(b),s.sha256,'STOP input hash mismatch '+s.path);assert.equal(b.length,s.bytes);return{path:s.path,sha256:sha(b),bytes:b.length};
});
const weightSha256=sha(read('pipeline/config/weights.yaml'));assert.equal(weightSha256,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec','STOP weights mismatch');
const checks=json(`${prefix}/checks-v2-1789309002730.json`);assert.equal(checks.exitCode,0);
assert.ok(checks.stdout.includes('tests 15')&&checks.stdout.includes('pass 15'));
for(const s of checks.sources)assert.equal(sha(read(`${prefix}/${s.path}`)),s.sha256,s.path);
assert.equal(sha(read(`${prefix}/red-budget-server.mjs`)),'926164d9e5d0d30b5a65bdf7da0b2574aec700979f8dfd67b4b59ae9bdb995c1');
function run(name,command,args){
  const start=Date.now(),r=spawnSync(command,args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024});
  const result={command:[command,...args],exitCode:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.message,elapsedMs:Date.now()-start};write(name+'.json',result);assert.equal(r.status,0,name);return result;
}
const publication=run('publication-tests',process.execPath,['--test',resolve(out,'publish-trace.test.mjs')]);
assert.ok(publication.stdout.includes('tests 2')&&publication.stdout.includes('pass 2'));
const integrity=run('integrity','python',['-B','scripts/check_repo_integrity.py']);assert.ok(integrity.stdout.includes('repo_integrity=ok'));
const evidence='qa/verification/REVAMP-R1-core-walk.md',before=git('show',`${base}:${evidence}`),after=read(evidence);
assert.equal(before.length,410901);assert.equal(sha(before),'d960e21409b0e900ec608cc84ad240d13f9ae1a12410f425fc2068d9f3bbd9e7');
assert.equal(Buffer.compare(before,after.subarray(0,before.length)),0,'Exact evidence prefix');assert.ok(after.length>before.length);
assert.ok(after.subarray(before.length).includes('FINDINGS')&&after.subarray(before.length).includes('DISAGREEMENTS'));
const ignore=spawnSync('git',['check-ignore','-v',evidence,`${prefix}/summary.json`],{cwd:root,windowsHide:true,encoding:'utf8'});
assert.equal(ignore.status,1);assert.equal(git('ls-files','--',evidence).toString().trim(),evidence);
write('tracking.json',{command:['git','check-ignore','-v',evidence,`${prefix}/summary.json`],exitCode:ignore.status,stdout:ignore.stdout,stderr:ignore.stderr,evidenceTracked:true,newArtifacts:'Explicit staging/index verification follows; ignore exit alone is not tracking'});

const browsers=[];
for(const directory of ['observed-x7tWuN','corrected-OZc1mz']){
  const raw=read(`${prefix}/${directory}/browser.json`),data=JSON.parse(raw),supervisor=json(`${prefix}/${directory}/supervisor.json`);
  assert.equal(data.ok,false);assert.equal(supervisor.exitCode,1);assert.equal(supervisor.cleanup.verified,true);assert.ok(supervisor.elapsedMs<300000);assert.equal(data.anchorsUnchanged,true);
  const published=publicTrace(data),bytes=Buffer.from(JSON.stringify(published.trace,null,2)+'\n'),gz=gzipSync(bytes);
  assert.equal(Buffer.compare(gunzipSync(gz),bytes),0);
  writeFileSync(resolve(out,directory,'browser.public.json.gz'),gz,{flag:'wx'});
  const rawIdentity={bytes:raw.length,sha256:sha(raw),published:false,reason:'Third-party cookie/address headers; original stays local untracked'};
  const publicIdentity={file:'browser.public.json.gz',bytes:bytes.length,sha256:sha(bytes),compressedBytes:gz.length,compressedSha256:sha(gz),redactions:published.redactions};
  const {events,...receipt}=published.trace;write(`${directory}/receipt.json`,{...receipt,rawIdentity,publicIdentity,eventCount:events.length});
  const captures=readdirSync(resolve(out,directory)).filter(name=>name.endsWith('.png')).map(name=>{
    const b=read(`${prefix}/${directory}/${name}`),bracket=data.captures.find(c=>c.name+'.png'===name);
    if(bracket)assert.equal(sha(b),bracket.sha256);
    return{path:`${directory}/${name}`,bytes:b.length,sha256:sha(b),parentInspected:true,peerInspected:directory==='corrected-OZc1mz',completedBracket:!!bracket};
  });
  browsers.push({directory,ok:data.ok,phase:data.phase,failure:data.failure,failureCaptureError:data.failureCaptureError,checks:data.checks.length,passed:data.checks.filter(c=>c.pass).length,releaseSwitches:data.server.releaseSwitches,driverMs:data.elapsedMs,supervisorMs:supervisor.elapsedMs,cleanup:supervisor.cleanup.verified,chromeTerminal:data.chromeTerminal,finalBoundsClear:data.finalBoundsClear??null,captures,rawIdentity,publicIdentity});
}
assert.equal(browsers[0].checks,6);assert.equal(browsers[0].passed,5);
assert.equal(browsers[1].checks,5);assert.equal(browsers[1].passed,5);assert.equal(browsers[1].releaseSwitches,0);
assert.equal(browsers[1].finalBoundsClear,true);assert.equal(browsers[1].captures.length,1);assert.equal(browsers[1].captures[0].completedBracket,false);
const preview=await(await fetch('http://127.0.0.1:4420/__qa/status',{signal:AbortSignal.timeout(10000)})).json();assert.equal(preview.buildId,build.buildId);assert.equal(preview.readOnlyData,true);
const served=Buffer.from(await(await fetch('http://127.0.0.1:4420/postplan.html',{signal:AbortSignal.timeout(10000)})).arrayBuffer());assert.equal(sha(served),sha(read('postplan.html')));
const findings=[
  'Actual old search persists postal; old worker navigation root fetch requires browser Document identity proof, not backend destination metadata.',
  'Two failed browser attempts remain distinct. Corrected old-document observation stopped before release switch. No returning-client PASS.',
  'Review repaired harness budget, shutdown, capture and document-binding defects; current app code unchanged.',
  'Real reporting, maintenance activation, expanded coverage, device and exact-release approval remain open; goal ACTIVE.'
];
const disagreements=[
  'Runtime.evaluate timeout does not identify a worker or hardware-only root cause.',
  'Local tests and partial screenshots do not complete services or authorize deployment.'
];
const summary={root,hostname:hostname(),base,createdAt:new Date().toISOString(),goal:'ACTIVE',productSourceChanges:0,browserAcceptance:false,
  tests:{harness:15,publication:2,arithmetic:'15+2=17 final offline diagnostics; earlier5/5,13/14and14/14 retained separately',retainedWeb:{tests:1945,files:72,dependencyGuards:42,rerun:false,receipt:`${previous}/checks-lnq1fY/result.json`},retainedPython:{tests:1012,files:12,rerun:false},typesExit:types.exitCode,integrityExit:integrity.exitCode},
  build:{buildId:build.buildId,sources:build.sources.length,currentTestAndBuildMatch:true,deploymentIdentityVerified:false},browsers,browserArithmetic:'52.222+67.806=120.028 supervisor seconds;2+1=3 images; no accepted browser',
  evidence:{path:evidence,previousBytes:before.length,previousSha256:sha(before),bytes:after.length,addedBytes:after.length-before.length,exactPrefix:true},anchors,weightSha256,preview,taskBoard:{url:'http://127.0.0.1:4420/postplan.html',sha256:sha(served)},review:json(`${prefix}/review.json`),method:json(`${prefix}/method.json`),findings,disagreements,pipelineRuns:0,pipelineSeconds:0,installations:0,deployments:0};
write('summary.json',summary);
const files=[];
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const path=resolve(dir,e.name);if(e.isDirectory())walk(path);else{
  const name=relative(out,path).replaceAll('\\','/');if(name.endsWith('/browser.json'))continue;
  const bytes=readFileSync(path);files.push({path:`${prefix}/${name}`,bytes:bytes.length,sha256:sha(bytes)});
}}}
walk(out);write('artifact-index.json',{files});write('stage-paths.json',[...files.map(f=>f.path),`${prefix}/artifact-index.json`,`${prefix}/stage-paths.json`]);
console.log(JSON.stringify({diagnostics:17,browsers:browsers.map(({directory,ok,checks,passed,releaseSwitches,captures})=>({directory,ok,checks,passed,releaseSwitches,images:captures.length})),evidence:summary.evidence,sourceCount:build.sources.length,anchors:anchors.length,integrityExit:integrity.exitCode,checkIgnoreExit:ignore.status,artifactCount:files.length,taskBoard:summary.taskBoard},null,2));
