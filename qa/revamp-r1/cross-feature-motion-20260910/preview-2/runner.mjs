import http from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';if(process.cwd()!==root)throw Error('Wrong working root');
const label=process.argv[2];if(!/^[a-z0-9-]+$/.test(label??''))throw Error('Fresh label required');
const directory=resolve(root,'qa/revamp-r1/cross-feature-motion-20260910',label);
if(existsSync(directory))throw Error('Preserve previous receipts');mkdirSync(directory);
const build=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/cached-release-20260908/cross-feature-motion-20260910-2/build.json')));
if(build.exitCode!==0||!build.protectedDataAbsent)throw Error('Invalid build');
const live=await fetch('http://127.0.0.1:4353/',{signal:AbortSignal.timeout(30000)});
if(!live.ok||!(await live.text()).includes(build.buildId))throw Error('Wrong actual Next build');
const identity={root,directory,pid:process.pid,origin:'http://127.0.0.1:4354',buildB:build.buildId,sourceB:build.snapshot,active:'B'};
const requests=[],nonce=randomUUID();let stopping=false;
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,identity.origin);
  if(url.pathname==='/__qa/status'){json(res,200,{...identity,nonce,requests});return;}
  if(url.pathname==='/__qa/stop'){
    if(req.method!=='POST'||req.headers['x-shiok-qa']!==nonce||stopping){json(res,403,{});return;}
    stopping=true;writeFileSync(resolve(directory,'proxy-terminal.json'),JSON.stringify({...identity,requests},null,2)+'\n',{flag:'wx'});
    res.writeHead(204).end();server.close();server.closeIdleConnections();return;
  }
  if(requests.length>=6000||!['GET','HEAD'].includes(req.method)||url.pathname.startsWith('/api/')){json(res,503,{error:'Read-only QA'});return;}
  const port=url.pathname.startsWith('/data/')?4321:4353,hostname=port===4321?'localhost':'127.0.0.1';
  const upstream=http.request({hostname,port,path:req.url,method:req.method,headers:{...req.headers,host:hostname+':'+port},timeout:90000},response=>{
    requests.push({at:new Date().toISOString(),method:req.method,path:req.url,upstream:port,status:response.statusCode});res.writeHead(response.statusCode,response.headers);response.pipe(res);
  });
  upstream.on('timeout',()=>upstream.destroy(Error('Upstream timeout')));
  upstream.on('error',error=>{requests.push({path:req.url,error:error.message});if(!res.headersSent)json(res,502,{error:error.message});else res.end();});
  res.on('close',()=>upstream.destroy());req.pipe(upstream);
});
server.on('error',error=>{console.error(error);process.exitCode=1;});
server.listen(4354,'127.0.0.1',()=>{
  writeFileSync(resolve(directory,'runner.mjs'),readFileSync(new URL(import.meta.url)),{flag:'wx'});
  writeFileSync(resolve(directory,'proxy-start.json'),JSON.stringify(identity,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(identity));
});
