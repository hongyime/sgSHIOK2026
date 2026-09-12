import { spawn } from 'node:child_process';
import { mkdirSync, createWriteStream, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const mode=process.argv[2];
const commands={
  diagnostics:[process.execPath,['--test',resolve(root,'qa/revamp-r1/resume-20260912/error-audit.test.mjs'),resolve(root,'qa/revamp-r1/request-audit-20260910/transport.test.mjs')]],
  web:[process.execPath,[resolve(root,'web/scripts/test-without-production-data.mjs'),'--testTimeout','15000']],
  types:[process.execPath,[resolve(root,'web/node_modules/typescript/bin/tsc'),'--project',resolve(root,'web/tsconfig.json'),'--noEmit','--incremental','false']],
  integrity:[resolve(root,'.venv/Scripts/python.exe'),['-B',resolve(root,'scripts/check_repo_integrity.py')]],
};
if(!commands[mode])throw Error('Expected web, types, integrity or diagnostics');
const out=resolve(root,'qa/revamp-r1/resume-20260912',mode);mkdirSync(out);
const [command,args]=commands[mode],start=performance.now(),startedAt=new Date().toISOString();
const stdout=createWriteStream(resolve(out,'stdout.txt'),{flags:'wx'}),stderr=createWriteStream(resolve(out,'stderr.txt'),{flags:'wx'});
const child=spawn(command,args,{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
writeFileSync(resolve(out,'started.json'),JSON.stringify({command,args,startedAt,pid:child.pid,cwd:root})+'\n',{flag:'wx'});
child.stdout.pipe(stdout);child.stderr.pipe(stderr);
child.stdout.on('data',b=>process.stdout.write(b));child.stderr.on('data',b=>process.stderr.write(b));
child.on('error',e=>{console.error(e);process.exitCode=1;});
child.on('close',(code,signal)=>{
  const report={command,args,startedAt,finishedAt:new Date().toISOString(),elapsedSeconds:(performance.now()-start)/1000,exitCode:code,signal};
  writeFileSync(resolve(out,'command.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(report));process.exitCode=code??1;
});
