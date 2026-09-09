import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute, sep } from 'node:path';
const root='C:\\sgSHIOK2026';
if(process.cwd()!==root) throw Error('Wrong working root');
const snapshot=realpathSync(resolve(root,'tmp/cached-release-source-freshness-20260909-1/web'));
const part=relative(realpathSync(resolve(root,'tmp')),snapshot);
if(isAbsolute(part)||part==='..'||part.startsWith('..'+sep)) throw Error('Invalid snapshot');
const build=readFileSync(resolve(snapshot,'.next/BUILD_ID'),'utf8').trim();
for(const port of [4333,4334]) await new Promise((done,reject)=>{
  const probe=net.createServer();probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(done));
});
const child=spawn(process.execPath,[resolve(root,'web/node_modules/next/dist/bin/next'),'start',snapshot,'-p','4333','-H','127.0.0.1'],{cwd:root,windowsHide:true,stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
const server=http.createServer((req,res)=>{
  const path=new URL(req.url,'http://127.0.0.1:4334').pathname;
  if(!['GET','HEAD'].includes(req.method)){json(res,405,{error:'Read-only preview'});return;}
  if(path==='/__qa/status'){json(res,200,{build,snapshot,pid:process.pid,nextPid:child.pid});return;}
  if(path.startsWith('/api/')){json(res,503,{error:'QA APIs disabled'});return;}
  const data=path.startsWith('/data/'),hostname=data?'localhost':'127.0.0.1',port=data?4321:4333;
  const upstream=http.request({hostname,port,path:req.url,method:req.method,headers:{...req.headers,host:hostname+':'+port},timeout:90000},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});
  upstream.on('timeout',()=>upstream.destroy(Error('QA upstream timeout')));
  upstream.on('error',()=>{if(!res.headersSent)json(res,502,{error:'QA upstream unavailable'});else res.end();});
  res.on('close',()=>upstream.destroy());req.pipe(upstream);
});
child.on('error',error=>{console.error(error.message);server.close();process.exitCode=1;});
child.on('exit',code=>{server.close();process.exitCode=code??1;});
server.on('error',error=>{console.error(error.message);child.kill();process.exitCode=1;});
server.listen(4334,'127.0.0.1',()=>console.log(JSON.stringify({preview:'http://127.0.0.1:4334/',build,pid:process.pid,nextPid:child.pid})));
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{server.close();child.kill();});
