import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);process.env.TEMP=process.env.TMP=resolve(root,'tmp');
const prefix='qa/revamp-r1/production-runtime-20260913',out=resolve(root,prefix),sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:root,windowsHide:true,maxBuffer:16*1024*1024});
const summary=JSON.parse(readFileSync(resolve(out,'summary.json'))),before=git('show',summary.base+':qa/verification/REVAMP-R1-core-walk.md');
const after=readFileSync(resolve(root,'qa/verification/REVAMP-R1-core-walk.md'));assert.ok(after.subarray(0,before.length).equals(before));
const entries=summary.assets.files.map(f=>({path:prefix+'/capture-1789294685168/'+f.file,sha256:f.sha256}));
entries.push({path:prefix+'/parser-tests.txt',sha256:summary.parser.receiptSha256},{path:prefix+'/capture-1789294685168/index.html',sha256:summary.html.sha256});
const batch=execFileSync('git',['cat-file','--batch'],{cwd:root,windowsHide:true,maxBuffer:16*1024*1024,input:entries.map(f=>':'+f.path).join('\n')+'\n'});
let offset=0;for(const f of entries){const end=batch.indexOf(10,offset),header=batch.subarray(offset,end).toString('ascii'),match=header.match(/^[0-9a-f]+ blob (\d+)$/);assert.ok(match,header);const n=Number(match[1]),b=batch.subarray(end+1,end+1+n);assert.equal(sha(b),f.sha256,'Staged byte mismatch '+f.path);assert.equal(sha(readFileSync(resolve(root,f.path))),f.sha256);assert.equal(batch[end+1+n],10);offset=end+2+n;}
assert.equal(offset,batch.length);
const staged=git('diff','--cached','--name-only','-z').toString().split('\0').filter(Boolean);
const source=staged.filter(p=>!p.startsWith(prefix+'/capture-1789294685168/responses/'));
const check=spawnSync('git',['diff','--cached','--check','--',...source.map(p=>':(literal)'+p)],{cwd:root,windowsHide:true,encoding:'utf8',maxBuffer:1024*1024});
assert.equal(check.status,0,check.stdout);assert.equal(check.stderr,'');
assert.equal(git('diff','--name-only',summary.base,'--','pipeline','raw','processed','web','checksums.json','qa/p6_*','qa/p7_*','qa/p8_*','qa/p9_*','qa/p10_*','qa/p11/d_*','qa/releases').toString().trim(),'');
const expected=new Set(['.agents/STATE.md','PRODUCT-PLAN.md','decisions.md','postplan.html','qa/verification/REVAMP-R1-core-walk.md']);
assert.ok(staged.every(p=>expected.has(p)||p.startsWith(prefix+'/')));
const result={base:summary.base,indexedCapturedBodies:entries,allMatchDiskAndCapture:true,sourceCheck:{status:check.status,stdout:check.stdout,stderr:check.stderr,literalPaths:source,excludedCapturedResponses:24},
  evidence:{beforeBytes:before.length,afterBytes:after.length,addedBytes:after.length-before.length,exactPrefix:true,sha256:sha(after)},
  correction:'First summary/artifact-index were before staging. Attribute addition preserves parser-tests.txt raw bytes; no downloaded payload or log body changed. Broad whitespace check failed on untouched captured vendor text; exact source paths pass.',
  finalFileReview:'Incomplete; see final-review.json. Parser/worker/replay-draft review completed.',stagedScopeOnly:true,protectedTrackedDiffEmpty:true,goalComplete:false};
writeFileSync(resolve(out,'staging-verification.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const files=[];function walk(d){for(const e of readdirSync(d,{withFileTypes:true})){const p=resolve(d,e.name);assert.ok(!e.isSymbolicLink());if(e.isDirectory())walk(p);else{const b=readFileSync(p);files.push({path:prefix+'/'+relative(out,p).replaceAll('\\','/'),bytes:b.length,sha256:sha(b)});}}}walk(out);
writeFileSync(resolve(out,'artifact-index-final.json'),JSON.stringify({supersedes:'artifact-index.json snapshot for current filesystem identities',files},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({indexedCapturedBodies:entries.length,allMatch:true,sourceCheckExit:check.status,evidence:result.evidence,qaFiles:files.length},null,2));
