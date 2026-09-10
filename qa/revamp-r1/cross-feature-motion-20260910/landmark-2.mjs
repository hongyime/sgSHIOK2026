import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const hash=b=>createHash('sha256').update(b).digest('hex');
const checksums=JSON.parse(readFileSync(resolve(root,'checksums.json')));
const data=resolve(root,'web/public/data',checksums.bundle),receipts=[];
function read(path){
  const candidates=[path,path+'.gz'].filter(p=>checksums.files[p]&&existsSync(resolve(data,p)));
  if(!candidates.length)throw Error('No checksum-pinned available artifact: '+path);
  const chosen=candidates[0],bytes=readFileSync(resolve(data,chosen)),actual=hash(bytes),expected=checksums.files[chosen];
  receipts.push({path:chosen,bytes:bytes.length,expected,actual});
  if(actual!==expected)throw Error('Hash mismatch '+chosen+': '+actual);
  return JSON.parse(chosen.endsWith('.gz')?gunzipSync(bytes):bytes);
}
// Public-landmark sample; no home-postal recommendation or data generation.
const postal='049213';
const areas=read('scores/index.json');
const area=Object.entries(areas).find(([,postals])=>postals.includes(postal))?.[0];
if(!area)throw Error('Postal absent');
const score=read('scores/'+area+'.json').find(r=>r.postal===postal);
const index=read('geom/postal-index.json');
const shard=index[postal];
const report={root,postal,area,shard,score,receipts};
if(typeof shard==='string')report.geometry=read('geom/h3/'+shard+'.json').find(r=>r.postal===postal);
writeFileSync(resolve(root,'qa/revamp-r1/cross-feature-motion-20260910/landmark-2.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report,null,2));
