import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const base=resolve(root,'qa/revamp-r1/moderator-console-20260915');
const read=p=>JSON.parse(readFileSync(resolve(base,p),'utf8')),hash=b=>createHash('sha256').update(b).digest('hex');
const focused=read('focused-qlx1x0/summary.json'),full=read('full-LDzXmI/summary.json'),types=read('types-QHJus1/summary.json'),docs=read('docs-G9tt6t/summary.json'),browser=read('browser-xNQFDt/summary.json');
for(const run of[focused,full,types,docs]){assert.equal(run.accepted,true);assert.equal(run.exit,0);assert.deepEqual(run.before,focused.before);assert.deepEqual(run.after,focused.before);}
for(const[p,h]of Object.entries(focused.before))assert.equal(hash(readFileSync(resolve(root,p))),h,p);
assert.equal(full.snapshotMatches,true);assert.equal(full.isolation.productionDataDirectoryAbsent,true);assert.equal(full.isolation.guardProbePassed,true);
const clean=s=>s.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g,'');
const stdout=clean(readFileSync(resolve(base,'full-LDzXmI/stdout.txt'),'utf8'));
assert.match(stdout,/Tests\s+3325 passed\s+\(3325\)/);assert.match(stdout,/Test Files\s+85 passed\s+\(85\)/);assert.match(stdout,/(?:#|\u2139)\s+tests 42/);assert.match(stdout,/(?:#|\u2139)\s+fail 0/);
assert.match(readFileSync(resolve(base,'docs-G9tt6t/stdout.txt'),'utf8'),/41 passed/);
assert.deepEqual(focused.tests,{passed:469,failed:0,pending:0,files:4});
const perFile=read('focused-qlx1x0/vitest.json').testResults.map(file=>({path:relative(root,file.name).replaceAll('\\','/'),passed:file.assertionResults.filter(t=>t.status==='passed').length,failed:file.assertionResults.filter(t=>t.status==='failed').length}));
assert.equal(browser.passed,true);assert.equal(browser.closed,true);assert.equal(browser.chromeExit.code,0);assert.equal(browser.sourcesUnchanged,true);
assert.equal(browser.checks.length,30);assert.equal(browser.captures.length,8);assert.ok(browser.checks.every(c=>c.passed));
for(const[p,h]of Object.entries(browser.sources))assert.equal(hash(readFileSync(resolve(root,p))),h,p);
for(const c of browser.captures)assert.equal(hash(readFileSync(resolve(base,'browser-xNQFDt',c.file))),c.sha256,c.file);
const anchors=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/report-operations-20260915/database-checkpoint.json'),'utf8'));
for(const a of anchors.protectedAnchors){const b=readFileSync(resolve(root,a.path));assert.equal(b.length,a.bytes);assert.equal(hash(b),a.sha256,a.path);}
assert.equal(hash(readFileSync(resolve(root,'pipeline/config/weights.yaml'))),anchors.weights);
const evidence=resolve(root,'qa/verification/REVAMP-R1-core-walk.md'),before=readFileSync(evidence);
const prior=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/moderator-http-20260915/evidence.json'),'utf8')).after;
assert.equal(before.length,prior.bytes);assert.equal(hash(before),prior.sha256);
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:30000});return{command:[cmd,...args],exit:r.status,stdout:r.stdout,stderr:r.stderr};};
const integrity=run(resolve(root,'.venv/Scripts/python.exe'),['-B',resolve(root,'scripts/check_repo_integrity.py')]);assert.equal(integrity.exit,0);assert.match(integrity.stdout,/repo_integrity=ok/);
const ignore=run('git',['check-ignore','-v','qa/verification/REVAMP-R1-core-walk.md']);assert.equal(ignore.exit,1);
const result={root,host:process.env.COMPUTERNAME,base:'86e6274ab4fa1bee2196a3ec72b32de37630d272',
  sourceBindings:focused.before,receipts:{focused:'focused-qlx1x0',full:'full-LDzXmI',types:'types-QHJus1',docs:'docs-G9tt6t',browser:'browser-xNQFDt'},
  focused:{...focused.tests,perFile},full:{tests:3325,files:85,guards:42,isolation:full.isolation,
    arithmetic:'182 session + 233 client + 33 console + 21 route/cache = 469; 2856 + 469 = 3325; 81 + 4 = 85. Focused overlaps full; guards are separate.'},
  browser:{checks:browser.checks,captures:browser.captures,visuallyInspected:browser.captures.map(c=>c.file),canvasPixels:browser.canvas,freeKiB:browser.freeKiB,closed:browser.closed,chromeExit:browser.chromeExit,
    limitation:'Real React/client in local Chrome with synthetic reports/transport. Dispatched page-transition events, not proven BFCache hit. Not real Auth/DB, Next production, integrated Home or physical-phone acceptance.'},
  history:{
    initialBrowserImport:read('browser-djywKH/summary.json').error,
    earlierBrowserChecks:'browser-zKivv9 (26) and browser-VfDYtV (29) passed their executed checks but omitted brand asset acceptance; their broken fixture icon does not qualify as full visual acceptance.',
    explicitIconGate:read('browser-LSHngs/summary.json').error,
    priorClientBrowser:'browser-rKWfUs:30 checks passed on the earlier client snapshot; final browser-xNQFDt binds corrected client.',
    typeFailure:{receipt:'types-iq27SM',exit:read('types-iq27SM/summary.json').exit,cause:'Nine TS2322 projection return-type errors; literal-preserving generic failure factory fixed without casts.'},
  },
  review:{agents:3,closed:3,corrected:['restored private DOM visible before React clear committed','selected/recovered audit outliving row expiry timer','logout provider dispatch lacked pressure limiter','pagination stopped at100pages despite5000retained capacity','focus jumped to root on decision phases','client/server login input bounds differed'],remaining:'Actual owner Auth/SQL concurrency, account enrollment, monitoring delivery and integrated release acceptance'},
  integrity,ignore,protectedAnchorsVerified:anchors.protectedAnchors.length,weights:anchors.weights,preview:read('preview.json'),
  operation:{supabaseCalls:0,enrollments:0,runtimeSecretsConfigured:0,intakeEnabled:false,productionBuilds:0,deployments:0,pipelineRuns:0,pipelineCost:0},
  FINDINGS:[
    '30-day/720-hour retention remains enforced; the new console expires selected content and recovered audit reasons as well as queue rows.',
    'Default-off private owner sign-in, local geometry, queue and confirmed decisions implemented. No browser persistence or external private geometry requests.',
    'Unknown saves reconcile read-only; pending/missing replies never prove failure and terminal state is not attributed to the previous attempt.',
    'Review fixes are covered by469focused tests and3325isolated tests,85files,42guards. TypeScript and41docs tests pass.30browser checks/eight inspected captures pass.',
    'Fixtures do not enable a reporting service. Owner email/enrollment, real Auth/overlapping database acceptance, monitoring delivery and independent core-map release remain under the active full-scope goal.',
  ],DISAGREEMENTS:[
    'None with the30-day choice. Physical deletion is the next successful daily cleanup, not the exact expiry instant.',
    'Warm-instance pressure limits are not a global free-tier budget; fixture and dispatched page-transition success are not actual Auth, BFCache-hit or launch acceptance.',
  ]};
const output=JSON.stringify(result,null,2);writeFileSync(resolve(base,'checkpoint.json'),output+'\n',{flag:'wx'});
appendFileSync(evidence,'\n\n## 2026-09-15: Private owner console and 30-day visibility\n\n```json\n'+output+'\n```\n');
const after=readFileSync(evidence);assert.ok(after.subarray(0,before.length).equals(before));
writeFileSync(resolve(base,'evidence.json'),JSON.stringify({before:prior,after:{bytes:after.length,sha256:hash(after)},appendOnly:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({root,host:result.host,focused:469,full:3325,files:85,guards:42,browserChecks:30,inspectedCaptures:8,docs:41,integrity,ignore,appendOnly:true,preview:result.preview},null,2));
