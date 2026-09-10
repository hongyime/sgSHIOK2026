import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';
if(process.cwd()!==root)throw Error('Wrong working root');
const [testsName,browserName,buildName]=process.argv.slice(2);
for(const name of [testsName,browserName,buildName])if(!/^[\w-]+$/.test(name??''))throw Error('Explicit receipt directory names required');
const qa=resolve(root,'qa/revamp-r1/cross-feature-20260910'),sha=b=>createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(readFileSync(p));
const test=json(resolve(qa,testsName,'checks.json')),browser=json(resolve(qa,browserName,'browser.json'));
const build=json(resolve(root,'qa/revamp-r1/cached-release-20260908',buildName,'build.json'));
const stdout=test.commands[0].stdout,marker='\n{\n  "snapshot":';
const position=stdout.lastIndexOf(marker);if(position<0)throw Error('Isolation output missing');
const isolation=JSON.parse(stdout.slice(position));
const sources=build.sources.map(s=>{const current=sha(readFileSync(resolve(root,s.path))),tested=sha(readFileSync(resolve(isolation.snapshot,s.path)));return{path:s.path,built:s.sha256,current,tested,ok:s.sha256===current&&current===tested};});
const inputs=test.inputs.map(s=>{const bytes=readFileSync(resolve(root,s.path)),actual=sha(bytes);if(actual!==s.expected||bytes.length!==s.bytes)throw Error('STOP input mismatch '+s.path+' '+actual);return{path:s.path,bytes:bytes.length,sha256:actual,ok:true};});
const captures=browser.captures.map(c=>{const bytes=readFileSync(resolve(qa,browserName,c.name+'.png'));return{name:c.name,bytes:bytes.length,sha256:sha(bytes),ok:bytes.length===c.bytes&&sha(bytes)===c.sha256};});
const html=readFileSync(resolve(qa,browserName,'document.html'));
const previous=execFileSync('git',['show','d7e5019:qa/verification/REVAMP-R1-core-walk.md'],{cwd:root,windowsHide:true,maxBuffer:2000000});
const currentEvidence=readFileSync(resolve(root,'qa/verification/REVAMP-R1-core-walk.md'));
const baseline=json(resolve(qa,'baseline-2-npfpHq/browser.json'));
const report={root,hostname:process.env.COMPUTERNAME,base:'d7e5019',testsName,browserName,buildName,buildId:build.buildId,
  tests:{ok:test.ok,commands:test.commands.map(c=>({command:c.command,args:c.args,exitCode:c.exitCode,elapsedMs:c.elapsedMs})),countLines:stdout.split(/\r?\n/).filter(line=>/^\s*(Test Files|Tests)\s/.test(line)),sourcesUnchanged:test.sourcesUnchanged,inputsUnchanged:test.inputsUnchanged},
  isolation,sources,inputs,captures,browser:{ok:browser.ok,checks:browser.checks.length,captures:browser.captures.length,cleanupVerified:browser.cleanup.verified,deniedTraffic:browser.deniedTraffic,completedRetry:browser.completedRetry},
  document:{bytes:html.length,sha256:sha(html),matches:sha(html)===browser.document.sha256&&html.includes(Buffer.from(build.buildId))},
  evidence:{baseBytes:previous.length,baseSha256:sha(previous),currentBytes:currentEvidence.length,prefixUnchanged:currentEvidence.subarray(0,previous.length).equals(previous)},
  baseline:{directory:'baseline-2-npfpHq',ok:baseline.ok,focusFailure:baseline.checks.find(c=>c.name==='Retry retains keyboard context during loading'),cleanupVerified:baseline.cleanup.verified,
    laterHarnessError:'Expected018990 to become drawable after geometry recovery, but its published bus option is honestly an unverified straight-line estimate. This does not invalidate the earlier BODY-focus failure.'},
  findings:['Keyboard Retry lost focus to BODY; focused keyboard activation now transfers to the same postal column synchronously without changing selection or deferred reclaim.',
    'The first full web run exposed three stale T31 script assertions. They now enforce plan/refusal, no dependency installation, and an explicitly present early confirmation return.',
    'Comparison diagnostics preserve a bounded geometry503 payload; unavailable straight-line evidence is not promoted to a verified route after transport recovery.'],
  disagreements:['T25 remains partial: this is not a retained-old-tab M17, physical-device, native-zoom, representative performance, all Python tests, or production acceptance claim.',
    'Prior startup failures, the import-time cleanup error, first full-suite failure, and incorrect baseline recovery expectation remain preserved; a later pass does not erase them.'],
  limits:'No pipeline, installation, deployment, or protected data changes in this continuation. Existing preview data read-only. Earlier T31 synthetic export incident is separately recorded and is not reclassified.'};
report.ok=test.ok&&isolation.guardProbePassed&&isolation.productionDataDirectoryAbsent&&isolation.exitCode===0&&build.exitCode===0&&browser.ok&&browser.cleanup.verified&&browser.build===build.buildId&&sources.every(s=>s.ok)&&captures.every(c=>c.ok)&&report.document.matches&&report.evidence.prefixUnchanged;
writeFileSync(resolve(qa,'summary.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({ok:report.ok,tests:report.tests.countLines,sources:sources.length,captures:captures.length,browserChecks:browser.checks.length,evidence:report.evidence}));process.exitCode=report.ok?0:1;
