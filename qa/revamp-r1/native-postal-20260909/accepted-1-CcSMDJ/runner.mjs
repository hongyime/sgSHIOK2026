import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute, sep } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [label, build, extra] = process.argv.slice(2);
if (extra || !/^[a-z0-9-]+$/.test(label || '') || !/^[A-Za-z0-9_-]+$/.test(build || '')) throw Error('Fresh label and expected build required');
const origin = 'http://127.0.0.1:4332';
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/native-postal-20260909', label + '-'));
const started = Date.now(), deadline = started + 600_000, workEnd = deadline - 60_000;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const runner = readFileSync(new URL(import.meta.url));
writeFileSync(resolve(out, 'runner.mjs'), runner, { flag: 'wx' });
const report = { root, hostname: process.env.COMPUTERNAME, out, build, startedAt: new Date().toISOString(),
  runnerSha256: sha(runner), checks: [], scenarios: [], captures: [], cleanup: {},
  policy: 'Hold actual Next script requests before native Enter/button submission; release only after the new Document retains the postal. Fresh Chrome contexts, SW/cache bypass, API requests blocked. No installs, pipeline, protected-data mutation, native clipboard, performance or deployment claim.' };
let chrome, ws, profile, sequence = 0, stderr = '', cleaning = false, fatal;
const pending = new Map(), contexts = new Map(), jobs = new Set();
const delay = ms => new Promise(done => setTimeout(done, ms));
const budget = () => { const value = (cleaning ? deadline : workEnd) - Date.now(); if (value <= 0) throw Error('QA budget exhausted'); return value; };
function check(name, pass, detail) { report.checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name); if (!pass) throw Error(name); }
function send(method, params = {}, sessionId, timeout = 30_000) {
  const ms = Math.min(timeout, budget());
  return new Promise((done, reject) => {
    const id = ++sequence, timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout ' + method)); }, ms);
    pending.set(id, { finish(value, error) { clearTimeout(timer); pending.delete(id); error ? reject(Error(error.message)) : done(value); } });
    try { ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }
    catch (error) { pending.get(id)?.finish(null, error); }
  });
}
function track(job) { const guarded = job.catch(error => { fatal ??= error; }); jobs.add(guarded); void guarded.then(() => jobs.delete(guarded)); }
async function call(c, fn, arg) {
  const value = await send('Runtime.evaluate', { expression: '(' + fn.toString() + ')(' + JSON.stringify(arg ?? null) + ')', returnByValue: true, awaitPromise: true }, c.sessionId);
  if (value.exceptionDetails) throw Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
  return value.result.value;
}
async function until(name, action, predicate = Boolean, ms = 90_000) {
  const end = Math.min(workEnd, Date.now() + ms); let value;
  while (Date.now() < end) {
    budget(); if (fatal) throw fatal;
    value = await action(); if (predicate(value)) return value;
    await delay(200);
  }
  throw Error(name + ' timed out; last=' + JSON.stringify(value));
}
function receive(message) {
  if (message.id) { pending.get(message.id)?.finish(message.result, message.error); return; }
  const c = contexts.get(message.sessionId); if (!c) return;
  const { method, params: p } = message;
  if (method === 'Network.requestWillBeSent') {
    if (c.requests.length >= 6000) throw Error('Request receipt capacity exceeded');
    c.requests.push({ id: p.requestId, url: p.request.url, method: p.request.method, type: p.type, frameId: p.frameId, loaderId: p.loaderId, at: Date.now() });
  }
  if (method === 'Network.responseReceived') c.responses[p.requestId] = { status: p.response.status, url: p.response.url, loaderId: p.loaderId };
  if (method === 'Network.loadingFinished') c.finished.add(p.requestId);
  if (method === 'Network.loadingFailed') c.failed.push({ id: p.requestId, error: p.errorText, canceled: p.canceled ?? false });
  if (method === 'Runtime.exceptionThrown') c.errors.push({ kind: 'exception', detail: p.exceptionDetails });
  if (method === 'Runtime.consoleAPICalled' && p.type === 'error') c.errors.push({ kind: 'console-error', args: p.args });
  if (method === 'Log.entryAdded') c.logs.push(p.entry);
  if (method === 'Runtime.bindingCalled' && p.name === '__qaPostalEvent') c.pageEvents.push(JSON.parse(p.payload));
  if (method === 'Fetch.requestPaused') {
    const value = { id: p.requestId, networkId: p.networkId, url: p.request.url, at: Date.now() };
    if (new URL(p.request.url).pathname.startsWith('/api/')) {
      c.api.push(value); track(send('Fetch.failRequest', { requestId: p.requestId, errorReason: 'BlockedByClient' }, c.sessionId));
    } else if (c.hold) { c.paused.set(p.requestId, value); c.held.push(value); }
    else track(send('Fetch.continueRequest', { requestId: p.requestId }, c.sessionId));
  }
}
function facts() {
  const input = document.querySelector('#postal-search-input'), form = input?.form;
  const summary = document.querySelector('[aria-label="Walk summary"]');
  const rect = node => { const r = node?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom } : null; };
  const metricValues = {};
  for (const item of summary?.querySelectorAll('strong') ?? []) {
    const key = item.parentElement.querySelector('span')?.textContent.trim();
    if (['Walk distance', 'Covered', 'Uncovered', 'Longest gap'].includes(key)) metricValues[key] = item.textContent.trim();
  }
  const map = window.__shiokRouteMap, debug = window.__shiokRouteDebug;
  let count = 0, tiles = false, moving = true;
  if (map?.getLayer('shiokest-route-line')) count = map.queryRenderedFeatures({ layers: ['shiokest-route-line'] }).filter(f => f.properties?.render_key === debug?.routeKey).length;
  if (map) { tiles = map.areTilesLoaded(); moving = map.isMoving(); }
  return { url: location.href, timeOrigin: performance.timeOrigin, input: input?.value ?? null, inputBounds: rect(input), busy: form?.getAttribute('aria-busy'),
    hydrated: !!input && Object.keys(input).some(k => k.startsWith('__reactProps$') && typeof input[k]?.onChange === 'function'),
    form: form ? { action: form.getAttribute('action'), method: form.method, name: input.name, required: input.required, pattern: input.pattern, type: input.type } : null,
    postal: summary?.getAttribute('data-postal'), metrics: metricValues, count, routeKey: debug?.routeKey, tiles, moving,
    status: document.querySelector('main')?.dataset.mapStatus, stack: rect(document.querySelector('[data-map-overlay="top-left"]')),
    panel: rect(document.querySelector('aside')), dock: rect(document.querySelector('footer')), width: innerWidth, height: innerHeight };
}
const healthy = f => f.postal === '018956' && f.input === '018956' && f.busy === 'false' && f.status === 'ready' && f.count === 4 && f.routeKey && f.tiles && !f.moving
  && Object.entries({ 'Walk distance': '81 m', Covered: '55%', Uncovered: '37 m', 'Longest gap': '20 m' }).every(([key, value]) => f.metrics[key] === value);
async function create(name, width) {
  const { browserContextId } = await send('Target.createBrowserContext', { disposeOnDetach: true });
  const { targetId } = await send('Target.createTarget', { browserContextId, url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const c = { name, sessionId, browserContextId, hold: true, paused: new Map(), finished: new Set(),
    held: [], released: [], requests: [], responses: {}, failed: [], errors: [], logs: [], pageEvents: [], api: [], documents: [] };
  contexts.set(sessionId, c); report.scenarios.push(c);
  for (const domain of ['Page', 'Runtime', 'Network', 'Log']) await send(domain + '.enable', {}, sessionId);
  await send('Runtime.addBinding', { name: '__qaPostalEvent' }, sessionId);
  await send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId);
  await send('Network.setBypassServiceWorker', { bypass: true }, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width, height: width === 320 ? 667 : 844, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
    const report = (kind, detail) => window.__qaPostalEvent(JSON.stringify({kind,detail,url:location.href,timeOrigin:performance.timeOrigin}));
    report('document-start', null);
    addEventListener('error', e => { if(e.target===window)report('window-error',e.message); }, true);
    addEventListener('unhandledrejection', e => report('unhandled',String(e.reason)));
    if(navigator.serviceWorker) Object.defineProperty(navigator.serviceWorker,'register',{value:async()=>({active:null,installing:null,waiting:null,addEventListener(){}})});
  })();` }, sessionId);
  await send('Fetch.enable', { patterns: [
    { urlPattern: origin + '/_next/static/*', resourceType: 'Script', requestStage: 'Request' },
    { urlPattern: '*://*/api/*', requestStage: 'Request' },
  ] }, sessionId);
  return c;
}
async function documentIdentity(c) {
  const frame = (await send('Page.getFrameTree', {}, c.sessionId)).frameTree.frame;
  const request = await until('finished main HTML', async () => c.requests.find(r => r.type === 'Document' && r.frameId === frame.id && r.loaderId === frame.loaderId && c.finished.has(r.id)));
  check(c.name + ' main HTML HTTP200', c.responses[request.id]?.status === 200);
  const result = await send('Network.getResponseBody', { requestId: request.id }, c.sessionId);
  const html = Buffer.from(result.body, result.base64Encoded ? 'base64' : 'utf8');
  const path = resolve(out, c.name + '-document-' + c.documents.length + '.html');
  writeFileSync(path, html, { flag: 'wx' });
  const identity = { request, frameId: frame.id, loaderId: frame.loaderId, bytes: html.length, sha256: sha(html), path, buildPresent: html.includes(Buffer.from(build)) };
  c.documents.push(identity); check(c.name + ' exact build in actual HTML', identity.buildPresent);
  return identity;
}
async function pressEnter(c) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r', windowsVirtualKeyCode: 13 }, c.sessionId);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }, c.sessionId);
}
async function clickSubmit(c) {
  const point = await call(c, () => { const r = document.querySelector('#postal-search-button').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 }, c.sessionId);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 }, c.sessionId);
}
async function capture(c, name, accepted = healthy) {
  const before = await until(name + ' stable selected result', () => call(c, facts), accepted);
  const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, c.sessionId);
  const after = await call(c, facts);
  const bytes = Buffer.from(image.data, 'base64'), path = resolve(out, name + '.png');
  writeFileSync(path, bytes, { flag: 'wx' });
  report.captures.push({ name, path, bytes: bytes.length, sha256: sha(bytes), before, after });
  check(name + ' screenshot bracket matches', accepted(after) && before.timeOrigin === after.timeOrigin && before.routeKey === after.routeKey);
  check(name + ' approved equal-width top-left layout', after.panel?.y > after.inputBounds.bottom && Math.abs(after.panel.width - after.inputBounds.width) < 2 && after.dock.right <= after.width && after.dock.x > after.width / 2);
}
async function releaseScripts(c) {
  c.hold = false;
  for (const [id, request] of c.paused) {
    c.paused.delete(id);
    try { await send('Fetch.continueRequest', { requestId: id }, c.sessionId); c.released.push({ ...request, result: 'continued' }); }
    catch (error) {
      const canceled = c.failed.some(f => f.id === request.networkId && f.canceled);
      c.released.push({ ...request, result: 'error', message: error.message, canceled });
      if (!canceled) throw error;
    }
  }
}
async function run(c, mode) {
  await send('Page.navigate', { url: origin + '/?postal=018955&transit=mrt_lrt&route=both' }, c.sessionId);
  const before = await until('SSR form with blocked scripts', () => call(c, facts), f => !!f.form && !f.hydrated && c.held.length > 0);
  check(mode + ' real application scripts held before interaction', !before.hydrated && c.held.length > 0, { held: c.held.length, before });
  await documentIdentity(c);
  const docs = () => c.requests.filter(r => r.type === 'Document');
  for (const invalid of ['', '12345', 'abcdef', '1234567']) {
    const valid = await call(c, value => { const i = document.querySelector('#postal-search-input'); i.value = value; i.focus(); return i.checkValidity(); }, invalid);
    check(mode + ' rejects invalid native postal ' + JSON.stringify(invalid), !valid);
    const count = docs().length; await clickSubmit(c); await delay(150);
    check(mode + ' invalid input does not navigate ' + JSON.stringify(invalid), docs().length === count);
  }
  await call(c, () => { const i = document.querySelector('#postal-search-input'); i.value = ''; i.focus(); });
  await send('Input.insertText', { text: '018956' }, c.sessionId);
  const entered = await call(c, facts);
  check(mode + ' typed exact leading-zero postal before hydration', entered.input === '018956' && !entered.hydrated);
  const count = docs().length;
  if (mode === 'enter') await pressEnter(c); else await clickSubmit(c);
  await until('native postal Document request', async () => docs().length === count + 1);
  const next = await until('new SSR Document retains native postal', () => call(c, facts), f => f.timeOrigin !== before.timeOrigin && f.url === origin + '/?postal=018956' && !!f.form);
  check(mode + ' native GET preserves only the new postal', docs().at(-1).method === 'GET' && next.url === origin + '/?postal=018956' && !next.hydrated, docs().at(-1));
  await documentIdentity(c);
  await releaseScripts(c);
  await capture(c, mode + '-native-recovered');
  const loaded = await call(c, facts), documentsBefore = docs().length;
  check(mode + ' native arrival introduces no extra Documents or live APIs', docs().length === count + 1 && c.api.length === 0);
  await call(c, () => { const i = document.querySelector('#postal-search-input'); i.focus(); i.select(); });
  await send('Input.insertText', { text: '079908' }, c.sessionId);
  await pressEnter(c);
  // A different real fixture record prevents the previous successful route from
  // making a dropped Enter event look like an accepted hydrated submission.
  await capture(c, mode + '-hydrated-submit', f => f.postal === '079908' && f.input === '079908' && f.busy === 'false'
    && new URL(f.url).searchParams.get('postal') === '079908' && f.count === 0 && f.tiles && !f.moving
    && ['Walk distance', 'Covered', 'Uncovered', 'Longest gap'].every(key => f.metrics[key] === 'Unavailable'));
  const after = await call(c, facts);
  check(mode + ' hydrated submit does not reload or call live API', after.timeOrigin === loaded.timeOrigin && docs().length === documentsBefore && c.api.length === 0);
  check(mode + ' no POST requests', c.requests.every(r => r.method !== 'POST'));
  check(mode + ' no runtime or persistent page errors', c.errors.length === 0 && c.pageEvents.every(e => e.kind === 'document-start'));
  await send('Target.disposeBrowserContext', { browserContextId: c.browserContextId }); c.disposed = true;
}
async function boundary(c) {
  await send('Page.navigate', { url: origin + '/' }, c.sessionId);
  await until('boundary SSR script hold', () => call(c, facts), f => !!f.form && !f.hydrated && c.held.length > 0);
  await documentIdentity(c);
  await call(c, () => document.querySelector('#postal-search-input').focus());
  await send('Input.insertText', { text: '018956' }, c.sessionId);
  const typed = await call(c, facts);
  check('boundary value typed before React handler exists', typed.input === '018956' && !typed.hydrated);
  await releaseScripts(c);
  const hydrated = await until('boundary handler attached', () => call(c, facts), f => f.hydrated);
  check('hydration preserves input typed before it', hydrated.input === '018956' && hydrated.timeOrigin === typed.timeOrigin, hydrated);
  // No input/change event is dispatched after hydration; only the actual Enter key.
  await pressEnter(c);
  await capture(c, 'hydration-boundary-submit');
  check('boundary submit has one Document and no API or POST', c.requests.filter(r => r.type === 'Document').length === 1 && c.requests.every(r => r.method !== 'POST') && c.api.length === 0);
  await send('Target.disposeBrowserContext', { browserContextId: c.browserContextId }); c.disposed = true;
}
try {
  const response = await fetch(origin + '/__qa/status', { signal: AbortSignal.timeout(5000) });
  const status = await response.json(); report.preview = { build: status.build, snapshot: status.snapshot, pid: status.pid, nextPid: status.nextPid, mode: status.mode };
  check('correct clear preview build', response.ok && status.build === build && status.mode === 'clear');
  const snapshot = realpathSync(status.snapshot), part = relative(realpathSync(resolve(root, 'tmp')), snapshot);
  check('preview snapshot within repository tmp', part !== '..' && !part.startsWith('..' + sep) && !isAbsolute(part));
  check('actual preview BUILD_ID matches', readFileSync(resolve(snapshot, '.next/BUILD_ID'), 'utf8').trim() === build);
  profile = mkdtempSync(resolve(root, 'tmp/native-postal-browser-')); report.profile = profile;
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
  report.chromePid = chrome.pid; chrome.on('error', e => { fatal = e; });
  chrome.stderr.on('data', value => { stderr += value; if (stderr.length > 1_000_000) fatal = Error('stderr capacity exceeded'); });
  const endpoint = await until('owned browser startup', async () => /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1], Boolean, 40_000);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(endpoint).hostname)) throw Error('Non-local CDP endpoint');
  ws = new WebSocket(endpoint);
  ws.onmessage = e => { try { receive(JSON.parse(e.data)); } catch (error) { fatal ??= error; } };
  await new Promise((done, reject) => { const timer = setTimeout(() => reject(Error('Websocket startup timeout')), 10_000); ws.onopen = () => { clearTimeout(timer); done(); }; ws.onerror = () => { clearTimeout(timer); reject(Error('Websocket failed')); }; });
  ws.onclose = () => { if (!cleaning) fatal ??= Error('Unexpected CDP close'); for (const p of [...pending.values()]) p.finish(null, { message: 'CDP closed' }); };
  for (const [mode, width] of [['enter', 390], ['button', 320]]) await run(await create(mode, width), mode);
  await boundary(await create('hydration-boundary', 390));
} catch (error) { report.failure = error.stack; console.error(error.stack); }
finally {
  cleaning = true;
  if (ws?.readyState === WebSocket.OPEN) try { await send('Browser.close', {}, undefined, 5000); } catch (e) { report.cleanup.closeError = e.message; }
  if (chrome) { const end = Math.min(deadline - 35_000, Date.now() + 15_000); while (Date.now() < end && chrome.exitCode === null && chrome.signalCode === null) await delay(200); }
  if (profile) {
    const command = "$ErrorActionPreference='Stop'; $profile='" + profile.replaceAll("'", "''") + "'; function Owned { @(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($profile) }) }; $before=@(Owned | Select-Object ProcessId,Name,CommandLine); foreach($p in @(Owned)){ $live=Get-Process -Id $p.ProcessId -ErrorAction SilentlyContinue; if($live -and -not $live.HasExited){Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue} }; $remaining=@(Owned | Where-Object { $p=Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; $p -and -not $p.HasExited }); @{before=$before;remaining=@($remaining | Select-Object ProcessId,Name,CommandLine)} | ConvertTo-Json -Depth 4 -Compress";
    const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { cwd: root, windowsHide: true, encoding: 'utf8', timeout: Math.max(1, Math.min(30_000, deadline - Date.now())) });
    report.cleanup.audit = { command, exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
    try { report.cleanup.verified = result.status === 0 && JSON.parse(result.stdout).remaining.length === 0; } catch { report.cleanup.verified = false; }
  } else report.cleanup.verified = !chrome;
  ws?.close(); for (const p of [...pending.values()]) p.finish(null, { message: 'QA ended' });
  await Promise.all([...jobs]);
  report.stderr = stderr; report.asyncFailure = fatal?.stack; report.elapsedMs = Date.now() - started; report.finishedAt = new Date().toISOString();
  report.ok = !report.failure && !fatal && report.checks.every(c => c.pass) && report.scenarios.length === 3 && report.scenarios.every(c => c.disposed && !c.api.length && !c.errors.length && c.pageEvents.every(e => e.kind === 'document-start')) && report.cleanup.verified;
  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, (key, value) => value instanceof Set ? [...value] : value instanceof Map ? [...value.values()] : value, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, ok: report.ok, checks: report.checks.length, captures: report.captures.length, elapsedMs: report.elapsedMs, cleanup: report.cleanup.verified }));
  process.exit(report.ok ? 0 : 1);
}
