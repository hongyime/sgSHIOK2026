import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { freemem } from 'node:os';
import assert from 'node:assert/strict';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';

// Retained, never executed draft. Supersede in a new file after independent review.
throw Error('REVIEW-REJECTED: worker traffic not fully gated; observation wrongly requires 404; cleanup outside deadline. Do not run this draft.');

const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const dir = resolve(root, 'qa/revamp-r1/production-runtime-20260913');
const captured = resolve(dir, 'capture-1789294685168');
const out = mkdtempSync(resolve(dir, 'replay-'));
const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));
const hash = b => createHash('sha256').update(b).digest('hex');
const json = p => JSON.parse(readFileSync(resolve(captured, p)));
const started = Date.now(), deadline = started + 180000;
const report = { root, hostname: process.env.COMPUTERNAME, startedAt: new Date().toISOString(),
  scope: 'One local captured-production Document, not a production browser, retained-tab acceptance or speed benchmark. Same HTML/asset bytes, local read-only data, OneMap tiles only. No API. Missing uncaptured assets are explicit synthetic 503, never fabricated 404.',
  out, profile, availableMiB: freemem() / 1048576, requests: [], events: [], denied: [], errors: [], checks: [] };
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
const htmlReceipt = json('response.json'), html = readFileSync(resolve(captured, 'index.html'));
assert.equal(hash(html), htmlReceipt.sha256);
const all = ['initial-assets.json', 'dependencies.json', 'dependencies-reviewed.json'].flatMap(f => json(f).responses);
const assets = new Map();
for (const r of all.filter(r => r.file)) {
  const path = new URL(r.url).pathname, bytes = readFileSync(resolve(captured, r.file));
  assert.equal(bytes.length, r.decodedBytes); assert.equal(hash(bytes), r.sha256);
  assets.set(path, { ...r, bytes });
}
const observed404 = new Map(all.filter(r => r.status === 404).map(r => [new URL(r.url).pathname, r]));
report.buildId = json('html-inspection.json').buildId; report.htmlSha256 = hash(html);
report.assetCount = assets.size; report.assetBytes = [...assets.values()].reduce((n, r) => n + r.bytes.length, 0);
const fixture = JSON.parse(readFileSync(resolve(root, 'web/lib/__tests__/fixtures/published-walks.provenance.json')));
const anchors = () => Object.values(fixture.sources).map(s => {
  const sha256 = hash(readFileSync(resolve(root, s.path))); assert.equal(sha256, s.sha256, 'STOP protected input mismatch ' + s.path);
  return { path: s.path, sha256 };
});
let origin, server, chrome, ws, session, closing = false, sequence = 0, stderr = '', timer;
const pending = new Map(), upstreams = new Set(); let dataBytes = 0, tileCount = 0;
const note = (kind, data) => { if (report.events.length < 10000) report.events.push({ atMs: Date.now() - started, kind, ...data }); };
function send(method, params = {}, sessionId = '', timeout = 10000) {
  return new Promise((done, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error(method + ' timeout')); }, timeout);
    pending.set(id, (value, error) => { clearTimeout(timer); pending.delete(id); error ? reject(Error(error.message)) : done(value); });
    try { ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }
    catch (e) { clearTimeout(timer); pending.delete(id); reject(e); }
  });
}
const sleep = ms => new Promise(done => setTimeout(done, ms));
async function until(get, predicate, ms) {
  const end = Math.min(started + 125000, Date.now() + ms);
  while (Date.now() < end) { const value = await get(); if (predicate(value)) return value; await sleep(250); }
  throw Error('Observation timeout');
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true }, session);
  if (result.exceptionDetails) throw Error(result.exceptionDetails.text);
  return result.result.value;
}
try {
  assert.ok(report.availableMiB >= 1024, 'STOP memory gate');
  report.anchorsBefore = anchors();
  server = http.createServer((req, res) => {
    const u = new URL(req.url, origin), entry = { path: req.url, method: req.method, atMs: Date.now() - started };
    report.requests.push(entry);
    const end = (status, headers = {}, body) => { entry.status = status; res.writeHead(status, headers).end(req.method === 'HEAD' ? undefined : body); };
    if (Date.now() >= started + 130000 || report.requests.length > 300) { end(503); return; }
    if (!['GET', 'HEAD'].includes(req.method) || u.pathname.startsWith('/api/')) { entry.denied = true; end(405); return; }
    if (u.pathname === '/') { entry.sha256 = hash(html); end(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': htmlReceipt.headers['content-security-policy'] }, html); return; }
    const asset = assets.get(u.pathname);
    if (asset) { entry.sha256 = asset.sha256; end(200, { 'content-type': asset.headers['content-type'], 'cache-control': asset.headers['cache-control'], ...(u.pathname === '/sw.js' ? { 'service-worker-allowed': '/' } : {}) }, asset.bytes); return; }
    if (observed404.has(u.pathname)) { entry.observedPublic404 = true; end(404, { 'content-type': 'text/plain' }, 'Previously observed public HTTP 404'); return; }
    if (u.pathname.startsWith('/data/generated_20260805_prefer_scored_routed/') && !u.search && !/%|\\/.test(u.pathname)) {
      const upstream = http.request({ hostname: 'localhost', port: 4340, path: u.pathname, method: req.method, timeout: 15000 }, r => {
        entry.status = r.statusCode; entry.localReadOnlyData = true;
        const sha = createHash('sha256'); let bytes = 0;
        res.writeHead(r.statusCode, r.headers);
        r.on('data', b => { bytes += b.length; dataBytes += b.length; sha.update(b); if (dataBytes > 100 * 1024 * 1024) upstream.destroy(Error('Data byte bound')); });
        r.on('end', () => { entry.bytes = bytes; entry.sha256 = sha.digest('hex'); }); r.pipe(res);
      });
      upstreams.add(upstream); upstream.on('close', () => upstreams.delete(upstream));
      upstream.on('timeout', () => upstream.destroy(Error('Data timeout')));
      upstream.on('error', e => { entry.error = e.message; if (!res.headersSent) end(502); else res.destroy(); });
      res.on('close', () => upstream.destroy()); upstream.end(); return;
    }
    entry.uncaptured = true; end(503, { 'content-type': 'text/plain' }, 'QA has no captured response; not a production status claim');
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  origin = 'http://127.0.0.1:' + server.address().port; report.origin = origin;
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--window-size=1440,950', '--force-device-scale-factor=1', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
  report.chromePid = chrome.pid; chrome.stderr.on('data', b => { stderr += b; });
  timer = setTimeout(() => { chrome.kill(); for (const u of upstreams) u.destroy(); server.closeAllConnections(); server.close(); ws?.close(); }, deadline - Date.now());
  const endpoint = await until(() => /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1], Boolean, 30000);
  ws = new WebSocket(endpoint);
  await new Promise((done, reject) => { const t = setTimeout(() => reject(Error('CDP connection timeout')), 10000); ws.onopen = () => { clearTimeout(t); done(); }; ws.onerror = () => { clearTimeout(t); reject(Error('CDP connection')); }; });
  ws.onmessage = e => {
    const m = JSON.parse(e.data), p = m.params, sid = m.sessionId ?? '';
    if (m.id) { pending.get(m.id)?.(m.result, m.error); return; }
    if (['Target.attachedToTarget', 'Runtime.exceptionThrown', 'Log.entryAdded', 'Network.requestWillBeSent', 'Network.responseReceived', 'Network.loadingFailed'].includes(m.method)) note(m.method, { sessionId: sid, params: p });
    if (m.method === 'Target.attachedToTarget' && p.targetInfo.type === 'worker') {
      void (async () => { for (const d of ['Runtime', 'Network', 'Log']) await send(d + '.enable', {}, p.sessionId); })().catch(e => report.errors.push(e.message));
    }
    if (m.method === 'Fetch.requestPaused') {
      const u = new URL(p.request.url);
      const tile = u.origin === 'https://www.onemap.gov.sg' && !u.search && (/^\/maps\/tiles\/Grey_HD\/\d+\/\d+\/\d+\.png$/.test(u.pathname) || u.pathname === '/web-assets/images/logo/om_logo.png');
      const allowed = ['GET', 'HEAD'].includes(p.request.method) && !u.username && !u.password && ((u.origin === origin && !u.pathname.startsWith('/api/')) || (tile && ++tileCount <= 100));
      if (!allowed) report.denied.push({ url: u.href, method: p.request.method });
      void send(allowed ? 'Fetch.continueRequest' : 'Fetch.failRequest', { requestId: p.requestId, ...(!allowed ? { errorReason: 'BlockedByClient' } : {}) }, sid).catch(e => { if (!closing) report.errors.push(e.message); });
    }
  };
  ws.onclose = () => { for (const done of [...pending.values()]) done(undefined, { message: 'CDP closed' }); };
  const targets = await send('Target.getTargets'); const target = targets.targetInfos.find(t => t.type === 'page' && t.url === 'about:blank'); assert.ok(target);
  session = (await send('Target.attachToTarget', { targetId: target.targetId, flatten: true })).sessionId;
  for (const d of ['Page', 'Runtime', 'Network', 'Log']) await send(d + '.enable', {}, session);
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] }, session);
  await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, session);
  await send('Network.setBypassServiceWorker', { bypass: true }, session);
  await send('Page.navigate', { url: origin + '/?postal=018956&debugMap=1' }, session);
  await until(() => report.requests, rows => rows.some(r => r.observedPublic404), 75000);
  await sleep(2000);
  report.document = await evaluate('({url:location.href,ready:document.readyState,text:document.body.innerText,canvasCount:document.querySelectorAll("canvas").length,debug:window.__shiokRouteDebug||null})');
  const shot = await send('Page.captureScreenshot', { format: 'png' }, session);
  const bytes = Buffer.from(shot.data, 'base64'); writeFileSync(resolve(out, 'observed.png'), bytes, { flag: 'wx' });
  report.screenshot = { path: 'observed.png', bytes: bytes.length, sha256: hash(bytes) };
  report.observationComplete = true;
} catch (e) { report.failure = e.stack; }
finally {
  closing = true; clearTimeout(timer);
  if (ws?.readyState === 1) try { await send('Browser.close', {}, '', 3000); } catch (e) { report.closeError = e.message; }
  ws?.close(); report.cleanup = cleanup(profile); chrome?.stderr?.destroy(); chrome?.unref();
  for (const u of upstreams) u.destroy(); if (server) { server.closeAllConnections(); await new Promise(done => server.close(done)); }
  report.serverClosed = !server?.listening; report.stderr = stderr; report.dataBytes = dataBytes; report.tileCount = tileCount;
  try { report.anchorsAfter = anchors(); report.anchorsUnchanged = JSON.stringify(report.anchorsBefore) === JSON.stringify(report.anchorsAfter); } catch (e) { report.failure = e.stack; }
  report.elapsedMs = Date.now() - started;
  report.ok = !!report.observationComplete && !report.failure && report.cleanup.verified && report.serverClosed && report.anchorsUnchanged;
  writeFileSync(resolve(out, 'observation.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, ok: report.ok, failure: report.failure, known404: report.requests.filter(r => r.observedPublic404), uncaptured: report.requests.filter(r => r.uncaptured), errors: report.errors, cleanup: report.cleanup.verified, elapsedMs: report.elapsedMs }, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}
