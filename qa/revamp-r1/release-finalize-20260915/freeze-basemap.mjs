import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const ROOT='C:\\sgSHIOK2026',BASE=resolve(ROOT,'qa/revamp-r1/release-finalize-20260915');
assert.equal(process.cwd(),ROOT);
assert.equal(process.argv[2],'--go');
const source=resolve(ROOT,'qa/revamp-r1/selection-recovery-20260913/observed-vqv2K4/browser.json');
const bytes=readFileSync(source),sha=b=>createHash('sha256').update(b).digest('hex');
const allowed=url=>/^https:\/\/www\.onemap\.gov\.sg\/maps\/tiles\/Grey_HD\/\d+\/\d+\/\d+\.png$/.test(url);
const urls=[...new Set(JSON.parse(bytes).entries.filter(e=>e.method==='Fetch.requestPaused')
  .map(e=>e.params?.request?.url).filter(url=>typeof url==='string'&&allowed(url)))];
urls.push('https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png');
assert.ok(urls.length>1&&urls.length<=128);
const out=mkdtempSync(resolve(BASE,'basemap-')),started=Date.now(),end=started+180000;
const record={out,source,sourceSha256:sha(bytes),startedAt:new Date(started).toISOString(),scope:'One-time public display images for offline browser QA, not pipeline inputs; no retries',
  requested:urls.length,deadlineSeconds:180,maxBytes:35*1024*1024,totalBytes:0,localReplies:[],passed:false};
try{
  for(const url of urls){
    assert.ok(Date.now()<end,'Basemap capture deadline');
    const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(Math.min(15000,end-Date.now()))});
    assert.equal(response.status,200,url);
    const contentType=response.headers.get('content-type');
    // The public tile endpoint reports image/undefined; require actual PNG bytes below.
    assert.ok(['image/png','image/undefined'].includes(contentType),`${url}: ${contentType}`);
    const chunks=[];let length=0;
    for await(const chunk of response.body){length+=chunk.length;assert.ok(length<=2*1024*1024);chunks.push(chunk);}
    const data=Buffer.concat(chunks);assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    record.totalBytes+=length;assert.ok(record.totalBytes<=record.maxBytes);
    const path=resolve(out,sha(Buffer.from(url))+'.png');writeFileSync(path,data,{flag:'wx'});
    record.localReplies.push({url,path:relative(ROOT,path).replaceAll('\\','/'),sha256:sha(data),bytes:length,sourceContentType:contentType});
  }
  record.passed=true;
}catch(error){record.error=error.stack;}
record.elapsedMs=Date.now()-started;
writeFileSync(resolve(out,'receipt.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(record,null,2));process.exitCode=record.passed?0:1;
