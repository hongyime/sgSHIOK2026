import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root='C:\\sgSHIOK2026'; assert.equal(process.cwd(),root);
const mode=process.argv[2]; assert.ok(['all','focused','integrity','smoke'].includes(mode));
const out=resolve(root,'qa/revamp-r1/notice-inspection-20260913',`${mode}-${Date.now()}`);
assert.ok(!existsSync(out));mkdirSync(out);
const temp=resolve(root,'tmp',`notice-inspection-tests-${Date.now()}`);assert.ok(!existsSync(temp));mkdirSync(temp);
const tests=['smoke','integrity'].includes(mode)?[]:['tests/test_source_notice_inspection.py',...(mode==='all'?[
  'tests/test_source_metadata_github.py','tests/test_source_metadata_request_budget.py','tests/test_source_metadata_comments.py',
  'tests/test_source_metadata_acknowledgement.py','tests/test_source_metadata_receipt_verification.py','tests/test_source_metadata_cli.py',
  'tests/test_source_metadata_catalog.py','tests/test_source_metadata_http.py','tests/test_source_metadata_state.py',
  'tests/test_source_metadata_delivery.py','tests/test_readme.py']:[])];
const args=mode==='smoke'?['-B',resolve(root,'qa/revamp-r1/notice-inspection-20260913/smoke.py')]:mode==='integrity'?['-B','scripts/check_repo_integrity.py']:['-B','-m','pytest','-q',...tests,'--noconftest','-p','no:cacheprovider','-o','addopts=',
  '--basetemp='+resolve(temp,'fixtures'),'--junitxml='+resolve(out,'junit.xml')];
const paths=['qa/revamp-r1/notice-inspection-20260913/smoke.py','scripts/inspect_source_notice_journal.py','scripts/acknowledge_source_notices.py','scripts/source_metadata_comments.py',
  'scripts/source_metadata_github.py','scripts/source_metadata_request_budget.py','scripts/source_metadata_delivery.py',
  'scripts/source_metadata_state.py','scripts/check_source_metadata.py','scripts/source_metadata_http.py','README.md',...tests];
const hashes=()=>Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
const sourceHashes=hashes(),start=Date.now();
const result=spawnSync('python',args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:240000,maxBuffer:4*1024*1024,
  env:{...process.env,PYTEST_DISABLE_PLUGIN_AUTOLOAD:'1',PYTHONDONTWRITEBYTECODE:'1',PYTEST_ADDOPTS:'',TEMP:temp,TMP:temp}});
const sourceStable=JSON.stringify(sourceHashes)===JSON.stringify(hashes());
writeFileSync(resolve(out,'command.json'),JSON.stringify({command:['python',...args],cwd:root,elapsedMs:Date.now()-start,status:result.status,
  error:result.error?.message,stdout:result.stdout,stderr:result.stderr,sourceHashes,sourceStable,
  scope:'Synthetic local journals and clocks. No real source check, network notice, production payload, pipeline, install or activation.'},null,2)+'\n',{flag:'wx'});
process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'');console.log('receipt='+out);console.log('exit='+result.status);
assert.ok(sourceStable,'Source changed during checks');process.exitCode=result.status??1;
