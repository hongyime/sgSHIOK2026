import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createFixtureServer, BODY_SIZES, BODY_MODES } from './server.mjs';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';
import { observeWorker } from './worker-session.mjs';

const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/lifecycle-probe-20260910';
if (process.cwd() !== root) throw Error('Wrong working root');
const label = process.argv[2];
if (!/^[a-z0-9-]+$/.test(label ?? '')) throw Error('Fresh fixture label required');
const out = mkdtempSync(resolve(root, folder, label + '-'));
const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const started = Date.now(), deadline = started + 240000, workEnd = deadline - 60000;
const report = { root, host: process.env.COMPUTERNAME, out, profile, startedAt: new Date().toISOString(),
  entries: [], serverEvents: [], phases: [], checks: [], denied: [], errors: [] };
report.sources = ['browser.mjs', 'server.mjs', 'page.mjs', 'worker-session.mjs'].map(name => {
  const bytes = readFileSync(resolve(root, folder, name));
  writeFileSync(resolve(out, name), bytes, { flag: 'wx' });
  return { path: folder + '/' + name, sha256: hash(bytes) };
});
const knownAnchors = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/dependency-alignment-20260910/final-contracts-2/command.json'))).anchorsAfter;
function anchors() {
  return knownAnchors.map(item => { const actual = hash(readFileSync(resolve(root, item.path))); if (actual !== item.expected) throw Error('Protected input hash mismatch: ' + item.path + ' ' + actual); return { ...item, actual }; });
}
const sleep = ms => new Promise(done => setTimeout(done, ms));
let ws, chrome, stderr = '', sequence = 0, closing = false, mainSession, origin;
const pending = new Map(), workerSessions = new Set();
const record = entry => report.entries.push({ sequence: report.entries.length, timeMs: Date.now() - started, ...entry });
const server = createFixtureServer(entry => report.serverEvents.push({ timeMs: Date.now() - started, ...entry }));
function check(name, passed, detail) { report.checks.push({ name, passed: !!passed, detail }); console.log((passed ? 'PASS ' : 'FAIL ') + name); if (!passed) throw Error(name); }
function send(method, params = {}, sessionId = '', timeout = 20000) {
  return new Promise((done, reject) => {
    const left = (closing ? deadline : workEnd) - Date.now();
    if (left <= 0) { reject(Error('Fixture deadline')); return; }
    const id = ++sequence; record({ kind: 'send', id, method, sessionId, params });
    const timer = setTimeout(() => finish(undefined, { kind: 'timeout', message: 'CDP timeout: ' + method }), Math.min(left, timeout));
    function finish(result, error) {
      clearTimeout(timer); pending.delete(id);
      record({ kind: 'reply', id, sessionId, ...(error ? { error } : { result }) });
      error ? reject(Object.assign(Error(error.message), { cdp: { id, method, sessionId, error } })) : done(result);
    }
    pending.set(id, finish);
    try { ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }
    catch (error) { finish(undefined, { kind: 'connection', message: error.message }); }
  });
}
async function evaluate(fn, value = null) {
  const result = await send('Runtime.evaluate', { expression: '(' + fn.toString() + ')(' + JSON.stringify(value) + ')', returnByValue: true, awaitPromise: true }, mainSession);
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function until(name, get, predicate, limit = 20000) {
  const end = Math.min(workEnd, Date.now() + limit);
  while (Date.now() < end) { const value = await get(); report.last = { name, value }; if (predicate(value)) return value; await sleep(200); }
  throw Error(name + ' timeout');
}
function requestStates(path) {
  return report.entries.filter(e => e.method === 'Network.requestWillBeSent' && e.params.request.url === origin + path).map(request => {
    const matches = e => e.kind === 'event' && e.params?.requestId === request.params.requestId && e.sessionId === request.sessionId;
    return { requestId: request.params.requestId, sessionId: request.sessionId, request,
      responses: report.entries.filter(e => matches(e) && e.method === 'Network.responseReceived'),
      terminal: report.entries.filter(e => matches(e) && ['Network.loadingFinished', 'Network.loadingFailed'].includes(e.method)) };
  });
}
const paths = Object.keys(BODY_SIZES).flatMap(size => BODY_MODES.map(mode => `/body/${size}/${mode}`));
function phase(name, actions = []) {
  const value = { name, timeMs: Date.now() - started, actions, requests: paths.map(path => ({ path, states: requestStates(path) })) };
  report.phases.push(value); return value;
}
try {
  report.anchorsBefore = anchors();
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  origin = 'http://127.0.0.1:' + server.address().port; report.origin = origin;
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-sandbox', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
  report.chromePid = chrome.pid; chrome.on('error', error => report.errors.push({ launch: error.message })); chrome.stderr.on('data', bytes => { stderr += bytes; });
  const endpoint = await until('owned browser', async () => /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1], Boolean, 45000);
  ws = new WebSocket(endpoint);
  await new Promise((done, reject) => { const timer = setTimeout(() => reject(Error('CDP connection timeout')), 10000); ws.onopen = () => { clearTimeout(timer); done(); }; ws.onerror = () => { clearTimeout(timer); reject(Error('CDP connection failed')); }; });
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { pending.get(m.id)?.(m.result, m.error ? { kind: 'cdp', ...m.error } : undefined); return; }
    const p = m.params, sessionId = m.sessionId || '';
    let params = p;
    if (m.method === 'Network.requestWillBeSent') params = { requestId: p.requestId, loaderId: p.loaderId, timestamp: p.timestamp, type: p.type, request: { url: p.request.url, method: p.request.method } };
    if (m.method === 'Network.responseReceived') params = { requestId: p.requestId, type: p.type, timestamp: p.timestamp, response: { url: p.response.url, status: p.response.status } };
    if (m.method === 'Fetch.requestPaused') params = { requestId: p.requestId, networkId: p.networkId, frameId: p.frameId, resourceType: p.resourceType, request: { url: p.request.url, method: p.request.method } };
    if (m.method.startsWith('Target.') || ['Network.requestWillBeSent', 'Network.responseReceived', 'Network.loadingFinished', 'Network.loadingFailed', 'Fetch.requestPaused', 'Runtime.exceptionThrown'].includes(m.method)) record({ kind: 'event', method: m.method, sessionId, params });
    if (m.method === 'Target.attachedToTarget' && p.targetInfo.type === 'worker') {
      workerSessions.add(p.sessionId);
      void observeWorker(send, p.sessionId).catch(error => report.errors.push({ workerSetup: error.message, cdp: error.cdp }));
    }
    if (m.method === 'Runtime.exceptionThrown') report.errors.push({ runtime: p, sessionId });
    if (m.method === 'Fetch.requestPaused') {
      const url = new URL(p.request.url);
      const allowed = url.origin === origin && ['GET', 'HEAD'].includes(p.request.method) && !url.username && !url.password;
      if (!allowed) report.denied.push({ url: url.href, method: p.request.method, sessionId });
      void send(allowed ? 'Fetch.continueRequest' : 'Fetch.failRequest', allowed ? { requestId: p.requestId } : { requestId: p.requestId, errorReason: 'BlockedByClient' }, sessionId).catch(error => report.errors.push({ interception: error.message, cdp: error.cdp }));
    }
  };
  ws.onclose = () => { if (!closing) report.errors.push({ connection: 'Unexpected close' }); for (const finish of [...pending.values()]) finish(undefined, { kind: 'connection', message: 'CDP closed' }); };
  const targets = await send('Target.getTargets');
  const page = targets.targetInfos.find(t => t.type === 'page' && t.url === 'about:blank');
  check('owned blank page found', !!page); report.pageTarget = page.targetId;
  mainSession = (await send('Target.attachToTarget', { targetId: page.targetId, flatten: true })).sessionId;
  report.mainSession = mainSession;
  for (const domain of ['Page', 'Runtime', 'Network']) await send(domain + '.enable', {}, mainSession);
  await send('Network.setCacheDisabled', { cacheDisabled: true }, mainSession);
  await send('Network.setBypassServiceWorker', { bypass: true }, mainSession);
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] }, mainSession);
  await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }, mainSession);
  await send('Page.navigate', { url: origin + '/' }, mainSession);
  const pageState = await until('fixture page', () => evaluate(() => ({ ready: !!window.fixture, title: document.title })), state => state.ready);
  check('fixture title is visible', pageState.title === 'Local lifecycle fixture');
  const retained = [];
  for (const path of paths) retained.push(await evaluate(path => window.fixture.retain(path), path));
  check('six404 responses retained without consuming bodies', retained.length === 6 && retained.every(r => r.status === 404 && !r.bodyUsed && !r.locked), retained);
  await sleep(1000); phase('retained', retained);
  const consumed = [];
  for (const path of paths.filter(p => !p.endsWith('/ignored'))) consumed.push(await evaluate(path => window.fixture.consume(path, path.endsWith('/cancel') ? 'cancel' : 'drain'), path));
  await sleep(1000); phase('drained-or-canceled', consumed);
  const released = [];
  for (const path of paths.filter(p => p.endsWith('/ignored'))) released.push(await evaluate(path => window.fixture.consume(path, 'drain'), path));
  await until('body requests terminal after deliberate handling', async () => paths.map(requestStates), states => states.every(items => items.length === 1 && items[0].terminal.length === 1));
  phase('ignored-now-drained', released);
  check('all drained response lengths match fixture bytes', [...consumed, ...released].filter(r => r.action === 'drain').every(r => r.bytes === BODY_SIZES[r.path.split('/')[2]]));
  report.workerResult = await evaluate(() => window.fixture.worker());
  check('worker actually executes its module import and data fetch', report.workerResult.value === 'owned-worker-ready' && report.workerResult.data.fixture === true, report.workerResult);
  await until('worker data request completes within its worker session', async () => requestStates('/worker-data.json'), requests => requests.some(r => workerSessions.has(r.sessionId) && r.terminal.some(e => e.method === 'Network.loadingFinished')));
  report.workerSessions = [...workerSessions];
  report.workerRequests = ['/worker.mjs', '/worker-helper.mjs', '/worker-data.json'].map(path => ({ path, states: requestStates(path) }));
  report.workerEvents = report.entries.filter(e => e.kind === 'event' && (workerSessions.has(e.sessionId) || e.method.startsWith('Target.')));
  check('child worker telemetry exists independently of page events', workerSessions.size === 1 && report.workerRequests.some(r => r.states.some(s => workerSessions.has(s.sessionId))));
  await evaluate(() => { window.fixtureWorker.terminate(); });
  await until('owned worker detaches', async () => report.entries.some(e => e.method === 'Target.detachedFromTarget' && workerSessions.has(e.params.sessionId)), Boolean);
  check('no unexpected runtime, protocol or denied requests', !report.errors.length && !report.denied.length, report.errors);
} catch (error) { report.failure = error.stack; report.failureCommand = error.cdp; console.error(error.stack); }
finally {
  closing = true;
  if (ws?.readyState === 1) try { await send('Browser.close', {}, '', 5000); } catch (error) { report.closeError = error.message; }
  ws?.close(); report.cleanup = cleanup(profile);
  server.closeAllConnections(); await new Promise(done => server.close(done)); report.serverClosed = !server.listening;
  report.chromeStderr = stderr; report.elapsedMs = Date.now() - started;
  report.anchorsAfter = anchors(); report.anchorsUnchanged = JSON.stringify(report.anchorsBefore) === JSON.stringify(report.anchorsAfter);
  report.ok = !report.failure && !report.errors.length && !report.denied.length && report.cleanup.verified && report.serverClosed && report.anchorsUnchanged;
  report.limits = 'Synthetic localhost-only response/worker lifecycle experiment, not application behavior, current-lock validation, map screenshots, full browser audit or representative performance. Existing previews untouched. No pipeline/install/build/deploy.';
  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, ok: report.ok, checks: report.checks.length, elapsedMs: report.elapsedMs, cleanup: report.cleanup.verified, serverClosed: report.serverClosed }));
  process.exitCode = report.ok ? 0 : 1;
}
