import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { resolve, relative } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const base='06953fd873e39d08392c171437e4cc7963155dbf',prefix='qa/revamp-r1/selection-recovery-20260913',out=resolve(root,prefix);
const read=p=>readFileSync(resolve(root,p)),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const write=(p,value)=>writeFileSync(resolve(out,p),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true,maxBuffer:32*1024*1024});
assert.equal(git('rev-parse','HEAD').toString().trim(),base);
const build=json(`${prefix}/build-2/build.json`),full=json(`${prefix}/checks-lnq1fY/result.json`);
assert.equal(build.exitCode,0);assert.equal(build.sourceStable,true);assert.equal(full.exitCode,0);
const stdout=read(`${prefix}/checks-lnq1fY/stdout.txt`).toString();
assert.ok(stdout.includes('1945 passed (1945)')&&stdout.includes('72 passed (72)'));
assert.ok(stdout.includes('tests 42')&&stdout.includes('pass 42')&&stdout.includes('skipped 0'));
const isolation=JSON.parse(stdout.slice(stdout.lastIndexOf('\n{')+1));
assert.equal(isolation.exitCode,0);assert.equal(isolation.guardProbePassed,true);assert.equal(isolation.productionDataDirectoryAbsent,true);
for(const s of build.sources){assert.equal(sha(read(s.path)),s.sha256,s.path);assert.equal(sha(readFileSync(resolve(isolation.snapshot,s.path))),s.sha256,'Isolated test source '+s.path);}
for(const s of full.sources)assert.equal(sha(read(s.path)),s.sha256,s.path);
const types=json(`${prefix}/checks-1l0OqM/result.json`);assert.equal(types.exitCode,0);
assert.equal(git('diff','--name-only',base,'--','pipeline','raw','processed','checksums.json','web/public/data','qa/p6_*','qa/p7_*','qa/p8_*','qa/p9_*','qa/p10_*','qa/p11/d_*','qa/releases').toString().trim(),'');
const anchors=[];for(const s of Object.values(json('web/lib/__tests__/fixtures/published-walks.provenance.json').sources)){
  const bytes=read(s.path);assert.equal(sha(bytes),s.sha256,'STOP input hash mismatch '+s.path);assert.equal(bytes.length,s.bytes);anchors.push({path:s.path,bytes:bytes.length,sha256:sha(bytes)});
}
const weightSha256=sha(read('pipeline/config/weights.yaml'));assert.equal(weightSha256,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec','STOP weights hash mismatch');
const evidence='qa/verification/REVAMP-R1-core-walk.md',before=git('show',`${base}:${evidence}`),after=read(evidence);
assert.equal(before.length,405838);assert.equal(sha(before),'b5522b274c538d83a86344b73a65486521549d0a7d5a5f33c8ef88de6763ad8e');
assert.equal(Buffer.compare(before,after.subarray(0,before.length)),0,'Exact evidence prefix');
assert.ok(after.length>before.length);assert.ok(after.subarray(before.length).includes('FINDINGS'));assert.ok(after.subarray(before.length).includes('DISAGREEMENTS'));
const ignore=spawnSync('git',['check-ignore','-v',evidence,`${prefix}/summary.json`],{cwd:root,windowsHide:true,encoding:'utf8'});
assert.equal(ignore.status,1);assert.equal(git('ls-files','--',evidence).toString().trim(),evidence);
write('tracking.json',{checkIgnoreCommand:['git','check-ignore','-v',evidence,`${prefix}/summary.json`],exitCode:ignore.status,stdout:ignore.stdout,stderr:ignore.stderr,evidenceTracked:true,newSummaryTracking:'Explicit staging and index verification follow; ignore exit alone does not establish tracking'});
function run(name,command,args){const started=Date.now(),r=spawnSync(command,args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024});const value={command:[command,...args],exitCode:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.message,elapsedMs:Date.now()-started};write(name+'.json',value);assert.equal(r.status,0,name);return value;}
const diagnostic=run('diagnostic-tests',process.execPath,['--test',`${prefix}/focus-geometry.test.mjs`]);
assert.ok(diagnostic.stdout.includes('tests 6')&&diagnostic.stdout.includes('pass 6'));
const integrity=run('integrity','python',['-B','scripts/check_repo_integrity.py']);assert.ok(integrity.stdout.includes('repo_integrity=ok'));
const directViews=[...['retry-before','retry-pending','retry-recovered','metrics-0','metrics-1','metrics-2','metrics-3','walk-controls-return'].map(name=>`observed-vqv2K4/${name}.png`),...['walk-controls-return','active-bus-focus','keyboard-map','keyboard-exit'].map(name=>`corrected-6kmGYF/${name}.png`)];
const inspected=new Map(directViews.map(p=>[sha(read(`${prefix}/${p}`)),p]));
const browsers=[];
for(const directory of ['observed-vqv2K4','corrected-6kmGYF']){
  const raw=read(`${prefix}/${directory}/browser.json`),data=JSON.parse(raw),gz=gzipSync(raw),supervisor=json(`${prefix}/${directory}/supervisor.json`);
  assert.equal(Buffer.compare(gunzipSync(gz),raw),0);assert.equal(supervisor.cleanup.verified,true);assert.ok(supervisor.elapsedMs<=360000);assert.equal(data.anchorsUnchanged,true);
  writeFileSync(resolve(out,directory,'browser.json.gz'),gz,{flag:'wx'});
  const {entries,...receipt}=data;
  const captures=(data.samples??[]).map(s=>{const bytes=read(`${prefix}/${directory}/${s.name}.png`);assert.equal(sha(bytes),s.sha256);assert.ok(inspected.has(s.sha256),'Uninspected pixels '+s.name);return{name:s.name,bytes:bytes.length,sha256:s.sha256,inspectedPixelsAt:inspected.get(s.sha256),method:directViews.includes(`${directory}/${s.name}.png`)?'direct parent view':'byte-identical to parent-viewed image'};});
  write(`${directory}/receipt.json`,{...receipt,rawTrace:{file:'browser.json.gz',bytes:raw.length,sha256:sha(raw),compressedBytes:gz.length,compressedSha256:sha(gz),entries:entries.length}});
  browsers.push({directory,ok:data.ok,checks:data.checks.length,passed:data.checks.filter(c=>c.pass).length,errors:data.errors.length,denied:data.denied.length,buildId:data.preview.buildId,supervisorMs:supervisor.elapsedMs,cleanup:supervisor.cleanup.verified,captures,readMetrics:data.readMetrics,camera:data.camera});
}
assert.equal(browsers[0].ok,false);assert.equal(browsers[0].passed,9);
assert.equal(browsers[1].ok,true);assert.equal(browsers[1].checks,20);assert.equal(browsers[1].passed,20);assert.equal(browsers[1].buildId,build.buildId);assert.equal(browsers[1].errors,0);
const preview=await(await fetch('http://127.0.0.1:4420/__qa/status',{signal:AbortSignal.timeout(10000)})).json();assert.equal(preview.buildId,build.buildId);assert.equal(preview.readOnlyData,true);
const served=Buffer.from(await(await fetch('http://127.0.0.1:4420/postplan.html',{signal:AbortSignal.timeout(10000)})).arrayBuffer());assert.equal(sha(served),sha(read('postplan.html')));
const findings=['Retry selection/map could remove owned keyboard focus; fixed synchronously without stealing focus from async completions.','Peer screenshot review found clipped segmented focus rings; contrasting inset ring now visible on MRT and active Bus.','Corrected20check native200% browser proves retry, complete metric reading and camera navigation; failed first attempt retained.','Reporting/maintenance activation, missing route coverage, real-device and exact-release gates remain open; goal ACTIVE.'];
const disagreements=['Computed focus-visible is not pixel visibility, and a clipped canvas border can still have a visible inset ring.','Local tests and a desktop browser pass do not constitute working public services or deployment approval.'];
const summary={root,hostname:hostname(),base,createdAt:new Date().toISOString(),tests:{isolated:{tests:1945,files:72,dependencyGuards:42,arithmetic:'1930+14+1=1945;72+0=72',isolation,receipt:'checks-lnq1fY/result.json'},focused:{beforeCss:{tests:193,files:4,receipt:'checks-A2FGsU/result.json'},finalCss:{tests:47,files:1,receipt:'checks-A0kQ3c/result.json'}},diagnostic:6,typesExit:types.exitCode,retainedPython:{tests:1012,files:12,rerun:false}},build:{buildId:build.buildId,sources:build.sources.length,currentTestAndBuildMatch:true,deploymentIdentityVerified:false},browsers,browserArithmetic:'71.310+26.273=97.583seconds;8+15=23captures;12directviews plus exact-byte duplicates',review:json(`${prefix}/review.json`),method:json(`${prefix}/method.json`),evidence:{path:evidence,previousBytes:before.length,previousSha256:sha(before),bytes:after.length,addedBytes:after.length-before.length,exactPrefix:true},anchors,weightSha256,preview,taskBoard:{url:'http://127.0.0.1:4420/postplan.html',sha256:sha(served)},findings,disagreements,pipelineRuns:0,pipelineSeconds:0,installations:0,deployments:0};
write('summary.json',summary);
const files=[];
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const path=resolve(dir,e.name);if(e.isDirectory())walk(path);else{const name=relative(out,path).replaceAll('\\','/');if(name.endsWith('/browser.json')||/^(?:preview(?:-\d+)?|next-\d+)\.(?:stdout|stderr)\.txt$/.test(name))continue;const bytes=readFileSync(path);files.push({path:`${prefix}/${name}`,bytes:bytes.length,sha256:sha(bytes)});}}}
walk(out);write('artifact-index.json',{files});write('stage-paths.json',[...files.map(f=>f.path),`${prefix}/artifact-index.json`,`${prefix}/stage-paths.json`]);
console.log(JSON.stringify({tests:1945,files:72,guards:42,diagnostic:6,build:build.buildId,sourceCount:build.sources.length,browsers:browsers.map(({directory,ok,checks,passed,captures})=>({directory,ok,checks,passed,captures:captures.length})),evidence:summary.evidence,artifactCount:files.length,integrityExit:integrity.exitCode,checkIgnoreExit:ignore.status},null,2));
