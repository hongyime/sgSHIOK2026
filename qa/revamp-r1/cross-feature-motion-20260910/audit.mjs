import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const relative='qa/revamp-r1/cross-feature-motion-20260910',directory=resolve(root,relative);
const base='b7196b6683ab333ab4bb3eb4f88a65021516c3bf';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(readFileSync(resolve(directory,p)));
const write=(p,v)=>writeFileSync(resolve(directory,p),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
if(existsSync(resolve(directory,'audit.json'))||existsSync(resolve(directory,'summary.json')))throw Error('Preserve audit');
const full=read('full-1/checks.json');
if(!full.ok||!full.commands[0].stdout.includes('1765 passed (1765)'))throw Error('Full suite did not pass');
const build=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/cached-release-20260908/cross-feature-motion-20260910-2/build.json')));
if(build.exitCode!==0||!build.protectedDataAbsent)throw Error('Invalid build');
const sources=build.sources.map(s=>({path:s.path,built:s.sha256,
  testedBefore:full.sourcesBefore.find(t=>t.path===s.path)?.sha256,testedAfter:full.sourcesAfter.find(t=>t.path===s.path)?.sha256,
  current:sha(readFileSync(resolve(root,s.path)))}));
if(sources.some(s=>s.built!==s.testedBefore||s.built!==s.testedAfter||s.built!==s.current))throw Error('Source identity changed');
const anchors=full.anchorsAfter.map(p=>({...p,current:sha(readFileSync(resolve(root,p.path)))}));
if(anchors.some(p=>p.current!==p.expected))throw Error('Protected hash mismatch');
const landmark=read('landmark-2.json').receipts.map(p=>({...p,current:sha(readFileSync(resolve(root,'web/public/data/generated_20260805_prefer_scored_routed',p.path)))}));
if(landmark.some(p=>p.current!==p.expected))throw Error('Landmark hash mismatch');
const evidencePath='qa/verification/REVAMP-R1-core-walk.md';
const prefix=execFileSync('git',['show',base+':'+evidencePath],{cwd:root,maxBuffer:1024*1024});
if(!readFileSync(resolve(root,evidencePath)).subarray(0,prefix.length).equals(prefix))throw Error('Existing evidence changed');
const browsers=readdirSync(directory).filter(p=>/^acceptance-\d-/.test(p)).sort().map(path=>({path,report:read(path+'/browser.json')}));
const screenshots=[],reviewed=new Map();
for(const {path,report}of browsers){
  for(const file of readdirSync(resolve(directory,path)).filter(p=>p.endsWith('.png'))){
    const bytes=readFileSync(resolve(directory,path,file)),hash=sha(bytes);
    const capture=report.captures.find(c=>(c.file??c.name+'.png')===file)??(file==='failure.png'?report.failureCapture:undefined);
    if(capture?.sha256!==hash)throw Error('Screenshot receipt mismatch');
    screenshots.push({path:relative+'/'+path+'/'+file,sha256:hash,bytes:bytes.length,
      review:reviewed.has(hash)?{byteIdenticalToInspected:reviewed.get(hash)}:{parentVisuallyInspected:true}});
    reviewed.set(hash,relative+'/'+path+'/'+file);
  }
}
const implementation=['web/components/route-evidence-map.tsx','web/components/home-comparison.tsx','web/lib/__tests__/route-source-lifecycle.test.ts','web/lib/__tests__/home-comparison.test.tsx'];
const diff=execFileSync('git',['diff','--no-color',base,'--',...implementation],{cwd:root,maxBuffer:1024*1024});
writeFileSync(resolve(directory,'implementation.diff'),diff,{flag:'wx'});
const diffReceipt={path:relative+'/implementation.diff',sha256:sha(diff),bytes:diff.length,lines:diff.toString().split('\n').length-1};
const final=browsers.at(-1).report;
const cleanupCommand="@(Get-CimInstance Win32_Process -Filter 'ProcessId = 101520 OR ProcessId = 115356 OR ProcessId = 4528' | Select-Object ProcessId,Name,CommandLine) | ConvertTo-Json -Depth 4";
const cleanupStdout=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',cleanupCommand],{cwd:root,encoding:'utf8',windowsHide:true,timeout:30000});
const cleanup=JSON.parse(cleanupStdout||'[]');if(cleanup.length)throw Error('Owned completed process still alive');
const audit={root,base,sources,anchors,landmark,evidencePrefix:{path:evidencePath,bytes:prefix.length,sha256:sha(prefix),preserved:true},diff:diffReceipt,
  screenshots,reviewedUniqueImages:reviewed.size,browserRuns:browsers.map(({path,report:r})=>({path,ok:r.ok,checks:r.checks.length,passed:r.checks.filter(c=>c.pass).length,
    captures:r.captures.length,failureCapture:!!r.failureCapture,errors:r.errors,deniedTraffic:r.deniedTraffic,cleanup:r.cleanup.verified,failure:r.failure})),
  focusedBefore:browsers[1].report.checks.at(-1),focusedAfter:final.checks.filter(c=>c.name==='reachable Show postal 018956 on map'),
  cleanup:{command:cleanupCommand,stdout:cleanupStdout,verified:true,firstPreviewCleanup:'close-preview-1.mjs exited1 after Stop-Process because its immediate alive check raced termination; subsequent read-only check found both exact owned PIDs gone. No repeated kill. Proxy terminal receipt preserved.',browser:'owned-browser-terminal.json found the completed helper had already exited; no stop was performed.'}};
write('audit.json',audit);
const findings=[
  'Three executed races let old route visibility authorize ready after selection/layout changed but before passive-effect cleanup. Current visibility ownership now invalidates both old route probes and late basemap completion.',
  'Keyboard focus could land beneath the sticky comparison label: the real postal button at x51..154 was obscured by the column ending x112. Measured focus scrolling reveals the same target without changing selection or reclaiming focus. Browser selection in both directions now passes.',
  '1755 previous +3 stale-ready cases +7 focus cases =1765 tests across64files pass in the full isolated web suite. TypeScript, fresh Next build and repository integrity pass; all149 current/tested/built web sources and11 protected anchors match.',
  'The final browser run executes52 passing functional checks,14 captures, and all18 recorded route fits use duration0 under reduced motion. Four viewports, text doubling, reflow, current route identity, keyboard navigation, shared-close/plain home and About data pass. The final audit fails on5 CDP Invalid InterceptionId command faults: the run remains exit1, not a clean browser pass.',
  'The browser receipt records0 Runtime.exceptionThrown entries and0 denied requests, but interception faults lack request-ID/cancellation correlation. Their cause is unresolved; they are not silently ignored, treated as application exceptions, or used to claim clean transport.',
  'Unavailable fixture postals, wrong H3 path, initial-document null access, a post-idle source transition and a wrong shared-close expectation are preserved separately from the real keyboard defect. Shared navigation intentionally clears the single-postal inspector (page.tsx2554-2555); closing does not resurrect it.',
  'No pipeline, installs, input regeneration, protected-payload writes or deployment. Current preview4354 uses build jNTP8fdVgYwcHrBSMHG0l; obsolete owned4351/4352 stopped, older previews untouched. Existing verification prefix is preserved.'
];
const disagreements=[
  'Passing functional captures do not make a failing browser audit pass. T25 remains PARTIAL until request interception is correlated and a bounded clean audit is obtained; preserve every original result.',
  'CSS reflow and computed-font doubling are not native browser zoom, assistive technology, real-phone evidence or representative latency. The cache/SW-bypassed replay is not retained-old-tab M17 acceptance.',
  'Subagent quota remains exhausted from the previous attempt. Source and image review are parent-only, not independent acceptance.'
];
const summary={root,hostname:process.env.COMPUTERNAME,base,task:'T25 selection-readiness and sticky-column focus repair',status:'Progress; browser audit and overall goal incomplete',implementation,
  tests:{redRace:'3failed+54passed=57',greenRace:'96passed/5files',redFocus:'3failed+77passed=80',greenFocus:'137passed/2files; third supplied filename matched no file, not a third passing file',full:'1755+3+7=1765passed/64files',typeScript:full.commands[1].exitCode,integrity:full.commands[2].exitCode,build:build.buildId},
  browser:{run:relative+'/acceptance-6-DYmh0w/browser.json',passedFunctionalChecks:52,totalChecks:53,ok:false,captures:14,failureCapture:1,interceptionFaults:final.errors,runtimeExceptions:final.errors.filter(e=>!('fault'in e)).length,deniedRequests:final.deniedTraffic.length,
    cameraFits:final.camera.filter(c=>c.name==='fitBounds').length,reducedMotionFits:final.camera.filter(c=>c.name==='fitBounds').every(c=>c.options.duration===0),
    imageArithmetic:'5+5+1+5+12+15='+screenshots.length,uniqueImages:reviewed.size,review:'Parent inspection, with exact-byte duplicates linked in audit.json'},
  identities:{sources:sources.length,anchors:anchors.length,landmarkBytes:landmark.map(p=>p.bytes).join('+')+'='+landmark.reduce((n,p)=>n+p.bytes,0),evidencePrefix:audit.evidencePrefix},
  evidence:{audit:relative+'/audit.json',full:relative+'/full-1/checks.json',diff:diffReceipt},findings,disagreements,
  next:['Correlate CDP Fetch errors with Network request cancellation before another bounded clean audit; do not rerun simply for PASS.','Retained-old-tab M17 with latest build remains open.','T29 dependency/security and T27/T28 real release gates remain owner-bounded; no automatic activation.'],pipelineRuns:0,pipelineCost:0,preview:'http://127.0.0.1:4354/'};
write('summary.json',summary);console.log(JSON.stringify(summary,null,2));
