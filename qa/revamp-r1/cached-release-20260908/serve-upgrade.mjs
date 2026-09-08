import http from 'node:http';
import { execFileSync, spawn } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const name = process.argv[2];
if (!/^[a-z0-9-]+$/.test(name || '')) throw Error('Snapshot name required');
const snapshot = resolve(root, 'tmp/cached-release-' + name, 'web');
if (!existsSync(resolve(snapshot, '.next/BUILD_ID'))) throw Error('Successful snapshot build required');
const buildB = readFileSync(resolve(snapshot, '.next/BUILD_ID'), 'utf8').trim();
const buildA = readFileSync(resolve(root, 'web/.next/BUILD_ID'), 'utf8').trim();
const workerA = execFileSync('git', ['show', 'c83fc96:web/public/sw.js'], { cwd: root });
const workerASha256 = createHash('sha256').update(workerA).digest('hex');
// Public worker source is served as a static file; it does not require another Next compilation.
const worker = resolve(root, 'web/public/sw.js');
const previousWorkerSha256 = createHash('sha256').update(readFileSync(resolve(snapshot, 'public/sw.js'))).digest('hex');
copyFileSync(worker, resolve(snapshot, 'public/sw.js'));
writeFileSync(resolve(root, 'qa/revamp-r1/cached-release-20260908', `static-overlay-${Date.now()}.json`), JSON.stringify({
  buildB, source: 'web/public/sw.js', destination: resolve(snapshot, 'public/sw.js'),
  previousWorkerSha256,
  sha256: createHash('sha256').update(readFileSync(worker)).digest('hex'),
  reason: 'Copy the current static worker source into the QA snapshot; compare the two hashes to determine whether it changed.',
}, null, 2) + '\n');
let active = 'A', offline = false;
let holdWorker = false;
const heldWorkerResponses = new Map();
const workerHoldRequests = [];
function releaseWorkers() {
  holdWorker = false;
  for (const [response, request] of heldWorkerResponses) {
    request.releasedAt = Date.now();
    response.writeHead(503, { 'Cache-Control': 'no-store' }).end('QA held worker released; retry allowed');
  }
  heldWorkerResponses.clear();
}
const child = spawn(process.execPath, [resolve(root, 'web/node_modules/next/dist/bin/next'), 'start', snapshot, '-p', '4323', '-H', '127.0.0.1'],
  { cwd: root, windowsHide: true, stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
child.on('error', error => { console.error(error); process.exitCode = 1; server.close(); });
const counts = { A: 0, B: 0, data: 0, failures: 0 };
const requests = [];
function receipt(path, status) {
  requests.push({ path, status, active, offline, at: new Date().toISOString() });
  if (requests.length > 500) requests.shift();
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:4324');
  if (url.pathname === '/__qa/status') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ active, offline, buildA, buildB, workerASha256, counts, requests,
      workerHold: { enabled: holdWorker, pending: heldWorkerResponses.size, requests: workerHoldRequests } })); return;
  }
  if (url.pathname.startsWith('/__qa/select/')) {
    if (req.method !== 'POST' || req.headers['x-shiok-qa'] !== 'local-upgrade') { res.writeHead(403).end(); return; }
    const value = url.pathname.split('/').at(-1);
    if (!['A', 'B', 'offline', 'online', 'hold-worker', 'release-worker'].includes(value)) { res.writeHead(400).end(); return; }
    if (value === 'hold-worker') {
      if (active !== 'B' || offline || holdWorker) { res.writeHead(409).end(); return; }
      holdWorker = true;
    } else if (value === 'release-worker') releaseWorkers();
    else if (value === 'A' || value === 'B') active = value;
    else offline = value === 'offline';
    console.log(JSON.stringify({ active, offline, holdWorker, at: new Date().toISOString() }));
    res.writeHead(204).end(); return;
  }
  if (!['GET', 'HEAD'].includes(req.method) || offline) { counts.failures++; receipt(url.pathname, 503); res.writeHead(503).end('QA network unavailable'); return; }
  if (holdWorker && active === 'B' && url.pathname === '/maplibre/6.1.0/maplibre-gl-worker.mjs') {
    const request = { path: url.pathname, wallMs: Date.now(), active, buildB };
    workerHoldRequests.push(request);
    if (workerHoldRequests.length > 50) workerHoldRequests.shift();
    heldWorkerResponses.set(res, request);
    res.on('close', () => { request.closedAt = Date.now(); heldWorkerResponses.delete(res); });
    return;
  }
  // Next serves public/ from disk, not its compiled build. Pin the old worker to the reviewed commit.
  if (active === 'A' && url.pathname === '/sw.js') {
    receipt(url.pathname, 200);
    res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', 'Service-Worker-Allowed': '/' });
    res.end(req.method === 'HEAD' ? undefined : workerA); return;
  }
  const data = url.pathname.startsWith('/data/');
  const target = data ? 4321 : active === 'A' ? 4321 : 4323;
  const hostname = target === 4321 ? 'localhost' : '127.0.0.1';
  counts[data ? 'data' : active]++;
  const upstream = http.request({ hostname, port: target, path: req.url, method: req.method,
    headers: { ...req.headers, host: `${hostname}:${target}` } }, response => {
    receipt(url.pathname, response.statusCode);
    res.writeHead(response.statusCode, response.headers);
    response.pipe(res);
  });
  upstream.on('error', error => { counts.failures++; receipt(url.pathname, 502); console.error(error.message); if (!res.headersSent) res.writeHead(502); res.end(); });
  req.pipe(upstream);
});
server.on('error', error => { console.error(error); child.kill(); process.exitCode = 1; });
server.listen(4324, '127.0.0.1', () => console.log(JSON.stringify({ preview: 'http://127.0.0.1:4324/', buildA, buildB, pid: process.pid, serverPid: child.pid })));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { releaseWorkers(); server.close(); child.kill(); });
