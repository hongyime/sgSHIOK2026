import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, createWriteStream } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Working root guard');
const out = resolve(root, 'qa/revamp-r1/worker-alignment-20260910');
const build = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/cached-release-20260908/worker-alignment-20260910/build.json')));
if (build.exitCode !== 0 || !build.protectedDataAbsent) throw Error('Successful isolated build required');
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:4362');
  if (!['GET', 'HEAD'].includes(req.method) || url.pathname.startsWith('/api/')) { res.writeHead(403).end('Read-only preview'); return; }
  if (url.pathname === '/__qa/status') { res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ buildId: build.buildId, snapshot: build.snapshot, pid: process.pid })); return; }
  const port = url.pathname.startsWith('/data/') ? 4321 : 4361;
  const hostname = port === 4321 ? 'localhost' : '127.0.0.1';
  const upstream = http.request({ hostname, port, path: req.url, method: req.method, headers: { ...req.headers, host: `${hostname}:${port}` }, timeout: 90000 }, response => { res.writeHead(response.statusCode, response.headers); response.pipe(res); });
  upstream.on('timeout', () => upstream.destroy(Error('Upstream timeout')));
  upstream.on('error', error => { if (!res.headersSent) res.writeHead(502); res.end(error.message); });
  res.on('close', () => upstream.destroy()); req.pipe(upstream);
});
// Binding first refuses an occupied preview port without starting another Next process.
server.listen(4362, '127.0.0.1', () => {
  const child = spawn(process.execPath, [resolve(root, 'web/node_modules/next/dist/bin/next'), 'start', resolve(build.snapshot, 'web'), '-p', '4361', '-H', '127.0.0.1'], { cwd: root, windowsHide: true, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(createWriteStream(resolve(out, 'preview.stdout.txt'), { flags: 'wx' }));
  child.stderr.pipe(createWriteStream(resolve(out, 'preview.stderr.txt'), { flags: 'wx' }));
  const identity = { url: 'http://127.0.0.1:4362', pid: process.pid, nextPid: child.pid, buildId: build.buildId, snapshot: build.snapshot };
  writeFileSync(resolve(out, 'preview.json'), JSON.stringify(identity, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(identity));
  child.on('exit', code => { server.close(); process.exitCode = code ?? 1; });
});
