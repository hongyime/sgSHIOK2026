import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const dir='qa/revamp-r1/frontend-retention-20260910',out=resolve(root,dir,'index-check.json');
if(existsSync(out))throw Error('Preserve index check');
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=args=>execFileSync('git',args,{cwd:root,windowsHide:true,maxBuffer:32*1024*1024});
const changed=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean);
const entries=git(['ls-files','--stage','-z','--',...changed]).toString().split('\0').filter(Boolean).map(s=>{
  const m=/^(\d+) ([a-f0-9]{40}) 0\t(.+)$/.exec(s);if(!m)throw Error('Unexpected index entry');return {path:m[3],objectId:m[2]};
});
const blobs=execFileSync('git',['cat-file','--batch'],{cwd:root,windowsHide:true,input:entries.map(e=>e.objectId).join('\n')+'\n',maxBuffer:32*1024*1024});
let offset=0;
for(const entry of entries){
  const end=blobs.indexOf(10,offset),header=blobs.subarray(offset,end).toString();
  const m=/^([a-f0-9]{40}) blob (\d+)$/.exec(header);if(!m||m[1]!==entry.objectId)throw Error('Invalid batch header');
  const length=Number(m[2]),content=blobs.subarray(end+1,end+1+length);offset=end+length+2;
  if(content.length!==length||blobs[offset-1]!==10)throw Error('Invalid batch body');
  const working=readFileSync(resolve(root,entry.path));
  Object.assign(entry,{indexedSha256:sha(content),indexedBytes:length,workingSha256:sha(working),workingBytes:working.length});
  if(!content.equals(working)&&!content.equals(Buffer.from(working.toString().replaceAll('\r\n','\n'))))throw Error('Unexpected index difference:'+entry.path);
}
if(offset!==blobs.length)throw Error('Extra batch bytes');
const commands=[];
for(const args of [['diff','--cached','--check'],['diff','--cached','--check','--','.',':(exclude)'+dir+'/implementation.diff']]){
  const r=spawnSync('git',args,{cwd:root,windowsHide:true,encoding:'utf8',timeout:60000});commands.push({args,exitCode:r.status,stdout:r.stdout,stderr:r.stderr});
}
const evidence='qa/verification/REVAMP-R1-core-walk.md';
const prefix=git(['show','ad3e99a:'+evidence]),indexed=git(['show',':'+evidence]);
const report={root,hostname:process.env.COMPUTERNAME,paths:entries,commands,
  note:'Machine-byte hashes in audit.json describe original logs. This receipt also records exact indexed blob bytes; Git LF normalization affects only the listed textual paths. No original log was rewritten.',
  normalizedTextPaths:entries.filter(e=>e.indexedSha256!==e.workingSha256).map(e=>e.path),
  whitespaceNote:'The literal implementation.diff contains blank context lines prefixed by a space. Full diff --check reports those as added trailing whitespace in the evidence artifact; the source-only check excludes exactly that literal patch and passes. Preserve the original diff and its hash.',
  evidencePrefix:{bytes:prefix.length,sha256:sha(prefix),indexedUnchanged:indexed.subarray(0,prefix.length).equals(prefix)}};
report.ok=report.evidencePrefix.indexedUnchanged&&commands[1].exitCode===0&&entries.filter(e=>e.path.startsWith('web/')).every(e=>e.indexedSha256===e.workingSha256);
writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({ok:report.ok,paths:entries.length,normalizedTextPaths:report.normalizedTextPaths,evidencePrefix:report.evidencePrefix,whitespaceNote:report.whitespaceNote},null,2));process.exitCode=report.ok?0:1;
