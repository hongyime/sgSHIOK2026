import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { resolve, relative } from 'node:path';
const root='C:\\sgSHIOK2026'; assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const base='5e15a36437910e2a35001234c122e7a9c9fff39d';
const prefix='qa/revamp-r1/production-runtime-20260913',out=resolve(root,prefix),capture=resolve(out,'capture-1789294685168');
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>readFileSync(resolve(root,p)),json=p=>JSON.parse(read(p));
const local=p=>JSON.parse(readFileSync(resolve(capture,p)));
const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true});
const write=(name,value)=>writeFileSync(resolve(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const receipt=local('response.json'),html=readFileSync(resolve(capture,'index.html'));
assert.equal(sha(html),receipt.sha256);assert.equal(html.length,12827);
const authorized=json(`${prefix}/authorized-deployment-response.json`),unique=Buffer.from(authorized.text,'utf8');
assert.equal(authorized.status,200);assert.ok(unique.equals(html));
const phases=['initial-assets.json','dependencies.json','dependencies-reviewed.json'].map(p=>({path:p,...local(p)}));
assert.equal(phases[0].ok,true);assert.equal(phases[1].ok,false);assert.equal(phases[2].ok,false);
const files=[],paths=new Set();
for(const phase of phases)for(const r of phase.responses.filter(r=>r.file)){
  const b=readFileSync(resolve(capture,r.file));assert.equal(b.length,r.decodedBytes);assert.equal(sha(b),r.sha256,'STOP captured bytes mismatch '+r.file);
  const path=new URL(r.url).pathname;assert.ok(!paths.has(path));paths.add(path);
  files.push({path,bytes:b.length,sha256:sha(b),receipt:phase.path,file:r.file});
}
assert.equal(files.length,24);const totalBytes=files.reduce((n,r)=>n+r.bytes,0);assert.equal(totalBytes,5271035);
const failed=phases.flatMap(p=>p.responses.filter(r=>!r.file).map(r=>({phase:p.path,path:new URL(r.url).pathname,status:r.status})));
assert.equal(failed.length,2);assert.ok(failed.every(r=>r.status===404));
const integrity=spawnSync('python',['-B','scripts/check_repo_integrity.py'],{cwd:root,encoding:'utf8',windowsHide:true,timeout:30000});
write('integrity.json',{command:'python -B scripts/check_repo_integrity.py',status:integrity.status,stdout:integrity.stdout,stderr:integrity.stderr});
assert.equal(integrity.status,0);assert.ok(integrity.stdout.includes('repo_integrity=ok'));
const protectedDiff=git('diff','--name-only',base,'--','pipeline','raw','processed','checksums.json','web','qa/p6_*','qa/p7_*','qa/p8_*','qa/p9_*','qa/p10_*','qa/p11/d_*','qa/releases').toString().trim();assert.equal(protectedDiff,'');
const anchors=[];for(const s of Object.values(json('web/lib/__tests__/fixtures/published-walks.provenance.json').sources)){
  const b=read(s.path);assert.equal(sha(b),s.sha256,'STOP input mismatch '+s.path);assert.equal(b.length,s.bytes);anchors.push({path:s.path,bytes:b.length,sha256:sha(b)});
}
const weights=sha(read('pipeline/config/weights.yaml'));assert.equal(weights,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec');
const evidence='qa/verification/REVAMP-R1-core-walk.md',before=git('show',`${base}:${evidence}`),after=read(evidence);
assert.equal(before.length,389019);assert.ok(after.length>before.length);assert.ok(after.subarray(0,before.length).equals(before));
const ignore=spawnSync('git',['check-ignore','-v',evidence],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(ignore.status,1);assert.equal(git('ls-files','--',evidence).toString().trim(),evidence);
const parserLog=read(`${prefix}/parser-tests.txt`);const parserText=parserLog.subarray(0,2).equals(Buffer.from([255,254]))?parserLog.toString('utf16le'):parserLog.toString('utf8');
assert.match(parserText,/pass 26/);assert.match(parserText,/fail 0/);
const workerSources=[
  ['chunks/0jggz8zkp0-16.js',394993,450,'cE={get url(){return t.F('],
  ['chunks/0jggz8zkp0-16.js',419991,450,'async function pa(){'],
  ['chunks/turbopack-0ow_qx54-jpcy.js',5291,260,'v.F=function(e){'],
  ['media/maplibre-gl-dev.10vbfbdmgxqvt.mjs',4876,120,'from "./maplibre-gl-shared-dev.mjs"'],
  ['media/maplibre-gl-worker.3p8qq_5zjvx0t.mjs',500,120,'from"./maplibre-gl-shared.mjs"']
].map(([path,offset,length,expected])=>{const b=readFileSync(resolve(capture,'responses/_next/static/immutable',path));const snippet=b.subarray(offset,offset+length).toString('utf8');assert.ok(snippet.startsWith(expected));return{path,offset,snippet,sha256:sha(b)};});
assert.match(read(`${prefix}/replay-observation.mjs`).toString(),/throw Error\('REVIEW-REJECTED:/);
assert.equal(readdirSync(out).filter(n=>n.startsWith('replay-')&&n!=='replay-observation.mjs').length,0);
const preview=await(await fetch('http://127.0.0.1:4416/__qa/status',{signal:AbortSignal.timeout(10000)})).json();assert.equal(preview.buildId,'vOoOxn7etjT-WJqrIExq7');
const board=Buffer.from(await(await fetch('http://127.0.0.1:4416/postplan.html',{signal:AbortSignal.timeout(10000)})).arrayBuffer());assert.equal(sha(board),sha(read('postplan.html')));
const findings=[
  'Actual Aug30 CLI deployment is identified; authorized unique-deployment HTML and alias bytes match. Nominal2a99893 is gitDirty1, not clean-source recovery.',
  '24 captured frontend responses total5271035bytes. Two dependency passes stopped and remain failed; capture is not executable closure or rollback acceptance.',
  'Independent static trace finds a suspected empty default worker URL from Turbopack file:///ROOT module identity; no browser result is claimed. The development shared-import404 is not established on default startup.',
  'The original parser mistook a bare.css suffix for a URL. Its replacement passes26offline tests; old failure evidence remains.',
  'Replay draft was rejected before execution for incomplete worker traffic controls, outcome bias and cleanup deadline. Reporting/service/device/deployment gates remain open.'
];
const disagreements=[
  'The preliminary parent inference that the development main module was the default worker omitted the file-scheme branch condition. The complete static trace supersedes it.',
  'A static dependency404, clean asset hash list or passing parser tests do not establish runtime failure, executable closure, retained-client acceptance or permission to deploy.'
];
const summary={root,hostname:hostname(),base,createdAt:new Date().toISOString(),scope:'Read-only external/frontend capture; QA parser and docs, no product code changes.',
  deployment:json(`${prefix}/deployment-observation.json`),html:{buildId:local('html-inspection.json').buildId,bytes:html.length,sha256:sha(html),uniqueAuthorizedTextUtf8EqualsAlias:true,aliasHeaders:receipt.headers,uniqueHeaders:authorized.headers},
  assets:{files,count:files.length,totalBytes,arithmetic:'864620 + 1005311 + 3401104 = 5271035 bytes; 12 + 5 + 7 = 24 successful asset responses',captureAttempts:phases.reduce((n,p)=>n+p.responses.length,0),attemptArithmetic:'12 + 6 + 8 = 26 asset HTTP responses = 24 success + 2 HTTP404',failed,executableClosure:false},
  phases:phases.map(p=>({path:p.path,ok:p.ok,totalBytes:p.totalBytes,elapsedMs:p.elapsedMs,error:p.error})),
  parser:{passed:26,failed:0,files:1,receipt:'parser-tests.txt',receiptSha256:sha(parserLog),sourceSha256:sha(read(`${prefix}/references-reviewed.cjs`)),executedDownloadedScripts:false},
  workerSources,review:json(`${prefix}/review.json`),browser:{ran:false,reason:'Bootstrap os error3; subsequent owned-CDP draft rejected before run. Static capture only.'},
  observationsNotSuccesses:['Original parser false.css request returned404.','Reviewed static pass dev shared import returned404.','Unauthenticated unique-deployment GET failed before recorded HTTP status; authenticated owner connector then returned200.','A diagnostic node -e had a ternary syntax error before execution and was corrected.','Data preflight127.0.0.1:4340 refused; configured localhost:4340 returned200 atIPv6 ::1. No browser was run.'],
  evidence:{path:evidence,previousBytes:before.length,bytes:after.length,addedBytes:after.length-before.length,exactPrefix:true,tracked:true,checkIgnoreExit:ignore.status},
  protected:{trackedDiffEmpty:true,anchors,weights},integrity:{exit:integrity.status,stdout:integrity.stdout,stderr:integrity.stderr},
  preview,taskBoardSha256:sha(board),retainedValidation:{webTests:1930,webFiles:72,dependencyGuards:42,maintenanceTests:1012,maintenanceFiles:12,rerun:false},findings,disagreements,pipelineRuns:0,pipelineSeconds:0,installations:0,deployments:0,externalActivation:false,goalComplete:false};
write('summary.json',summary);
const index=[];function walk(d){for(const e of readdirSync(d,{withFileTypes:true})){const p=resolve(d,e.name);assert.ok(!e.isSymbolicLink());if(e.isDirectory())walk(p);else{const b=readFileSync(p);index.push({path:`${prefix}/${relative(out,p).replaceAll('\\','/')}`,bytes:b.length,sha256:sha(b)});}}}walk(out);
write('artifact-index.json',{files:index});write('stage-paths.json',[...index.map(f=>f.path),`${prefix}/artifact-index.json`,`${prefix}/stage-paths.json`]);
console.log(JSON.stringify({html:summary.html,assets:{count:files.length,totalBytes,failed},parser:summary.parser,integrity:summary.integrity,evidence:summary.evidence,anchors:anchors.length,weights,qaFiles:index.length,taskBoardSha256:summary.taskBoardSha256,browserRan:false},null,2));
