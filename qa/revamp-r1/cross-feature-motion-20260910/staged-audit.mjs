import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const dir='qa/revamp-r1/cross-feature-motion-20260910',out=resolve(root,dir,'staged-audit.json');
if(existsSync(out))throw Error('Preserve receipt');
const git=args=>execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024});
const hash=b=>createHash('sha256').update(b).digest('hex');
const summary=JSON.parse(readFileSync(resolve(root,dir,'summary.json')));
const staged=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean);
const exact=['.agents/STATE.md','PRODUCT-PLAN.md','decisions.md','qa/verification/REVAMP-R1-core-walk.md',...summary.implementation];
const prefixes=[dir+'/',...['1','2'].map(n=>'qa/revamp-r1/cached-release-20260908/cross-feature-motion-20260910-'+n+'/')];
if(staged.some(p=>!exact.includes(p)&&!prefixes.some(prefix=>p.startsWith(prefix))))throw Error('Staged scope exceeded');
const audit=JSON.parse(readFileSync(resolve(root,dir,'audit.json')));
const paths=[...audit.sources.map(p=>p.path),'qa/verification/REVAMP-R1-core-walk.md'];
const batch=execFileSync('git',['cat-file','--batch'],{cwd:root,input:paths.map(p=>':'+p+'\n').join(''),maxBuffer:64*1024*1024});
let cursor=0;const blobs=new Map();
for(const path of paths){
  const end=batch.indexOf(10,cursor),header=batch.subarray(cursor,end).toString().split(' '),size=Number(header[2]);
  if(header[1]!=='blob'||!Number.isSafeInteger(size))throw Error('Invalid batch header');
  cursor=end+1;blobs.set(path,batch.subarray(cursor,cursor+size));cursor+=size+1;
}
if(cursor!==batch.length)throw Error('Unexpected batch tail');
const normalized=[];
for(const source of audit.sources){
  const current=readFileSync(resolve(root,source.path)),indexed=blobs.get(source.path);
  if(hash(current)!==source.current)throw Error('Source changed since test/build audit');
  if(current.equals(indexed))continue;
  if(!['web/lib/__tests__/accessibility-render.test.tsx','web/lib/__tests__/revamp-layout.test.ts'].includes(source.path))throw Error('Unexpected index byte difference: '+source.path);
  const previous=git(['show',summary.base+':'+source.path]);
  if(!previous.equals(indexed)||!Buffer.from(current.toString().replace(/\r\n/g,'\n')).equals(indexed))throw Error('Not unchanged CRLF-only difference');
  normalized.push({path:source.path,worktreeSha256:hash(current),indexSha256:hash(indexed),unchangedFromBase:true,exactCrlfOnly:true});
}
const evidence=blobs.get('qa/verification/REVAMP-R1-core-walk.md'),old=git(['show',summary.base+':qa/verification/REVAMP-R1-core-walk.md']);
if(!evidence.subarray(0,old.length).equals(old)||!readFileSync(resolve(root,'qa/verification/REVAMP-R1-core-walk.md')).equals(evidence))throw Error('Evidence was not append-only');
const check=spawnSync('git',['diff','--cached','--check','--','.',':!'+dir+'/implementation.diff'],{cwd:root,encoding:'utf8',windowsHide:true});
if(check.status!==0)throw Error('Source diff check failed: '+check.stdout+check.stderr);
const report={base:summary.base,stagedFiles:staged.length,staged,sourceCount:audit.sources.length,sourceIndexMatches:audit.sources.length-normalized.length,normalized,
  evidence:{oldBytes:old.length,oldSha256:hash(old),stagedBytes:evidence.length,prefixUnchanged:true},
  diffCheck:{exitCode:check.status,stdout:check.stdout,stderr:check.stderr,excluded:dir+'/implementation.diff',reason:'Literal diff context whitespace is preserved, not rewritten.'},
  selfScope:'This receipt is added after auditing the staged scope; it cannot hash its own future blob.'};
writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({stagedFiles:staged.length,sourceCount:report.sourceCount,indexMatches:report.sourceIndexMatches,normalized,evidence:report.evidence,diffCheckExit:check.status},null,2));
