import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const prefix=resolve(root,'qa/revamp-r1/production-runtime-20260913');
const observation=JSON.parse(readFileSync(resolve(prefix,'deployment-observation.json')));
const out=resolve(prefix,`deployment-html-${Date.now()}`);mkdirSync(out);
const result={url:observation.latestDeployment.url+'/',deploymentId:observation.latestDeployment.id,
  startedAt:new Date().toISOString(),requestLimit:1,byteLimit:2097152,deadlineSeconds:30,authenticated:false,kind:'frontend HTML only'};
const start=Date.now();
try{
  const r=await fetch(result.url,{redirect:'error',headers:{'accept-encoding':'identity'},signal:AbortSignal.timeout(30000)});
  result.status=r.status;result.headers=Object.fromEntries(r.headers);assert.equal(r.status,200,'STOP deployment HTML status; no auth bypass or retry');
  const parts=[],reader=r.body.getReader();let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>result.byteLimit){void reader.cancel();throw Error('STOP byte limit');}parts.push(value);}
  const raw=Buffer.concat(parts);result.bytes=raw.length;result.sha256=createHash('sha256').update(raw).digest('hex');
  writeFileSync(resolve(out,'index.html'),raw,{flag:'wx'});
  result.expectedAliasSha256=JSON.parse(readFileSync(resolve(prefix,'capture-1789294685168/response.json'))).sha256;
  assert.equal(result.sha256,result.expectedAliasSha256,'STOP different HTML hashes');result.aliasBytesMatch=true;result.ok=true;
}catch(error){result.ok=false;result.error={name:error.name,message:error.message,cause:error.cause?.code};process.exitCode=1;}
result.elapsedMs=Date.now()-start;writeFileSync(resolve(out,'response.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output:out,...result},null,2));
