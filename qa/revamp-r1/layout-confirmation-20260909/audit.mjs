import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';
if(process.cwd()!==root) throw Error('Wrong working root');
const base='qa/revamp-r1/layout-confirmation-20260909', sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>readFileSync(resolve(root,p));
const report=JSON.parse(read(base+'/run-YaHEvG/browser.json'));
const captures=report.captures.map(c=>({name:c.name,hashMatch:sha(read(base+'/run-YaHEvG/'+c.name+'.png'))===c.sha256,
  before:{bottomGap:c.before.height-c.before.dock.bottom,legendVisible:c.before.legendVisible},
  after:{bottomGap:c.after.height-c.after.dock.bottom,legendVisible:c.after.legendVisible},
  additionalAssertions:[c.before,c.after].every(f=>Math.abs((f.height-f.dock.bottom)-32)<1&&!f.legendVisible&&f.creditImageLoaded)}));
const snapshot=realpathSync(report.preview.snapshot), part=relative(resolve(root,'tmp'),snapshot);
if(isAbsolute(part)||part==='..'||part.startsWith('..'+sep)) throw Error('Wrong snapshot');
const files=['app/page.tsx','app/page.module.css','components/route-evidence-map.tsx','components/route-evidence-map.module.css'];
const sources=files.map(path=>{
  const committed=execFileSync('git',['show','a17fa50:web/'+path],{cwd:root,windowsHide:true});
  const built=readFileSync(resolve(snapshot,path));
  return {path:'web/'+path,committed:sha(committed),built:sha(built),match:committed.equals(built)};
});
const evidence='qa/verification/REVAMP-R1-core-walk.md';
const original=execFileSync('git',['show','a17fa50:'+evidence],{cwd:root,windowsHide:true,maxBuffer:2*1024*1024});
const current=read(evidence);
const audit={base:'a17fa5059dfd9215026b904ca83620a4a6567116',captures,sources,
  cleanupVerified:report.cleanup?.verified===true,
  evidence:{path:evidence,originalBytes:original.length,originalSha256:sha(original),currentBytes:current.length,prefixUnchanged:current.subarray(0,original.length).equals(original)},
  limitation:'Proxy advertised build and on-disk snapshot identity verified; actual browser Document response body was not captured in this focused run.',
  ok:report.ok&&report.checks.length===37&&captures.length===6&&captures.every(c=>c.hashMatch&&c.additionalAssertions)&&sources.every(s=>s.match)&&report.cleanup?.verified===true&&current.subarray(0,original.length).equals(original)};
writeFileSync(resolve(root,base,'audit.json'),JSON.stringify(audit,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(audit));process.exitCode=audit.ok?0:1;
