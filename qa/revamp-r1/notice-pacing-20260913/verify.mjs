import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const mode=process.argv[2];assert.ok(['focused','all','integrity'].includes(mode));
const out=resolve(root,'qa/revamp-r1/notice-pacing-20260913',`${mode}-${Date.now()}`);assert.ok(!existsSync(out));mkdirSync(out);
const temp=resolve(root,'tmp',`notice-pacing-tests-${Date.now()}`);assert.ok(!existsSync(temp));mkdirSync(temp);
const tests=['tests/test_source_metadata_github.py','tests/test_source_metadata_request_budget.py','tests/test_source_metadata_comments.py','tests/test_source_metadata_acknowledgement.py',
  ...(mode==='all'?['tests/test_source_metadata_receipt_verification.py','tests/test_source_metadata_cli.py','tests/test_source_metadata_catalog.py','tests/test_source_metadata_http.py',
    'tests/test_source_metadata_state.py','tests/test_source_metadata_delivery.py','tests/test_readme.py']:[])];
const args=mode==='integrity'?['-B','scripts/check_repo_integrity.py']:['-B','-m','pytest','-q',...tests,'--noconftest','-p','no:cacheprovider','-o','addopts=',
  '--basetemp='+resolve(temp,'fixtures'),'--junitxml='+resolve(out,'junit.xml')];
const paths=['scripts/acknowledge_source_notices.py','scripts/source_metadata_comments.py','scripts/source_metadata_github.py','scripts/source_metadata_request_budget.py','README.md',...tests];
const sourceHashes=Object.fromEntries(paths.filter(p=>existsSync(resolve(root,p))).map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
const start=Date.now();
const result=spawnSync('python',args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024,
  env:{...process.env,PYTEST_DISABLE_PLUGIN_AUTOLOAD:'1',PYTHONDONTWRITEBYTECODE:'1',PYTEST_ADDOPTS:'',TEMP:temp,TMP:temp}});
writeFileSync(resolve(out,'command.json'),JSON.stringify({command:['python',...args],cwd:root,elapsedMs:Date.now()-start,status:result.status,
  error:result.error?.message,stdout:result.stdout,stderr:result.stderr,sourceHashes,
  scope:'Synthetic responses and clocks; real temporary journals. No live notices, source checks, pipeline, frontend build or deployment.'},null,2)+'\n',{flag:'wx'});
console.log(result.stdout);console.log(result.stderr);console.log('receipt='+out);console.log('exit='+result.status);process.exitCode=result.status??1;
