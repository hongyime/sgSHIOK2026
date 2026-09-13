import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const label=process.argv[2];assert.match(label,/^capture-\d+$/);
const out=resolve(root,'qa/revamp-r1/production-runtime-20260913',label),sha=b=>createHash('sha256').update(b).digest('hex');
const inspection=JSON.parse(readFileSync(resolve(out,'html-inspection.json')));
assert.equal(sha(readFileSync(resolve(out,'index.html'))),inspection.htmlSha256,'STOP HTML changed');
const known=new Map(JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/release-runtime-20260913/runtime-analysis.json'))).liveInputs.map(f=>[new URL(f.url).pathname,f]));
const paths=[...new Set([...inspection.htmlReferences.map(f=>f.url).filter(p=>p.startsWith('/_next/static/')||p==='/icon.svg'),...inspection.flightModuleChunks,'/sw.js'])].sort();
assert.ok(paths.length<=24);
const started=Date.now(),result={buildId:inspection.buildId,startedAt:new Date().toISOString(),limits:{requests:24,totalDecodedBytes:16*1024*1024,perFileBytes:4*1024*1024,wallSeconds:180},responses:[],totalBytes:0,
  provenance:'GET only; literal HTML/Flight references plus /sw.js observed in the previously captured app. No script execution, data, route provider, credentials, install or deployment.',closureComplete:false};
try{
  for(const p of paths){
    assert.match(p,/^\/(?:_next\/static\/[A-Za-z0-9_./-]+\.(?:js|css|woff2?)|icon\.svg|sw\.js)$/);assert.ok(!p.includes('..'));
    assert.ok(Date.now()-started<150000,'STOP wall budget');
    const url='https://sgshiok.vercel.app'+p,start=Date.now();
    const r=await fetch(url,{redirect:'error',headers:{'accept-encoding':'identity'},signal:AbortSignal.timeout(30000)});
    const receipt={url,finalUrl:r.url,status:r.status,headers:Object.fromEntries(r.headers),startedAt:new Date(start).toISOString()};
    result.responses.push(receipt);assert.equal(r.status,200,'STOP asset status '+p);
    const reader=r.body.getReader(),parts=[];let bytes=0;
    for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;
      if(bytes>result.limits.perFileBytes||result.totalBytes+bytes>result.limits.totalDecodedBytes){void reader.cancel();throw Error('STOP asset byte bound');}parts.push(value);}
    const raw=Buffer.concat(parts),h=sha(raw),prior=known.get(p);
    receipt.decodedBytes=raw.length;receipt.sha256=h;receipt.elapsedMs=Date.now()-start;
    if(prior){receipt.priorSha256=prior.sha256;assert.equal(h,prior.sha256,'STOP changed immutable asset '+p);}
    const target=resolve(out,'responses',p.slice(1));mkdirSync(dirname(target),{recursive:true});writeFileSync(target,raw,{flag:'wx'});
    receipt.file='responses'+p;result.totalBytes+=raw.length;
  }
  result.ok=true;
}catch(error){result.ok=false;result.error={name:error.name,message:error.message,cause:error.cause?.code};process.exitCode=1;}
result.elapsedMs=Date.now()-started;
writeFileSync(resolve(out,'initial-assets.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:out,ok:result.ok,error:result.error,files:result.responses.length,totalBytes:result.totalBytes,elapsedMs:result.elapsedMs,
  responses:result.responses.map(({url,status,decodedBytes,sha256,priorSha256})=>({url,status,decodedBytes,sha256,priorSha256}))},null,2));
