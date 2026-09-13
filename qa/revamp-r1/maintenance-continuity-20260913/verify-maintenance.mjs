import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const mode=process.argv[2];assert.ok(['docs-red','final'].includes(mode));
const out=resolve(root,'qa/revamp-r1/maintenance-continuity-20260913',mode);
assert.ok(!existsSync(out),'Preserve existing receipts');mkdirSync(out);
const temp=resolve(root,'tmp/maintenance-continuity-'+mode+'-20260913');
assert.ok(!existsSync(temp),'Fresh fixture directory required');mkdirSync(temp);
const tests=mode==='docs-red'?['tests/test_readme.py']:[
  'tests/test_readme.py','tests/test_source_metadata_cli.py','tests/test_source_metadata_catalog.py',
  'tests/test_source_metadata_http.py','tests/test_source_metadata_state.py','tests/test_source_metadata_delivery.py'];
const args=['-B','-m','pytest','-q',...tests,'--noconftest','-p','no:cacheprovider','-o','addopts=',
  '--basetemp='+resolve(temp,'fixtures'),'--junitxml='+resolve(out,'junit.xml')];
const start=Date.now();
const result=spawnSync('python',args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:120000,
  env:{...process.env,PYTEST_DISABLE_PLUGIN_AUTOLOAD:'1',PYTHONDONTWRITEBYTECODE:'1',PYTEST_ADDOPTS:'',TEMP:temp,TMP:temp},maxBuffer:4*1024*1024});
const receipt={command:['python',...args],cwd:root,elapsedMs:Date.now()-start,status:result.status,
  error:result.error?.message,stdout:result.stdout,stderr:result.stderr,scope:'Mocked tests, no live monitor or pipeline invocation'};
writeFileSync(resolve(out,'command.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(result.stdout);console.log(result.stderr);console.log('exit='+result.status);
process.exitCode=result.status??1;
