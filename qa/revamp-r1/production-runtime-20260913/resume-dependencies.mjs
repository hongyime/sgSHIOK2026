import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { freemem } from 'node:os';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const req=createRequire(import.meta.url),{references,allowed}=req('./references-reviewed.cjs');
const label=process.argv[2];assert.match(label,/^capture-\d+$/);const out=resolve(root,'qa/revamp-r1/production-runtime-20260913',label);
const sha=b=>createHash('sha256').update(b).digest('hex'),json=p=>JSON.parse(readFileSync(resolve(out,p)));
const initial=json('initial-assets.json'),partial=json('dependencies.json');assert.equal(initial.ok,true);assert.equal(partial.ok,false);
assert.ok(partial.error.message.startsWith('STOP dependency status /_next/static/immutable/chunks/.css'));
const previous=[...initial.responses,...partial.responses.filter(r=>r.file)].map(r=>({...r,path:new URL(r.url).pathname}));
const pending=[...previous],seen=new Map(pending.map(r=>[r.path.toLowerCase(),r.path]));
for(const r of previous)assert.equal(sha(readFileSync(resolve(out,r.file))),r.sha256,'STOP previously captured bytes changed '+r.path);
const known=new Map(JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/release-runtime-20260913/runtime-analysis.json'))).liveInputs.map(f=>[new URL(f.url).pathname,f]));
const start=Date.now(),result={buildId:initial.buildId,startedAt:new Date().toISOString(),availableMiB:freemem()/1048576,
  limits:{newRequests:20,decodedBytes:16*1024*1024,perFileBytes:4*1024*1024,wallSeconds:180,minAvailableMiB:1024},
  previouslySaved:previous.map(({path,sha256,decodedBytes})=>({path,sha256,decodedBytes})),responses:[],parsed:[],totalBytes:0,closureComplete:false,
  method:'Reviewed offline parser. Reuse the17 verified captured bodies; never retry false .css suffix URL or overwrite receipts. Remaining explicit static references only, not arbitrary computed URLs.',
  parserSha256:sha(readFileSync(resolve(root,'qa/revamp-r1/production-runtime-20260913/references-reviewed.cjs')))};
try{
  assert.ok(result.availableMiB>=1024,'STOP memory gate before network');
  for(let i=0;i<pending.length;i++){
    assert.ok(Date.now()-start<150000,'STOP wall budget');const source=pending[i],raw=readFileSync(resolve(out,source.file));
    assert.equal(sha(raw),source.sha256,'STOP local capture changed '+source.path);
    if(!/\.(?:mjs|js|css)$/.test(source.path)){result.parsed.push({path:source.path,binaryOrNonExecutable:true});continue;}
    const discovered=references(source.path,new TextDecoder('utf-8',{fatal:true}).decode(raw));result.parsed.push({path:source.path,...discovered});
    for(const p of discovered.urls){
      const priorPath=seen.get(p.toLowerCase());if(priorPath){assert.equal(priorPath,p,'STOP case alias');continue;}seen.set(p.toLowerCase(),p);
      assert.equal(allowed(p,source.path),p);assert.ok(!p.endsWith('/.css'));assert.ok(result.responses.length<20,'STOP request bound');assert.ok(Date.now()-start<150000,'STOP wall budget');
      const url='https://sgshiok.vercel.app'+p,at=Date.now(),r=await fetch(url,{redirect:'error',headers:{'accept-encoding':'identity'},signal:AbortSignal.timeout(30000)});
      const receipt={path:p,url,finalUrl:r.url,discoveredFrom:source.path,status:r.status,headers:Object.fromEntries(r.headers),startedAt:new Date(at).toISOString()};result.responses.push(receipt);
      assert.equal(r.status,200,'STOP dependency status '+p);
      const parts=[],reader=r.body.getReader();let bytes=0;for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;
        if(bytes>result.limits.perFileBytes||result.totalBytes+bytes>result.limits.decodedBytes){void reader.cancel();throw Error('STOP dependency byte bound');}parts.push(value);}
      const body=Buffer.concat(parts);receipt.decodedBytes=body.length;receipt.sha256=sha(body);receipt.elapsedMs=Date.now()-at;
      const prior=known.get(p);if(prior){receipt.priorSha256=prior.sha256;assert.equal(receipt.sha256,prior.sha256,'STOP changed immutable asset '+p);}
      const target=resolve(out,'responses',p.slice(1));mkdirSync(dirname(target),{recursive:true});writeFileSync(target,body,{flag:'wx'});receipt.file='responses'+p;result.totalBytes+=body.length;pending.push(receipt);
    }
  }
  result.ok=true;result.staticQueueExhausted=true;
}catch(error){result.ok=false;result.error={name:error.name,message:error.message,causeName:error.cause?.name,causeCode:error.cause?.code,causeMessage:error.cause?.message};process.exitCode=1;}
result.elapsedMs=Date.now()-start;writeFileSync(resolve(out,'dependencies-reviewed.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({ok:result.ok,error:result.error,availableMiB:result.availableMiB,reused:previous.length,newResponses:result.responses.length,totalBytes:result.totalBytes,elapsedMs:result.elapsedMs,
  unresolved:result.parsed.filter(p=>p.unresolved?.length),outputs:result.responses.map(({path,status,decodedBytes,sha256})=>({path,status,decodedBytes,sha256}))},null,2));
