import http from 'node:http';
import { parseEnv } from 'node:util';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, createWriteStream, createReadStream, realpathSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root='C:\\sgSHIOK2026';
if(process.cwd()!==root)throw Error('Wrong working root');
const out=resolve(root,'qa/revamp-r1/selection-recovery-20260913');
const build=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/selection-recovery-20260913/build-1/build.json')));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
for(const s of build.sources)assert.equal(hash(resolve(root,s.path)),s.sha256,s.path);
const provenance=JSON.parse(readFileSync(resolve(root,'web/lib/__tests__/fixtures/published-walks.provenance.json')));
for(const s of Object.values(provenance.sources))assert.equal(hash(resolve(root,s.path)),s.sha256,s.path);
writeFileSync(resolve(out,'source-check-2.json'),JSON.stringify({buildId:build.buildId,sources:build.sources.length,anchors:Object.keys(provenance.sources).length,matched:true})+'\n',{flag:'wx'});
const dataRoot=realpathSync(resolve(root,'web/public/data'));
const data=http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost:4340').pathname);
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
  const path=new URL(req.url,'http://127.0.0.1:4418').pathname;
  if(!['GET','HEAD'].includes(req.method)||(path.startsWith('/api/') && !(req.method==='GET' && ['/api/onemap-route','/api/onemap-search'].includes(path)))){res.writeHead(403).end();return;}
  if(path==='/postplan.html'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(readFileSync(resolve(root,'postplan.html')));return;}
  if(path==='/__qa/status'){res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify(identity));return;}
  const port=path.startsWith('/data/')?4340:4417,hostname=port===4340?'localhost':'127.0.0.1';
  const upstream=http.request({hostname,port,path:req.url,method:req.method,headers:{...req.headers,host:`${hostname}:${port}`},timeout:90000},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
  upstream.on('error',e=>{if(!res.headersSent)res.writeHead(502);res.end(e.message);});
  upstream.on('timeout',()=>upstream.destroy(Error('Upstream timeout')));res.on('close',()=>upstream.destroy());req.pipe(upstream);
});
const listen=(server,port,host)=>new Promise((yes,no)=>{server.once('error',no);server.listen(port,host,yes);});
const credentials = {};
const envPath = resolve(root, '.env');
const configured = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
for (const key of ['ONEMAP_EMAIL', 'ONEMAP_PASSWORD']) if (process.env[key] || configured[key]) credentials[key] = process.env[key] || configured[key];
let child;
const identity={buildId:build.buildId,snapshot:build.snapshot,pid:process.pid,dataPort:4340,nextPort:4417,proxyPort:4418,readOnlyData:true, allowedApi:'GET /api/onemap-route and /api/onemap-search', oneMapCredentialsConfigured:Boolean(credentials.ONEMAP_EMAIL && credentials.ONEMAP_PASSWORD)};
try{
  const check=await fetch('http://[::1]:4340/data/generated_20260805_prefer_scored_routed/manifest.json',{signal:AbortSignal.timeout(5000)});assert.ok(check.ok);assert.equal(createHash('sha256').update(Buffer.from(await check.arrayBuffer())).digest('hex'),hash(resolve(dataRoot,'generated_20260805_prefer_scored_routed/manifest.json')));
  await listen(proxy,4418,'127.0.0.1');
  child=spawn(process.execPath,[resolve(root,'web/node_modules/next/dist/bin/next'),'start',resolve(build.snapshot,'web'),'-p','4417','-H','127.0.0.1'],{cwd:root,windowsHide:true,env:{...process.env,...credentials,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
  child.stdout.pipe(createWriteStream(resolve(out,'next-2.stdout.txt'),{flags:'wx'}));child.stderr.pipe(createWriteStream(resolve(out,'next-2.stderr.txt'),{flags:'wx'}));
  identity.nextPid=child.pid;writeFileSync(resolve(out,'preview-2.json'),JSON.stringify(identity,null,2)+'\n',{flag:'wx'});
  child.on('exit',code=>{data.close();proxy.close();process.exitCode=code??1;});console.log(JSON.stringify(identity));
}catch(error){data.close();proxy.close();child?.kill();throw error;}
