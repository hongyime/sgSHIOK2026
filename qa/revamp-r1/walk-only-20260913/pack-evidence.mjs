import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const root='C:\\sgSHIOK2026';
assert.equal(process.cwd(),root);
const out=resolve(root,'qa/revamp-r1/walk-only-20260913');
const sha=b=>createHash('sha256').update(b).digest('hex');
const evidence='qa/verification/REVAMP-R1-core-walk.md';
const previous=execFileSync('git',['show','HEAD:'+evidence],{cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n');
const current=readFileSync(resolve(root,evidence),'utf8').replaceAll('\r\n','\n');
assert.ok(current.startsWith(previous),'Existing evidence lines changed');
const records=[];
function walk(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    const path=resolve(dir,entry.name);
    if(entry.isDirectory()){walk(path);continue;}
    if(entry.name==='artifact-index.json'||entry.name.endsWith('.gz'))continue;
    // Servers are intentionally live; do not snapshot logs while they can change.
    if(dir===out&&/^(next|preview)(-\d+)?\.(stdout|stderr)\.txt$/.test(entry.name))continue;
    const bytes=readFileSync(path);
    const item={path:relative(root,path).replaceAll('\\','/'),bytes:bytes.length,sha256:sha(bytes)};
    if(bytes.length>200000&&/\.(json|txt)$/.test(path)){
      const zipped=gzipSync(bytes);
      writeFileSync(path+'.gz',zipped,{flag:'wx'});
      assert.deepEqual(gunzipSync(readFileSync(path+'.gz')),bytes);
      item.committedPath=item.path+'.gz';item.committedBytes=zipped.length;item.committedSha256=sha(zipped);
    }else{item.committedPath=item.path;item.committedBytes=item.bytes;item.committedSha256=item.sha256;}
    records.push(item);
  }
}
walk(out);
const index={records,evidenceAppendOnly:true,previousEvidenceSha256:sha(previous),addedEvidenceLines:current.slice(previous.length).split('\n').length-1,
  files:records.length,rawBytes:records.reduce((s,x)=>s+x.bytes,0),committedBytes:records.reduce((s,x)=>s+x.committedBytes,0),
  note:'Large raw command/browser receipts are losslessly gzip-compressed; original files remain locally intact. Decompress the committedPath to reproduce the exact original SHA256. Live server console logs are not acceptance receipts.'};
writeFileSync(resolve(out,'artifact-index.json'),JSON.stringify(index,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:index.files,rawBytes:index.rawBytes,committedBytes:index.committedBytes,appendOnly:index.evidenceAppendOnly,addedEvidenceLines:index.addedEvidenceLines},null,2));
