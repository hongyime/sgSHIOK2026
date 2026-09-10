import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const hash=b=>createHash('sha256').update(b).digest('hex');
const base='38022b4df2482142d19570e93aa6e4daaffb1f8e';
const prefix='qa/revamp-r1/basemap-startup-20260910/';
const evidence='qa/verification/REVAMP-R1-core-walk.md';
const git=args=>execFileSync('git',args,{cwd:root,windowsHide:true});
const prior=git(['show',base+':'+evidence]),staged=git(['show',':'+evidence]),disk=readFileSync(resolve(root,evidence));
if(!disk.subarray(0,prior.length).equals(prior)||!staged.subarray(0,prior.length).equals(prior))throw Error('Evidence prefix changed');
const paths=git(['diff','--cached','--name-only','-z']).toString('utf8').split('\0').filter(Boolean);
const allowed=new Set(['.agents/STATE.md','PRODUCT-PLAN.md','decisions.md',evidence,'web/components/route-evidence-map.tsx','web/lib/__tests__/route-source-lifecycle.test.ts','web/lib/__tests__/map-startup-stage.test.ts']);
if(paths.some(p=>!allowed.has(p)&&!p.startsWith(prefix)&&!p.startsWith('qa/revamp-r1/cached-release-20260908/basemap-startup-20260910-1/')))throw Error('Unexpected staged scope');
const files=paths.filter(p=>p!==prefix+'index-check.json'&&p!==prefix+'index-check-2.json').map(path=>({path,diskSha256:hash(readFileSync(resolve(root,path))),indexSha256:hash(git(['show',':'+path]))}));
const audit=JSON.parse(readFileSync(resolve(root,prefix+'audit.json')));
const sourceIndex=audit.sourceIdentity.map(source=>{
  const raw=readFileSync(resolve(root,source.path)),index=git(['show',':'+source.path]);
  const exact=hash(index)===source.sha256,crlfOnly=!exact&&raw.toString('utf8').replaceAll('\r\n','\n')===index.toString('utf8');
  if(!exact&&!crlfOnly)throw Error('Non-line-ending source mismatch: '+source.path);
  return {path:source.path,testedSha256:source.sha256,indexSha256:hash(index),exact,crlfOnly};
});
const commands=[['check-ignore','-v',evidence],['diff','--cached','--check'],['diff','--cached','--check','--','.',':!'+prefix+'implementation.diff']].map(args=>{
  const r=spawnSync('git',args,{cwd:root,windowsHide:true,encoding:'utf8'});return {args,exitCode:r.status,stdout:r.stdout,stderr:r.stderr};
});
if(commands[0].exitCode!==1||commands[2].exitCode!==0)throw Error('Ignore/scope validation failed');
const result={base,evidencePrefix:{bytes:prior.length,sha256:hash(prior),diskUnchanged:true,indexUnchanged:true},files,commands,sourceIndex,
  note:'Raw generated logs can have CRLF; Git text=auto eol=lf normalization is disclosed with both machine-byte and indexed blob hashes. implementation.diff is exact git output; its blank context lines trigger whitespace warnings and are not rewritten. This manifest excludes itself.'};
writeFileSync(resolve(root,prefix+'index-check-2.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:files.length,normalizedFiles:files.filter(f=>f.diskSha256!==f.indexSha256).map(f=>f.path),sourceNormalizations:sourceIndex.filter(s=>s.crlfOnly),evidencePrefix:result.evidencePrefix,commands},null,2));
