import assert from 'node:assert/strict';
import { test } from 'node:test';
import http from 'node:http';
import { allowedPath, selectedHeaders, startReleaseServer } from './release-server-v2.mjs';
test('oversized captured HTML and assets reject before listening',async()=>{
  const oversized=Buffer.alloc(8*1024*1024+1);
  for(const [html,assets] of [[oversized,new Map()],[Buffer.alloc(0),new Map([['/sw.js',{bytes:oversized}]])]]){
    await assert.rejects(startReleaseServer({html,assets,currentOrigin:'http://127.0.0.1:1'}),/captured file exceeds 8 MiB/);
  }
});
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

test('discarded upstream bodies remain charged across failed requests',async()=>{
  let calls=0;
  const upstream=http.createServer((req,res)=>{calls++;res.writeHead(200);res.write('1234');setTimeout(()=>res.destroy(),20);});
  await new Promise(done=>upstream.listen(0,'127.0.0.1',done));
  const server=await startReleaseServer({html:Buffer.alloc(0),assets:new Map(),currentOrigin:'http://127.0.0.1:'+upstream.address().port,maxBytes:6});
  server.flip();
  try{
    assert.equal((await fetch(server.origin+'/')).status,502);
    assert.equal(server.snapshot().upstreamBytes,4);
    assert.equal((await fetch(server.origin+'/')).status,503);
    assert.equal(server.snapshot().upstreamBytes,8);
    await fetch(server.origin+'/');
    assert.equal(calls,2);assert.equal(server.stats.limitHit,'received bytes');
  }finally{await server.close();upstream.closeAllConnections();await new Promise(done=>upstream.close(done));}
  assert.equal(server.snapshot().inFlightBytes,0);
});
test('concurrent shutdown callers await the same socket and upstream closure',async()=>{
  let began;const requested=new Promise(done=>began=done);
  const upstream=http.createServer((req,res)=>{res.writeHead(200);res.write('pending');began();});
  await new Promise(done=>upstream.listen(0,'127.0.0.1',done));
  const server=await startReleaseServer({html:Buffer.alloc(0),assets:new Map(),currentOrigin:'http://127.0.0.1:'+upstream.address().port});
  server.flip();const request=fetch(server.origin+'/').catch(()=>null);
  await requested;
  const first=server.close(),second=server.close();assert.equal(first,second);await second;await request;
  assert.equal(server.stats.closed,true);assert.equal(server.snapshot().activeSockets,0);assert.equal(server.snapshot().activeUpstreams,0);
  upstream.closeAllConnections();await new Promise(done=>upstream.close(done));
});
test('wall-triggered shutdown is awaitable by final cleanup',async()=>{
  const server=await startReleaseServer({html:Buffer.from('old'),assets:new Map(),currentOrigin:'http://127.0.0.1:1',wallMs:20});
  await new Promise(done=>setTimeout(done,50));await server.close();
  assert.equal(server.stats.limitHit,'wall');assert.equal(server.stats.closed,true);assert.equal(server.snapshot().activeSockets,0);
});
test('automatic lamp data uses only its known read-only prefix',()=>{
  assert.equal(allowedPath('/data/lamp_posts_v1/manifest.json'),true);
  assert.equal(allowedPath('/data/lamp_posts_v1/cells/1.json.gz'),true);
  assert.equal(allowedPath('/data/lamp_posts_v2/manifest.json'),false);
});
