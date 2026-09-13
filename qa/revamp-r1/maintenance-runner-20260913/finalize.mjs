import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { hostname } from 'node:os';
const root='C:\\sgSHIOK2026'; assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const prefix='qa/revamp-r1/maintenance-runner-20260913',dir=resolve(root,prefix);
const base='e6113cfd09bd9cfbd615debad826827b6758dcac';
const read=p=>readFileSync(resolve(root,p));
const json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const write=(p,v)=>writeFileSync(resolve(dir,p),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true,maxBuffer:32000000});
assert.equal(git('rev-parse','HEAD').toString().trim(),base);
const focused=json(`${prefix}/focused-4v8lpX/command.json`),full=json(`${prefix}/all-CWKqK9/command.json`),integrity=json(`${prefix}/integrity-Oays0P/command.json`);
for(const receipt of [focused,full,integrity]) {
  assert.equal(receipt.status,0); assert.ok(receipt.stable);
  for(const [path,hash] of Object.entries(receipt.sources)) assert.equal(sha(read(path)),hash,path);
}
const xml=path=>JSON.parse(execFileSync('python',['-B','-c',
  'import json,sys,xml.etree.ElementTree as E; r=E.parse(sys.argv[1]).getroot(); print(json.dumps({"suites":[n.attrib for n in r.iter("testsuite")],"tests":[{"name":n.get("name"),"file":n.get("classname"),"failed":n.find("failure") is not None or n.find("error") is not None,"skipped":n.find("skipped") is not None} for n in r.iter("testcase")]}))',resolve(root,path)],{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:8000000}));
const focusedXml=xml(`${prefix}/focused-4v8lpX/junit.xml`),fullXml=xml(`${prefix}/all-CWKqK9/junit.xml`);
assert.equal(focusedXml.tests.length,27); assert.equal(fullXml.tests.length,1039);
assert.ok(fullXml.tests.every(t=>!t.failed&&!t.skipped));
assert.equal(new Set(fullXml.tests.map(t=>t.file)).size,13);
assert.ok(integrity.stdout.includes('repo_integrity=ok'));
write('test-catalogue.json',{cases:focusedXml.tests,limits:'Synthetic local integration; no provider or scheduler activation.'});
const anchors=Object.values(json('web/lib/__tests__/fixtures/published-walks.provenance.json').sources).map(s=>{
  const b=read(s.path); assert.equal(sha(b),s.sha256,'STOP_INPUT_MISMATCH '+s.path); assert.equal(b.length,s.bytes);return{path:s.path,bytes:b.length,sha256:sha(b)};
});
const weights=sha(read('pipeline/config/weights.yaml'));assert.equal(weights,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec');
assert.equal(git('diff','--name-only',base,'--','pipeline','raw','processed','checksums.json','web/public/data','qa/p6_*','qa/p7_*','qa/p8_*','qa/p9_*','qa/p10_*','qa/p11/d_*','qa/releases').toString().trim(),'');
const evidence='qa/verification/REVAMP-R1-core-walk.md',before=git('show',base+':'+evidence),after=read(evidence);
assert.ok(before.equals(after.subarray(0,before.length)));assert.ok(after.subarray(before.length).includes('FINDINGS')&&after.subarray(before.length).includes('DISAGREEMENTS'));
const board=Buffer.from(await(await fetch('http://127.0.0.1:4420/postplan.html',{signal:AbortSignal.timeout(10000)})).arrayBuffer());
assert.equal(sha(board),sha(read('postplan.html')));assert.ok(board.toString().includes('all 1,039 maintenance Python tests across 13 files pass'));
assert.ok(!board.toString().includes('Next: inactive maintenance-runner integration'));
assert.ok(!read('.agents/STATE.md').toString().includes('Retained1012Python/12files not rerun'));
const preview=await(await fetch('http://127.0.0.1:4420/__qa/status',{signal:AbortSignal.timeout(10000)})).json();assert.equal(preview.buildId,'l7V5uOArXwdDrUIe3Wc2s');
const sourcePaths=['scripts/run_source_maintenance.py','scripts/check_source_metadata.py','scripts/acknowledge_source_notices.py','scripts/source_metadata_comments.py','scripts/source_metadata_request_budget.py','scripts/source_metadata_github.py','scripts/source_metadata_http.py','scripts/source_metadata_state.py','scripts/source_metadata_delivery.py','scripts/inspect_source_notice_journal.py'];
const summary={root,hostname:hostname(),base,createdAt:new Date().toISOString(),goal:'ACTIVE',tests:{focused:27,maintenance:1039,files:13,failures:0,skips:0,arithmetic:'1012+27=1039;12+1=13',focusedReceipt:'focused-4v8lpX/command.json',allReceipt:'all-CWKqK9/command.json',scope:'Maintenance/README only, not full Python project',elapsedMs:full.elapsedMs,runnerSeconds:127.63,arithmeticTime:'Runner127.63s is inside command elapsed, not added twice',retainedWeb:{tests:1990,files:73,dependencyGuards:42,typesExit:0,rerun:false,commit:base}},failedAttempts:[{receipt:'focused-vkZXJr/command.json',passed:18,failed:1,cause:'Nine-source fixture supplied one response'},{receipt:'focused-eVpMcj/command.json',passed:24,failed:1,cause:'Changed original report was rejected by existing receipt pin before the expected later check; corrected test uses a distinct carried-current pair'}],sourceHashes:Object.fromEntries(sourcePaths.map(p=>[p,sha(read(p))])),anchors,weightSha256:weights,evidence:{path:evidence,previousBytes:before.length,previousSha256:sha(before),bytes:after.length,addedBytes:after.length-before.length,exactPrefix:true},preview,taskBoard:{url:'http://127.0.0.1:4420/postplan.html',sha256:sha(board),liveEqualsDisk:true},integrity:{receipt:'integrity-Oays0P/command.json',status:0,stdout:integrity.stdout},review:json(`${prefix}/review.json`),findings:['Actual local checker/client/journal/acknowledgement integration passes;27newcases.','Review caught and corrected missing-client default networking, dropped handoff pins and escaping recovery IO errors.','Pending notices retain original check identity; eight fresh notices share24calls including acknowledgement.','Service/account/storage/operator/scheduler, physical devices and exact release remain open.'],disagreements:['Successful notice delivery does not establish healthy sources or active maintenance.','Local fixtures do not replace real reporting infrastructure or physical-device acceptance.'],pipelineRuns:0,pipelineSeconds:0,installations:0,externalNotices:0,deployments:0};
write('summary.json',summary);
const files=[];
function walk(path){for(const e of readdirSync(path,{withFileTypes:true})){const p=resolve(path,e.name);if(e.isDirectory())walk(p);else{const b=readFileSync(p);files.push({path:prefix+'/'+relative(dir,p).replaceAll('\\','/'),bytes:b.length,sha256:sha(b)});}}}
walk(dir);write('artifact-index.json',{files});write('stage-paths.json',[...files.map(f=>f.path),prefix+'/artifact-index.json',prefix+'/stage-paths.json']);
console.log(JSON.stringify({focused:27,maintenance:1039,files:13,integrity:0,evidence:summary.evidence,boardMatches:true,protectedAnchors:anchors.length,artifacts:files.length},null,2));
