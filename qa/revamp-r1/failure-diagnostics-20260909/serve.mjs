import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [name, extra] = process.argv.slice(2);
if (extra || !/^[a-z0-9-]+$/.test(name || '')) throw Error('Built snapshot required');
const snapshot = realpathSync(resolve(root, 'tmp/cached-release-' + name, 'web'));
const local = relative(realpathSync(resolve(root, 'tmp')), snapshot);
if (local === '..' || local.startsWith('..' + sep) || isAbsolute(local)) throw Error('Snapshot outside repository tmp');
const build = readFileSync(resolve(snapshot, '.next/BUILD_ID'), 'utf8').trim();
const modes = new Set(['clear', 'geometry', 'score', 'worker']);
const requests = [];
let mode = 'clear';
function record(path, status, kind) {
  const receipt = { path, status, kind, mode, at: Date.now() };
  requests.push(receipt);
  if (requests.length > 5000) requests.shift();
  return receipt;
}
function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
async function freePort(port) {
  await new Promise((done, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', () => probe.close(done));
  });
}
await freePort(4331);
await freePort(4332);
const child = spawn(process.execPath, [resolve(root, 'web/node_modules/next/dist/bin/next'), 'start', snapshot, '-p', '4331', '-H', '127.0.0.1'], {
  cwd: root, windowsHide: true, stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
});
const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://127.0.0.1:4332').pathname;
  if (path === '/__qa/status' && req.method === 'GET') {
    json(res, 200, { build, snapshot, pid: process.pid, nextPid: child.pid, mode, requests }); return;
  }
  if (path === '/__qa/fault' && req.method === 'POST') {
    let body = '';
    try {
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 512) { json(res, 413, { error: 'QA body limit' }); return; }
      }
      const next = JSON.parse(body).mode;
      if (!modes.has(next)) { json(res, 400, { error: 'Invalid QA mode' }); return; }
      mode = next;
      json(res, 200, { mode });
    } catch { if (!res.headersSent) json(res, 400, { error: 'Invalid QA request' }); }
    return;
  }
  if (!['GET', 'HEAD'].includes(req.method)) { json(res, 405, { error: 'Read-only preview' }); return; }
  const data = path.startsWith('/data/');
  const fault = (mode === 'geometry' && data && path.includes('/geom/'))
    || (mode === 'score' && data && path.includes('/scores/'))
    || (mode === 'worker' && path === '/maplibre/6.1.0/maplibre-gl-worker.mjs');
  if (fault || path.startsWith('/api/')) {
    const receipt = record(path, 503, fault ? 'injected-fault' : 'blocked-api');
    res.once('finish', () => { receipt.responseFinishedAt = Date.now(); });
    json(res, 503, { error: 'QA preview unavailable' }); return;
  }
  const port = data ? 4321 : 4331, hostname = data ? 'localhost' : '127.0.0.1';
  const upstream = http.request({ hostname, port, path: req.url, method: req.method,
    headers: { ...req.headers, host: `${hostname}:${port}` }, timeout: 90_000 }, response => {
    record(path, response.statusCode, data ? 'read-only-data' : 'app');
    res.writeHead(response.statusCode, response.headers); response.pipe(res);
  });
  upstream.on('timeout', () => upstream.destroy(Error('QA upstream timeout')));
  upstream.on('error', () => { if (!res.headersSent) json(res, 502, { error: 'QA upstream unavailable' }); else res.end(); });
  res.on('close', () => upstream.destroy());
  req.pipe(upstream);
});
child.on('error', error => { console.error(error.message); server.close(); process.exitCode = 1; });
child.on('exit', code => { server.close(); process.exitCode = code ?? 1; });
server.on('error', error => { console.error(error.message); child.kill(); process.exitCode = 1; });
server.listen(4332, '127.0.0.1', () => console.log(JSON.stringify({ preview: 'http://127.0.0.1:4332/', build, pid: process.pid, nextPid: child.pid })));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(); child.kill(); });
