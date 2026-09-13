import assert from 'node:assert/strict';
import { test } from 'node:test';
import http from 'node:http';
import { allowedPath, selectedHeaders, startReleaseServer } from './release-server.mjs';
test('only required local frontend/data GET paths are admitted',()=>{
  for(const p of ['/?postal=018956','/sw.js','/_next/static/immutable/chunks/a.js','/maplibre/6.4.1/maplibre-gl-csp-worker.js','/data/generated_20260805_prefer_scored_routed/scores/01.json'])assert.equal(allowedPath(p),true,p);
  for(const p of ['/api/onemap-route','/data/other/data.json','//external.invalid/','http://external.invalid','/../raw/a','/_next/static/%2e%2e/raw','/_next/static/a\\b','/sw.js#x'])assert.equal(allowedPath(p),false,p);
});
test('response credentials are not forwarded',()=>{
  assert.deepEqual(selectedHeaders({'content-type':'text/html','set-cookie':'secret','authorization':'secret','date':'today'}),{'content-type':'text/html',date:'today'});
});
test('old captured bodies, genuine worker switch, current query and data read-only path',async()=>{
  const calls=[];
  const upstream=http.createServer((req,res)=>{calls.push({url:req.url,method:req.method});res.writeHead(200,{'content-type':'text/html','cache-control':'no-cache'}).end('current '+req.url);});
  await new Promise(done=>upstream.listen(0,'127.0.0.1',done));
  const server=await startReleaseServer({html:Buffer.from('old'),htmlHeaders:{'content-type':'text/html'},assets:new Map([['/sw.js',{bytes:Buffer.from('old-worker'),headers:{'content-type':'application/javascript'}}]]),currentOrigin:'http://127.0.0.1:'+upstream.address().port});
  try{
    assert.equal(await(await fetch(server.origin+'/?postal=018956')).text(),'old');
    assert.equal(await(await fetch(server.origin+'/sw.js')).text(),'old-worker');
    assert.equal((await fetch(server.origin+'/_next/static/missing.js')).status,404);
    assert.equal((await fetch(server.origin+'/api/onemap-route')).status,403);
    assert.equal((await fetch(server.origin+'/',{method:'POST'})).status,403);
    assert.equal(calls.length,0);
    await fetch(server.origin+'/data/generated_20260805_prefer_scored_routed/scores/01.json');
    server.flip();assert.throws(()=>server.flip());
    assert.equal(await(await fetch(server.origin+'/?postal=018956')).text(),'current /?postal=018956');
    assert.equal(await(await fetch(server.origin+'/sw.js')).text(),'current /sw.js');
    assert.ok(calls.every(c=>c.method==='GET'));assert.equal(server.stats.releaseSwitches,1);
  } finally {await server.close();upstream.closeAllConnections();await new Promise(done=>upstream.close(done));}
  assert.equal(server.stats.closed,true);assert.equal(server.snapshot().activeUpstreams,0);
});
test('request bound stops admission',async()=>{
  const server=await startReleaseServer({html:Buffer.from('old'),assets:new Map(),currentOrigin:'http://127.0.0.1:1',maxRequests:1});
  try{assert.equal((await fetch(server.origin+'/')).status,200);assert.equal((await fetch(server.origin+'/')).status,503);assert.equal(server.requests.length,1);assert.equal(server.stats.limitHit,'requests');}finally{await server.close();}
});
test('byte bound rejects captured body without sending it',async()=>{
  const server=await startReleaseServer({html:Buffer.from('old'),assets:new Map(),currentOrigin:'http://127.0.0.1:1',maxBytes:2});
  try{const r=await fetch(server.origin+'/');assert.equal(r.status,503);assert.equal(await r.text(),'');assert.equal(server.snapshot().totalBytes,0);}finally{await server.close();}
});
