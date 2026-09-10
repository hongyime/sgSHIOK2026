import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const dir=resolve(root,'qa/revamp-r1/cross-feature-20260910'),summary=JSON.parse(readFileSync(resolve(dir,'summary.json')));
const evidence=readFileSync(resolve(root,'qa/verification/REVAMP-R1-core-walk.md'));
const prefix=evidence.subarray(0,summary.evidence.baseBytes);
const sources=summary.sources.map(s=>({path:s.path,expected:s.current,actual:sha(readFileSync(resolve(root,s.path)))}));
const anchors=summary.inputs.map(s=>({path:s.path,expected:s.sha256,actual:sha(readFileSync(resolve(root,s.path)))}));
const browser=JSON.parse(readFileSync(resolve(dir,summary.browserName,'browser.json')));
const agentReceipts=['mTgPta','eGQs4a','F9ijQk','xJgD7X'].map(id=>{
  const path='tmp/test-without-data-'+id+'/isolation.json',bytes=readFileSync(resolve(root,path));
  return{path,sha256:sha(bytes),bytes:bytes.length,content:JSON.parse(bytes)};
});
const integrity=execFileSync(resolve(root,'.venv/Scripts/python.exe'),['-B',resolve(root,'scripts/check_repo_integrity.py')],{cwd:root,encoding:'utf8',windowsHide:true});
const protectedDiff=execFileSync('git',['diff','--name-only','--','pipeline/config/weights.yaml','raw','processed','web/public/data','checksums.json','qa/p6_*','qa/p7_*','qa/p8_*','qa/p9_*','qa/p10_*','qa/p11/d_*','qa/releases'],{cwd:root,encoding:'utf8',windowsHide:true});
const record={root,hostname:process.env.COMPUTERNAME,integrity,protectedTrackedDiff:protectedDiff,evidence:{baseBytes:prefix.length,expected:summary.evidence.baseSha256,actual:sha(prefix),totalBytes:evidence.length},sources,anchors,agentReceipts,
  visualInspection:{reviewer:'parent',count:9,names:browser.captures.map(c=>c.name),independentFinalReview:false,reason:'Independent source reviewer reached usage limit before image audit; see reviewer-terminal.json.'},
  captureCounts:browser.captures.map(c=>({name:c.name,before:c.before.featureCount,after:c.after.featureCount,routeKey:c.after.routeKey,basemap:c.after.basemap})),
  limits:'Eleven known fixture anchors and tracked protected diff only; not a recursive payload inventory. No deployment, pipeline or dependency install.'};
record.ok=integrity.trim()==='repo_integrity=ok'&&protectedDiff===''&&sha(prefix)===summary.evidence.baseSha256&&sources.every(s=>s.actual===s.expected)&&anchors.every(s=>s.actual===s.expected)&&browser.cleanup.verified;
writeFileSync(resolve(dir,'final-check.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({ok:record.ok,integrity:record.integrity,evidence:record.evidence,sources:sources.length,anchors:anchors.length,captureCounts:record.captureCounts}));process.exitCode=record.ok?0:1;
