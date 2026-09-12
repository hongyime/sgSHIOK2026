import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, createWriteStream, createReadStream, realpathSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root='C:\\sgSHIOK2026';
if(process.cwd()!==root)throw Error('Wrong working root');
const out=resolve(root,'qa/revamp-r1/ux-reset-20260912');
const build=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/ux-reset-20260912/build-2/build.json')));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
for(const s of build.sources)assert.equal(hash(resolve(root,s.path)),s.sha256,s.path);
const provenance=JSON.parse(readFileSync(resolve(root,'web/lib/__tests__/fixtures/published-walks.provenance.json')));
for(const s of Object.values(provenance.sources))assert.equal(hash(resolve(root,s.path)),s.sha256,s.path);
writeFileSync(resolve(out,'source-check-2.json'),JSON.stringify({buildId:build.buildId,sources:build.sources.length,anchors:Object.keys(provenance.sources).length,matched:true})+'\n',{flag:'wx'});
const dataRoot=realpathSync(resolve(root,'web/public/data'));
const data=http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost:4333').pathname);
    if(!path.startsWith('/data/')){res.writeHead(404).end();return;}
    const file=realpathSync(resolve(dataRoot,path.slice(6)));
    if(!file.startsWith(dataRoot+sep)){res.writeHead(403).end();return;}
    const s=await stat(file);if(!s.isFile()){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':extname(file)==='.json'?'application/json':extname(file)==='.gz'?'application/gzip':'application/octet-stream','Content-Length':s.size,'Cache-Control':'no-store'});
    if(req.method==='HEAD'){res.end();return;}
    const stream=createReadStream(file);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  }catch(error){res.writeHead(error.code==='ENOENT'?404:400).end();}
});
const proxy=http.createServer((req,res)=>{
  const path=new URL(req.url,'http://127.0.0.1:4386').pathname;
  if(!['GET','HEAD'].includes(req.method)||path.startsWith('/api/')){res.writeHead(403).end();return;}
  if(path==='/__qa/status'){res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify(identity));return;}
  const port=path.startsWith('/data/')?4333:4385,hostname=port===4333?'localhost':'127.0.0.1';
  const upstream=http.request({hostname,port,path:req.url,method:req.method,headers:{...req.headers,host:`${hostname}:${port}`},timeout:90000},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
  upstream.on('error',e=>{if(!res.headersSent)res.writeHead(502);res.end(e.message);});
  upstream.on('timeout',()=>upstream.destroy(Error('Upstream timeout')));res.on('close',()=>upstream.destroy());req.pipe(upstream);
});
const listen=(server,port,host)=>new Promise((yes,no)=>{server.once('error',no);server.listen(port,host,yes);});
let child;
const identity={buildId:build.buildId,snapshot:build.snapshot,pid:process.pid,dataPort:4333,nextPort:4385,proxyPort:4386,readOnly:true};
try{
  await listen(data,4333,'localhost');await listen(proxy,4386,'127.0.0.1');
  child=spawn(process.execPath,[resolve(root,'web/node_modules/next/dist/bin/next'),'start',resolve(build.snapshot,'web'),'-p','4385','-H','127.0.0.1'],{cwd:root,windowsHide:true,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
  child.stdout.pipe(createWriteStream(resolve(out,'next-2.stdout.txt'),{flags:'wx'}));child.stderr.pipe(createWriteStream(resolve(out,'next-2.stderr.txt'),{flags:'wx'}));
  identity.nextPid=child.pid;writeFileSync(resolve(out,'preview-2.json'),JSON.stringify(identity,null,2)+'\n',{flag:'wx'});
  child.on('exit',code=>{data.close();proxy.close();process.exitCode=code??1;});console.log(JSON.stringify(identity));
}catch(error){data.close();proxy.close();child?.kill();throw error;}
