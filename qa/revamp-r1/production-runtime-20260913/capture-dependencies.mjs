import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);const req=createRequire(import.meta.url),{references,allowed}=req('./references.cjs');
const label=process.argv[2];assert.match(label,/^capture-\d+$/);const out=resolve(root,'qa/revamp-r1/production-runtime-20260913',label);
const sha=b=>createHash('sha256').update(b).digest('hex'),initial=JSON.parse(readFileSync(resolve(out,'initial-assets.json')));assert.equal(initial.ok,true);
const known=new Map(JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/release-runtime-20260913/runtime-analysis.json'))).liveInputs.map(f=>[new URL(f.url).pathname,f]));
const pending=initial.responses.map(r=>({path:new URL(r.url).pathname,...r})),seen=new Set(pending.map(r=>r.path));
const start=Date.now(),result={buildId:initial.buildId,startedAt:new Date().toISOString(),limits:{requests:32,decodedBytes:16*1024*1024,perFileBytes:4*1024*1024,wallSeconds:180},responses:[],parsed:[],totalBytes:0,closureComplete:false,
  method:'Acorn literals/static imports and PostCSS tokens, no execution. Captures a static-reference over-approximation, not arbitrary computed URLs, server build or deployment identity.'};
try{
  for(let i=0;i<pending.length;i++){
    assert.ok(Date.now()-start<150000,'STOP wall budget');const source=pending[i];
    const raw=readFileSync(resolve(out,source.file));assert.equal(sha(raw),source.sha256,'STOP local capture changed '+source.path);
    const discovered=references(source.path,new TextDecoder('utf-8',{fatal:true}).decode(raw));result.parsed.push({path:source.path,...discovered});
    for(const p of discovered.urls){if(seen.has(p))continue;seen.add(p);assert.equal(allowed(p,source.path),p);assert.ok(result.responses.length<32,'STOP request bound');assert.ok(Date.now()-start<150000,'STOP wall budget');
      const url='https://sgshiok.vercel.app'+p,at=Date.now(),response=await fetch(url,{redirect:'error',headers:{'accept-encoding':'identity'},signal:AbortSignal.timeout(30000)});
      const receipt={path:p,url,finalUrl:response.url,discoveredFrom:source.path,status:response.status,headers:Object.fromEntries(response.headers),startedAt:new Date(at).toISOString()};result.responses.push(receipt);assert.equal(response.status,200,'STOP dependency status '+p);
      const parts=[],reader=response.body.getReader();let bytes=0;for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;
        if(bytes>result.limits.perFileBytes||result.totalBytes+bytes>result.limits.decodedBytes){void reader.cancel();throw Error('STOP dependency byte bound');}parts.push(value);}
      const body=Buffer.concat(parts);receipt.decodedBytes=body.length;receipt.sha256=sha(body);receipt.elapsedMs=Date.now()-at;
      const prior=known.get(p);if(prior){receipt.priorSha256=prior.sha256;assert.equal(receipt.sha256,prior.sha256,'STOP changed immutable asset '+p);}
      const target=resolve(out,'responses',p.slice(1));mkdirSync(dirname(target),{recursive:true});writeFileSync(target,body,{flag:'wx'});receipt.file='responses'+p;result.totalBytes+=body.length;pending.push(receipt);
    }
  }
  result.ok=true;result.staticQueueExhausted=true;
}catch(error){result.ok=false;result.error={name:error.name,message:error.message,cause:error.cause?.code};process.exitCode=1;}
result.elapsedMs=Date.now()-start;writeFileSync(resolve(out,'dependencies.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({ok:result.ok,error:result.error,files:result.responses.length,totalBytes:result.totalBytes,elapsedMs:result.elapsedMs,parsed:result.parsed.map(p=>({path:p.path,urls:p.urls,unresolved:p.unresolved,embedded:p.embedded})),
  outputs:result.responses.map(({path,decodedBytes,sha256,priorSha256})=>({path,decodedBytes,sha256,priorSha256}))},null,2));
