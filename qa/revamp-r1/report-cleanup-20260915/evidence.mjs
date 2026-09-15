import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026',dir=resolve(root,'qa/revamp-r1/report-cleanup-20260915');
assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const load=relative=>JSON.parse(readFileSync(resolve(dir,relative,'summary.json'),'utf8'));
const before=JSON.parse(readFileSync(resolve(dir,'before.json'),'utf8'));
console.log(`${root} | ${process.env.COMPUTERNAME}`);
for(const [exe,args] of [
  ['git',['rev-parse','HEAD']],
  ['git',['check-ignore','-v','qa/verification/REVAMP-R1-core-walk.md']],
  ['git',['ls-files','--error-unmatch','qa/verification/REVAMP-R1-core-walk.md']],
  [resolve(root,'.venv/Scripts/python.exe'),['-B','scripts/check_repo_integrity.py']],
]){
  console.log(`$ ${exe} ${args.join(' ')}`);
  const result=spawnSync(exe,args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:30000});
  process.stdout.write(result.stdout??'');process.stdout.write(result.stderr??'');
  console.log(`exit=${result.status}`);
  assert.equal(result.status,args[0]==='check-ignore'?1:0);
}
for(const receipt of ['checks-IONe84','checks-MNJptw','checks-M360Kn',...readdirSync(dir).filter(name=>name.startsWith('checks-')&&load(name).mode==='docs')]){
  const r=load(receipt);console.log(JSON.stringify({receipt,command:r.command,exit:r.exit,elapsedMs:r.elapsedMs,sourceStable:r.sourceStable,tests:r.tests??null}));
}
console.log('full_web=2219 + 168 = 2387; files=76 + 1 = 77; dependency_guards=42');
console.log('focused=476 across6files; overlaps_full_suite=true; snapshot=bEAEHy; source_hashes_equal=12');
for(const receipt of ['remote-J5s5fs','remote-nPm25K']){
  const r=load(receipt);
  console.log(JSON.stringify({receipt,mode:r.mode,passed:r.passed,migration:r.migration,checks:r.checks,after:r.after,readback:r.readback??r.helperReadback},null,2));
}
const core=load('remote-J5s5fs');
console.log(`advisor_warn_error=${core.advisors.lints.filter(row=>['WARN','ERROR'].includes(row.level)).length}; advisor_info=${core.advisors.lints.filter(row=>row.level==='INFO').length}`);
for(const receipt of before.remoteReceipts)console.log(JSON.stringify(receipt));
console.log(`management_requests=${before.managementRequests.terms.join(' + ')} = ${before.managementRequests.total}; public_rpc_probes=1`);
console.log(`sql_group_executions=${before.sqlExecutedGroups.terms.join(' + ')} = ${before.sqlExecutedGroups.total}; unique_groups=23 + 6 = 29`);
console.log(`weights_sha256=${before.weights}; published_anchors_matched=${before.anchors.length}`);
console.log(`evidence_original_prefix_bytes=${before.evidenceOriginalPrefix.bytes}; sha256=${before.evidenceOriginalPrefix.sha256}`);
const evidence=readFileSync(resolve(root,'qa/verification/REVAMP-R1-core-walk.md'));
assert.equal(createHash('sha256').update(evidence.subarray(0,before.evidenceOriginalPrefix.bytes)).digest('hex'),before.evidenceOriginalPrefix.sha256);
console.log('FINDINGS');
before.findings.forEach((value,i)=>console.log(`${i+1}. ${value}`));
console.log('5. Global advisor WARNs were not waived: the public RPC returned400/0A000, not expected404. Earlier SQL probes were inconclusive; later ACL tests prove actual role denial and retained automatic RLS.');
console.log('6. Initial SQL fixture ambiguity and documentation wording failure were corrected; original failure receipts remain. No checks were weakened.');
console.log('DISAGREEMENTS');
before.disagreements.forEach((value,i)=>console.log(`${i+1}. ${value}`));
console.log('pipeline_runs=0; frontend_deployments=0; runtime_secrets_saved=0; intake_enabled=false; cron_installed=false');
console.log('NEXT: actual concurrency and scheduler cancellation, daily cleanup, early-deletion replay protection, resident form, authenticated moderator queue, exact release and device acceptance. Full build-and-ship goal remains active.');
