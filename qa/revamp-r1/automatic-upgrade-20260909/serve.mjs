import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const hash = value => createHash('sha256').update(value).digest('hex');
const buildA = readFileSync(resolve(root, 'web/.next/BUILD_ID'), 'utf8').trim();
const receiptB = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/cached-release-20260908/map-download-20260909-1/build.json')));
const buildB = receiptB.buildId;
const statusB = await (await fetch('http://127.0.0.1:4328/__qa/status', { signal: AbortSignal.timeout(10_000) })).json();
if (statusB.build !== buildB || buildA === buildB) throw Error('Expected distinct live A and B builds');
const workerA = execFileSync('git', ['show', 'c83fc96:web/public/sw.js'], { cwd: root });
const workerB = readFileSync(resolve(receiptB.snapshot, 'web/public/sw.js'));
const workerHashes = { A: hash(workerA), B: hash(workerB) };
if (workerHashes.A !== 'c1a9e34ed80456e93ade73cd90706269e47a75cc6782dad3d9f12620cf6b2390') throw Error('Legacy worker identity mismatch');
if (workerHashes.B !== receiptB.sources.find(source => source.path === 'web/public/sw.js')?.sha256) throw Error('Built worker identity mismatch');
let active = 'A', sequence = 0;
const requests = [];
function note(req, status, extra = {}) {
  if (requests.length >= 4000) throw Error('QA receipt capacity exceeded');
  requests.push({ sequence: ++sequence, at: new Date().toISOString(), method: req.method, path: req.url,
    active, status, destination: req.headers['sec-fetch-dest'], serviceWorker: req.headers['service-worker'],
    userAgent: req.headers['user-agent'], ...extra });
}
const server = http.createServer((req, res) => {
  req.qaActiveAtStart = active;
  const url = new URL(req.url, 'http://127.0.0.1:4330');
  if (url.pathname === '/__qa/status') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ root, pid: process.pid, active, buildA, buildB, workerHashes, sourceB: statusB.snapshot, requests })); return;
  }
  if (url.pathname === '/__qa/select/B') {
    if (req.method !== 'POST' || req.headers['x-shiok-qa'] !== 'automatic-upgrade' || active !== 'A') { res.writeHead(403).end(); return; }
    active = 'B'; note(req, 204, { control: true }); res.writeHead(204).end(); return;
  }
  if (!['GET', 'HEAD'].includes(req.method) || url.pathname.startsWith('/api/')) {
    note(req, 503, { blocked: true }); res.writeHead(503, { 'Cache-Control': 'no-store' }).end('QA API disabled'); return;
  }
  if (url.pathname === '/sw.js') {
    const body = active === 'A' ? workerA : workerB;
    note(req, 200, { workerSha256: workerHashes[active] });
    res.writeHead(200, { 'Content-Type': 'application/javascript', 'Service-Worker-Allowed': '/',
      'Cache-Control': active === 'A' ? 'public, max-age=86400, stale-while-revalidate=604800' : 'public, max-age=0, must-revalidate',
      ETag: '"' + workerHashes[active] + '"' });
    res.end(req.method === 'HEAD' ? undefined : body); return;
  }
  const data = url.pathname.startsWith('/data/');
  const port = data || active === 'A' ? 4321 : 4327;
  const hostname = port === 4321 ? 'localhost' : '127.0.0.1';
  const upstream = http.request({ hostname, port, path: req.url, method: req.method, headers: { ...req.headers, host: `${hostname}:${port}` } }, response => {
    note(req, response.statusCode, { upstream: port, data, activeAtStart: req.qaActiveAtStart });
    res.writeHead(response.statusCode, response.headers); response.pipe(res);
  });
  upstream.on('error', error => { note(req, 502, { error: error.message }); if (!res.headersSent) res.writeHead(502); res.end(); });
  req.pipe(upstream);
});
server.on('error', error => { console.error(error); process.exitCode = 1; });
server.listen(4330, '127.0.0.1', () => console.log(JSON.stringify({ preview: 'http://127.0.0.1:4330', pid: process.pid, buildA, buildB, workerHashes })));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
