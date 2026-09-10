import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const attempt=process.argv[2];if(!/^[a-z0-9-]+$/.test(attempt??''))throw Error('Explicit fresh attempt required');
const directory=resolve(root,'qa/revamp-r1/frontend-retention-20260910',attempt);
mkdirSync(directory,{recursive:true});
const receipt=resolve(directory,'proxy-start.json');if(existsSync(receipt))throw Error('Preserve prior proxy');
const sha=b=>createHash('sha256').update(b).digest('hex');
const buildA=readFileSync(resolve(root,'web/.next/BUILD_ID'),'utf8').trim();
const b=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/frontend-retention-20260910/build-2/build.json')));
const target='/_next/static/chunks/0j6tjjnrv2h3w.js';
const targetBytes=readFileSync(resolve(root,'web/.next/static/chunks/0j6tjjnrv2h3w.js'));
if(buildA!=='e8Hlhkml4c3i_uMGJdd3P'||b.exitCode!==0||!b.sourceStable)throw Error('Unexpected build identity');
if(existsSync(resolve(b.snapshot,'web/.next/static/chunks/0j6tjjnrv2h3w.js')))throw Error('Chosen A chunk also exists in B');
const workerA=execFileSync('git',['show','c83fc96:web/public/sw.js'],{cwd:root,windowsHide:true});
const workerB=readFileSync(resolve(b.snapshot,'web/public/sw.js'));
const workerHashes={A:sha(workerA),B:sha(workerB)};
if(workerHashes.A!=='c1a9e34ed80456e93ade73cd90706269e47a75cc6782dad3d9f12620cf6b2390'||workerHashes.B!==b.sources.find(s=>s.path==='web/public/sw.js').sha256)throw Error('Worker identity mismatch');
const live=await fetch('http://127.0.0.1:4345'+target,{signal:AbortSignal.timeout(15000)});
const liveBytes=Buffer.from(await live.arrayBuffer());
if(live.status!==200||sha(liveBytes)!==sha(targetBytes))throw Error('Actual Next fallback did not serve pinned old chunk');
let active='A',stopping=false;const requests=[],nonce=randomUUID();
const identity={root,directory,pid:process.pid,origin:'http://127.0.0.1:4346',buildA,buildB:b.buildId,workerHashes,target,targetBytes:targetBytes.length,targetSha256:sha(targetBytes),sourceB:b.snapshot};
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
function note(req,status,extra={}){requests.push({at:new Date().toISOString(),method:req.method,path:req.url,active,status,serviceWorker:req.headers['service-worker'],...extra});}
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,identity.origin);
  if(requests.length>=6000){json(res,503,{error:'Receipt capacity reached'});return;}
  if(url.pathname==='/__qa/status'){json(res,200,{...identity,active,nonce,requests});return;}
  if(url.pathname==='/__qa/switch'){
    if(req.method!=='POST'||req.headers['x-shiok-qa']!==nonce||active!=='A'){json(res,403,{error:'Invalid control'});return;}
    active='B';note(req,204,{control:true});res.writeHead(204).end();return;
  }
  if(url.pathname==='/__qa/stop'){
    if(req.method!=='POST'||req.headers['x-shiok-qa']!==nonce||stopping){json(res,403,{error:'Invalid control'});return;}
    stopping=true;
    note(req,204,{control:true});writeFileSync(resolve(directory,'proxy-terminal.json'),JSON.stringify({...identity,active,requests},null,2)+'\n',{flag:'wx'});
    res.writeHead(204).end();server.close();server.closeIdleConnections();return;
  }
  if(!['GET','HEAD'].includes(req.method)||url.pathname.startsWith('/api/')){note(req,405,{blocked:true});json(res,405,{error:'Read-only QA'});return;}
  if(url.pathname==='/__qa/seed'){
    note(req,200,{fixture:true});res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'}).end('<!doctype html><html><head><title>Retained-tab fixture seed</title></head><body>Local fixture seed.</body></html>');return;
  }
  if(url.pathname==='/sw.js'){
    note(req,200,{workerSha256:workerHashes[active]});res.writeHead(200,{'Content-Type':'application/javascript','Service-Worker-Allowed':'/','Cache-Control':'no-cache',ETag:'"'+workerHashes[active]+'"'}).end(active==='A'?workerA:workerB);return;
  }
  const data=url.pathname.startsWith('/data/'),port=data||active==='A'?4321:4345,hostname=port===4321?'localhost':'127.0.0.1';
  const atStart=active;
  const upstream=http.request({hostname,port,path:req.url,method:req.method,headers:{...req.headers,host:hostname+':'+port},timeout:90000},response=>{
    note(req,response.statusCode,{upstream:port,data,activeAtStart:atStart});res.writeHead(response.statusCode,response.headers);response.pipe(res);
  });
  upstream.on('timeout',()=>upstream.destroy(Error('QA upstream timeout')));
  upstream.on('error',error=>{note(req,502,{error:error.message});if(!res.headersSent)json(res,502,{error:'QA upstream unavailable'});else res.end();});
  res.on('close',()=>upstream.destroy());req.pipe(upstream);
});
server.on('error',error=>{console.error(error);process.exitCode=1;});
server.listen(4346,'127.0.0.1',()=>{writeFileSync(resolve(directory,'runner.mjs'),readFileSync(new URL(import.meta.url)),{flag:'wx'});writeFileSync(receipt,JSON.stringify(identity,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(identity));});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close());
