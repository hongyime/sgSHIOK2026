import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { connect } from 'node:net';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const base=resolve(root,'qa/revamp-r1/report-operations-20260915');
const hash=x=>createHash('sha256').update(x).digest('hex');
const load=p=>JSON.parse(readFileSync(resolve(base,p),'utf8'));
const proofs={full:'checks-full-lmnBqi',focused:'checks-focused-DhvBiC',types:'checks-types-3L4DKf',docs:'checks-docs-yCfVkA'};
const checks=Object.fromEntries(Object.entries(proofs).map(([mode,name])=>[mode,load(`${name}/summary.json`)]));
for(const c of Object.values(checks)){assert.equal(c.exit,0);assert.equal(c.sourceStable,true);assert.deepEqual(c.before,c.after);}
assert.deepEqual(checks.full.before,checks.full.snapshotSources);
for(const [path,h] of Object.entries(checks.full.before))assert.equal(hash(readFileSync(resolve(root,path))),h,path);
const fullOutput=readFileSync(resolve(base,proofs.full,'stdout.txt'),'utf8');
assert.match(fullOutput,/Test Files\s+78 passed \(78\)/);assert.match(fullOutput,/Tests\s+2482 passed \(2482\)/);assert.match(fullOutput,/pass 42/);
assert.deepEqual(checks.focused.tests,{passed:381,failed:0,files:8});
assert.match(readFileSync(resolve(base,proofs.docs,'stdout.txt'),'utf8'),/41 passed/);
const database=load('database-checkpoint.json');
for(const anchor of database.protectedAnchors){const b=readFileSync(resolve(root,anchor.path));assert.equal(b.length,anchor.bytes);assert.equal(hash(b),anchor.sha256,anchor.path);}
assert.equal(hash(readFileSync(resolve(root,'pipeline/config/weights.yaml'))),database.weights);
const browserName='composer-browser-MUbSsS';const browser=load(`${browserName}/summary.json`);
assert.equal(browser.passed,false);assert.equal(browser.checks.length,21);assert.ok(browser.checks.every(c=>c.passed));assert.equal(browser.captures.length,8);assert.equal(browser.sourcesUnchanged,true);
for(const capture of browser.captures){const b=readFileSync(resolve(base,browserName,capture.file));assert.equal(b.length,capture.bytes);assert.equal(hash(b),capture.sha256);}
for(const [path,h] of Object.entries(browser.sources))assert.equal(hash(readFileSync(resolve(root,path))),h,path);
const processCheck="$c=@(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -like '*C:\\sgSHIOK2026\\qa\\revamp-r1\\report-operations-20260915\\composer-browser-*' }); $n=@(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*C:\\sgSHIOK2026\\qa\\revamp-r1\\report-operations-20260915\\composer-browser.mjs*' }); [PSCustomObject]@{OwnedChrome=$c.Count;OwnedDriver=$n.Count} | ConvertTo-Json -Compress";
const processes=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-Command',processCheck],{cwd:root,windowsHide:true,timeout:15000,encoding:'utf8'}));
assert.deepEqual(processes,{OwnedChrome:0,OwnedDriver:0});
async function closed(port){return new Promise(done=>{const s=connect({host:'127.0.0.1',port});const finish=answer=>{s.removeAllListeners();s.destroy();done(answer);};s.setTimeout(1000,()=>finish(false));s.once('connect',()=>finish(false));s.once('error',e=>finish(e.code==='ECONNREFUSED'));});}
const browserPort=Number(readFileSync(resolve(base,browserName,'profile/DevToolsActivePort'),'utf8').split(/\r?\n/)[0]);
assert.ok(browserPort>0&&browserPort<65536);
const portChecks={vite:{port:Number(new URL(browser.origin).port),closed:await closed(Number(new URL(browser.origin).port))},cdp:{port:browserPort,closed:await closed(browserPort)}};
assert.ok(portChecks.vite.closed&&portChecks.cdp.closed);
const requestCounts=database.outcomes.map(o=>{const r=load(`${o.path}/summary.json`);const rest=r.requests.filter(x=>x.suffix?.startsWith('/rest/')).length;return {receipt:o.path,management:r.requests.length-rest,rest,total:r.requests.length};});
const totals={management:requestCounts.reduce((s,r)=>s+r.management,0),rest:requestCounts.reduce((s,r)=>s+r.rest,0),total:requestCounts.reduce((s,r)=>s+r.total,0)};
assert.deepEqual(totals,{management:244,rest:45,total:289});
const prior=load('database-evidence.json').after;
const evidencePath=resolve(root,'qa/verification/REVAMP-R1-core-walk.md');const evidence=readFileSync(evidencePath);
assert.equal(evidence.length,prior.bytes);assert.equal(hash(evidence),prior.sha256);
const result={root,host:process.env.COMPUTERNAME,proofs,
  validation:{full:{passed:2482,files:78,dependencyGuards:42},focused:checks.focused.tests,typesExit:0,docs:{passed:41,exit:0},
    arithmetic:'2387 + 65 composer + 30 Home integration = 2482; 77 + 1 test file = 78. Focused counts overlap the full suite; 42 guards are separate.',
    isolated:checks.full.isolation,sourceBindings:checks.full.before},
  browser:{receipt:browserName,overallPassed:false,runtimeChecks:browser.checks,captures:browser.captures,parentVisuallyInspected:browser.captures.map(c=>c.file),scope:browser.scope,cleanupReconciled:{processes,portChecks},limitations:load('browser-limitations.json')},
  httpCountCorrection:{originalField:'database-checkpoint.json.managementRequestArithmetic',actualMeaning:'Combined Management and PostgREST requests, not Management-only',requestCounts,totals,arithmetic:'244 + 45 = 289'},
  protectedAnchorsVerified:database.protectedAnchors.length,weights:database.weights,previousEvidence:prior,
  findings:[
    'Report composer and Home selection/review/retry/receipt integration implemented;65newcomposer and30newHome tests preserve frozen context and uncertain outcomes.',
    'Parent review corrected active-panel measurement and prevented an unfinished public entry. UI capabilityfalse and server admissionfalse remain separate gates.',
    '2482isolatedweb tests/78files and42dependency guards pass;381focused/8files,TypeScript and41docs/integrity tests pass.13source bindings match the isolated snapshot.',
    '21standalonebrowser interaction/layout checks and8inspectedcaptures do not override the overall cleanup failure. Laterexact-profile and portchecks verify no owned browser/driver remains; latest harness cleanup change is not rerun.',
    'Earlier HTTP total was mislabeled;244Management+45PostgREST=289combinedcalls. Originalrecord preserved, correction appended.',
    'No scoring/export/ingest/network/input repair, frozen artifact change, runtime secret saved, Cloudflare use or paid upgrade. No frontend deployment command executed.'
  ],
  disagreements:[
    'No disagreement with30days. A tested but disabled composer is not a launched resident service.',
    'Browser cleanup reconciliation is not a retrospective overall PASS; integrated navigation, actual durable receipt, moderator authorization and release acceptance remain.'
  ],
  next:'Keep full goal active: private moderator authorization/queue, health monitoring, cross-route navigation guard and integrated acceptance; exact core-map release can proceed separately from report activation.'};
writeFileSync(resolve(base,'form-checkpoint.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
appendFileSync(evidencePath,'\n\n## 2026-09-15: Disabled report composer and Home integration\n\n```json\n'+JSON.stringify(result,null,2)+'\n```\n');
assert.equal(hash(readFileSync(evidencePath).subarray(0,evidence.length)),hash(evidence));
writeFileSync(resolve(base,'form-evidence.json'),JSON.stringify({before:prior,after:{bytes:readFileSync(evidencePath).length,sha256:hash(readFileSync(evidencePath))},appendOnly:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({validation:result.validation,cleanup:result.browser.cleanupReconciled,totals,findings:result.findings,disagreements:result.disagreements,next:result.next},null,2));
