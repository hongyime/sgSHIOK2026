import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong root');
const name = process.argv[2];
if (!/^[a-z0-9-]+$/.test(name || '')) throw Error('Built snapshot required');
const snapshot = resolve(root, 'tmp/cached-release-' + name, 'web');
const build = readFileSync(resolve(snapshot, '.next/BUILD_ID'), 'utf8').trim();
const child = spawn(process.execPath, [resolve(root, 'web/node_modules/next/dist/bin/next'), 'start', snapshot, '-p', '4327', '-H', '127.0.0.1'],
  { cwd: root, windowsHide: true, stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
const requests = [];
const server = http.createServer((req, res) => {
  const path = new URL(req.url, 'http://127.0.0.1:4328').pathname;
  if (path === '/__qa/status') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ build, snapshot, pid: process.pid, nextPid: child.pid, requests })); return;
  }
  if (path.startsWith('/api/')) {
    requests.push({ path, status: 503, kind: 'blocked-preview', at: Date.now() });
    res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ok: false, error: 'QA preview unavailable' })); return;
  }
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  const data = path.startsWith('/data/'), port = data ? 4321 : 4327, hostname = data ? 'localhost' : '127.0.0.1';
  const upstream = http.request({hostname,port,path:req.url,method:req.method,headers:{...req.headers,host:`${hostname}:${port}`}}, response => {
    requests.push({path,status:response.statusCode,kind:data?'data':'app',at:Date.now()});
    if(requests.length>1000)requests.shift();res.writeHead(response.statusCode,response.headers);response.pipe(res);
  });
  upstream.on('error',error=>{console.error(error.message);if(!res.headersSent)res.writeHead(502);res.end();});req.pipe(upstream);
});
child.on('error',error=>{console.error(error);server.close();process.exitCode=1;});
server.on('error',error=>{console.error(error);child.kill();process.exitCode=1;});
server.listen(4328,'127.0.0.1',()=>console.log(JSON.stringify({preview:'http://127.0.0.1:4328/',build,pid:process.pid,nextPid:child.pid})));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close();child.kill();});
