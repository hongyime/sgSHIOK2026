import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const dir='qa/revamp-r1/frontend-retention-20260910',output=resolve(root,dir,'summary.json');
if(existsSync(output))throw Error('Preserve prior summary');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFileSync(resolve(root,p)),json=p=>JSON.parse(read(p));
const report={root,hostname:process.env.COMPUTERNAME,base:'ad3e99a885e592baa805d45c3f954651d339e39c',commands:[]};
const command=(exe,args)=>{
  const r=spawnSync(exe,args,{cwd:root,encoding:'utf8',windowsHide:true,timeout:60000,maxBuffer:4*1024*1024});
  report.commands.push({exe,args,exitCode:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.message});return r;
};
const web=json(dir+'/web-full-2/checks.json'),build=json(dir+'/build-2/build.json');
report.web={path:dir+'/web-full-2/checks.json',ok:web.ok,counts:web.commands[0].stdout.match(/Test Files[^\n]+|Tests[^\n]+/g),sourceCount:web.sourcesAfter.length};
report.sources=web.sourcesAfter.map(s=>({...s,current:sha(read(s.path)),built:build.sources.find(b=>b.path===s.path)?.sha256}));
report.anchors=web.anchorsAfter.map(s=>({...s,current:sha(read(s.path))}));
report.python=['retention-final-2','staging-final-c','staging-final-d','staging-final-e'].map(name=>{
  const r=json(dir+'/'+name+'/checks.json');
  return {path:dir+'/'+name+'/checks.json',exitCode:r.exitCode,stable:r.stable,stdout:r.stdout,elapsedSeconds:r.elapsedSeconds,
    sourcesCurrent:r.after.every(s=>sha(read(s.path))===s.sha256)};
});
report.pythonArithmetic='25 retention + 75 publish + 8 README + (15 + 38 + 5) staging = 166 targeted tests; not the full Python suite';
report.webArithmetic='1717 previous + 23 retention + 4 global error = 1744 tests; 62 + 2 = 64 files';
report.build={path:dir+'/build-2/build.json',exitCode:build.exitCode,sourceStable:build.sourceStable,buildId:build.buildId,derivatives:build.derivatives,
  archive:build.capture,scope:'Fresh frontend-only QA snapshot, existing dependencies; no production data copied. QA-only fault route/config are explicit derivatives.'};
report.http=json(dir+'/http.json');
report.browser=['observed-8p1Ofj','global-8DefXL','global-PrIbto'].map(name=>{
  const r=json(dir+'/'+name+'/browser.json');
  return {path:dir+'/'+name+'/browser.json',exitCode:r.exitCode,checks:r.checks,errors:r.errors,error:r.error,elapsedSeconds:r.elapsedSeconds,
    cleanup:r.cleanup.verified,proxyStopped:r.proxyStopStatus===204,
    captures:r.captures.map(c=>({name:c.name,expected:c.sha256,current:sha(readFileSync(resolve(r.out,c.name+'.png'))),before:c.before.featureCount,after:c.after.featureCount})),
    lastSample:r.lastSample,outcome:r.outcome};
});
report.visualInspection={reviewer:'parent',independent:false,count:9,
  result:'Five retained-tab captures: intentionally deferred blank map with useful metrics, then four visible selected-route captures at 390x844/390x667/320x667/1440x950. Four global-error captures show readable recovery controls at three viewports and after native Reload. No successful new-B-route capture in this turn.',
  limitation:'Subagent quota previously recorded; no repeated spawn and no independent visual acceptance claim'};
report.failedAttempts={
  python:['integration-1','staging-final-b'].map(name=>{const r=json(dir+'/'+name+'/checks.json');return {name,exitCode:r.exitCode,signal:r.signal,error:r.error,elapsedSeconds:r.elapsedSeconds,stdout:r.stdout};}),
  firstBuild:json(dir+'/build-1/build.json'),
  captureCorrection:'Initial capture omitted support for actual .mjs runtimes/LICENSE.txt. Build-1 stopped before archive creation/compilation. Its wrapper failed to retain child stdout; original detailed error is unavailable. Inspected paths and code establish the allowlist gap; final fixture/capture/build succeed. Build-2 wrapper preserves future child failures.',
  firstProxy:'proxy-1 reached ECONNREFUSED on4345 before the launcher completed. No browser started. Its early exception was printed to the tool but not persisted by that script.',
  launcher:'Owned PowerShell113276 stalled in Get-NetTCPConnection before creating logs/server. Exact PID/path/starttime13:26:15.644918+08:00 checked; stopped only that launcher. Direct Next startup then succeeded. No existing listener or other app was stopped.',
  globalHarness:'global-8DefXL polled document.body before navigation created it and exited1. Null-safe DOM sampling fixed in the new helper only; subsequent global-PrIbto passed. Original runner/receipt unchanged.'};
report.findings=[
  'Pinned bounded frontend retention is implemented in preparation and guarded local/provider builds. Same-URL different bytes, linked/unlisted paths and pin changes block; current assets win and old misses fall back. No automatic archive discovery or forced navigation.',
  'Controlled retained A remained the same Document/postal after B worker activation and actual old-module200; bytes match the 39556-byte pin and all four viewport captures show four current route features. This fixes the specific previously reproduced uncached old-chunk404 case.',
  'The same run later failed ordinary navigation to B with map-startup timeout, while useful walk text remained. Browser exit1 stays recorded: 15 passed checks followed by a timeout, not full upgrade acceptance. OneMap responses continued; 15 stale CDP interception errors also limit causal attribution. Hardware-only causation is not established.',
  'A separate QA-only fault-route test passes7 checks: real global fallback, native Reload preserving query/hash, no reload loop, narrow/desktop fit. It does not retrofit legacy A or prove new-B map startup.',
  'Final isolated web1744/64, targeted Python166, TypeScript, guarded build and integrity pass. Initial fixture/runtime gaps, bounded test timeouts and harness failures are preserved. No full-project Python-suite or latency claim.',
  'Archive capture is29 files totaling5786770bytes, frontend only. Real deployment identity and old-runtime security remain unverified; current MapLibre advisory/installation and T27/T28 gates remain. No installs, protected-data mutation, pipeline execution, real artifact staging or deployment in this turn.'
];
report.disagreements=[
  'A passing retained-tab slice cannot close T01 when the subsequent current-build navigation timed out. Keep T01 PARTIAL and retain the failure instead of rerunning merely for a pass.',
  'Captured local build identity plus byte hashes are not production identity or security approval. Retention is selected-generation compatibility, not indefinite old-tab support. The global error test uses a declared QA-only route.',
  'Both data-cache sentinels and sampled body preservation were previously established, but this retained run stopped before its final cache comparison. Do not carry that claim into this run.'
];
report.next=['T01: instrument the first current-build startup across navigation, including worker/style/tile lifecycle and recovery; avoid blind repetition or changing timeouts without evidence',
  'T25: bounded fast navigation/reduced motion/enlarged text acceptance remains FREE',
  'T29 security disposition then T27 real release identity/preparation and T28 deployment require their owner gates; no repeated determinism work'];
const evidence='qa/verification/REVAMP-R1-core-walk.md';
const prefix=execFileSync('git',['show',report.base+':'+evidence],{cwd:root,windowsHide:true,maxBuffer:2*1024*1024});
report.evidencePrefix={path:evidence,bytes:prefix.length,sha256:sha(prefix),unchanged:read(evidence).subarray(0,prefix.length).equals(prefix)};
report.protectedTrackedDiff=command('git',['diff',report.base,'--','pipeline/config/weights.yaml','raw','processed','web/public/data','checksums.json','qa/releases','qa/p6_*','qa/p7_*','qa/p8_*','qa/p9_*','qa/p10_*','qa/p11/d_*']).stdout;
command('git',['diff','--check']);
command('git',['check-ignore','-v',evidence]);
command(resolve(root,'.venv/Scripts/python.exe'),['-B',resolve(root,'scripts/check_repo_integrity.py')]);
for(const port of [4345,4346]){
  try{await fetch('http://127.0.0.1:'+port+'/',{signal:AbortSignal.timeout(3000)});throw Error('Owned helper still listening:'+port);}
  catch(e){if(e.cause?.code!=='ECONNREFUSED')throw e;}
}
report.ownedHelpersStopped={ports:[4345,4346],probe:'ECONNREFUSED',nextPid:104776,identityVerifiedBeforeStop:true,browsers:report.browser.every(b=>b.cleanup&&b.proxyStopped)};
report.ok=report.web.ok&&report.sources.every(s=>s.sha256===s.current&&s.current===s.built)&&report.anchors.every(s=>s.expected===s.current)&&
  report.python.every(t=>t.exitCode===0&&t.stable&&t.sourcesCurrent)&&report.build.exitCode===0&&report.http.ok&&report.evidencePrefix.unchanged&&
  !report.protectedTrackedDiff&&report.browser.every(b=>b.cleanup&&b.proxyStopped&&b.captures.every(c=>c.current===c.expected))&&
  report.commands.every(c=>c.exitCode===(c.args[0]==='check-ignore'?1:0));
report.okMeaning='Implementation/test/source/cleanup receipt valid, NOT full T01 or release acceptance';
report.productAcceptance=false;report.finishedAt=new Date().toISOString();
writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,ok:report.ok,productAcceptance:report.productAcceptance,web:report.web,python:report.pythonArithmetic,build:build.buildId,
  evidencePrefix:report.evidencePrefix,findings:report.findings,disagreements:report.disagreements},null,2));
process.exitCode=report.ok?0:1;
