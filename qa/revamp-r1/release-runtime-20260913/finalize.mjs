import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const out=resolve(root,'qa/revamp-r1/release-runtime-20260913');
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const checks=readdirSync(out).filter(p=>p.startsWith('checks-')).sort().map(p=>({path:p,...json(relative(root,resolve(out,p,'command.json')))}));
const full=checks.filter(c=>c.path.startsWith('checks-full-')).at(-1);
const types=checks.filter(c=>c.path.startsWith('checks-types-')).at(-1);
assert.equal(full.status,0);assert.equal(types.status,0);
const stdout=readFileSync(resolve(out,full.path,'stdout.txt'),'utf8');
assert.match(stdout,/Tests\s+1916 passed/);assert.match(stdout,/Test Files\s+71 passed/);assert.match(stdout,/pass 42/);
const monitor=json('qa/revamp-r1/maintenance-continuity-20260913/final/command.json');
assert.equal(monitor.status,0);assert.match(monitor.stdout,/376 passed/);
const probe=json('qa/revamp-r1/release-runtime-20260913/sanitizer-probe.json');
assert.ok(probe.pass&&probe.cleanup.verified&&probe.checks.length===12&&probe.checks.every(c=>c.pass));
const previewBuild=json('qa/revamp-r1/completion-20260913/build-2/build.json');
const changed=previewBuild.sources.filter(s=>sha(readFileSync(resolve(root,s.path)))!==s.sha256).map(s=>s.path).sort();
assert.deepEqual(changed,['web/lib/__tests__/route-evidence-map-popup.test.ts','web/lib/__tests__/transit-popup.test.ts']);
const fixture=json('web/lib/__tests__/fixtures/published-walks.provenance.json');
const anchors=Object.values(fixture.sources).map(s=>{const bytes=readFileSync(resolve(root,s.path));assert.equal(sha(bytes),s.sha256,s.path);return {path:s.path,bytes:bytes.length,sha256:sha(bytes)};});
const weights=sha(readFileSync(resolve(root,'pipeline/config/weights.yaml')));
assert.equal(weights,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec');
const evidence='qa/verification/REVAMP-R1-core-walk.md';
const before=execFileSync('git',['show','0680184:'+evidence],{cwd:root,encoding:'utf8'}).replace(/\r\n/g,'\n');
assert.ok(readFileSync(resolve(root,evidence),'utf8').replace(/\r\n/g,'\n').startsWith(before));
const integrity=spawnSync('python',['-B','scripts/check_repo_integrity.py'],{cwd:root,windowsHide:true,encoding:'utf8',timeout:15000});
assert.equal(integrity.status,0);assert.match(integrity.stdout,/repo_integrity=ok/);
const ignored=spawnSync('git',['check-ignore','-v',evidence],{cwd:root,windowsHide:true,encoding:'utf8'});assert.equal(ignored.status,1);
assert.equal(git(['ls-files','--error-unmatch',evidence]),evidence);
assert.equal(git(['diff','--name-only','0680184','--','pipeline','raw','processed','web/public/data','checksums.json']),'');
const preview=await (await fetch('http://127.0.0.1:4412/__qa/status',{signal:AbortSignal.timeout(5000)})).json();
assert.equal(preview.buildId,previewBuild.buildId);
const summary={root,hostname:process.env.COMPUTERNAME,createdAt:new Date().toISOString(),headBeforeFinalCommit:git(['rev-parse','HEAD']),
  tests:{web:{tests:1916,files:71,delta:'1889 +22 independent full fields +4 compact fields +1 constructor/source contract =1916',full},types,
    pythonFocused:{tests:376,delta:'80 CLI +31 catalog +76 HTTP +85 state +96 delivery +8 README =376',receipt:'qa/revamp-r1/maintenance-continuity-20260913/final/command.json'},
    dependencyGuards:42,wholeProjectPythonSuite:false},checks,
  browser:{newAppRun:false,previewBuild:preview.buildId,previewSourceCount:previewBuild.sources.length,testOnlyChangesSinceBuild:changed,
    sanitizerCases:12,observedInstrumentedPageRequests:probe.network.length,cleanupVerified:probe.cleanup.verified,
    limits:'Inert DOMParser output only; no insertion/event execution or live exploit. Not whole browser-process network capture or application security approval.'},
  liveBuild:json('qa/revamp-r1/release-runtime-20260913/build-id-proof.json'),
  review:{independent:'Einstein inspected compiled/live/current paths and source hashes; found no untrusted attribution sink path or popup escaping bypass in scoped paths.',
    followup:'Parent added independent fallback/compact field tests and constructor/source checks. Peer identified missing url exclusion and rendered HTML equality; both added before final full suite.',
    limits:'Peer read-only review did not rerun the parent test suite or approve deployment.'},
  anchors,weightsSha256:weights,evidenceAppendOnly:true,
  integrity:{stdout:integrity.stdout,stderr:integrity.stderr,exitCode:integrity.status},
  checkIgnore:{stdout:ignored.stdout,stderr:ignored.stderr,exitCode:ignored.status,tracked:true},
  findings:['Monitor initialization now fails closed instead of silently losing cooldown/history continuity.',
    'Actual production HTML and JS identify an older6.1.0 runtime; it is not the archived local compatibility build.',
    'Old sanitizer defect reproduced; current patched code removes the tested attributes. Scoped reviewed app paths do not expose untrusted attribution.',
    'GitHub issue PATCH does not document the abstract adapter CAS guarantee; delivery protocol needs provider-honest revision before activation.'],
  disagreements:['Version presence is not proof of an exploitable application path; scoped absence is not universal safety.',
    'setDOMContent does not sanitize prior innerHTML; application escaping remains required.',
    'Fake conditional updates cannot establish actual GitHub atomicity or durable service delivery.'],
  remaining:['Report account/privacy/moderator/backups and real service implementation.',
    'Append-only maintenance notice/recovery protocol, persistence, approved schedule and actual delivery.',
    'Actual production/rollback archive, retained-runtime disposition, quota and exact release/SW approval.',
    'Physical phone and unaided resident acceptance.'],
  pipelineRuns:0,exports:0,installs:0,deployments:0,protectedWrites:0,xAccess:0,goalComplete:false};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
const paths=[];function walk(p){for(const e of readdirSync(p,{withFileTypes:true})){const f=resolve(p,e.name);if(e.isDirectory())walk(f);else if(e.isFile())paths.push(f);}}walk(out);
const artifacts=paths.sort().map(p=>{const bytes=readFileSync(p);return {path:relative(root,p).replaceAll('\\','/'),bytes:bytes.length,sha256:sha(bytes)};});
writeFileSync(resolve(out,'artifact-index.json'),JSON.stringify({artifacts,note:'Raw diagnostic bytes preserved by local .gitattributes; original vendor response bodies remain local/publicly URL-addressed, not republished as new vendor assets.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({webTests:1916,pythonFocused:376,probeCases:12,anchors:anchors.length,artifacts:artifacts.length,goalComplete:false}));
