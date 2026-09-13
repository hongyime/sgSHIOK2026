import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const out=resolve(root,'qa/revamp-r1/production-runtime-20260913',`capture-${Date.now()}`);
mkdirSync(out);
const sha=b=>createHash('sha256').update(b).digest('hex');
const result={url:'https://sgshiok.vercel.app/',startedAt:new Date().toISOString(),method:'GET',requestHeaders:{'accept-encoding':'identity'},
  limits:{requests:1,decodedBytes:2*1024*1024,deadlineSeconds:30},pipelineRuns:0,kind:'public frontend HTML only; no data, route provider, credentials or deployment'};
const start=Date.now();
try{
  const response=await fetch(result.url,{method:'GET',redirect:'error',headers:result.requestHeaders,signal:AbortSignal.timeout(30000)});
  result.status=response.status;result.headers=Object.fromEntries(response.headers);assert.equal(response.status,200,'STOP non-200 HTML');
  const reader=response.body.getReader(),parts=[];let bytes=0;
  for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>result.limits.decodedBytes){void reader.cancel();throw Error('STOP HTML byte bound');}parts.push(value);}
  const body=Buffer.concat(parts);new TextDecoder('utf-8',{fatal:true}).decode(body);
  writeFileSync(resolve(out,'index.html'),body,{flag:'wx'});
  result.decodedBytes=body.length;result.sha256=sha(body);result.body='index.html';result.ok=true;
}catch(error){result.ok=false;result.error={name:error.name,message:error.message,cause:error.cause?.code};process.exitCode=1;}
result.elapsedMs=Date.now()-start;
writeFileSync(resolve(out,'response.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:out,...result},null,2));
