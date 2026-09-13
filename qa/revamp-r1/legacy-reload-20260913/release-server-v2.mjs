import assert from 'node:assert/strict';
import http from 'node:http';
import { createHash } from 'node:crypto';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const DATA=['/data/generated_20260805_prefer_scored_routed/','/data/lamp_posts_v1/'];
const ALLOWED_HEADERS=['content-type','content-security-policy','cross-origin-embedder-policy','cross-origin-opener-policy','cross-origin-resource-policy','referrer-policy','x-content-type-options','cache-control','date','etag','service-worker-allowed','content-encoding'];
export function allowedPath(raw) {
  if(typeof raw!=='string'||raw.length>4096||!raw.startsWith('/')||raw.startsWith('//')||/[\x00-\x20\x7f\\]/.test(raw)||/%(?:2f|5c|2e|00)/i.test(raw))return false;
  const url=new URL(raw,'http://localhost');
  if(url.hash||url.pathname.split('/').some(p=>p==='.'||p==='..')||raw.split(/[?]/)[0].split('/').some(p=>p==='.'||p==='..'))return false;
  return url.pathname==='/'||['/sw.js','/icon.svg','/favicon.ico'].includes(url.pathname)||url.pathname.startsWith('/_next/static/')||url.pathname.startsWith('/maplibre/6.4.1/')||DATA.some(prefix=>url.pathname.startsWith(prefix));
}
export function selectedHeaders(headers) {
  return Object.fromEntries(Object.entries(headers??{}).filter(([key,value])=>ALLOWED_HEADERS.includes(key.toLowerCase())&&typeof value==='string'));
}
export async function startReleaseServer({html,htmlHeaders,assets,currentOrigin,wallMs=180000,maxRequests=600,maxBytes=128*1024*1024}) {
  for(const bytes of [html,...[...assets.values()].map(asset=>asset.bytes)])assert.ok(Buffer.isBuffer(bytes)&&bytes.length<=8*1024*1024,'captured file exceeds 8 MiB or is not a Buffer');
  const current=new URL(currentOrigin);assert.equal(current.hostname,'127.0.0.1');assert.equal(current.protocol,'http:');
  for(const n of [wallMs,maxRequests,maxBytes])assert.ok(Number.isSafeInteger(n)&&n>0);
  let release='old',origin,closed=false,totalBytes=0,inFlightBytes=0,upstreamBytes=0,capturedBytes=0,closingPromise;
  const requests=[],upstreams=new Set(),sockets=new Set();
  const stats={closed:false,releaseSwitches:0,limitHit:null};
  const server=http.createServer((req,res)=>{
    const receipt={at:new Date().toISOString(),method:req.method,url:req.url,release,destination:req.headers['sec-fetch-dest']??null};
    if(requests.length>=maxRequests){stats.limitHit??='requests';res.writeHead(503).end();return;}
    requests.push(receipt);
    const finish=(status,headers,bytes,source,alreadyCharged=false)=>{
      if(res.destroyed||res.writableEnded)return;
      if(!alreadyCharged&&capturedBytes+upstreamBytes+bytes.length>maxBytes){stats.limitHit??='bytes';Object.assign(receipt,{status:503,source:'limit'});res.writeHead(503).end();return;}
      if(!alreadyCharged)capturedBytes+=bytes.length;
      totalBytes+=bytes.length;Object.assign(receipt,{status,source,bytes:bytes.length,sha256:sha(bytes),finishedAt:new Date().toISOString()});
      res.writeHead(status,{...selectedHeaders(headers),'Content-Length':bytes.length});res.end(req.method==='HEAD'?undefined:bytes);
    };
    if(closed||stats.limitHit||!['GET','HEAD'].includes(req.method)||!allowedPath(req.url)){finish(403,{},Buffer.alloc(0),'blocked');return;}
    const url=new URL(req.url,origin),data=DATA.some(prefix=>url.pathname.startsWith(prefix));
    if(release==='old'&&!data){
      const asset=url.pathname==='/'?{bytes:html,headers:htmlHeaders}:assets.get(url.pathname);
      if(!asset){finish(404,{},Buffer.alloc(0),'uncaptured-old');return;}
      const headers=selectedHeaders(asset.headers);delete headers['content-encoding'];
      if(url.pathname==='/sw.js')headers['service-worker-allowed']='/';
      finish(200,headers,asset.bytes,'captured-old');return;
    }
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    let count=0;
    const upstream=http.request({hostname:current.hostname,port:current.port,path:req.url,method:'GET',headers:{host:current.host,accept:req.headers.accept??'*/*'},signal:controller.signal},response=>{
      const chunks=[];
      response.on('data',bytes=>{
        count+=bytes.length;inFlightBytes+=bytes.length;upstreamBytes+=bytes.length;
        if(count>8*1024*1024||capturedBytes+upstreamBytes>maxBytes){stats.limitHit??='received bytes';for(const active of upstreams)active.destroy();controller.abort();return;}chunks.push(bytes);
      });
      response.on('end',()=>finish(response.statusCode,response.headers,Buffer.concat(chunks),data?'read-only-data':'current-preview',true));
      response.on('error',error=>{receipt.error=error.message;finish(502,{},Buffer.alloc(0),'upstream-error');});
    });
    upstreams.add(upstream);
    upstream.on('error',error=>{receipt.error=error.message;finish(502,{},Buffer.alloc(0),'upstream-error');});
    upstream.on('close',()=>{clearTimeout(timer);inFlightBytes-=count;upstreams.delete(upstream);});
    res.on('close',()=>{if(!res.writableEnded)controller.abort();});upstream.end();
  });
  server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
  const close=()=>{
    if(closingPromise)return closingPromise;
    closed=true;clearTimeout(timer);
    const waits=[...upstreams,...sockets].map(stream=>new Promise(done=>stream.once('close',done)));
    closingPromise=Promise.all([...waits,new Promise(done=>server.close(done))]).then(()=>{stats.closed=true;});
    for(const req of upstreams)req.destroy();server.closeAllConnections();
    return closingPromise;
  };
  await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done);});
  origin='http://127.0.0.1:'+server.address().port;
  const timer=setTimeout(()=>{stats.limitHit??='wall';void close();},wallMs);
  return {origin,requests,stats,flip(){assert.equal(release,'old');assert.equal(closed,false);release='current';stats.releaseSwitches++;},close,
    snapshot(){return{release,totalBytes,inFlightBytes,upstreamBytes,capturedBytes,chargedBytes:upstreamBytes+capturedBytes,activeUpstreams:upstreams.size,activeSockets:sockets.size,...stats};}};
}
