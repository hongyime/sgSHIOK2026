import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const base='38022b4df2482142d19570e93aa6e4daaffb1f8e';
const dir=resolve(root,'qa/revamp-r1/basemap-startup-20260910');
const hash=b=>createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(readFileSync(resolve(dir,p)));
const final=json('full-1/checks.json'),green=json('green-2/checks.json');
const build=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/cached-release-20260908/basemap-startup-20260910-1/build.json')));
if(!final.ok||!green.ok||build.exitCode!==0)throw Error('Validation did not pass');
const tested=final.sourcesAfter;
const sourceIdentity=tested.map(row=>({...row,current:hash(readFileSync(resolve(root,row.path))),build:build.sources.find(s=>s.path===row.path)?.sha256}));
if(sourceIdentity.some(r=>r.sha256!==r.current||r.sha256!==r.build))throw Error('Current/test/build source mismatch');
const anchors=final.anchorsAfter.map(row=>({...row,now:hash(readFileSync(resolve(root,row.path)))}));
if(anchors.some(r=>r.expected!==r.now))throw Error('Protected anchor mismatch');
const verification='qa/verification/REVAMP-R1-core-walk.md';
const prior=execFileSync('git',['show',base+':'+verification],{cwd:root,windowsHide:true});
const current=readFileSync(resolve(root,verification));
if(!current.subarray(0,prior.length).equals(prior))throw Error('Historical evidence changed');
const browserPaths=['baseline-pVxA4P','treatment-AEyTq8','treatment-b6ZKon'];
const browsers=browserPaths.map(path=>({path,report:json(path+'/browser.json')}));
if(browsers.some(b=>!b.report.cleanup.verified||b.report.proxyStopStatus!==204))throw Error('Browser/proxy cleanup incomplete');
const accepted=browsers.at(-1).report;
if(accepted.exitCode!==0||accepted.checks.some(c=>!c.pass))throw Error('Browser failed');
const captures=browsers.flatMap(b=>b.report.captures.map(c=>({path:b.path+'/'+c.name+'.png',expected:c.sha256,actual:hash(readFileSync(resolve(dir,b.path,c.name+'.png'))),visuallyInspectedBy:'parent Codex',before:c.before,after:c.after})));
if(captures.some(c=>c.expected!==c.actual)||captures.length!==14)throw Error('Capture inventory mismatch');
const implementationPaths=['web/components/route-evidence-map.tsx','web/lib/__tests__/route-source-lifecycle.test.ts','web/lib/__tests__/map-startup-stage.test.ts'];
const diff=execFileSync('git',['diff','--no-color',base,'--',...implementationPaths],{cwd:root,windowsHide:true});
writeFileSync(resolve(dir,'implementation.diff'),diff,{flag:'wx'});
const protectedPaths=['pipeline/config/weights.yaml','raw','processed','web/public/data','checksums.json','qa/p6_*','qa/p7_*','qa/p8_*','qa/p9_*','qa/p10_*','qa/p11/d_*','qa/releases'];
const protectedDiff=execFileSync('git',['diff','--name-only',base,'--',...protectedPaths],{cwd:root,encoding:'utf8',windowsHide:true});
if(protectedDiff.trim())throw Error('Protected tracked changes');
const report={root,hostname:process.env.COMPUTERNAME,base,sourceIdentity,anchors,
  evidencePrefix:{path:verification,bytes:prior.length,sha256:hash(prior),unchanged:true},
  implementationDiff:{path:'qa/revamp-r1/basemap-startup-20260910/implementation.diff',bytes:diff.length,sha256:hash(diff),lines:diff.toString('utf8').split('\n').length-(diff.at(-1)===10?1:0)},
  protectedTrackedDiffEmpty:true,build:{path:'qa/revamp-r1/cached-release-20260908/basemap-startup-20260910-1/build.json',buildId:build.buildId,exitCode:build.exitCode,protectedDataAbsent:build.protectedDataAbsent},
  commands:final.commands.map(c=>({args:c.args,exitCode:c.exitCode,elapsedSeconds:c.elapsedSeconds,stdout:c.stdout,stderr:c.stderr})),
  captures,browsers:browsers.map(b=>({path:b.path+'/browser.json',exitCode:b.report.exitCode,checks:b.report.checks.length,captures:b.report.captures.length,elapsedSeconds:b.report.elapsedSeconds,cleanup:b.report.cleanup.verified,proxyStopStatus:b.report.proxyStopStatus})),
  limitations:['Parent-only visual/source review. Peer quota previously reached; no new independent-review claim.','Baseline uses a wrong private GeoJSON field; null is not zero. Lifecycle and screen are valid; receipt exit1 preserved.','First treatment counts initial null publication as teardown; exit1 preserved. Corrected replay tests teardown only after map creation.','Ordinary current-build navigation and local SW-controlled tile delay tested. No new retained-A upgrade/production/physical-device/representative-latency claim.','Worker transport case bypasses HTTP cache and service worker deliberately.','No installs, protected-payload mutation, pipeline execution, real release staging, external service activation or deployment.']};
writeFileSync(resolve(dir,'audit.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({base,sourceFiles:sourceIdentity.length,anchors:anchors.length,buildId:build.buildId,captures:captures.length,browsers:report.browsers,prefix:report.evidencePrefix,diff:report.implementationDiff,checks:final.commands.map(c=>({exitCode:c.exitCode,elapsedSeconds:c.elapsedSeconds,counts:c.stdout.match(/(?:Test Files|Tests)\s+[^\n]+/g)}))},null,2));
