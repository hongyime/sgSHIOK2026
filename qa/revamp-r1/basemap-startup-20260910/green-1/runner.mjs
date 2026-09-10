import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const label=process.argv[2];if(!/^[a-z0-9-]+$/.test(label??''))throw Error('Invalid receipt');
const targets=process.argv.slice(3);if(targets.some(p=>!/^lib\/__tests__\/[a-z-]+\.test\.tsx?$/.test(p)))throw Error('Invalid test scope');
const out=resolve(root,'qa/revamp-r1/basemap-startup-20260910',label);if(existsSync(out))throw Error('Preserve receipt');mkdirSync(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const paths=execFileSync('git',['ls-files','-z','--','web'],{cwd:root,encoding:'utf8'}).split('\0').filter(p=>p&&!p.startsWith('web/public/data/'));
const identities=()=>paths.map(path=>({path,sha256:hash(readFileSync(resolve(root,path)))}));
const pins=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/cross-feature-20260910/final-check.json'))).anchors;
const anchors=()=>pins.map(p=>({path:p.path,expected:p.expected,actual:hash(readFileSync(resolve(root,p.path)))}));
const report={root,hostname:process.env.COMPUTERNAME,out,sourcesBefore:identities(),anchorsBefore:anchors(),commands:[]};
if(report.anchorsBefore.some(p=>p.expected!==p.actual))throw Error('Protected hash mismatch');
writeFileSync(resolve(out,'runner.mjs'),readFileSync(new URL(import.meta.url)),{flag:'wx'});
for(const [exe,args,timeout] of [
  [process.execPath,[resolve(root,'web/scripts/test-without-production-data.mjs'),...targets,'--reporter=dot'],600000],
  [process.execPath,[resolve(root,'web/node_modules/typescript/bin/tsc'),'--project',resolve(root,'web/tsconfig.json'),'--noEmit','--incremental','false'],180000],
  [resolve(root,'.venv/Scripts/python.exe'),['-B',resolve(root,'scripts/check_repo_integrity.py')],30000],
]){
  const start=Date.now(),r=spawnSync(exe,args,{cwd:root,encoding:'utf8',windowsHide:true,timeout,maxBuffer:32*1024*1024});
  report.commands.push({exe,args,exitCode:r.status,signal:r.signal,error:r.error?.message,stdout:r.stdout,stderr:r.stderr,elapsedSeconds:(Date.now()-start)/1000});
  console.log(JSON.stringify({args,exitCode:r.status,elapsedSeconds:(Date.now()-start)/1000}));
}
report.sourcesAfter=identities();report.anchorsAfter=anchors();report.ok=report.commands.every(c=>c.exitCode===0)&&JSON.stringify(report.sourcesBefore)===JSON.stringify(report.sourcesAfter)&&report.anchorsAfter.every(p=>p.expected===p.actual);
writeFileSync(resolve(out,'checks.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({out,ok:report.ok}));process.exitCode=report.ok?0:1;
