import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';
import { observeWorker } from '../lifecycle-probe-20260910/worker-session.mjs';
import { workerEntryHandoffs } from '../lifecycle-probe-20260910/analyze.mjs';
const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/worker-lifecycle-20260912/observed-'));
const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));
const origin = 'http://127.0.0.1:4362', hash = bytes => createHash('sha256').update(bytes).digest('hex');
const started = Date.now(), deadline = started + 240000, workEnd = deadline - 60000;
const report = { root, hostname: process.env.COMPUTERNAME, out, profile, origin, startedAt: new Date().toISOString(), entries: [], checks: [], errors: [], denied: [] };
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
let chrome, ws, stderr = '', sequence = 0, closing = false, mainSession;
const pending = new Map(), workerSessions = new Set();
const record = entry => report.entries.push({ sequence: report.entries.length, timeMs: Date.now() - started, ...entry });
function send(method, params = {}, sessionId = '', timeout = 20000) {
  return new Promise((done, reject) => {
    const remaining = (closing ? deadline : workEnd) - Date.now();
    if (remaining <= 0) { reject(Error('QA deadline')); return; }
    const id = ++sequence; record({ kind: 'send', id, method, sessionId, params });
    const timer = setTimeout(() => finish(undefined, { kind: 'timeout', message: method + ' timeout' }), Math.min(remaining, timeout));
    function finish(result, error) {
      clearTimeout(timer); pending.delete(id);
      // Response bodies are hashed separately; retain identity/size, not duplicate bodies in telemetry.
      record({ kind: 'reply', id, sessionId, ...(error ? { error } : { result: method === 'Network.getResponseBody' ? { bodyCharacters: result.body.length, base64Encoded: result.base64Encoded } : result }) });
      error ? reject(Object.assign(Error(error.message), { cdp: { id, method, sessionId, error } })) : done(result);
    }
    pending.set(id, finish);
    try { ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }
    catch (e) { finish(undefined, { kind: 'connection', message: e.message }); }
  });
}
async function evaluate(fn) {
  const r = await send('Runtime.evaluate', { expression: '(' + fn.toString() + ')()', returnByValue: true, awaitPromise: true }, mainSession);
  if (r.exceptionDetails) throw Error(r.exceptionDetails.text);
  return r.result.value;
}
async function until(name, get, predicate, limit = 90000) {
  const end = Math.min(workEnd, Date.now() + limit);
  while (Date.now() < end) { const value = await get(); report.last = { name, value }; if (predicate(value)) return value; await new Promise(done => setTimeout(done, 250)); }
  throw Error(name + ' timeout');
}
function check(name, pass, detail) { report.checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name); if (!pass) throw Error(name); }
function facts() {
  const m = window.__shiokRouteMap, d = window.__shiokRouteDebug;
  let features = []; try { features = m?.queryRenderedFeatures({ layers: ['shiokest-route-line'] }) ?? []; } catch {}
  return { status: document.querySelector('main')?.dataset.mapStatus, routeKey: d?.routeKey,
    count: features.filter(f => f.properties?.render_key === d?.routeKey).length,
    keys: [...new Set(features.map(f => f.properties?.render_key))], basemap: !!m?.getSource('onemap') && m.isSourceLoaded('onemap'),
    tiles: m?.areTilesLoaded(), moving: m?.isMoving(), viewport: [innerWidth, innerHeight] };
}
const ready = f => f.status === 'ready' && f.count === 4 && f.keys.length === 1 && f.keys[0] === f.routeKey && f.basemap && f.tiles && !f.moving;
const fixture = JSON.parse(readFileSync(resolve(root, 'web/lib/__tests__/fixtures/published-walks.provenance.json')));
function anchors() { return Object.values(fixture.sources).map(s => { const actual = hash(readFileSync(resolve(root, s.path))); assert.equal(actual, s.sha256, s.path); return { path: s.path, sha256: actual }; }); }
try {
  report.anchorsBefore = anchors();
  const build = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/cached-release-20260908/worker-alignment-20260910/build.json')));
  assert.ok(build.sources.every(s => hash(readFileSync(resolve(root, s.path))) === s.sha256));
  report.preview = await (await fetch(origin + '/__qa/status', { signal: AbortSignal.timeout(5000) })).json();
  assert.equal(report.preview.buildId, build.buildId);
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
  report.chromePid = chrome.pid; chrome.stderr.on('data', b => { stderr += b; });
  const endpoint = await until('owned browser', async () => /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1], Boolean, 45000);
  ws = new WebSocket(endpoint);
  await new Promise((done, reject) => { const timer = setTimeout(() => reject(Error('Connection timeout')), 10000); ws.onopen = () => { clearTimeout(timer); done(); }; ws.onerror = () => { clearTimeout(timer); reject(Error('CDP connection')); }; });
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { pending.get(m.id)?.(m.result, m.error ? { kind: 'cdp', ...m.error } : undefined); return; }
    const p = m.params, sessionId = m.sessionId ?? '';
    if (m.method.startsWith('Target.') || ['Network.requestWillBeSent', 'Network.responseReceived', 'Network.loadingFinished', 'Network.loadingFailed', 'Fetch.requestPaused', 'Runtime.exceptionThrown'].includes(m.method)) record({ kind: 'event', method: m.method, sessionId, params: p });
    if (m.method === 'Target.attachedToTarget' && p.targetInfo.type === 'worker') {
      workerSessions.add(p.sessionId);
      void observeWorker(send, p.sessionId).catch(e => report.errors.push({ worker: e.message, cdp: e.cdp }));
    }
    if (m.method === 'Runtime.exceptionThrown') report.errors.push({ sessionId, runtime: p });
    if (m.method === 'Fetch.requestPaused') {
      const u = new URL(p.request.url);
      const allowed = ['GET', 'HEAD'].includes(p.request.method) && !u.username && !u.password && ((u.origin === origin && !u.pathname.startsWith('/api/')) || (u.origin === 'https://www.onemap.gov.sg' && !u.search && (/^\/maps\/tiles\/Grey_HD\/\d+\/\d+\/\d+\.png$/.test(u.pathname) || u.pathname === '/web-assets/images/logo/om_logo.png')));
      if (!allowed) report.denied.push({ sessionId, url: u.href });
      void send(allowed ? 'Fetch.continueRequest' : 'Fetch.failRequest', allowed ? { requestId: p.requestId } : { requestId: p.requestId, errorReason: 'BlockedByClient' }, sessionId).catch(e => report.errors.push({ interception: e.message, cdp: e.cdp }));
    }
  };
  ws.onclose = () => { if (!closing) report.errors.push({ connection: 'Unexpected close' }); for (const done of [...pending.values()]) done(undefined, { kind: 'connection', message: 'CDP closed' }); };
  const targets = await send('Target.getTargets');
  const page = targets.targetInfos.find(t => t.type === 'page' && t.url === 'about:blank');
  assert.ok(page); report.pageTarget = page.targetId;
  mainSession = (await send('Target.attachToTarget', { targetId: page.targetId, flatten: true })).sessionId; report.mainSession = mainSession;
  for (const domain of ['Page', 'Runtime', 'Network']) await send(domain + '.enable', {}, mainSession);
  await send('Network.setCacheDisabled', { cacheDisabled: true }, mainSession);
  await send('Network.setBypassServiceWorker', { bypass: true }, mainSession);
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] }, mainSession);
  await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }, mainSession);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }, mainSession);
  await send('Page.navigate', { url: origin + '/?debugMap=1&postal=018956' }, mainSession);
  await until('selected current map', () => evaluate(facts), ready);
  report.handoffs = await until('explicit worker entry handoff', async () => workerEntryHandoffs(report.entries), h => h.confirmed.length > 0);
  check('actual map worker entry completes in its attached worker session', report.handoffs.confirmed.length === 1 && report.handoffs.unresolved.length === 0, report.handoffs);
  const confirmed = report.handoffs.confirmed[0];
  check('handoff is the expected package-version worker', confirmed.request.params.request.url === origin + '/maplibre/6.4.1/maplibre-gl-worker.mjs');
  const body = await send('Network.getResponseBody', { requestId: confirmed.request.params.requestId }, confirmed.attachment.params.sessionId);
  const bytes = Buffer.from(body.body, body.base64Encoded ? 'base64' : 'utf8');
  const expected = readFileSync(resolve(root, 'web/public/maplibre/6.4.1/maplibre-gl-worker.mjs'));
  report.workerBody = { bytes: bytes.length, sha256: hash(bytes), expectedSha256: hash(expected) };
  check('observed worker response bytes match versioned source', hash(bytes) === hash(expected), report.workerBody);
  const before = await evaluate(facts), screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, mainSession), after = await evaluate(facts);
  const png = Buffer.from(screenshot.data, 'base64'); writeFileSync(resolve(out, 'current-map.png'), png, { flag: 'wx' });
  report.capture = { before, after, bytes: png.length, sha256: hash(png) };
  check('current map remains visible across capture', ready(before) && ready(after) && before.routeKey === after.routeKey);
  check('no unexpected runtime/protocol failures or denied requests', !report.errors.length && !report.denied.length, report.errors);
} catch (e) { report.failure = e.stack; report.failureCommand = e.cdp; console.error(e.stack); }
finally {
  closing = true;
  if (ws?.readyState === 1) try { await send('Browser.close', {}, '', 5000); } catch (e) { report.closeError = e.message; }
  ws?.close(); report.cleanup = cleanup(profile); chrome?.stderr?.destroy(); chrome?.unref();
  report.anchorsAfter = anchors(); report.anchorsUnchanged = JSON.stringify(report.anchorsBefore) === JSON.stringify(report.anchorsAfter);
  report.stderr = stderr; report.elapsedMs = Date.now() - started;
  report.ok = !report.failure && !report.errors.length && !report.denied.length && report.cleanup.verified && report.anchorsUnchanged;
  report.scope = 'Current app worker lifecycle only; not retroactive classification of older traces, full network audit, performance or deployment. No pipeline/install/build or preview modifications.';
  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, ok: report.ok, checks: report.checks.length, cleanup: report.cleanup.verified }));
  process.exitCode = report.ok ? 0 : 1;
}
