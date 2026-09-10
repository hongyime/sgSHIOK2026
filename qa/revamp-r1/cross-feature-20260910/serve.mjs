import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { readFileSync, realpathSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative, isAbsolute, sep } from 'node:path';
const root='C:\\sgSHIOK2026';
if(process.cwd()!==root)throw Error('Wrong working root');
const [name,nextArg='4341',proxyArg='4342']=process.argv.slice(2);
if(!/^[a-z0-9-]+$/.test(name??'')||!/^\d{4}$/.test(nextArg)||!/^\d{4}$/.test(proxyArg)||nextArg===proxyArg)throw Error('Invalid preview arguments');
const nextPort=Number(nextArg),proxyPort=Number(proxyArg);
const snapshot=realpathSync(resolve(root,'tmp/cached-release-'+name+'/web'));
const part=relative(realpathSync(resolve(root,'tmp')),snapshot);
if(isAbsolute(part)||part==='..'||part.startsWith('..'+sep))throw Error('Wrong snapshot');
const build=readFileSync(resolve(snapshot,'.next/BUILD_ID'),'utf8').trim();
const receipt=resolve(root,'qa/revamp-r1/cross-feature-20260910','preview-'+proxyPort+'.json');
if(existsSync(receipt))throw Error('Preserve existing preview receipt');
for(const port of [nextPort,proxyPort])await new Promise((done,reject)=>{const probe=net.createServer();probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(done));});
const child=spawn(process.execPath,[resolve(root,'web/node_modules/next/dist/bin/next'),'start',snapshot,'-p',nextArg,'-H','127.0.0.1'],{cwd:root,windowsHide:true,stdio:'inherit',env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
const identity={origin:'http://127.0.0.1:'+proxyPort,build,snapshot,pid:process.pid,nextPid:child.pid};
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
const server=http.createServer((req,res)=>{
  const path=new URL(req.url,identity.origin).pathname;
  if(!['GET','HEAD'].includes(req.method)){json(res,405,{error:'Read-only preview'});return;}
  if(path==='/__qa/status'){json(res,200,identity);return;}
  if(path.startsWith('/api/')){json(res,503,{error:'QA APIs disabled'});return;}
  const data=path.startsWith('/data/'),hostname=data?'localhost':'127.0.0.1',port=data?4321:nextPort;
  const upstream=http.request({hostname,port,path:req.url,method:req.method,headers:{...req.headers,host:hostname+':'+port},timeout:90000},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});
  upstream.on('timeout',()=>upstream.destroy(Error('QA upstream timeout')));
  upstream.on('error',()=>{if(!res.headersSent)json(res,502,{error:'QA upstream unavailable'});else res.end();});
  res.on('close',()=>upstream.destroy());req.pipe(upstream);
});
child.on('error',error=>{console.error(error.message);server.close();process.exitCode=1;});
child.on('exit',code=>{server.close();process.exitCode=code??1;});
server.on('error',error=>{console.error(error.message);child.kill();process.exitCode=1;});
server.listen(proxyPort,'127.0.0.1',()=>{writeFileSync(receipt,JSON.stringify(identity,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(identity));});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close();child.kill();});
