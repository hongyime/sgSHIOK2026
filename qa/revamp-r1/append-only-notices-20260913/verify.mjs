import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const mode=process.argv[2];assert.ok(['core','focused','all','integrity'].includes(mode));
const out=resolve(root,'qa/revamp-r1/append-only-notices-20260913',`${mode}-${Date.now()}`);
assert.ok(!existsSync(out));mkdirSync(out);
const temp=resolve(root,'tmp',`notice-tests-${Date.now()}`);
assert.ok(!existsSync(temp));mkdirSync(temp);
const tests=mode==='core'?['tests/test_source_metadata_comments.py']:
  mode==='focused'?['tests/test_source_metadata_comments.py','tests/test_source_metadata_github.py']:[
  'tests/test_source_metadata_comments.py','tests/test_source_metadata_github.py','tests/test_readme.py',
  'tests/test_source_metadata_cli.py','tests/test_source_metadata_catalog.py',
  'tests/test_source_metadata_http.py','tests/test_source_metadata_state.py','tests/test_source_metadata_delivery.py'];
const args=mode==='integrity'?['-B','scripts/check_repo_integrity.py']:[
  '-B','-m','pytest','-q',...tests,'--noconftest','-p','no:cacheprovider','-o','addopts=',
  '--basetemp='+resolve(temp,'fixtures'),'--junitxml='+resolve(out,'junit.xml')];
const sourceHashes=Object.fromEntries([...new Set(['scripts/source_metadata_comments.py','scripts/source_metadata_github.py',
  'scripts/source_metadata_delivery.py','README.md',...tests])].filter(p=>existsSync(resolve(root,p)))
  .map(p=>[p,createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex')]));
const start=Date.now();
const result=spawnSync('python',args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:120000,
  env:{...process.env,PYTEST_DISABLE_PLUGIN_AUTOLOAD:'1',PYTHONDONTWRITEBYTECODE:'1',PYTEST_ADDOPTS:'',TEMP:temp,TMP:temp},maxBuffer:4*1024*1024});
const receipt={command:['python',...args],cwd:root,elapsedMs:Date.now()-start,status:result.status,
  error:result.error?.message,stdout:result.stdout,stderr:result.stderr,sourceHashes,
  scope:'Local file-journal fixtures and synthetic HTTP/subprocess. No external mutation, scheduler or pipeline.'};
writeFileSync(resolve(out,'command.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(result.stdout);console.log(result.stderr);console.log('receipt='+out);console.log('exit='+result.status);
process.exitCode=result.status??1;
