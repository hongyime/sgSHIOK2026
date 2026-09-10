import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';
if(process.cwd()!==root)throw Error('Wrong working root');
const label=process.argv[2];if(!/^[a-z0-9-]+$/.test(label??''))throw Error('Fresh label required');
const out=mkdtempSync(resolve(root,'qa/revamp-r1/cross-feature-20260910',label+'-'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const files=['web/components/home-comparison.tsx','web/lib/__tests__/home-comparison.test.tsx','web/lib/__tests__/deployment.test.ts'];
const sources=()=>files.map(path=>({path,sha256:sha(readFileSync(resolve(root,path)))}));
const report={root,hostname:process.env.COMPUTERNAME,out,startedAt:new Date().toISOString(),commands:[],sourcesBefore:sources(),inputs:[]};
const provenance=JSON.parse(readFileSync(resolve(root,'web/lib/__tests__/fixtures/published-walks.provenance.json')));
for(const s of Object.values(provenance.sources)){
  const bytes=readFileSync(resolve(root,s.path)),actual=sha(bytes);
  report.inputs.push({path:s.path,bytes:bytes.length,expected:s.sha256,actual,ok:actual===s.sha256&&bytes.length===s.bytes});
}
const save=()=>writeFileSync(resolve(out,'checks.json'),JSON.stringify(report,null,2)+'\n');
if(!report.inputs.every(s=>s.ok)){save();throw Error('STOP input mismatch: '+JSON.stringify(report.inputs.filter(s=>!s.ok)));}
const commands=[
  [process.execPath,[resolve(root,'web/scripts/test-without-production-data.mjs'),'--reporter=dot']],
  [process.execPath,[resolve(root,'web/node_modules/typescript/bin/tsc'),'--project',resolve(root,'web/tsconfig.json'),'--noEmit','--incremental','false']],
  [resolve(root,'.venv/Scripts/python.exe'),['-B',resolve(root,'scripts/check_repo_integrity.py')]],
  ['git',['diff','--check']],
];
for(const [command,args]of commands){
  const started=Date.now();
  const result=await new Promise(done=>{const child=spawn(command,args,{cwd:root,windowsHide:true,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});let stdout='',stderr='';
    child.stdout.on('data',d=>{stdout+=d;});child.stderr.on('data',d=>{stderr+=d;});child.on('error',error=>done({stdout,stderr,error:error.message,exitCode:null}));
    child.on('close',(exitCode,signal)=>done({stdout,stderr,exitCode,signal}));
  });
  report.commands.push({command,args,...result,elapsedMs:Date.now()-started});save();
  console.log(JSON.stringify(report.commands.at(-1)));if(result.exitCode!==0)break;
}
report.sourcesAfter=sources();report.sourcesUnchanged=JSON.stringify(report.sourcesBefore)===JSON.stringify(report.sourcesAfter);
report.inputsAfter=report.inputs.map(s=>({path:s.path,sha256:sha(readFileSync(resolve(root,s.path)))}));
report.inputsUnchanged=report.inputs.every((s,n)=>s.actual===report.inputsAfter[n].sha256);
report.ok=report.commands.length===commands.length&&report.commands.every(c=>c.exitCode===0)&&report.sourcesUnchanged&&report.inputsUnchanged;
report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({out,ok:report.ok}));process.exitCode=report.ok?0:1;
