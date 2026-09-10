import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root='C:\\sgSHIOK2026';
if(process.cwd()!==root)throw Error('Working root guard');
const commands=[];
function run(command,args){
  const r=spawnSync(command,args,{cwd:root,encoding:'utf8',windowsHide:true,timeout:60000});
  commands.push({command,args,exitCode:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.message});
  return r;
}
const evidence='qa/verification/REVAMP-R1-core-walk.md';
const before=run('git',['show','HEAD:'+evidence]);
assert.equal(before.status,0);
const after=readFileSync(resolve(root,evidence),'utf8');
assert.ok(after.startsWith(before.stdout));
assert.equal(run('git',['diff','--check']).status,0);
assert.equal(run('git',['check-ignore','-v',evidence]).status,1);
assert.equal(run('git',['ls-files','--error-unmatch',evidence]).status,0);
const app=run('git',['diff','--name-only','HEAD','--','web','pipeline','raw','processed','checksums.json']);
assert.equal(app.status,0);assert.equal(app.stdout,'');
for(const file of ['probe.mjs','trace-page.mjs','analyze.mjs','source-anchors.mjs']){
  assert.equal(run(process.execPath,['--check',resolve(root,'qa/revamp-r1/map-stall-20260910',file)]).status,0);
}
const integrity=run(resolve(root,'.venv/Scripts/python.exe'),['-B',resolve(root,'scripts/check_repo_integrity.py')]);
assert.equal(integrity.status,0);assert.ok(integrity.stdout.includes('repo_integrity=ok'));
// PowerShell parsing only: do not launch or terminate another browser during verification.
const ps=run('powershell.exe',['-NoProfile','-NonInteractive','-Command',
  "$e=$null;$t=$null;$null=[System.Management.Automation.Language.Parser]::ParseFile('C:\\sgSHIOK2026\\qa\\revamp-r1\\map-stall-20260910\\cleanup-live.ps1',[ref]$t,[ref]$e);if($e.Count){$e;exit 1};'powershell_parse=ok'"]);
assert.equal(ps.status,0);
const result={root,commands,evidenceAppendOnly:true,applicationDiffEmpty:true,verified:true,
  limitations:'Syntax and evidence contracts only, not a browser execution or a new full application-suite run.'};
writeFileSync(resolve(root,'qa/revamp-r1/map-stall-20260910/verification.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({verified:true,commands:commands.length,evidenceAppendOnly:true,applicationDiffEmpty:true}));
