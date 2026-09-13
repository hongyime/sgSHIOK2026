import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { resolve, relative } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const base='021d5dfc070fb0d8721a4d2cf5aa8f9db2303234',prefix='qa/revamp-r1/native-zoom-20260913',out=resolve(root,prefix);
const read=p=>readFileSync(resolve(root,p)),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const write=(p,v)=>writeFileSync(resolve(out,p),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true});
const build=json(`${prefix}/build-1/build.json`);assert.equal(build.exitCode,0);assert.equal(build.sourceStable,true);
const full=read(`${prefix}/checks-1789290961142/stdout.txt`).toString(),isolation=JSON.parse(full.slice(full.lastIndexOf('\n{')+1));
assert.ok(full.includes('1930 passed (1930)'));assert.ok(full.includes('72 passed (72)'));assert.ok(full.includes('tests 42')&&full.includes('pass 42'));
assert.equal(isolation.exitCode,0);assert.equal(isolation.guardProbePassed,true);assert.equal(isolation.productionDataDirectoryAbsent,true);
for(const s of build.sources){assert.equal(sha(read(s.path)),s.sha256,s.path);assert.equal(sha(readFileSync(resolve(isolation.snapshot,s.path))),s.sha256,'Test snapshot '+s.path);}
assert.equal(git('diff','--name-only',base,'--','pipeline','raw','processed','checksums.json','web/public/data','qa/p6_*','qa/p7_*','qa/p8_*','qa/p9_*','qa/p10_*','qa/p11/d_*','qa/releases').toString().trim(),'');
const anchors=[];for(const s of Object.values(json('web/lib/__tests__/fixtures/published-walks.provenance.json').sources)){const b=read(s.path);assert.equal(sha(b),s.sha256,'STOP input hash mismatch '+s.path);assert.equal(b.length,s.bytes);anchors.push({path:s.path,bytes:b.length,sha256:sha(b)});}
const weightSha256=sha(read('pipeline/config/weights.yaml'));assert.equal(weightSha256,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec','STOP weights hash mismatch');
const checks=readdirSync(out,{withFileTypes:true}).filter(e=>e.isDirectory()&&e.name.startsWith('checks-')).map(e=>({path:e.name,...json(`${prefix}/${e.name}/result.json`)}));
for(const r of checks)assert.equal(r.exitCode,0,r.path);
assert.ok(checks.some(r=>r.command.some(c=>c.endsWith('/tsc')||c.endsWith('tsc'))||r.command.some(c=>c.endsWith('typescript/bin/tsc'))),'TypeScript receipt');
const integrity=spawnSync('python',['scripts/check_repo_integrity.py'],{cwd:root,windowsHide:true,encoding:'utf8',timeout:60000});
write('integrity.json',{command:'python scripts/check_repo_integrity.py',exitCode:integrity.status,stdout:integrity.stdout,stderr:integrity.stderr,error:integrity.error?.message});process.stdout.write(integrity.stdout??'');assert.equal(integrity.status,0);assert.ok(integrity.stdout.includes('repo_integrity=ok'));
const evidence='qa/verification/REVAMP-R1-core-walk.md',before=git('show',`${base}:${evidence}`),after=read(evidence);assert.equal(Buffer.compare(before,after.subarray(0,before.length)),0,'Evidence exact prefix');
const ignore=spawnSync('git',['check-ignore','-v',evidence],{cwd:root,windowsHide:true,encoding:'utf8'});assert.equal(ignore.status,1);assert.equal(git('ls-files','--',evidence).toString().trim(),evidence);
const browsers=[];for(const e of readdirSync(out,{withFileTypes:true}).filter(e=>e.isDirectory()&&/^zoom(?:100|200)-/.test(e.name))){
  const raw=read(`${prefix}/${e.name}/browser.json`),data=JSON.parse(raw),gz=gzipSync(raw);assert.equal(Buffer.compare(gunzipSync(gz),raw),0);
  writeFileSync(resolve(out,e.name,'browser.json.gz'),gz,{flag:'wx'});
  const {entries,...receipt}=data;write(`${e.name}/receipt.json`,{...receipt,rawTrace:{file:'browser.json.gz',bytes:raw.length,sha256:sha(raw),compressedBytes:gz.length,compressedSha256:sha(gz),entries:entries.length}});
  for(const s of data.samples??[])assert.equal(sha(read(`${prefix}/${e.name}/${s.name}.png`)),s.sha256,s.name);
  browsers.push({path:e.name,ok:data.ok,checks:data.checks?.length??0,passed:data.checks?.filter(c=>c.pass).length??0,captures:data.samples?.length??0,buildId:data.preview?.buildId,elapsedMs:data.elapsedMs,cleanup:data.cleanup?.verified,zoom:data.nativeZoom,resetFocus:data.resetFocus?{tag:data.resetFocus.tag,text:['BODY','HTML'].includes(data.resetFocus.tag)?'[page body; full raw value retained in trace]':data.resetFocus.text,visible:data.resetFocus.visible,focusVisible:data.resetFocus.focusVisible}:null,returnedSectionFocus:data.returnedSectionFocus});
}
const treatment=browsers.filter(b=>b.buildId===build.buildId);assert.ok(treatment.some(b=>b.ok&&b.zoom.requestedPercent===200&&b.returnedSectionFocus?.visible&&b.resetFocus?.tag==='H2'));assert.ok(treatment.some(b=>b.ok&&b.zoom.requestedPercent===100&&b.resetFocus?.tag==='H2'));
assert.ok(treatment.every(b=>b.ok&&b.cleanup));
const preview=await(await fetch('http://127.0.0.1:4416/__qa/status',{signal:AbortSignal.timeout(10000)})).json();assert.equal(preview.buildId,build.buildId);assert.equal(preview.readOnlyData,true);
const served=Buffer.from(await(await fetch('http://127.0.0.1:4416/postplan.html',{signal:AbortSignal.timeout(10000)})).arrayBuffer());assert.equal(sha(served),sha(read('postplan.html')),'Task board identity');
const summary={root,hostname:hostname(),base,createdAt:new Date().toISOString(),tests:{focused:{tests:179,files:4,receipt:'checks-1789290903372/result.json'},isolated:{tests:1930,files:72,dependencyGuards:42,arithmetic:'1925+5=1930;72+0=72',isolation,receipt:'checks-1789290961142/result.json'},checks,retainedPython:{tests:955,rerun:false}},build:{buildId:build.buildId,sources:build.sources.length,currentTestAndBuildMatch:true},browsers,review:json(`${prefix}/review.json`),method:json(`${prefix}/method.json`),evidence:{path:evidence,tracked:true,checkIgnoreExit:ignore.status,previousBytes:before.length,previousSha256:sha(before),bytes:after.length,addedBytes:after.length-before.length,exactPrefix:true},anchors,weightSha256,preview,taskBoard:{url:'http://127.0.0.1:4416/postplan.html',sha256:sha(served)},findings:['Default reset dropped focus to BODY; now moves owned focus synchronously to the surviving heading.','Back to walk focused a clipped summary at200%; native focus scrolling fixes it.','The earlier42green checks missed the clipped-focus defect; raw failed and insufficient attempts remain preserved.','Real services, physical-device acceptance and exact release gates are still open.'],disagreements:['A headless native page-zoom setup is not a same-document keyboard/menu zoom change, real device or screen-reader result.','Feature counts and focus-visible flags alone cannot establish unobscured pixels.'],pipelineRuns:0,pipelineSeconds:0,installations:0,deployments:0};
write('summary.json',summary);
const files=[];function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=resolve(dir,e.name);if(e.isDirectory())walk(p);else{const n=relative(out,p).replaceAll('\\','/');if(n.endsWith('/browser.json')||['preview.stdout.txt','preview.stderr.txt','next-2.stdout.txt','next-2.stderr.txt'].includes(n))continue;const b=readFileSync(p);files.push({path:`${prefix}/${n}`,bytes:b.length,sha256:sha(b)});}}}walk(out);
write('artifact-index.json',{files});write('stage-paths.json',[...files.map(f=>f.path),`${prefix}/artifact-index.json`,`${prefix}/stage-paths.json`]);
console.log(JSON.stringify({tests:{focused:179,isolated:1930,files:72,dependencyGuards:42},build:summary.build,evidence:summary.evidence,browser:browsers.map(({zoom,resetFocus,returnedSectionFocus,...b})=>b),anchors:anchors.length,taskBoard:summary.taskBoard},null,2));
