import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const dir=resolve(root,'qa/revamp-r1/legacy-reload-20260913');
const capture=resolve(root,'qa/revamp-r1/production-runtime-20260913/capture-1789294685168');
const responses=['initial-assets.json','dependencies.json','dependencies-reviewed.json'].flatMap(file=>JSON.parse(readFileSync(resolve(capture,file))).responses).filter(r=>r.file);
const assets=[];
for(const response of responses){
  const bytes=readFileSync(resolve(capture,response.file));
  assert.equal(sha(bytes),response.sha256,'STOP captured input mismatch '+response.file);
  assert.equal(bytes.length,response.decodedBytes);
  const path=new URL(response.url).pathname,text=bytes.toString();
  const entry={path,file:response.file,bytes:bytes.length,sha256:sha(bytes)};
  if(path==='/sw.js')entry.serviceWorker=text;
  if(text.includes('postal-search-input')){
    entry.applicationChunk=true;entry.sites=[];
    for(const term of ['replaceState','pushState','URLSearchParams','location.href','location.search','localStorage','sessionStorage','"postal"','"stop"','postal-search-input']){
      const sites=[];let offset=0;
      while(sites.length<12){const index=text.indexOf(term,offset);if(index<0)break;sites.push({index,context:text.slice(Math.max(0,index-160),index+240)});offset=index+term.length;}
      entry.sites.push({term,sites});
    }
  }
  assets.push(entry);
}
const old=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/production-worker-20260913/observed-bf5YuS/observation.json')));
const report={assets,previousObservation:{url:old.document.url,typedPostal:old.search.input,queryWasPreseeded:true,reloadControlPresent:old.document.text.includes('Reload'),retryControlPresent:old.document.text.includes('Retry'),appAcceptance:old.appAcceptance},networkRequests:0,pipelineRuns:0};
writeFileSync(resolve(dir,'inspection.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report,null,2));
