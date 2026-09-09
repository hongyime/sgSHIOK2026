import { execFileSync } from 'node:child_process';
import { readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';
if(process.cwd()!==root)throw Error('Wrong working root');
const read=p=>readFileSync(resolve(root,p)),json=p=>JSON.parse(read(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const base='qa/revamp-r1/source-freshness-20260909',build=json('qa/revamp-r1/cached-release-20260908/source-freshness-20260909-1/build.json');
const tests=json('qa/revamp-r1/published-options-20260909/freshness-full-2/checks.json'),isolation=json('tmp/test-without-data-AkCZgE/isolation.json');
const browser=json(base+'/browser-JZIDgw/browser.json'),metadata=json(base+'/metadata.json');
const sources=build.sources.map(s=>{const current=sha(read(s.path)),tested=sha(read('tmp/test-without-data-AkCZgE/'+s.path));return {path:s.path,built:s.sha256,current,tested,match:s.sha256===current&&current===tested};});
const anchors=tests.inputs.map(s=>{const value=read(s.path),actual=sha(value);if(actual!==s.expected||value.length!==s.bytes)throw Error('STOP_INPUT_MISMATCH '+s.path+' '+actual);return {path:s.path,bytes:value.length,actual,expected:s.expected,match:true};});
const metadataIdentities=metadata.files.map(s=>{const value=read(s.path),actual=sha(value);return {path:s.path,actual,expected:s.sha256,match:actual===s.sha256&&value.length===s.bytes};});
const captures=browser.captures.map(s=>{const value=read(base+'/browser-JZIDgw/'+s.name+'.png');return {name:s.name,bytes:value.length,sha256:sha(value),match:value.length===s.bytes&&sha(value)===s.sha256};});
const document=read(base+'/browser-JZIDgw/document.html');
const prior=execFileSync('git',['show','b8bccce:qa/verification/REVAMP-R1-core-walk.md'],{cwd:root,maxBuffer:2000000,windowsHide:true});
const current=read('qa/verification/REVAMP-R1-core-walk.md');
const evidence={base:'b8bccce',priorBytes:prior.length,currentBytes:current.length,priorSha256:sha(prior),prefixUnchanged:current.subarray(0,prior.length).equals(prior)};
const report={root,buildId:build.buildId,sources,anchors,metadataIdentities,captures,evidence,
  isolation: {snapshot:isolation.snapshot,productionDataDirectoryAbsent:isolation.productionDataDirectoryAbsent,guardProbePassed:isolation.guardProbePassed,exitCode:isolation.exitCode},
  checks:browser.checks.length,documentMatches:browser.documents.length===1&&sha(document)===browser.documents[0].sha256&&document.includes(Buffer.from(build.buildId)),
  testsPassed:tests.ok,buildPassed:build.exitCode===0,browserPassed:browser.ok&&browser.build===build.buildId&&browser.cleanup.verified,
  limitations:'Source/date mapping and UI acceptance only; no new source check, pipeline run, full Python suite, physical-device, performance or deployment claim.'};
report.ok=report.testsPassed&&report.buildPassed&&report.browserPassed&&report.documentMatches&&metadata.ok&&evidence.prefixUnchanged&&isolation.productionDataDirectoryAbsent&&isolation.guardProbePassed&&isolation.exitCode===0&&sources.every(s=>s.match)&&metadataIdentities.every(s=>s.match)&&captures.length===7&&captures.every(s=>s.match);
writeFileSync(resolve(root,base,'identity-final.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({ok:report.ok,sources:sources.length,anchors:anchors.length,captures:captures.length,checks:report.checks,evidence}));process.exitCode=report.ok?0:1;
