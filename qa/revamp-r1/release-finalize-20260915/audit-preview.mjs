import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ROOT='C:\\sgSHIOK2026',BASE=resolve(ROOT,'qa/revamp-r1/release-finalize-20260915');
assert.equal(process.cwd(),ROOT);
const file=process.argv[2];assert.equal(dirname(dirname(file)),BASE);
const read=p=>JSON.parse(readFileSync(p,'utf8')),hash=b=>createHash('sha256').update(b).digest('hex');
const preview=read(file),build=read(preview.receiptPath),ledger=read(resolve(build.dataStage,'release-manifest.json'));
assert.equal(build.scope,'frontend-only-not-deployable');
assert.equal(hash(readFileSync(preview.receiptPath)),preview.receiptSha256);
assert.equal(hash(readFileSync(preview.buildOutputManifest)),preview.buildOutputManifestSha256);
assert.equal(hash(readFileSync(resolve(build.dataStage,'release-manifest.json'))),build.dataStageManifestSha256);
const outputs=read(preview.buildOutputManifest),expected=new Map();
for(const entry of outputs)if(entry.path.startsWith('.next/static/'))expected.set('/_next/static/'+entry.path.slice('.next/static/'.length),entry);
for(const entry of ledger.files)if(entry.path.startsWith('web/public/data/'))expected.set('/'+entry.path.slice('web/public/'.length),entry);
for(const entry of build.files)if(entry.path.startsWith('web/public/'))expected.set('/'+entry.path.slice('web/public/'.length),entry);
const root=new URL(preview.url);assert.equal(root.hostname,'127.0.0.1');assert.equal(root.protocol,'http:');
const result={preview,buildId:build.buildId,dataStageManifestSha256:build.dataStageManifestSha256,
  buildOutputManifestSha256:preview.buildOutputManifestSha256,served:[],disabled:[],passed:false};
const started=Date.now(),end=started+180000;
async function get(path,entry){
  const remaining=end-Date.now();assert.ok(remaining>0,'Audit deadline');
  const response=await fetch(new URL(path,root),{redirect:'error',signal:AbortSignal.timeout(Math.min(30000,remaining))});
  assert.equal(response.status,200,path);
  const buffer=Buffer.from(await response.arrayBuffer());assert.ok(buffer.length<=32*1024*1024);
  const sha256=hash(buffer);
  if(entry){assert.equal(buffer.length,entry.bytes,path);assert.equal(sha256,entry.sha256,path);}
  result.served.push({path,bytes:buffer.length,sha256,expectedPath:entry?.path??null,
    contentType:response.headers.get('content-type'),cacheControl:response.headers.get('cache-control')});
  return buffer;
}
try{
  const status=JSON.parse((await get('/__qa/status')).toString());
  assert.equal(status.buildId,build.buildId);assert.equal(status.receiptSha256,preview.receiptSha256);
  const home=await get('/');
  const matching=outputs.filter(entry=>entry.path.endsWith('.html')&&entry.sha256===hash(home)&&entry.bytes===home.length);
  assert.equal(matching.length,1,'Served home must match exactly one built HTML output');
  result.served.at(-1).expectedPath=matching[0].path;
  // Only exact static asset URL attributes emitted by this built HTML are selected.
  const assets=[...new Set([...home.toString('utf8').matchAll(/(?:src|href)="(\/_next\/static\/[^"?#]+)"/g)].map(match=>match[1]))];
  assert.ok(assets.length>0&&assets.length<100);
  for(const path of assets){assert.ok(expected.has(path),path);await get(path,expected.get(path));}
  const paths=['/sw.js','/maplibre/6.4.1/maplibre-gl-worker.mjs','/maplibre/6.4.1/maplibre-gl-shared.mjs',
    '/data/generated_20260805_prefer_scored_routed/manifest.json',
    '/data/generated_20260805_prefer_scored_routed/geom/postal-prefix/018.json.gz',
    '/data/generated_20260805_prefer_scored_routed/geom/h3/89652636c07ffff.json',
    '/data/lamp_posts_v1/manifest.json'];
  for(const path of paths){assert.ok(expected.has(path),path);await get(path,expected.get(path));}
  assert.ok(expected.has('/maplibre/6.4.1/maplibre-gl-worker.mjs'));
  // Direct loopback requests reach Next's disabled handlers, not the proxy's API deny rule.
  for(const path of ['/api/reports','/api/moderation/queue']){
    const response=await fetch(`http://127.0.0.1:${preview.nextPort}${path}`,{method:'POST',body:'{}',
      headers:{'content-type':'application/json'},redirect:'error',signal:AbortSignal.timeout(10000)});
    const body=await response.json();result.disabled.push({path,status:response.status,body,cacheControl:response.headers.get('cache-control')});
    assert.equal(response.status,503);assert.equal(body.ok,false);assert.ok(response.headers.get('cache-control')?.includes('no-store'));
  }
  result.passed=true;
}catch(error){result.error=error.stack;}
result.elapsedMs=Date.now()-started;
writeFileSync(resolve(dirname(file),'served-audit.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result,null,2));process.exitCode=result.passed?0:1;
