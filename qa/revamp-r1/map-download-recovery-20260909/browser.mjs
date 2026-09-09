import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [label, build, scenarioSet = 'all', extra] = process.argv.slice(2);
if (extra || !['all', 'rejections'].includes(scenarioSet) || !/^[a-z0-9-]{1,60}$/.test(label || '') || !/^[\w-]{1,100}$/.test(build || '')) throw Error('Fresh label, expected build and optional rejections scope required');
const started = Date.now(), overallDeadline = started + 600_000, workDeadline = overallDeadline - 75_000;
const origin = 'http://127.0.0.1:4328';
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/map-download-recovery-20260909', label + '-'));
const runner = readFileSync(new URL(import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
writeFileSync(resolve(out, 'runner.mjs'), runner, { flag: 'wx' });
const report = {
  root, hostname: process.env.COMPUTERNAME, out, build, scenarioSet, startedAt: new Date(started).toISOString(),
  runner: { path: resolve(out, 'runner.mjs'), bytes: runner.length, sha256: sha(runner) },
  limits: { overallMs: 600_000, cleanupReserveMs: 75_000, browserStartupMs: 40_000, cdpMs: 45_000, appWaitMs: 90_000, heldRequestMs: 180_000 },
  policy: 'One owned Chromium/SwiftShader process, one fresh browser context per requested scenario, real implementation-chunk faults. Network.setBypassServiceWorker=true and Network.setCacheDisabled=true throughout: NO service-worker upgrade or service-worker cache recovery coverage. Page-target data settlement waits for successful response bodies; HTTP error headers settle rejected reads because data.ts does not consume those bodies. This is not complete network/worker accounting, physical-device evidence or representative latency. No pipeline, install, deployment or API calls.',
  networkIntervention: { serviceWorkerBypass: true, cacheDisabled: true, serviceWorkerUpgradeCoverage: false },
  checks: [], scenarios: [], network: [], errors: [], asyncErrors: [], captures: [], cleanup: {}, overflow: [],
};
let chrome, ws, profile, sequence = 0, stderr = '', transportError, asyncError, cleaning = false;
const pending = new Map(), sessions = new Map(), eventTasks = new Set();
const delay = ms => new Promise(done => setTimeout(done, ms));
const asError = error => error instanceof Error ? error : Error(String(error));
const textError = error => asError(error).stack;
function within(path, base) {
  const part = relative(base, path);
  if (part === '..' || part.startsWith('..' + sep) || isAbsolute(part)) throw Error('Path outside permitted root: ' + path);
  return path;
}
function remaining(end = workDeadline) {
  const ms = end - Date.now();
  if (ms <= 0) throw Error('Wall-clock budget exhausted');
  return ms;
}
function check(name, pass, detail = null) {
  report.checks.push({ name, pass: !!pass, detail });
  console.log((pass ? 'PASS ' : 'FAIL ') + name);
  if (!pass) throw Error('Acceptance failed: ' + name);
}
function append(list, value, cap, name) {
  if (list.length >= cap) {
    if (!report.overflow.includes(name)) report.overflow.push(name);
    asyncError ??= Error('Receipt capacity exceeded: ' + name);
    return;
  }
  list.push(value);
}
function health() {
  remaining();
  if (transportError) throw transportError;
  if (asyncError) throw asyncError;
}
async function send(method, params = {}, sessionId, timeoutMs = 45_000, end = cleaning ? overallDeadline : workDeadline) {
  const budget = Math.min(timeoutMs, remaining(end));
  if (!ws || ws.readyState !== WebSocket.OPEN) return Promise.reject(Error('CDP socket is not open: ' + method));
  return new Promise((done, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, budget);
    pending.set(id, {
      done(value) { clearTimeout(timer); pending.delete(id); done(value); },
      reject(error) { clearTimeout(timer); pending.delete(id); reject(error); },
    });
    try { ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }
    catch (error) { pending.get(id)?.reject(error); }
  });
}
async function call(context, fn, arg, end = workDeadline) {
  const result = await send('Runtime.evaluate', {
    expression: '(' + fn.toString() + ')(' + JSON.stringify(arg ?? null) + ')', returnByValue: true, awaitPromise: true,
  }, context.sessionId, 45_000, end);
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
function trackEvent(task) {
  const caught = task.catch(error => {
    append(report.asyncErrors, { at: Date.now(), error: textError(error) }, 100, 'asyncErrors');
    if (!cleaning) asyncError ??= asError(error);
  });
  eventTasks.add(caught);
  void caught.then(() => eventTasks.delete(caught));
}
async function boundedJson(url, end = workDeadline) {
  const response = await fetch(url, { signal: AbortSignal.timeout(Math.min(15_000, remaining(end))) });
  if (!response.ok) throw Error('Preview status HTTP ' + response.status);
  return response.json();
}

function discoverChunks(snapshot) {
  if (typeof snapshot !== 'string') throw Error('Preview status has no snapshot path');
  const safeSnapshot = within(realpathSync(within(resolve(snapshot), resolve(root, 'tmp'))), realpathSync(resolve(root, 'tmp')));
  check('snapshot BUILD_ID matches expected build', readFileSync(resolve(safeSnapshot, '.next/BUILD_ID'), 'utf8').trim() === build);
  const directory = within(realpathSync(resolve(safeSnapshot, '.next/static/chunks')), safeSnapshot);
  const markers = {
    component: ['route-map-summary', 'shiokest-route-line', 'active-exposure-section-casing'],
    library: ['maplibre_preloaded_worker_pool', 'Style is not done loading.', 'maplibregl-cooperative-gesture-screen'],
  };
  const matches = { component: [], library: [] };
  let count = 0, totalBytes = 0;
  const scanStarted = Date.now();
  function visit(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      health();
      if (entry.isSymbolicLink()) throw Error('Unexpected symlink in built chunks');
      const file = within(resolve(path, entry.name), directory);
      if (entry.isDirectory()) { visit(file); continue; }
      if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
      const bytes = readFileSync(file), text = bytes.toString('utf8');
      count++; totalBytes += bytes.length;
      for (const [kind, required] of Object.entries(markers)) {
        if (required.every(marker => text.includes(marker))) matches[kind].push({
          path: file, bytes: bytes.length, sha256: sha(bytes), markers: required,
          urlPath: '/_next/static/chunks/' + relative(directory, file).split(sep).map(encodeURIComponent).join('/'),
        });
      }
    }
  }
  visit(directory);
  report.chunkDiscovery = { snapshot: safeSnapshot, directory, files: count, totalBytes, elapsedMs: Date.now() - scanStarted, matches };
  for (const kind of ['component', 'library']) {
    check(kind + ' implementation chunk is unique', matches[kind].length === 1, matches[kind]);
    check(kind + ' match is not a tiny re-export wrapper', matches[kind][0].bytes >= 4_096, matches[kind][0]);
  }
  check('component and library implementations are distinct', matches.component[0].path !== matches.library[0].path);
  return { component: matches.component[0], library: matches.library[0] };
}

// Installed before app scripts; captures short-lived stage changes that polling can miss.
function stageRecorder() {
  window.__qaStages = [];
  window.__qaUnhandled = [];
  window.__qaStageOverflow = false;
  let previous;
  const record = () => {
    const main = document.querySelector('main');
    if (!main) return;
    const value = { status: main.dataset.mapStatus ?? null, stage: main.dataset.mapStage ?? null, reason: main.dataset.mapFailure ?? null };
    const key = JSON.stringify(value);
    if (key === previous) return;
    previous = key;
    if (window.__qaStages.length >= 1_000) { window.__qaStageOverflow = true; return; }
    window.__qaStages.push({ ...value, performanceMs: performance.now(), wallMs: Date.now() });
  };
  new MutationObserver(record).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-map-status', 'data-map-stage', 'data-map-failure'] });
  window.addEventListener('unhandledrejection', event => {
    if (window.__qaUnhandled.length >= 100) { window.__qaStageOverflow = true; return; }
    window.__qaUnhandled.push({ at: Date.now(), reason: String(event.reason), stack: event.reason?.stack ?? null });
  });
}
function facts() {
  const main = document.querySelector('main'), input = document.querySelector('#postal-search-input');
  const submit = document.querySelector('#postal-search-button'), summary = document.querySelector('[aria-label="Walk summary"]');
  const rect = node => { const r = node?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom } : null; };
  const usable = node => {
    const r = rect(node);
    return !!node && !node.disabled && !!r && r.width > 0 && r.height > 0 && r.x >= 0 && r.y >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
  };
  const reload = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Reload page');
  const reloadRect = rect(reload);
  const reloadHit = reloadRect && document.elementFromPoint(reloadRect.x + reloadRect.width / 2, reloadRect.y + reloadRect.height / 2)?.closest('button') === reload;
  const metrics = {};
  for (const strong of summary?.querySelectorAll('strong') ?? []) {
    const label = strong.parentElement.querySelector('span')?.textContent.trim();
    if (['Walk distance', 'Covered', 'Uncovered', 'Longest gap'].includes(label)) metrics[label] = strong.textContent.replace(/\s+/g, ' ').trim();
  }
  const map = window.__shiokRouteMap, debug = window.__shiokRouteDebug;
  let featureCount = 0, routeIds = [], basemap = false, tilesLoaded = false, moving = null, mapProbeError = null;
  try {
    const features = map?.getLayer('shiokest-route-line') ? map.queryRenderedFeatures({ layers: ['shiokest-route-line'] }).filter(feature => feature.properties?.render_key === debug?.routeKey) : [];
    featureCount = features.length;
    routeIds = [...new Set(features.map(feature => feature.properties?.route_id))];
    basemap = !!map?.getSource('onemap') && map.isSourceLoaded('onemap');
    tilesLoaded = !!map?.areTilesLoaded(); moving = map?.isMoving() ?? null;
  } catch (error) { mapProbeError = String(error); }
  return {
    url: location.href, documentTimeOrigin: performance.timeOrigin, viewport: [innerWidth, innerHeight],
    status: main?.dataset.mapStatus ?? null, stage: main?.dataset.mapStage ?? null, reason: main?.dataset.mapFailure ?? null,
    shell: !!main && !!document.querySelector('h1'), inputUsable: usable(input), submitUsable: usable(submit), input: input?.value,
    reload: { visible: usable(reload), hit: !!reloadHit, rect: reloadRect, message: reload?.parentElement.textContent.trim() ?? null },
    summary: { postal: summary?.getAttribute('data-postal') ?? null, metrics, text: summary?.textContent ?? null },
    mapPresent: !!map, routeKey: debug?.routeKey ?? null, featureCount, routeIds, basemap, tilesLoaded, moving, mapProbeError,
    stages: window.__qaStages ?? [], unhandledRejections: window.__qaUnhandled ?? [], stageOverflow: window.__qaStageOverflow ?? false,
    serviceWorkerControlled: !!navigator.serviceWorker?.controller,
  };
}
const expectedMetrics = { 'Walk distance': '81 m', Covered: '55%', Uncovered: '37 m', 'Longest gap': '20 m' };
const walkIntact = value => value.summary.postal === '018956' && Object.entries(expectedMetrics).every(([key, valueExpected]) => value.summary.metrics[key] === valueExpected);
const failedAs = (value, stage, reason) => value.status === 'error' && value.stage === stage && value.reason === reason && value.reload.visible && value.reload.hit;
// Home's buildRouteItems names the selected route "primary", not its postal code.
const selectedReady = value => value.status === 'ready' && value.stage === null && walkIntact(value) && value.basemap && value.tilesLoaded && !value.moving && value.featureCount > 0 && value.routeIds.includes('primary');

async function sample(context, name, end = workDeadline) {
  const value = await call(context, facts, null, end);
  append(context.receipt.samples, { name, at: Date.now(), value }, 1_500, context.name + ' samples');
  report.lastSample = { scenario: context.name, name, value };
  if (value.stageOverflow) throw Error('Page stage/event receipt overflow');
  return value;
}
async function waitFor(context, name, predicate, limit = 90_000) {
  const end = Math.min(workDeadline, Date.now() + Math.min(limit, 90_000));
  let value;
  while (Date.now() < end) {
    health();
    try { value = await sample(context, name, end); }
    catch (error) {
      if (Date.now() >= end) throw Error('App wait expired: ' + name + '; final observation: ' + asError(error).message);
      throw error;
    }
    if (predicate(value)) return value;
    await delay(Math.max(0, Math.min(300, end - Date.now())));
  }
  throw Error('App wait expired: ' + name + ' ' + JSON.stringify(value));
}
async function waitNetwork(context, name, predicate, limit = 45_000) {
  const end = Math.min(workDeadline, Date.now() + limit);
  while (Date.now() < end) {
    health();
    const value = predicate();
    if (value) return value;
    await delay(Math.max(0, Math.min(100, end - Date.now())));
  }
  throw Error('Network wait expired: ' + context.name + ' ' + name);
}
function captureSignature(value) {
  return JSON.stringify([value.documentTimeOrigin, value.status, value.stage, value.reason, value.summary, value.routeKey, value.featureCount, value.basemap, value.tilesLoaded, value.moving]);
}
async function capture(context, name, predicate) {
  // Score text can precede geometry. Require completed page-target data reads and
  // stable facts rather than treating a legitimate later geometry delivery as drift.
  let before, previous, stable = 0;
  if (predicate) {
    const end = Math.min(workDeadline, Date.now() + 30_000);
    while (Date.now() < end) {
      health();
      before = await sample(context, name + ' settling', end);
      const signature = captureSignature(before);
      if (predicate(before) && context.pendingData.size === 0 && signature === previous) stable++; else stable = 0;
      previous = signature;
      if (stable >= 5) break;
      await delay(Math.min(300, Math.max(0, end - Date.now())));
    }
    check(name + ' stable facts after data reads', stable >= 5, { before, pendingData: [...context.pendingData] });
  } else before = await sample(context, name + ' before');
  if (predicate) check(name + ' pre-capture facts', predicate(before), before);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, context.sessionId);
  const bytes = Buffer.from(shot.data, 'base64'), path = resolve(out, context.name + '-' + name + '.png');
  writeFileSync(path, bytes, { flag: 'wx' });
  const after = await sample(context, name + ' after');
  const pendingDataAfter = [...context.pendingData];
  report.captures.push({ scenario: context.name, name, path, bytes: bytes.length, sha256: sha(bytes), before, after, pendingDataAfter });
  if (predicate) check(name + ' matching screenshot facts', pendingDataAfter.length === 0 && predicate(after) && captureSignature(before) === captureSignature(after), { before, after, pendingDataAfter });
  return after;
}

async function intercept(context, params) {
  const url = new URL(params.request.url);
  if (url.origin === origin && url.pathname.startsWith('/api/')) {
    await send('Fetch.failRequest', { requestId: params.requestId, errorReason: 'BlockedByClient' }, context.sessionId);
    throw Error('Forbidden API request attempted: ' + url.pathname);
  }
  if (url.origin !== origin || url.pathname !== context.target.urlPath) {
    await send('Fetch.continueRequest', { requestId: params.requestId }, context.sessionId);
    return;
  }
  const record = { requestId: params.requestId, networkId: params.networkId, at: Date.now(), resourceType: params.resourceType, url: params.request.url, action: context.fault };
  context.receipt.interceptions.push(record);
  if (context.fault === 'reject') {
    await send('Fetch.fulfillRequest', { requestId: params.requestId, responseCode: 503,
      responseHeaders: [{ name: 'Content-Type', value: 'application/javascript' }, { name: 'Cache-Control', value: 'no-store' }],
      body: Buffer.from('/* QA: implementation chunk deliberately unavailable. */').toString('base64'),
    }, context.sessionId);
    record.fulfilledAt = Date.now();
  } else if (context.fault === 'hold') {
    const timer = setTimeout(() => {
      context.held.delete(params.requestId);
      asyncError ??= Error('Held component request reached finite safety deadline');
      trackEvent(send('Fetch.failRequest', { requestId: params.requestId, errorReason: 'Aborted' }, context.sessionId));
    }, Math.min(180_000, remaining()));
    context.held.set(params.requestId, { record, timer });
  } else {
    await send('Fetch.continueRequest', { requestId: params.requestId }, context.sessionId);
    record.continuedAt = Date.now();
  }
}
function receive(message) {
  if (message.id) {
    const handler = pending.get(message.id);
    if (handler) message.error ? handler.reject(Error(JSON.stringify(message.error))) : handler.done(message.result);
    return;
  }
  const context = sessions.get(message.sessionId);
  if (!context) return;
  const { method, params } = message;
  if (['Network.requestWillBeSent', 'Network.responseReceived', 'Network.loadingFinished', 'Network.loadingFailed', 'Network.requestServedFromCache'].includes(method)) {
    append(report.network, { scenario: context.name, sessionId: message.sessionId, method, params }, 10_000, 'network');
    if (method === 'Network.responseReceived') context.responses.set(params.requestId, params);
    if (method === 'Network.responseReceived' && params.response.status >= 400 && context.pendingData.has(params.requestId)) {
      append(context.receipt.rejectedDataReads, { requestId: params.requestId, url: context.pendingData.get(params.requestId), status: params.response.status, at: Date.now() }, 1_000, context.name + ' rejected data reads');
      context.pendingData.delete(params.requestId);
    }
    if (method === 'Network.loadingFinished') context.finished.add(params.requestId);
    if (method === 'Network.requestWillBeSent' && new URL(params.request.url).pathname.startsWith('/data/')) context.pendingData.set(params.requestId, params.request.url);
    if (method === 'Network.loadingFinished' || method === 'Network.loadingFailed') context.pendingData.delete(params.requestId);
    if (method === 'Network.requestWillBeSent' && params.type === 'Document') context.documents.set(params.requestId, params);
    if (method === 'Network.requestWillBeSent' && new URL(params.request.url).pathname.startsWith('/api/')) asyncError ??= Error('API request attempted');
  }
  if (method === 'Runtime.exceptionThrown' || method === 'Log.entryAdded' || (method === 'Runtime.consoleAPICalled' && ['error', 'warn'].includes(params.type))) {
    append(report.errors, { scenario: context.name, sessionId: message.sessionId, method, params }, 1_000, 'errors');
  }
  if (method === 'Fetch.requestPaused') trackEvent(intercept(context, params));
}
async function launchChrome() {
  profile = mkdtempSync(resolve(root, 'tmp/map-download-browser-'));
  report.profile = profile;
  const args = ['--headless=new', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--disable-default-apps', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-default-browser-check',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'];
  report.chromeArgs = args;
  const end = Math.min(workDeadline, Date.now() + 40_000);
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', args,
    { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
  report.chromePid = chrome.pid;
  chrome.on('error', error => { transportError = error; });
  chrome.stderr.on('data', chunk => {
    if (stderr.length + chunk.length > 1_000_000) { asyncError ??= Error('Chrome stderr capacity exceeded'); return; }
    stderr += chunk;
  });
  let endpoint;
  while (Date.now() < end && !endpoint) {
    health();
    if (chrome.exitCode !== null || chrome.signalCode !== null) throw Error('Owned Chrome exited during startup');
    endpoint = /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1];
    if (!endpoint) await delay(100);
  }
  if (!endpoint) throw Error('Browser startup exceeded 40 seconds');
  const address = new URL(endpoint);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(address.hostname)) throw Error('Non-local CDP endpoint');
  report.browserEndpoint = endpoint;
  ws = new WebSocket(endpoint);
  ws.onmessage = event => { try { receive(JSON.parse(event.data)); } catch (error) { asyncError ??= asError(error); } };
  await new Promise((done, reject) => {
    const timer = setTimeout(() => { ws.close(); reject(Error('Browser websocket startup timeout')); }, remaining(end));
    ws.onopen = () => { clearTimeout(timer); done(); };
    ws.onerror = () => { clearTimeout(timer); reject(Error('Browser websocket startup failed')); };
    ws.onclose = () => { clearTimeout(timer); reject(Error('Browser websocket closed during startup')); };
  });
  ws.onerror = () => { if (!cleaning) transportError = Error('Browser websocket error'); };
  ws.onclose = () => {
    if (!cleaning) transportError = Error('Browser websocket closed');
    for (const request of [...pending.values()]) request.reject(Error('Browser websocket closed'));
  };
}
async function createContext(name, target, fault) {
  // CDP's browser-context creation method belongs to Target, on the browser websocket.
  const { browserContextId } = await send('Target.createBrowserContext', { disposeOnDetach: true });
  const receipt = { name, browserContextId, target, fault, freshContext: true, cacheDisabled: true, bypassServiceWorker: true, rejectedDataReads: [],
    samples: [], interceptions: [], documents: [], startedAt: new Date().toISOString() };
  report.scenarios.push(receipt);
  const context = { name, receipt, browserContextId, target, fault, held: new Map(), responses: new Map(), finished: new Set(), documents: new Map(), pendingData: new Map() };
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  context.targetId = targetId;
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  context.sessionId = sessionId; receipt.targetId = targetId; receipt.sessionId = sessionId; sessions.set(sessionId, context);
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Log.enable', {}, sessionId);
  await send('Network.enable', { maxTotalBufferSize: 40_000_000, maxResourceBufferSize: 8_000_000 }, sessionId);
  await send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId);
  await send('Network.setBypassServiceWorker', { bypass: true }, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: '(' + stageRecorder.toString() + ')()' }, sessionId);
  await send('Fetch.enable', { patterns: [
    { urlPattern: origin + target.urlPath + '*', requestStage: 'Request' },
    { urlPattern: origin + '/api/*', requestStage: 'Request' },
  ] }, sessionId);
  return context;
}
async function documentIdentity(context, previousLoaderId) {
  const request = await waitNetwork(context, 'completed main Document', () => [...context.documents.values()].findLast(value =>
    context.finished.has(value.requestId) && value.loaderId !== previousLoaderId && new URL(value.request.url).origin === origin));
  const response = context.responses.get(request.requestId);
  check(context.name + ' Document HTTP 200', response?.response.status === 200, response);
  const body = await send('Network.getResponseBody', { requestId: request.requestId }, context.sessionId);
  const bytes = Buffer.from(body.body, body.base64Encoded ? 'base64' : 'utf8'), html = bytes.toString('utf8');
  const path = resolve(out, context.name + '-document-' + context.receipt.documents.length + '.html');
  writeFileSync(path, bytes, { flag: 'wx' });
  const index = html.indexOf(build);
  const record = { requestId: request.requestId, loaderId: request.loaderId, url: request.request.url, path, bytes: bytes.length,
    sha256: sha(bytes), expectedBuildPresent: index >= 0, buildExcerpt: index < 0 ? null : html.slice(Math.max(0, index - 45), index + build.length + 45) };
  context.receipt.documents.push(record);
  check(context.name + ' actual Document HTML has expected build', record.expectedBuildPresent, record);
  return record;
}
async function navigate(context) {
  const result = await send('Page.navigate', { url: origin + '/?debugMap=1' }, context.sessionId);
  if (result.errorText) throw Error('Navigation failed: ' + result.errorText);
  await documentIdentity(context);
  await waitFor(context, 'search shell usable', value => value.shell && value.inputUsable && value.submitUsable);
}
async function typePostal(context) {
  await call(context, () => { const input = document.querySelector('#postal-search-input'); input.focus(); input.select(); });
  await send('Input.insertText', { text: '018956' }, context.sessionId);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' }, context.sessionId);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }, context.sessionId);
}
async function releaseComponent(context) {
  context.fault = 'pass';
  const held = [...context.held.values()];
  check('component implementation was actually held', held.length > 0, held.map(value => value.record));
  for (const { record, timer } of held) {
    clearTimeout(timer); context.held.delete(record.requestId);
    await send('Fetch.continueRequest', { requestId: record.requestId }, context.sessionId);
    record.releasedAt = Date.now(); record.heldMs = record.releasedAt - record.at;
  }
  const requestId = await waitNetwork(context, 'released implementation finished', () => held.map(value => value.record.networkId)
    .find(id => id && context.finished.has(id) && context.responses.get(id)?.response.status === 200));
  const body = await send('Network.getResponseBody', { requestId }, context.sessionId);
  const bytes = Buffer.from(body.body, body.base64Encoded ? 'base64' : 'utf8');
  context.receipt.releasedImplementation = { requestId, bytes: bytes.length, sha256: sha(bytes) };
  check('released response is the discovered component implementation', bytes.length === context.target.bytes && sha(bytes) === context.target.sha256, context.receipt.releasedImplementation);
}
async function holdScenario(context) {
  await navigate(context);
  const failure = await waitFor(context, 'real component timeout with explicit Reload', value => failedAs(value, 'component-download', 'timeout'));
  check('component timeout, not another startup stage', context.held.size > 0 && !failure.mapPresent, failure);
  await capture(context, 'timeout-empty', value => failedAs(value, 'component-download', 'timeout'));
  await typePostal(context);
  await waitFor(context, 'walk survives timed-out component', value => walkIntact(value) && failedAs(value, 'component-download', 'timeout') && value.inputUsable && value.submitUsable);
  await capture(context, 'timeout-with-walk', value => walkIntact(value) && failedAs(value, 'component-download', 'timeout'));
  const beforeReload = context.receipt.documents.at(-1), initialDocumentCount = context.documents.size;
  await releaseComponent(context);
  const observationStarted = Date.now(), end = Math.min(workDeadline, observationStarted + 5_000);
  while (Date.now() < end) {
    health();
    const value = await sample(context, 'released chunk cannot resurrect failed instance');
    check('released component leaves failure terminal and walk usable', failedAs(value, 'component-download', 'timeout') && walkIntact(value) && !value.mapPresent, value);
    await delay(Math.max(0, Math.min(300, end - Date.now())));
  }
  context.receipt.postReleaseObservationMs = Date.now() - observationStarted;
  check('no automatic reload after chunk release', context.documents.size === initialDocumentCount);
  await send('Fetch.disable', {}, context.sessionId);
  const value = await sample(context, 'before explicit Reload');
  context.receipt.beforeReload = value;
  check('Reload is visible and selection is in URL', value.reload.visible && value.reload.hit && new URL(value.url).searchParams.get('postal') === '018956', value);
  const point = { x: value.reload.rect.x + value.reload.rect.width / 2, y: value.reload.rect.y + value.reload.rect.height / 2 };
  context.receipt.explicitReloadClickAt = Date.now();
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point }, context.sessionId);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point }, context.sessionId);
  const newDocument = await documentIdentity(context, beforeReload.loaderId);
  const ready = await waitFor(context, 'explicit reload restores same selected route and basemap', selectedReady);
  check('new Document preserves the selected postal', newDocument.loaderId !== beforeReload.loaderId && ready.documentTimeOrigin !== value.documentTimeOrigin
    && new URL(ready.url).searchParams.get('postal') === '018956' && ready.input === '018956', ready);
  const captured = await capture(context, 'explicit-reload-ready', selectedReady);
  check('recovered page has no unhandled hint rejections', captured.unhandledRejections.length === 0, captured.unhandledRejections);
}
async function rejectionScenario(context, stage) {
  await navigate(context);
  const failed = await waitFor(context, stage + ' rejected with shell intact', value => failedAs(value, stage, 'rejected') && value.shell && value.inputUsable && value.submitUsable);
  check(context.name + ' implementation 503 actually injected', context.receipt.interceptions.some(record => record.fulfilledAt), context.receipt.interceptions);
  await capture(context, 'rejected-empty', value => failedAs(value, stage, 'rejected') && value.inputUsable);
  await typePostal(context);
  const walk = await waitFor(context, 'search remains usable after implementation rejection', value => walkIntact(value) && failedAs(value, stage, 'rejected') && value.inputUsable && value.submitUsable);
  const captured = await capture(context, 'rejected-with-walk', value => walkIntact(value) && failedAs(value, stage, 'rejected'));
  check(context.name + ' stays in the same Document without automatic reload', failed.documentTimeOrigin === captured.documentTimeOrigin && context.documents.size === 1);
  check(context.name + ' no unhandled preload rejections', captured.unhandledRejections.length === 0, captured.unhandledRejections);
}
async function closeContext(context) {
  await Promise.all([...eventTasks]);
  health();
  for (const held of context.held.values()) clearTimeout(held.timer);
  context.held.clear();
  await send('Target.disposeBrowserContext', { browserContextId: context.browserContextId });
  sessions.delete(context.sessionId);
  context.receipt.disposedAt = new Date().toISOString();
}

let current;
try {
  report.preview = await boundedJson(origin + '/__qa/status');
  check('preview reports expected build', report.preview.build === build, report.preview);
  const chunks = discoverChunks(report.preview.snapshot);
  await launchChrome();
  if (scenarioSet === 'all') {
    current = await createContext('component-timeout', chunks.component, 'hold');
    await holdScenario(current); await closeContext(current); current = null;
  }
  current = await createContext('library-rejected', chunks.library, 'reject');
  await rejectionScenario(current, 'library-download'); await closeContext(current); current = null;
  current = await createContext('component-rejected', chunks.component, 'reject');
  await rejectionScenario(current, 'component-download'); await closeContext(current); current = null;
  report.previewAfter = await boundedJson(origin + '/__qa/status');
  check('preview build did not change during acceptance', report.previewAfter.build === build);
  health();
} catch (error) {
  report.failure = textError(error);
  console.error(report.failure);
  if (current && ws?.readyState === WebSocket.OPEN && Date.now() + 5_000 < workDeadline) {
    try { await capture(current, 'unexpected-failure'); } catch (captureError) { report.failureCaptureError = textError(captureError); }
  }
} finally {
  cleaning = true;
  for (const context of sessions.values()) for (const held of context.held.values()) clearTimeout(held.timer);
  if (ws?.readyState === WebSocket.OPEN) {
    try { await send('Browser.close', {}, undefined, 5_000); report.cleanup.closeSent = true; }
    catch (error) { report.cleanup.closeError = textError(error); }
  }
  if (chrome) {
    const end = Math.min(overallDeadline - 40_000, Date.now() + 25_000);
    while (Date.now() < end && chrome.exitCode === null && chrome.signalCode === null) await delay(250);
    report.cleanup.spawnExited = chrome.exitCode !== null || chrome.signalCode !== null;
  }
  if (profile) {
    within(profile, resolve(root, 'tmp'));
    const cleanupCommand = "$ErrorActionPreference='Stop'; $profile='" + profile.replaceAll("'", "''") + "'; function Owned { @(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($profile) }) }; $owned=@(Owned); $before=@($owned | Select-Object ProcessId,Name,CommandLine); foreach($item in $owned){ $live=Get-Process -Id $item.ProcessId -ErrorAction SilentlyContinue; if($live -and -not $live.HasExited){ Stop-Process -Id $item.ProcessId -Force -ErrorAction SilentlyContinue } }; $end=[DateTime]::UtcNow.AddSeconds(25); do { $remaining=@(Owned | Where-Object { $live=Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; $live -and -not $live.HasExited }); if($remaining.Count -eq 0){break}; Start-Sleep -Milliseconds 500 } while([DateTime]::UtcNow -lt $end); @{before=$before; remaining=@($remaining | Select-Object ProcessId,Name,CommandLine); check='Exact fresh profile in CIM command line plus live Get-Process HasExited, bounded 25-second grace; no profile deletion'} | ConvertTo-Json -Depth 4 -Compress";
    const cleanup = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cleanupCommand],
      { cwd: root, windowsHide: true, encoding: 'utf8', timeout: Math.max(1, Math.min(38_000, overallDeadline - Date.now())), maxBuffer: 2_000_000 });
    report.cleanup.processAudit = { command: cleanupCommand, exitCode: cleanup.status, stdout: cleanup.stdout, stderr: cleanup.stderr, error: cleanup.error?.message ?? null };
    try { report.cleanup.verified = cleanup.status === 0 && JSON.parse(cleanup.stdout).remaining.length === 0; }
    catch { report.cleanup.verified = false; }
  } else report.cleanup.verified = !chrome;
  ws?.close();
  for (const request of [...pending.values()]) request.reject(Error('QA run ended'));
  pending.clear();
  await Promise.all([...eventTasks]);
  report.stderr = stderr;
  report.finishedAt = new Date().toISOString();
  report.elapsedMs = Date.now() - started;
  report.ok = !report.failure && !transportError && !asyncError && report.checks.every(value => value.pass) && report.cleanup.verified && report.elapsedMs <= 600_000;
  report.transportError = transportError ? textError(transportError) : null;
  report.asyncError = asyncError ? textError(asyncError) : null;
  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, ok: report.ok, elapsedMs: report.elapsedMs, checks: report.checks.length, captures: report.captures.length, cleanupVerified: report.cleanup.verified }));
  process.exit(report.ok ? 0 : 1);
}
