import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';
import { isOneMapTile, summarizeTransport } from './transport.mjs';

const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/request-audit-20260910';
if (process.cwd() !== root) throw Error('Wrong working root');
const label = process.argv[2];
if (!/^[a-z0-9-]+$/.test(label ?? '')) throw Error('Fresh diagnostic label required');
const origin = 'http://127.0.0.1:4354';
const build = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/cached-release-20260908/cross-feature-motion-20260910-2/build.json')));
if (build.buildId !== 'jNTP8fdVgYwcHrBSMHG0l' || build.snapshot !== resolve(root, 'tmp/cached-release-cross-feature-motion-20260910-2')) throw Error('Unexpected pinned build');
const out = mkdtempSync(resolve(root, folder, label + '-'));
const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { root, host: process.env.COMPUTERNAME, origin, out, profile, build: build.buildId,
  startedAt: new Date().toISOString(), checks: [], captures: [], denied: [], entries: [] };
for (const name of ['browser.mjs', 'transport.mjs']) writeFileSync(resolve(out, name), readFileSync(resolve(root, folder, name)), { flag: 'wx' });
const knownAnchors = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/dependency-alignment-20260910/final-contracts-2/command.json'))).anchorsAfter;
function anchors() {
  return knownAnchors.map(item => {
    const actual = sha(readFileSync(resolve(root, item.path)));
    if (actual !== item.expected) throw Error('Protected input hash mismatch: ' + item.path + ' ' + actual);
    return { ...item, actual };
  });
}
const start = Date.now(), end = start + 540000, workEnd = end - 75000;
const delay = ms => new Promise(done => setTimeout(done, ms));
let chrome, ws, stderr = '', closing = false, holdTiles = false, id = 0, ledgerSealed = false;
const pending = new Map(), commands = new Map(), held = [];
function record(entry) {
  if (!ledgerSealed) report.entries.push({ sequence: report.entries.length, timeMs: Date.now() - start, ...entry });
}
function check(name, ok, detail) { report.checks.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) throw Error(name); }
function send(method, params = {}, limit = 30000) {
  return new Promise((done, reject) => {
    const remaining = (closing ? end : workEnd) - Date.now();
    if (remaining <= 0) { reject(Error('Diagnostic deadline')); return; }
    const commandId = ++id, command = { kind: 'send', id: commandId, method, params };
    commands.set(commandId, command);
    if (method.startsWith('Fetch.')) record(command);
    const timer = setTimeout(() => finish(undefined, { kind: 'timeout', message: 'CDP timeout ' + method }), Math.min(limit, remaining));
    function finish(result, error) {
      clearTimeout(timer); pending.delete(commandId);
      if (method.startsWith('Fetch.')) record({ kind: 'reply', id: commandId, fetchCommand: /Request$/.test(method), ...(error ? { error } : {}) });
      error ? reject(Object.assign(Error(error.message), { diagnostic: { commandId, method, error } })) : done(result);
    }
    pending.set(commandId, finish);
    try { ws.send(JSON.stringify({ id: commandId, method, params })); }
    catch (error) { finish(undefined, { kind: 'connection', message: error.message }); }
  });
}
async function evaluate(fn, arg = null) {
  const result = await send('Runtime.evaluate', { expression: '(' + fn.toString() + ')(' + JSON.stringify(arg) + ')', returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function until(name, get, predicate, limit = 90000) {
  const stop = Math.min(workEnd, Date.now() + limit);
  while (Date.now() < stop) { const value = await get(); report.lastSample = { name, value }; if (predicate(value)) return value; await delay(250); }
  throw Error(name + ' timeout');
}
function facts() {
  const map = window.__shiokRouteMap, debug = window.__shiokRouteDebug;
  let features = []; try { features = map?.queryRenderedFeatures({ layers: ['shiokest-route-line'] }) || []; } catch {}
  return { url: location.href, status: document.querySelector('main')?.dataset.mapStatus,
    routeKey: debug?.routeKey, featureCount: features.filter(f => f.properties?.render_key === debug?.routeKey).length,
    keys: [...new Set(features.map(f => f.properties?.render_key))], moving: map?.isMoving(),
    basemap: !!map?.getSource('onemap') && map.isSourceLoaded('onemap'), tiles: map?.areTilesLoaded(),
    center: map?.getCenter().toArray(), zoom: map?.getZoom(), viewport: [innerWidth, innerHeight],
    postalInput: document.querySelector('input[aria-label="Enter 6-digit Singapore postal code"]')?.getAttribute('aria-label') };
}
const ready = f => f.status === 'ready' && f.basemap && f.tiles && !f.moving && f.featureCount > 0 && f.keys.length === 1 && f.keys[0] === f.routeKey;
async function capture(name) {
  await until(name + ' ready', () => evaluate(facts), ready);
  const before = await evaluate(facts), result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }), after = await evaluate(facts);
  const bytes = Buffer.from(result.data, 'base64');
  writeFileSync(resolve(out, name + '.png'), bytes, { flag: 'wx' });
  report.captures.push({ name, sha256: sha(bytes), bytes: bytes.length, before, after });
  check(name + ' has current route before and after screenshot', ready(before) && ready(after) && before.routeKey === after.routeKey, { before, after });
}
try {
  report.anchorsBefore = anchors();
  report.snapshotSources = build.sources.map(source => {
    const current = readFileSync(resolve(root, source.path));
    const expected = source.path === 'web/next.config.js' ? build.generatedConfigSha256
      : source.path === 'web/next-env.d.ts' && sha(current) === source.sha256 ? sha(Buffer.from(current.toString().replaceAll('./.next/dev/types/', './.next/types/'))) : source.sha256;
    return { ...source, current: sha(current), snapshot: sha(readFileSync(resolve(build.snapshot, source.path))), expected };
  });
  check('pinned old snapshot identities match', report.snapshotSources.every(s => s.snapshot === s.expected));
  const runtimeSources = report.snapshotSources.filter(s => /^web\/(app|components|lib)\//.test(s.path) && !s.path.includes('/__tests__/'));
  check('application runtime source remains identical to old build', runtimeSources.length > 0 && runtimeSources.every(s => s.current === s.sha256));
  report.currentDifferences = report.snapshotSources.filter(s => s.current !== s.sha256);
  const response = await fetch(origin + '/__qa/status', { signal: AbortSignal.timeout(5000) });
  const { nonce, ...preview } = await response.json(); report.preview = preview;
  check('live preview identifies pinned old build', response.ok && preview.buildB === build.buildId);
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
  report.chromePid = chrome.pid; chrome.on('error', error => { report.launchError = error.message; }); chrome.stderr.on('data', data => { stderr += data; });
  const endpoint = await until('owned browser', async () => /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1], Boolean, 45000);
  const tabs = await (await fetch('http://' + new URL(endpoint).host + '/json', { signal: AbortSignal.timeout(5000) })).json();
  ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((done, reject) => { const timer = setTimeout(() => reject(Error('CDP handshake timeout')), 15000); ws.onopen = () => { clearTimeout(timer); done(); }; ws.onerror = () => { clearTimeout(timer); reject(Error('CDP handshake failed')); }; });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const finish = pending.get(message.id);
      if (finish) finish(message.result, message.error ? { kind: 'cdp', ...message.error } : undefined);
      else if (commands.get(message.id)?.method.startsWith('Fetch.')) record({ kind: 'reply', id: message.id, fetchCommand: true, late: true, error: { kind: 'late_reply', ...message.error } });
      return;
    }
    const p = message.params;
    if (message.method === 'Network.requestWillBeSent') record({ kind: 'event', method: message.method, params: { requestId: p.requestId, loaderId: p.loaderId, timestamp: p.timestamp, type: p.type, request: { url: p.request.url, method: p.request.method }, ...(p.redirectResponse ? { redirectResponse: { status: p.redirectResponse.status, url: p.redirectResponse.url } } : {}) } });
    else if (message.method === 'Network.responseReceived') record({ kind: 'event', method: message.method, params: { requestId: p.requestId, timestamp: p.timestamp, type: p.type, response: { status: p.response.status, url: p.response.url } } });
    else if (['Network.loadingFailed', 'Network.loadingFinished', 'Runtime.exceptionThrown'].includes(message.method)) record({ kind: 'event', method: message.method, params: p });
    else if (message.method === 'Fetch.requestPaused') {
      const params = { ...p, request: { url: p.request.url, method: p.request.method } }; delete params.responseHeaders;
      record({ kind: 'event', method: message.method, params });
      const url = new URL(p.request.url), local = url.origin === origin && !url.pathname.startsWith('/api/');
      const logo = url.href === 'https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png';
      const allowed = ['GET', 'HEAD'].includes(p.request.method) && !url.username && !url.password && (local || isOneMapTile(url.href) || logo);
      if (!allowed) { report.denied.push({ url: url.href, method: p.request.method }); void send('Fetch.failRequest', { requestId: p.requestId, errorReason: 'BlockedByClient' }).catch(() => {}); }
      else if (holdTiles && isOneMapTile(url.href)) held.push(params);
      else void send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    }
  };
  ws.onclose = () => { if (!closing) record({ kind: 'connectionFault', message: 'CDP closed unexpectedly' }); for (const finish of [...pending.values()]) finish(undefined, { kind: 'connection', message: 'CDP closed' }); };
  for (const domain of ['Page', 'Runtime', 'Network']) await send(domain + '.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true }); await send('Network.setBypassServiceWorker', { bypass: true });
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: origin + '/?debugMap=1' });
  await until('initial basemap and search', () => evaluate(facts), f => f.basemap && f.tiles && f.postalInput);
  const documentEvent = report.entries.find(e => e.method === 'Network.responseReceived' && e.params.type === 'Document');
  const body = await send('Network.getResponseBody', { requestId: documentEvent.params.requestId });
  const html = Buffer.from(body.body, body.base64Encoded ? 'base64' : 'utf8');
  writeFileSync(resolve(out, 'document.html'), html, { flag: 'wx' });
  check('HTML independently pins old build', html.includes(Buffer.from(build.buildId)));
  await evaluate(() => document.querySelector('input[aria-label="Enter 6-digit Singapore postal code"]').focus());
  await send('Input.insertText', { text: '018956' });
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await capture('before-cancellation-390x844');
  const original = await evaluate(facts); holdTiles = true;
  await evaluate(() => window.__shiokRouteMap.panBy([900, 600], { duration: 0 }));
  await until('held new raster requests', async () => held.length, n => n > 0, 15000);
  await evaluate(camera => window.__shiokRouteMap.jumpTo({ center: camera.center, zoom: camera.zoom }), original);
  await until('browser cancels held offscreen tiles', async () => report.entries.filter(e => e.method === 'Network.loadingFailed' && e.params.canceled === true && held.some(p => p.networkId === e.params.requestId)).length, n => n > 0, 15000);
  holdTiles = false; report.heldTiles = [...held];
  for (const pause of held.splice(0)) { try { await send('Fetch.continueRequest', { requestId: pause.requestId }); } catch { /* Fault remains in the ledger and must be classified. */ } }
  await capture('after-cancellation-390x844');
  const after = await evaluate(facts); check('same selected route survives cancellation probe', after.routeKey === original.routeKey, { original, after });
  let stable = 0;
  await until('terminal network ledger', async () => summarizeTransport(report.entries), audit => {
    const settled = !audit.pendingCommands.length && !audit.pendingNetworkRequests.length && !audit.unfinishedPauses.length;
    stable = settled ? stable + 1 : 0; return stable >= 4;
  }, 20000);
  report.transport = summarizeTransport(report.entries);
  check('canceled interception fault was reproduced with exact identities', report.transport.explainedCanceledTileCommands.length > 0);
  check('page transport audit has no unexplained failures', report.transport.ok && !report.denied.length);
} catch (error) {
  report.failure = error.stack; console.error(error.stack);
  if (ws?.readyState === 1) try { const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, 10000); writeFileSync(resolve(out, 'failure.png'), Buffer.from(shot.data, 'base64'), { flag: 'wx' }); } catch (error) { report.captureError = error.message; }
} finally {
  report.transport = summarizeTransport(report.entries); ledgerSealed = true; closing = true;
  if (ws?.readyState === 1) try { await send('Browser.close', {}, 5000); } catch (error) { report.closeError = error.message; }
  ws?.close(); report.cleanup = cleanup(profile); report.chromeStderr = stderr;
  report.anchorsAfter = anchors(); report.anchorsUnchanged = JSON.stringify(report.anchorsBefore) === JSON.stringify(report.anchorsAfter);
  report.elapsedMs = Date.now() - start;
  report.ok = !report.failure && report.transport.ok && !report.denied.length && report.cleanup.verified && report.anchorsUnchanged;
  report.limits = 'One old pinned local build, one owned page CDP target, deliberate held offscreen tile cancellation at390x844, SwiftShader. Not current-lock acceptance, physical-device timing, full browser/worker network coverage or retroactive classification of the old five faults. No pipeline/install/build/deploy.';
  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, ok: report.ok, checks: report.checks.length, explained: report.transport.explainedCanceledTileCommands.length, cleanup: report.cleanup.verified }));
  process.exitCode = report.ok ? 0 : 1;
}
