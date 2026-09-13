import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root='C:\\sgSHIOK2026';
assert.equal(process.cwd(),root);
const out=resolve(root,'qa/revamp-r1/walk-only-20260913');
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(readFileSync(resolve(out,p)));
const base='ea825bca19e916f8c32ecbb5f8f0294a1c585162';
const commands=[];
function run(file,args,expected=0){
  const r=spawnSync(file,args,{cwd:root,encoding:'utf8',windowsHide:true,timeout:60000,maxBuffer:8*1024*1024});
  commands.push({file,args,status:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.message});
  assert.equal(r.status,expected,args.join(' ')); return r.stdout;
}
run('git',['rev-parse','HEAD']);
run('git',['ls-remote','origin','main']);
run('git',['diff','--check']);
run('git',['diff','--cached','--check']);
run('git',['check-ignore','-v','qa/verification/REVAMP-R1-core-walk.md','postplan.html'],1);
run('git',['ls-files','--error-unmatch','qa/verification/REVAMP-R1-core-walk.md','postplan.html']);
run(process.execPath,[resolve(root,'web/node_modules/typescript/bin/tsc'),'--project',resolve(root,'web/tsconfig.json'),'--noEmit','--incremental','false']);
run('python',['scripts/check_repo_integrity.py']);
const build=json('build-2/build.json');
const sourceMatches=build.sources.map(s=>({...s,currentSha256:sha(readFileSync(resolve(root,s.path)))}));
assert.ok(sourceMatches.every(s=>s.sha256===s.currentSha256));
const provenance=JSON.parse(readFileSync(resolve(root,'web/lib/__tests__/fixtures/published-walks.provenance.json')));
const anchors=Object.values(provenance.sources).map(s=>({...s,currentSha256:sha(readFileSync(resolve(root,s.path)))}));
assert.ok(anchors.every(s=>s.sha256===s.currentSha256));
const weightsPath='pipeline/config/weights.yaml';
const weights={path:weightsPath,baseSha256:sha(execFileSync('git',['show',base+':'+weightsPath],{cwd:root})),
  currentSha256:sha(readFileSync(resolve(root,weightsPath)))};
assert.equal(weights.baseSha256,weights.currentSha256);
const assertions=p=>json(p).testResults.flatMap(f=>f.name.endsWith('published-walk-page.test.tsx')?f.assertionResults.map(a=>a.fullName):[]);
const before=assertions('checks-1789265946224/stdout.txt');
const after=assertions('checks-1789266357480/stdout.txt');
const full=readFileSync(resolve(out,'checks-1789267423920/stdout.txt'),'utf8');
assert.match(full,/1784 passed \(1784\)/); assert.match(full,/67 passed \(67\)/);
const mainBrowser=json('observed-q5dYh5/browser.json');
assert.equal(mainBrowser.ok,true); assert.equal(mainBrowser.checks.length,64);
const positive=json('observed-GMu0lt/browser.json');
const report={
  root,hostname:process.env.COMPUTERNAME,base,commands,buildId:build.buildId,preview:json('preview-2.json'),
  tests:{baseline:1791,final:1784,files:67,previousFiles:65,skipped:0,dependencyGuard:42,
    arithmetic:'1791 - 25 retired page cases - 2 retired draft cases + 1 retired-draft boundary + 1 UI-removal case + 2 fragment guards + 2 failure cases + 14 helper cases = 1784',
    focused:99,removedPageCases:before.filter(x=>!after.includes(x)),addedSinceFirstRedPage:after.filter(x=>!before.includes(x)),
    note:'The first red page already included the new UI-removal case. Renamed/source-copy assertions follow the explicit scope change. Historical unmounted comparison helper tests remain.'},
  sourceMatches,anchors,weights,provider:json('provider-probe.json'),
  browser:{primary:{path:'observed-q5dYh5/browser.json',ok:true,checks:64,samples:mainBrowser.samples},
    successReplay:{path:'observed-GMu0lt/browser.json',ok:positive.ok,functionalChecks:positive.checks.filter(c=>c.pass).length,errors:positive.errors,
      note:'Observed live API payload replay renders a labelled preview and returns to saved bus. Overall audit stays failed on two CDP command faults, not relabelled PASS.'},
    earlierFailedRuns:['observed-IflzpE','observed-61CqNb'],
    inspected:['observed-q5dYh5/bus-preview-unavailable.png','observed-q5dYh5/bus-preview-recovered.png','observed-q5dYh5/details-320.png',
      'observed-q5dYh5/collapsed-1440.png','observed-q5dYh5/mobile-mrt_lrt.png','observed-q5dYh5/collapsed-390.png',
      'observed-q5dYh5/details-390.png','observed-q5dYh5/details-1440.png','observed-q5dYh5/mobile-details.png',
      'observed-GMu0lt/actual-provider-payload-rendered.png'],
    limitations:'Owned headless desktop Chrome at four emulated sizes; no physical phone, representative timing, new service-worker update acceptance or complete HTTP lifecycle claim. Plugin bootstrap failed os error3.'},
  findings:[
    'Old QA proxy denied all APIs, forcing unsaved-stop previews to fail. New exact GET route forwarding works; one public live request returned HTTP200 in355.585ms.',
    'Only MRT/LRT exits and Bus stops remain; shortest usable saved walking geometry is automatic. Explicit saved URL selection survives.',
    'Comparison/About data/technical card no longer mount or restore/load saved shortlists. Existing stored data and historical code/evidence remain.',
    'Night lighting is automatic and viewport/zoom bounded. Visual review found and removed a lamp-count/attribution overlap at320px.',
    'HTTP/body-inclusive12s client timeout, explicit retry and stale-result guards preserve the last usable saved walk and marker across category failure.',
    '64 final-build browser checks pass. A separate successful live-payload replay rendered correctly but keeps its two CDP command faults and failed audit.',
    'Remaining work is route coverage, device/core-walk acceptance, durable reports, maintenance activation and release. Comparison is retired. No data repair or production deployment occurred.'
  ],
  disagreements:[
    'No new factual disagreement with the owner request. Closest is limited to usable saved walking routes; markers do not guarantee saved or online route availability.',
    'The goal runner remains blocked and exposes no resume operation to this agent. This concrete request was executed; the broader service is not marked complete.'
  ],
  costs:{pipelineRuns:0,pipelineSeconds:0,installs:0,deployments:0},
  remainingAgentWork:['Reduce transit-popup density; extend mixed-availability core-walk cases.',
    'Add a separately tested server-side upstream deadline/cancellation; current12s bound is client-side.',
    'Finish release-specific returning-user/request-budget checks after naming the approved frontend generation.'],
  ownerGates:['Physical-phone task acceptance','Report provider/privacy/moderator/backup','Expanded data jobs, scheduler activation and exact deployment']
};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({buildId:report.buildId,tests:report.tests.final,files:report.tests.files,anchors:anchors.length,
  weightsUnchanged:true,browserChecks:64,positiveAudit:positive.ok,commands:commands.map(c=>({file:c.file,args:c.args,status:c.status}))},null,2));
