import http from 'node:http';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, createWriteStream } from 'node:fs';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { verifyFrontendRetention } from '../../../web/scripts/frontend-retention.mjs';
const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const out = resolve(root, 'qa/revamp-r1/retained-current-20260912/server-1'); mkdirSync(out);
const build = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/retained-current-20260912/build-1/build.json')));
assert.equal(build.exitCode, 0); assert.equal(build.sourceStable, true);
const sha = b => createHash('sha256').update(b).digest('hex');
for (const source of build.sources) assert.equal(sha(readFileSync(resolve(root, source.path))), source.sha256, source.path);
const web = resolve(build.snapshot, 'web'), retention = verifyFrontendRetention(web, { requireBuild: true });
assert.equal(retention.manifestSha256, build.verifiedRetention.manifestSha256);
const manifest = JSON.parse(readFileSync(resolve(web, 'frontend-retention.json')));
const oldFiles = new Map(manifest.files.map(entry => ['/' + entry.path, { ...entry, bytes: readFileSync(resolve(web, 'public/_retained', entry.path)) }]));
const html = readFileSync(resolve(root, 'web/.next/server/app/index.html'));
assert.equal(sha(html), '4ad9e4f9b97117f3203bba69a950b0bcfcab96ad3805a6b56503550bbfec544b');
const workerA = execFileSync('git', ['show', 'c83fc96:web/public/sw.js'], { cwd: root });
assert.equal(sha(workerA), 'c1a9e34ed80456e93ade73cd90706269e47a75cc6782dad3d9f12620cf6b2390');
const workerB = readFileSync(resolve(web, 'public/sw.js'));
assert.equal(sha(workerB), build.sources.find(s => s.path === 'web/public/sw.js').sha256);
const target = '/_next/static/chunks/0j6tjjnrv2h3w.js', oldTarget = oldFiles.get(target);
assert.ok(oldTarget);
const identity = { root, pid: process.pid, origin: 'http://127.0.0.1:4372', directory: out,
  buildA: 'e8Hlhkml4c3i_uMGJdd3P', buildB: build.buildId, sourceB: build.snapshot, bPort: 4371,
  workerHashes: { A: sha(workerA), B: sha(workerB) }, target, targetBytes: oldTarget.bytes.length,
  targetSha256: oldTarget.sha256, oldHtmlSha256: sha(html), retention,
  deploymentIdentityVerified: false, oldServing: 'Pinned static prerendered HTML and retained immutable files; not a production origin identity claim.' };
const child = spawn(process.execPath, [resolve(root, 'web/node_modules/next/dist/bin/next'), 'start', web, '-p', '4371', '-H', '127.0.0.1'],
  { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
identity.nextPid = child.pid;
child.stdout.pipe(createWriteStream(resolve(out, 'next.stdout.txt'), { flags: 'wx' }));
child.stderr.pipe(createWriteStream(resolve(out, 'next.stderr.txt'), { flags: 'wx' }));
const childExit = new Promise(done => child.on('exit', (code, signal) => done({ code, signal })));
child.on('error', error => { console.error(error); process.exitCode = 1; });
let active = 'A', stopping = false; const nonce = randomUUID(), requests = [];
const note = (req, status, extra = {}) => requests.push({ at: new Date().toISOString(), method: req.method, path: req.url, active, status, ...extra });
const json = (res, status, body) => res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(body));
const server = http.createServer((req, res) => {
  const url = new URL(req.url, identity.origin);
  if (url.pathname === '/__qa/status') { json(res, 200, { ...identity, active, nonce, requests }); return; }
  if (url.pathname === '/__qa/switch') {
    if (req.method !== 'POST' || req.headers['x-shiok-qa'] !== nonce || active !== 'A') { json(res, 403, {}); return; }
    active = 'B'; note(req, 204, { control: true }); res.writeHead(204).end(); return;
  }
  if (url.pathname === '/__qa/stop') {
    if (req.method !== 'POST' || req.headers['x-shiok-qa'] !== nonce || stopping) { json(res, 403, {}); return; }
    stopping = true; note(req, 204, { control: true }); res.writeHead(204).end();
    server.close(); server.closeIdleConnections(); child.kill();
    childExit.then(exit => writeFileSync(resolve(out, 'terminal.json'), JSON.stringify({ ...identity, active, requests, childExit: exit }, null, 2) + '\n', { flag: 'wx' })); return;
  }
  if (requests.length >= 6000) { json(res, 503, { error: 'Receipt capacity' }); return; }
  if (!['GET', 'HEAD'].includes(req.method) || url.pathname.startsWith('/api/')) { note(req, 405, { blocked: true }); json(res, 405, {}); return; }
  if (url.pathname === '/__qa/seed') {
    note(req, 200, { fixture: true }); res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' })
      .end('<!doctype html><title>Retained-tab fixture seed</title><p>Local fixture seed.</p>'); return;
  }
  if (url.pathname === '/sw.js') {
    note(req, 200, { workerSha256: identity.workerHashes[active] });
    res.writeHead(200, { 'Content-Type': 'application/javascript', 'Service-Worker-Allowed': '/', 'Cache-Control': 'no-cache' })
      .end(req.method === 'HEAD' ? undefined : active === 'A' ? workerA : workerB); return;
  }
  const data = url.pathname.startsWith('/data/');
  if (active === 'A' && !data) {
    const entry = oldFiles.get(url.pathname);
    const bytes = url.pathname === '/' ? html : entry?.bytes;
    if (!bytes) { note(req, 404, { oldStatic: true }); res.writeHead(404).end(); return; }
    const type = url.pathname === '/' ? 'text/html' : /\.css$/.test(url.pathname) ? 'text/css' : /\.woff2$/.test(url.pathname) ? 'font/woff2' : 'application/javascript';
    note(req, 200, { oldStatic: true, sha256: sha(bytes) });
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': url.pathname === '/' ? 'no-cache' : 'public,max-age=31536000,immutable' }).end(req.method === 'HEAD' ? undefined : bytes); return;
  }
  const port = data ? 4321 : 4371, hostname = data ? 'localhost' : '127.0.0.1', activeAtStart = active;
  const upstream = http.request({ hostname, port, method: req.method, path: req.url, headers: { ...req.headers, host: hostname + ':' + port }, timeout: 90000 }, response => {
    note(req, response.statusCode, { upstream: port, data, activeAtStart }); res.writeHead(response.statusCode, response.headers); response.pipe(res);
  });
  upstream.on('timeout', () => upstream.destroy(Error('Upstream timeout')));
  upstream.on('error', error => { note(req, 502, { error: error.message }); if (!res.headersSent) json(res, 502, { error: 'Upstream unavailable' }); else res.end(); });
  res.on('close', () => upstream.destroy()); req.pipe(upstream);
});
server.on('error', error => { console.error(error); child.kill(); process.exitCode = 1; });
// Startup probes precede listening, so a fresh browser trace starts with no requests.
try {
  const until = Date.now() + 60000; let response;
  while (Date.now() < until) {
    try { response = await fetch('http://127.0.0.1:4371' + target, { signal: AbortSignal.timeout(5000) }); break; }
    catch { await new Promise(done => setTimeout(done, 500)); }
  }
  assert.equal(response?.status, 200); assert.equal(sha(Buffer.from(await response.arrayBuffer())), oldTarget.sha256);
  writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
  server.listen(4372, '127.0.0.1', () => { writeFileSync(resolve(out, 'started.json'), JSON.stringify(identity, null, 2) + '\n', { flag: 'wx' }); console.log(JSON.stringify(identity)); });
} catch (error) { child.kill(); server.close(); throw error; }
