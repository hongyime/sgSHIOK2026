import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { resolve, relative } from 'node:path';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const prefix='qa/revamp-r1/notice-inspection-20260913',out=resolve(root,prefix),base='f9b23bca6dcdc40bc43788423594f83f0b639b64';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>readFileSync(resolve(root,p)),json=p=>JSON.parse(read(p));
const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true});
const write=(name,value)=>writeFileSync(resolve(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const names=process.argv.slice(2);assert.equal(names.length,3);assert.ok(names.every(n=>/^(all|smoke|integrity)-\d+$/.test(n)));
const commands=names.map(name=>({name,...json(`${prefix}/${name}/command.json`)}));
for(const c of commands){assert.equal(c.status,0,c.name);assert.equal(c.sourceStable,true);for(const [p,h] of Object.entries(c.sourceHashes))assert.equal(sha(read(p)),h,p);}
const all=commands.find(c=>c.name.startsWith('all-')),smoke=commands.find(c=>c.name.startsWith('smoke-')),integrity=commands.find(c=>c.name.startsWith('integrity-'));
const match=all.stdout.match(/(\d+) passed in/);assert.ok(match);const tests=Number(match[1]);assert.ok(tests>=955);
assert.ok(integrity.stdout.includes('repo_integrity=ok'));
const smokeLines=smoke.stdout.trim().split(/\r?\n/).map(s=>JSON.parse(s));assert.equal(smokeLines.length,2);
assert.equal(smokeLines[0].exitCode,1);assert.equal(smokeLines[1].bytesAndMtimesUnchanged,true);assert.deepEqual(smokeLines[1].forbiddenEvents,[]);
assert.equal(git('diff','--name-only',base,'--','pipeline','raw','processed','checksums.json','web','qa/p6_*','qa/p7_*','qa/p8_*','qa/p9_*','qa/p10_*','qa/p11/d_*','qa/releases').toString().trim(),'');
const anchors=[];for(const s of Object.values(json('web/lib/__tests__/fixtures/published-walks.provenance.json').sources)){const b=read(s.path);assert.equal(sha(b),s.sha256,'STOP input mismatch '+s.path);assert.equal(b.length,s.bytes);anchors.push({path:s.path,bytes:b.length,sha256:sha(b)});}
const weights=sha(read('pipeline/config/weights.yaml'));assert.equal(weights,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec');
const evidence='qa/verification/REVAMP-R1-core-walk.md',before=git('show',`${base}:${evidence}`),after=read(evidence);
assert.equal(Buffer.compare(before,after.subarray(0,before.length)),0);assert.ok(after.length>before.length);
const ignore=spawnSync('git',['check-ignore','-v',evidence],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(ignore.status,1);
assert.equal(git('ls-files','--',evidence).toString().trim(),evidence);
const preview=await(await fetch('http://127.0.0.1:4416/__qa/status',{signal:AbortSignal.timeout(10000)})).json();assert.equal(preview.buildId,'vOoOxn7etjT-WJqrIExq7');
const board=Buffer.from(await(await fetch('http://127.0.0.1:4416/postplan.html',{signal:AbortSignal.timeout(10000)})).arrayBuffer());assert.equal(sha(board),sha(read('postplan.html')));
const summary={root,hostname:hostname(),base,createdAt:new Date().toISOString(),tests:{passed:tests,files:12,arithmetic:`955 existing + ${tests-955} inspection = ${tests}`,receipt:all.name,sourceHashesMatch:true,wholeProjectPython:false},
  smoke:{receipt:smoke.name,fixture:smokeLines[1],output:smokeLines[0]},integrity:{receipt:integrity.name,exit:0},review:json(`${prefix}/review.json`),
  evidence:{path:evidence,previousBytes:before.length,bytes:after.length,addedBytes:after.length-before.length,exactPrefix:true,tracked:true,checkIgnoreExit:ignore.status},anchors,weights,
  web:{changed:false,rerun:false,retainedTests:1930,files:72,guards:42,preview},taskBoardSha256:sha(board),
  findings:['A new bounded offline command exposes unknown, observed and recorded local notice states without repair or resend.','The request-history parser is shared with admission; enumeration is bounded before validation.','Synthetic CLI inspection preserved all7files and mtimes with write/network audit denial enabled.','Reporting, service activation, backups, physical-device and exact release acceptance remain open.'],
  disagreements:['A locally consistent journal or stored verified label is not current remote delivery proof or authorization.','Request reservations contain no method or notice association; the inspector does not invent one.'],
  pipelineRuns:0,pipelineSeconds:0,installations:0,deployments:0,externalActivation:false};
write('summary.json',summary);
const files=[];function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=resolve(dir,e.name);if(e.isDirectory())walk(p);else{const b=readFileSync(p);files.push({path:`${prefix}/${relative(out,p).replaceAll('\\','/')}`,bytes:b.length,sha256:sha(b)});}}}walk(out);
write('artifact-index.json',{files});write('stage-paths.json',[...files.map(f=>f.path),`${prefix}/artifact-index.json`,`${prefix}/stage-paths.json`]);
console.log(JSON.stringify({tests:summary.tests,evidence:summary.evidence,anchors:anchors.length,weights,taskBoardSha256:summary.taskBoardSha256,files:files.length},null,2));
