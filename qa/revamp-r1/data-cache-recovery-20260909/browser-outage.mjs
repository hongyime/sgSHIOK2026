import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

// Run only after parent authorization. This changes the shared local QA proxy state.
// Usage: node <absolute-script-path> <fresh-run-label> <expected-build-B>
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root; use C:\\sgSHIOK2026');
const [label, expectedBuildB] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label || '') || !/^[A-Za-z0-9_-]+$/.test(expectedBuildB || '')) {
  throw Error('Required arguments: <fresh-run-label> <expected-build-B>');
}
const folder = resolve(root, 'qa/revamp-r1/data-cache-recovery-20260909');
const out = resolve(folder, `${label}-${Date.now()}-${randomUUID().slice(0, 8)}`);
if (!out.startsWith(folder + sep) || existsSync(out)) throw Error('Unsafe or existing output path');
const origin = 'http://127.0.0.1:4324';
const selectedUrl = `${origin}/?postal=018956`;
const mapWorkerPaths = ['/maplibre/6.1.0/maplibre-gl-worker.mjs', '/maplibre/6.1.0/maplibre-gl-shared.mjs'];
const onlineBudgetMs = 120000;
const outageBudgetMs = 45000;
const report = {
  schemaVersion: 1, root, origin, expectedBuildB, selectedUrl, out, mapWorkerPaths,
  startedAt: new Date().toISOString(), viewport: { width: 390, height: 844 },
  serviceWorkerBypassed: false, cachesCleared: false, forcedWorkerUpdate: false,
  mode: 'B-only-origin-outage', budgetsMs: { online: onlineBudgetMs, outage: outageBudgetMs, cleanup: 15000 },
  checks: [], captures: [], samples: [], network: [], exceptions: [], console: [], logs: [],
  serviceWorkers: [], targets: [], proxySnapshots: [], dropped: {}, cleanup: {},
  limitations: [
    'Origin outage is not whole-device offline; external OneMap tiles may remain reachable.',
    'Fresh-profile B-only test, not A-to-B upgrade or representative phone performance.',
    'Page-target CDP network does not necessarily include worker-target fetches; proxy receipts supplement it.',
    'Proxy receipts are bounded by the proxy; missing receipts are not proof of absent requests.',
    'Screenshots and facts are captured regardless of route recovery; images still require visual inspection.',
    'Map source/layer facts and error events cannot prove worker execution without corresponding worker evidence.',
  ],
};
mkdirSync(out);
const profile = mkdtempSync(resolve(root, 'tmp/t02-browser-outage-'));
report.browser = { profile, executable: 'C:/Program Files/Google/Chrome/Application/chrome.exe', stderr: '' };
let chrome, ws, phase = 'online', phaseDeadline = Date.now() + onlineBudgetMs, sequence = 0;
let interrupted = null, mainFrameLoader = null;
const pending = new Map();
const responses = new Map();
const completedRequests = new Set();
const delay = ms => new Promise(done => setTimeout(done, ms));
const stamp = () => ({ at: new Date().toISOString(), phase });
const add = (key, entry, limit = 4000) => {
  const values = report[key];
  if (values.length < limit) values.push({ ...stamp(), ...entry });
  else report.dropped[key] = (report.dropped[key] || 0) + 1;
};
const remaining = (maximum = 5000) => Math.max(1, Math.min(maximum, phaseDeadline - Date.now()));
function check(name, pass, details, fatal = false) {
  report.checks.push({ ...stamp(), name, pass: Boolean(pass), details });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  if (!pass && fatal) throw Error(name);
}
function assertTime() {
  if (interrupted) throw interrupted;
  if (Date.now() >= phaseDeadline) throw Error(`${phase} deadline`);
}
async function proxy(path, method = 'GET') {
  const response = await fetch(`${origin}${path}`, {
    method, headers: { 'x-shiok-qa': 'local-upgrade' }, signal: AbortSignal.timeout(remaining()),
  });
  if (method === 'POST') {
    if (response.status !== 204) throw Error(`Proxy control ${path}: HTTP ${response.status}`);
    return;
  }
  if (!response.ok) throw Error(`Proxy status: HTTP ${response.status}`);
  return response.json();
}
const control = value => proxy(`/__qa/select/${value}`, 'POST');
async function proxySnapshot(label) {
  try {
    const value = await proxy('/__qa/status');
    report.proxySnapshots.push({ ...stamp(), label, value });
    return value;
  } catch (error) {
    report.proxySnapshots.push({ ...stamp(), label, error: error.message });
    return null;
  }
}
function send(method, params = {}, maximum = 5000) {
  return new Promise((done, reject) => {
    if (ws?.readyState !== 1) { reject(Error(`CDP unavailable: ${method}`)); return; }
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, remaining(maximum));
    pending.set(id, {
      done: value => { clearTimeout(timer); done(value); },
      reject: error => { clearTimeout(timer); reject(error); },
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression, maximum = 5000) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, maximum);
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

const installDiagnostics = `(() => {
  const d = { errors: [], rejections: [], mapEvents: [], dropped: 0 };
  const push = (list, value) => { if (list.length < 200) list.push(value); else d.dropped++; };
  window.__t02Outage = d;
  window.addEventListener('error', e => push(d.errors, {
    at: performance.now(), message: e.message || null, filename: e.filename || null,
    line: e.lineno, column: e.colno, stack: e.error?.stack || null,
    resource: e.target?.src || e.target?.href || null, tag: e.target?.tagName || null
  }), true);
  window.addEventListener('unhandledrejection', e => push(d.rejections, {
    at: performance.now(), reason: String(e.reason), stack: e.reason?.stack || null
  }));
  d.attach = map => {
    if (!map || d.map === map) return;
    d.map = map;
    for (const name of ['error', 'load', 'idle', 'style.load', 'sourcedataloading', 'sourcedata']) {
      map.on(name, e => push(d.mapEvents, { at: performance.now(), type: name,
        message: e.error?.message || null, stack: e.error?.stack || null,
        sourceId: e.sourceId || null, isSourceLoaded: e.isSourceLoaded ?? null,
        sourceDataType: e.sourceDataType || null, dataType: e.dataType || null,
        tile: e.tile?.tileID?.toString?.() || null
      }));
    }
    map.getCanvas()?.addEventListener('webglcontextlost', () => push(d.mapEvents, {
      at: performance.now(), type: 'webglcontextlost'
    }));
  };
})()`;

const facts = `(() => {
  const m = window.__shiokRouteMap, d = window.__shiokRouteDebug, qa = window.__t02Outage;
  const errors = {};
  const safe = (name, fn) => { try { return fn(); } catch(e) { errors[name] = String(e); return null; } };
  safe('attach', () => qa?.attach(m));
  const style = safe('style', () => m?.getStyle());
  const routeLayers = ['shiokest-route-line', 'shortest-route-line'];
  const layerFacts = Object.fromEntries(routeLayers.map(id => [id, safe(id, () => {
    if (!m?.getLayer(id)) return { exists: false, currentCount: 0, allCount: 0 };
    const features = m.queryRenderedFeatures({ layers: [id] });
    return { exists: true, allCount: features.length,
      currentCount: d?.routeKey ? features.filter(f => f.properties?.render_key === d.routeKey).length : 0,
      renderKeys: [...new Set(features.map(f => f.properties?.render_key))],
      visibility: m.getLayoutProperty(id, 'visibility') || 'visible' };
  })]));
  const sources = Object.keys(style?.sources || {}).map(id => ({ id, type: style.sources[id].type,
    loaded: safe(id + '.loaded', () => m.isSourceLoaded(id)),
    exists: safe(id + '.exists', () => !!m.getSource(id)),
    url: style.sources[id].url || null, tiles: style.sources[id].tiles || null,
    styleFeatureCount: style.sources[id].data?.features?.length ?? null
  }));
  const summary = document.querySelector('[aria-label="Walk summary"]');
  const metrics = summary ? [...summary.querySelectorAll('div > strong')].map(node => ({
    value: node.textContent, label: node.parentElement.querySelector('span')?.textContent
  })).filter(item => ['Walk distance', 'Covered', 'Uncovered', 'Longest gap'].includes(item.label)) : [];
  const rect = node => { if (!node) return null; const r = node.getBoundingClientRect();
    return { x:r.x, y:r.y, width:r.width, height:r.height }; };
  const canvas = safe('canvas', () => m?.getCanvas());
  return { url: location.href, readyState: document.readyState, now: performance.now(),
    status: document.querySelector('main')?.dataset.mapStatus || null,
    text: document.body?.innerText || '', postal: summary?.dataset.postal || null,
    summaryText: summary?.innerText || null, metrics, alerts: [...document.querySelectorAll('[role="alert"], [role="status"]')].map(n => n.textContent),
    debug: d ? JSON.parse(JSON.stringify(d)) : null, key: d?.routeKey || null,
    routeCount: layerFacts['shiokest-route-line']?.currentCount ?? 0, layerFacts, sources,
    mapExists: !!m, loaded: safe('loaded', () => m?.loaded()),
    styleLoaded: safe('styleLoaded', () => m?.isStyleLoaded()),
    tilesLoaded: safe('tilesLoaded', () => m?.areTilesLoaded()),
    basemapLoaded: safe('basemapLoaded', () => !!m?.getSource('onemap') && m.isSourceLoaded('onemap')),
    center: safe('center', () => m?.getCenter()), zoom: safe('zoom', () => m?.getZoom()),
    bounds: safe('bounds', () => m?.getBounds()?.toArray()), moving: safe('moving', () => m?.isMoving()),
    padding: safe('padding', () => m?.getPadding()), canvas: { rect: rect(canvas), width:canvas?.width,
      height:canvas?.height, display:canvas ? getComputedStyle(canvas).display : null,
      visibility:canvas ? getComputedStyle(canvas).visibility : null },
    worker: { controlled: !!navigator.serviceWorker?.controller,
      scriptURL: navigator.serviceWorker?.controller?.scriptURL || null,
      state: navigator.serviceWorker?.controller?.state || null },
    qa: qa ? { errors:qa.errors, rejections:qa.rejections, mapEvents:qa.mapEvents, dropped:qa.dropped } : null,
    resourceTiming: performance.getEntriesByType('resource').slice(-300).map(e => ({
      name:e.name, initiatorType:e.initiatorType, startTime:e.startTime, duration:e.duration,
      transferSize:e.transferSize, encodedBodySize:e.encodedBodySize, decodedBodySize:e.decodedBodySize,
      responseStatus:e.responseStatus ?? null })), errors,
    viewport: { width:innerWidth, height:innerHeight }
  };
})()`;

async function documentEvidence(loaderId) {
  const item = [...responses.values()].filter(r => r.type === 'Document' && r.loaderId === loaderId).at(-1);
  if (!item) return { error: 'No actual Document response captured for this navigation', loaderId };
  try {
    const body = await send('Network.getResponseBody', { requestId: item.requestId });
    const bytes = Buffer.from(body.body, body.base64Encoded ? 'base64' : 'utf8');
    const html = bytes.toString('utf8');
    return { ...item, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
      containsExpectedBuildB: html.includes(expectedBuildB),
      containsProxyBuildA: report.initialProxy?.buildA ? html.includes(report.initialProxy.buildA) : null };
  } catch (error) { return { ...item, error: error.message }; }
}
async function capture(label, loaderId) {
  const capture = { label, ...stamp() };
  report.captures.push(capture);
  try { capture.before = await evaluate(facts); } catch (error) { capture.beforeError = error.message; }
  try {
    const png = await send('Page.captureScreenshot', { format: 'png' }, 6000);
    capture.path = resolve(out, `${label}.png`);
    writeFileSync(capture.path, Buffer.from(png.data, 'base64'), { flag: 'wx' });
  } catch (error) { capture.screenshotError = error.message; }
  try { capture.after = await evaluate(facts); } catch (error) { capture.afterError = error.message; }
  capture.document = await documentEvidence(loaderId);
  const a = capture.before, b = capture.after;
  capture.stable = Boolean(a && b && a.key === b.key && a.routeCount === b.routeCount &&
    a.zoom === b.zoom && JSON.stringify(a.center) === JSON.stringify(b.center) && !a.moving && !b.moving);
  return capture;
}
async function observe(predicate, deadline, stage) {
  let latest = null;
  while (Date.now() < deadline) {
    assertTime();
    try {
      latest = await evaluate(pollFacts, Math.max(1, Math.min(5000, deadline - Date.now())));
      const documentResponse = [...responses.values()].find(r => r.type === 'Document' && r.loaderId === activeLoader);
      const currentDocument = mainFrameLoader === activeLoader && !!documentResponse &&
        completedRequests.has(documentResponse.requestId);
      report.samples.push({ ...stamp(), stage, postal: latest.postal, status: latest.status,
        key: latest.key, routeCount: latest.routeCount, metrics: latest.metrics,
        basemapLoaded: latest.basemapLoaded, controlled: latest.worker.controlled,
        activeLoader, mainFrameLoader, currentDocument });
      if (currentDocument && predicate(latest)) return { reached: true, latest };
    } catch (error) { report.samples.push({ ...stamp(), stage, error: error.message }); }
    await delay(Math.min(500, Math.max(0, deadline - Date.now())));
  }
  return { reached: false, latest };
}
const realRoute = s => s.postal === '018956' && s.metrics.length === 4 && s.routeCount === 4 &&
  s.basemapLoaded === true && s.moving === false;
const pollFacts = `(() => {
  const map = window.__shiokRouteMap, key = window.__shiokRouteDebug?.routeKey;
  window.__t02Outage?.attach(map);
  const summary = document.querySelector('[aria-label="Walk summary"]');
  const metrics = summary ? [...summary.querySelectorAll('div > strong')].map(node => ({
    value: node.textContent, label: node.parentElement.querySelector('span')?.textContent
  })).filter(item => ['Walk distance','Covered','Uncovered','Longest gap'].includes(item.label)) : [];
  return { postal: summary?.dataset.postal || null, metrics, key,
    status: document.querySelector('main')?.dataset.mapStatus || null,
    routeCount: key && map?.getLayer('shiokest-route-line') ? map.queryRenderedFeatures({layers:['shiokest-route-line']}).filter(f => f.properties?.render_key === key).length : 0,
    basemapLoaded: !!map?.getSource('onemap') && map.isSourceLoaded('onemap'),
    moving: map?.isMoving(), worker: { controlled: !!navigator.serviceWorker?.controller } };
})()`;
function artifactKind(url) {
  const path = new URL(url).pathname;
  if (/\/scores?\//i.test(path)) return /\/(?:index|prefix-index)\.json(?:\.gz)?$/i.test(path) ? 'score-index' : 'score';
  if (/\/geom\//i.test(path)) return /\/(?:index|postal-index)\.json(?:\.gz)?$/i.test(path) ? 'geom-index' : 'geom';
  return 'other';
}
const dataResponses = targetPhase => [...responses.values()].filter(r => r.phase === targetPhase &&
  r.url.startsWith(origin + '/data/')).map(r => ({ ...r, artifact: artifactKind(r.url) }));
const fail = signal => {
  interrupted = Error(`Interrupted by ${signal}`);
  for (const waiter of pending.values()) waiter.reject(interrupted);
  pending.clear();
};
process.on('SIGINT', fail);
process.on('SIGTERM', fail);
let activeLoader = null;
try {
  report.onlineStartedAt = new Date().toISOString();
  await control('online');
  await control('B');
  report.initialProxy = await proxySnapshot('before-online');
  check('proxy serves the explicitly pinned B build', report.initialProxy?.active === 'B' &&
    report.initialProxy?.offline === false && report.initialProxy?.buildB === expectedBuildB, report.initialProxy, true);
  chrome = spawn(report.browser.executable, [
    '--headless=new', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  report.browser.pid = chrome.pid;
  chrome.stderr.on('data', chunk => { report.browser.stderr = (report.browser.stderr + chunk).slice(-16000); });
  chrome.on('error', error => { report.browser.error = error.message; });
  let tabs;
  while (!tabs && Date.now() < phaseDeadline - 10000) {
    assertTime();
    if (chrome.exitCode !== null || report.browser.error) throw Error('Owned Chrome exited or failed to start');
    const address = /DevTools listening on (ws:\/\/[^\s]+)/.exec(report.browser.stderr)?.[1];
    if (address) {
      const endpoint = new URL(address);
      if (!['127.0.0.1', '[::1]', 'localhost'].includes(endpoint.hostname)) throw Error('Nonlocal debugger host');
      endpoint.protocol = 'http:'; endpoint.pathname = '/json';
      try { tabs = await (await fetch(endpoint, { signal: AbortSignal.timeout(remaining(2000)) })).json(); }
      catch (error) { report.browser.lastDiscoveryError = error.message; }
    }
    if (!tabs) await delay(300);
  }
  const page = tabs?.find(tab => tab.type === 'page');
  if (!page) throw Error('No owned Chrome page within online budget');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((done, reject) => {
    const timer = setTimeout(() => reject(Error('CDP connection deadline')), remaining());
    ws.onopen = () => { clearTimeout(timer); done(); };
    ws.onerror = () => { clearTimeout(timer); reject(Error('CDP connection failed')); };
  });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const waiter = pending.get(message.id); pending.delete(message.id);
      if (waiter) message.error ? waiter.reject(Error(message.error.message)) : waiter.done(message.result);
      return;
    }
    const p = message.params;
    switch (message.method) {
      case 'Page.frameNavigated': if (!p.frame.parentId) mainFrameLoader = p.frame.loaderId; break;
      case 'Runtime.exceptionThrown': add('exceptions', p, 300); break;
      case 'Runtime.consoleAPICalled': add('console', { type: p.type, timestamp: p.timestamp,
        args: p.args.map(a => ({ type: a.type, value: a.value, description: a.description })), stackTrace: p.stackTrace }, 500); break;
      case 'Log.entryAdded': add('logs', p.entry, 500); break;
      case 'ServiceWorker.workerVersionUpdated': for (const version of p.versions) add('serviceWorkers', version, 300); break;
      case 'Target.targetCreated': case 'Target.targetInfoChanged': add('targets', p.targetInfo, 300); break;
      case 'Network.requestWillBeSent': add('network', { event: message.method, requestId: p.requestId,
        loaderId: p.loaderId, type: p.type, url: p.request.url, method: p.request.method,
        timestamp: p.timestamp, initiator: p.initiator, redirect: p.redirectResponse }); break;
      case 'Network.responseReceived': {
        const r = p.response;
        const receipt = { ...stamp(), requestId: p.requestId, loaderId: p.loaderId, type: p.type,
          url: r.url, status: r.status, mimeType: r.mimeType, fromServiceWorker: r.fromServiceWorker === true,
          fromDiskCache: r.fromDiskCache === true, serviceWorkerResponseSource: r.serviceWorkerResponseSource,
          protocol: r.protocol, remoteIPAddress: r.remoteIPAddress, headers: r.headers, timing: r.timing };
        responses.set(p.requestId, receipt); add('network', { event: message.method, ...receipt }); break;
      }
      case 'Network.loadingFinished': completedRequests.add(p.requestId); add('network', { event: message.method, ...p }); break;
      case 'Network.loadingFailed': add('network', { event: message.method, ...p }); break;
      case 'Network.requestServedFromCache': add('network', { event: message.method, ...p }); break;
    }
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable', { maxTotalBufferSize: 12000000, maxResourceBufferSize: 3000000 });
  await send('Log.enable'); await send('ServiceWorker.enable');
  try { await send('Target.setDiscoverTargets', { discover: true }); } catch (error) { report.targetDiscoveryError = error.message; }
  await send('Page.addScriptToEvaluateOnNewDocument', { source: installDiagnostics });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  activeLoader = (await send('Page.navigate', { url: selectedUrl }, 30000)).loaderId;
  const first = await observe(s => realRoute(s) && s.worker.controlled, phaseDeadline - 15000, 'first-B-visit');
  check('online first visit has real route and controlling worker', first.reached, first.latest, true);
  const firstDocument = await documentEvidence(activeLoader);
  check('first actual Document is B', firstDocument.status === 200 && firstDocument.containsExpectedBuildB,
    firstDocument, true);
  // A normal controlled revisit populates the SW caches; do not manually seed or clear them.
  activeLoader = (await send('Page.navigate', { url: selectedUrl }, 30000)).loaderId;
  const baseline = await observe(s => realRoute(s) && s.worker.controlled, phaseDeadline - 8000, 'controlled-B-baseline');
  const online = await capture('online-B-390x844', activeLoader);
  check('online controlled baseline verified', baseline.reached && online.document.containsExpectedBuildB &&
    online.document.status === 200 && online.stable && !!online.path, online, true);
  report.onlineDataResponses = dataResponses('online');
  report.cacheInspection = await evaluate(`(async()=>{const result=[];for(const name of await caches.keys()){
    const requests=await(await caches.open(name)).keys();result.push({name,count:requests.length,
      relevantUrls:requests.map(r=>r.url).filter(url=>/worker|maplibre|\\/_next\\/static\\/|\\/scores?\\/|\\/geom\\//i.test(url)).slice(0,1000)});
    }return result})()`);
  await proxySnapshot('before-outage-control');
  report.onlineFinishedAt = new Date().toISOString();
  report.onlineElapsedMs = Date.parse(report.onlineFinishedAt) - Date.parse(report.onlineStartedAt);
  check('online phase within 120 seconds', report.onlineElapsedMs <= onlineBudgetMs, report.onlineElapsedMs, true);
  phase = 'outage'; phaseDeadline = Date.now() + outageBudgetMs;
  report.outageStartedAt = new Date().toISOString();
  await control('offline');
  const beforeOutage = await proxySnapshot('outage-start');
  check('origin outage enabled on B', beforeOutage?.offline === true && beforeOutage?.active === 'B', beforeOutage, true);
  activeLoader = (await send('Page.navigate', { url: selectedUrl }, 30000)).loaderId;
  const recovery = await observe(s => realRoute(s) && s.worker.controlled, phaseDeadline - 20000, 'origin-outage');
  // Failure is diagnostic output, not a reason to skip the screenshot and network receipts.
  const offline = await capture('outage-B-390x844', activeLoader);
  report.outageObservation = { reachedRealRoute: recovery.reached, latest: recovery.latest };
  report.outageDataResponses = dataResponses('outage');
  const restored = kind => report.outageDataResponses.filter(r => r.artifact === kind && r.status === 200 && r.fromServiceWorker);
  report.recovery = {
    documentB: offline.document.containsExpectedBuildB === true,
    documentFromServiceWorker: offline.document.fromServiceWorker === true,
    metrics: offline.after?.metrics ?? offline.before?.metrics ?? [],
    metricsEqualOnline: JSON.stringify(offline.after?.metrics) === JSON.stringify(online.after?.metrics),
    routeCount: offline.after?.routeCount ?? offline.before?.routeCount ?? null,
    routeRecovered: recovery.reached, score200FromSW: restored('score'), geom200FromSW: restored('geom'),
  };
  check('outage actual Document is cached B', report.recovery.documentB && report.recovery.documentFromServiceWorker, offline.document);
  check('outage restores matching four metrics', report.recovery.metrics.length === 4 && report.recovery.metricsEqualOnline, report.recovery.metrics);
  check('outage score and geometry have 200 SW responses', restored('score').length > 0 && restored('geom').length > 0,
    { score: restored('score'), geom: restored('geom') });
  check('outage route observation captured without requiring success', [0, 4].includes(report.recovery.routeCount) && !!offline.path,
    { routeCount: report.recovery.routeCount, stable: offline.stable, screenshot: offline.path });
  check('outage selected route survives', recovery.reached && offline.stable && report.recovery.routeCount === 4, report.recovery);
  await proxySnapshot('outage-end');
  report.outageFinishedAt = new Date().toISOString();
  report.outageElapsedMs = Date.parse(report.outageFinishedAt) - Date.parse(report.outageStartedAt);
  check('outage phase within 45 seconds', report.outageElapsedMs <= outageBudgetMs, report.outageElapsedMs);
  check('no uncaught page exceptions', report.exceptions.length === 0, report.exceptions);
} catch (error) {
  report.failure = error.stack;
  console.error(error.stack);
  if (ws?.readyState === 1 && Date.now() < phaseDeadline) {
    try { await capture(`${phase}-failure`, activeLoader); } catch (captureError) { report.failureCaptureError = captureError.message; }
  }
} finally {
  phase = 'cleanup'; phaseDeadline = Date.now() + 15000;
  try { await control('online'); report.cleanup.originRestoredOnline = true; }
  catch (error) { report.cleanup.originRestoredOnline = false; report.cleanup.restoreError = error.message; }
  const finalProxy = await proxySnapshot('after-restore');
  report.cleanup.originVerifiedOnline = finalProxy?.offline === false;
  if (chrome) {
    if (ws?.readyState === 1) {
      try { await send('Browser.close', {}, 2000); report.cleanup.browserCloseSent = true; }
      catch (error) { report.cleanup.browserCloseError = error.message; }
    }
    if (chrome.exitCode === null && chrome.signalCode === null) {
      // This handle belongs only to the Chrome spawned above; never enumerate or kill other browsers.
      report.cleanup.ownedChromeKillSent = chrome.kill();
      const end = Date.now() + remaining(8000);
      while (chrome.exitCode === null && chrome.signalCode === null && Date.now() < end) await delay(100);
    }
    report.cleanup.chromeExitCode = chrome.exitCode;
    report.cleanup.chromeSignalCode = chrome.signalCode;
    report.cleanup.chromeExited = chrome.exitCode !== null || chrome.signalCode !== null;
  }
  ws?.close();
  for (const waiter of pending.values()) waiter.reject(Error('Owned diagnostic shutting down'));
  pending.clear();
  process.removeListener('SIGINT', fail); process.removeListener('SIGTERM', fail);
  report.finishedAt = new Date().toISOString();
  report.completedPageRequests = completedRequests.size;
  const workerReceipts = report.proxySnapshots.flatMap(snapshot => snapshot.value?.requests || [])
    .filter(receipt => mapWorkerPaths.includes(receipt.path));
  report.proxyMapWorkerReceipts = [...new Map(workerReceipts.map(receipt =>
    [`${receipt.at}|${receipt.path}|${receipt.status}|${receipt.active}|${receipt.offline}`, receipt])).values()];
  report.worker503DuringOutage = report.proxyMapWorkerReceipts.filter(receipt => receipt.active === 'B' &&
    receipt.offline === true && receipt.status === 503 && report.outageStartedAt && receipt.at >= report.outageStartedAt);
  report.worker503Interpretation = report.worker503DuringOutage.length > 0
    ? 'Proxy observed 503 for the configured MapLibre worker or shared module during this B origin outage.'
    : 'No matching 503 in available bounded proxy receipts; this does not prove worker availability.';
  report.ok = !report.failure && report.checks.every(c => c.pass) && report.cleanup.originVerifiedOnline &&
    (!chrome || report.cleanup.chromeExited === true);
  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ report: resolve(out, 'browser.json'), ok: report.ok, recovery: report.recovery,
    cleanup: report.cleanup }, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}
