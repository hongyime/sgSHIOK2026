import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026'; assert.equal(process.cwd(),root);
const dir=resolve(root,'qa/revamp-r1/maintenance-runner-20260913');
const mode=process.argv[2]; assert.ok(['focused','all','integrity'].includes(mode));
const out=mkdtempSync(resolve(dir,mode+'-'));
const temp=mkdtempSync(resolve(root,'tmp/maintenance-runner-tests-'));
const tests=['tests/test_source_maintenance_runner.py',...(mode==='all'?[
  'tests/test_source_notice_inspection.py','tests/test_source_metadata_request_budget.py',
  'tests/test_source_metadata_github.py','tests/test_source_metadata_comments.py',
  'tests/test_source_metadata_acknowledgement.py','tests/test_source_metadata_receipt_verification.py',
  'tests/test_source_metadata_cli.py','tests/test_source_metadata_catalog.py',
  'tests/test_source_metadata_http.py','tests/test_source_metadata_state.py',
  'tests/test_source_metadata_delivery.py','tests/test_readme.py']:[])];
const args=mode==='integrity'?['-B','scripts/check_repo_integrity.py']:['-B','-m','pytest','-q',...tests,
  '--noconftest','-p','no:cacheprovider','-o','addopts=','--basetemp='+resolve(temp,'fixtures'),'--junitxml='+resolve(out,'junit.xml')];
const paths=['scripts/run_source_maintenance.py',...tests];
const sha=b=>createHash('sha256').update(b).digest('hex');
const hashes=()=>Object.fromEntries(paths.map(p=>[p,sha(readFileSync(resolve(root,p)))]));
const sources=hashes(),start=Date.now();
const result=spawnSync('python',args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:240000,maxBuffer:8*1024*1024,
  env:{...process.env,PYTEST_DISABLE_PLUGIN_AUTOLOAD:'1',PYTHONDONTWRITEBYTECODE:'1',PYTEST_ADDOPTS:'',TEMP:temp,TMP:temp}});
const stable=JSON.stringify(sources)===JSON.stringify(hashes());
writeFileSync(resolve(out,'command.json'),JSON.stringify({command:['python',...args],elapsedMs:Date.now()-start,
  status:result.status,error:result.error?.message,stdout:result.stdout,stderr:result.stderr,sources,stable,
  network:'All new runner tests deny external sockets/process workers; synthetic provider responses only.',pipelineRuns:0},null,2)+'\n',{flag:'wx'});
process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'');console.log('receipt='+out);
assert.ok(stable);process.exitCode=result.status??1;
