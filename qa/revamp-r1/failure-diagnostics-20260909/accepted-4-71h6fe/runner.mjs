import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const origin = 'http://127.0.0.1:4332';
const metrics = { 'Walk distance': '81 m', Covered: '55%', Uncovered: '37 m', 'Longest gap': '20 m' };
const [label, build, extra] = process.argv.slice(2);
function faultPath(scenario, url) {
  try {
    const value = new URL(url);
    if (value.origin !== origin || value.search || value.hash) return false;
    if (scenario === 'worker') return value.pathname === '/maplibre/6.1.0/maplibre-gl-worker.mjs';
    return scenario === 'geometry' ? /^\/data\/[^/]+\/geom\//.test(value.pathname)
      : scenario === 'score' && /^\/data\/[^/]+\/scores\//.test(value.pathname);
  } catch { return false; }
}
function errorDisposition(event, network) {
  const unexpected = reason => ({ disposition: 'unexpected', reason });
  if (event.payload?.kind === 'document-start') return { disposition: 'informational', reason: 'Document binding receipt' };
  if (event.method === 'Runtime.exceptionThrown' || ['window-error', 'unhandled-rejection'].includes(event.payload?.kind)) {
    return unexpected('Runtime exception or persistent page failure');
  }
  if (event.method === 'Runtime.consoleAPICalled') return event.params.type === 'error'
    ? unexpected('Console error') : { disposition: 'informational', reason: 'Recorded console warning' };
  const entry = event.params?.entry;
  if (entry && entry.level !== 'error') return { disposition: 'informational', reason: 'Recorded browser log' };
  const resource = event.payload?.kind === 'resource-error';
  const url = resource ? event.payload.url : entry?.source === 'network' ? entry.url : null;
  if (url) {
    let optionalGzip = false;
    try {
      const parsed = new URL(url);
      optionalGzip = parsed.origin === origin && !parsed.search && !parsed.hash
        && /^\/data\/[^/]+\/(?:manifest|scores\/[^/]+|geom\/(?:index|postal-index|h3\/[^/]+|postal-prefix\/[^/]+)|transit\/pois)\.json\.gz$/.test(parsed.pathname);
    } catch { /* No allowlist match for invalid URLs. */ }
    const responses = network.filter(item => item.scenario === event.scenario && item.phase === event.phase
      && item.sessionId === event.sessionId && item.method === 'Network.responseReceived');
    const missing = responses.find(item => item.params.response.status === 404 && item.params.response.url === url);
    if (optionalGzip && missing && responses.some(item => item.params.response.status === 200
      && item.params.response.url === url.slice(0, -3) && item.params.loaderId === missing.params.loaderId)) {
      return { disposition: 'expected-fallback', reason: 'Optional gzip404 followed by plain JSON200 in the same Document' };
    }
  }
  if (!url || event.phase !== 'fault' || !faultPath(event.scenario, url)) return unexpected('No matching fault resource');
  const sameAttempt = item => item.scenario === event.scenario && item.phase === 'fault';
  if (network.some(item => sameAttempt(item) && item.method === 'Network.responseReceived'
    && item.params.response.status === 503 && item.params.response.url === url)) {
    return { disposition: 'expected-fault', reason: 'Observed HTTP503 for the exact injected resource' };
  }
  const compressedFailed = network.some(item => sameAttempt(item) && item.method === 'Network.responseReceived'
    && item.params.response.status === 503 && item.params.response.url === url + '.gz');
  const cacheMiss = network.some(item => {
    if (!sameAttempt(item) || item.method !== 'Network.loadingFailed' || item.params.errorText !== 'net::ERR_CACHE_MISS') return false;
    return network.some(request => sameAttempt(request) && request.sessionId === item.sessionId
      && request.method === 'Network.requestWillBeSent' && request.params.requestId === item.params.requestId
      && request.params.request.url === url);
  });
  return compressedFailed && cacheMiss
    ? { disposition: 'expected-fault', reason: 'Observed cache-only miss after the corresponding injected gzip503' }
    : unexpected('Fault resource error lacks matching network evidence');
}
async function driverSelfTests() {
  const { default: assert } = await import('node:assert/strict');
  const url = origin + '/data/pinned/geom/index.json';
  const error = { scenario: 'geometry', phase: 'fault', method: 'Log.entryAdded', params: { entry: { level: 'error', source: 'network', url } } };
  const response = { scenario: 'geometry', phase: 'fault', method: 'Network.responseReceived', params: { response: { status: 503, url } } };
  const cases = [
    ['exact HTTP503', error, [response], 'expected-fault'],
    ['no network evidence', error, [], 'unexpected'],
    ['wrong scenario', error, [{ ...response, scenario: 'worker' }], 'unexpected'],
    ['recovery errors', { ...error, phase: 'recovery' }, [response], 'unexpected'],
    ['runtime exceptions never excused', { ...error, method: 'Runtime.exceptionThrown' }, [response], 'unexpected'],
    ['console errors never excused', { ...error, method: 'Runtime.consoleAPICalled', params: { type: 'error' } }, [response], 'unexpected'],
    ['old Document rejection remains fatal', { ...error, payload: { kind: 'unhandled-rejection', timeOrigin: 1 } }, [response], 'unexpected'],
    ['window errors never excused', { ...error, payload: { kind: 'window-error' } }, [response], 'unexpected'],
    ['resource error with exact evidence', { ...error, payload: { kind: 'resource-error', url } }, [response], 'expected-fault'],
    ['Document binding receipt', { payload: { kind: 'document-start' } }, [], 'informational'],
    ['warnings retained without being errors', { method: 'Runtime.consoleAPICalled', params: { type: 'warn' } }, [], 'informational'],
  ];
  const gzip = { ...response, params: { response: { status: 503, url: url + '.gz' } } };
  const request = { scenario: 'geometry', phase: 'fault', sessionId: 's', method: 'Network.requestWillBeSent', params: { requestId: 'r', request: { url } } };
  const miss = { scenario: 'geometry', phase: 'fault', sessionId: 's', method: 'Network.loadingFailed', params: { requestId: 'r', errorText: 'net::ERR_CACHE_MISS' } };
  cases.push(['exact cache miss', error, [gzip, request, miss], 'expected-fault'],
    ['cache miss without request identity', error, [gzip, miss], 'unexpected']);
  const fallbackError = { ...error, params: { entry: { ...error.params.entry, url: url + '.gz' } } };
  const optional = { ...response, params: { loaderId: 'd', response: { status: 404, url: url + '.gz' } } };
  const plain = { ...response, params: { loaderId: 'd', response: { status: 200, url } } };
  cases.push(['optional gzip fallback', fallbackError, [optional, plain], 'expected-fallback'],
    ['gzip404 without plain success', fallbackError, [optional], 'unexpected'],
    ['plain success from different Document', fallbackError, [optional, { ...plain, params: { ...plain.params, loaderId: 'other' } }], 'unexpected']);
  for (const [name, event, network, expected] of cases) {
    assert.equal(errorDisposition(event, network).disposition, expected, name);
    console.log('PASS ' + name);
  }
  console.log(JSON.stringify({ tests: cases.length, failed: 0 }));
}
if (label === '--self-test' && !build && !extra) {
  await driverSelfTests();
  process.exit(0);
}
if (extra || !/^[a-z0-9-]{1,60}$/.test(label || '') || !/^[\w-]{1,100}$/.test(build || '')) {
  throw Error('Fresh lowercase label and expected BUILD_ID required');
}
const started = Date.now(), overallDeadline = started + 600_000, workDeadline = overallDeadline - 90_000;
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/failure-diagnostics-20260909', label + '-'));
const runner = readFileSync(new URL(import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
writeFileSync(resolve(out, 'runner.mjs'), runner, { flag: 'wx' });
const report = {
  root, hostname: process.env.COMPUTERNAME, out, build, label, startedAt: new Date(started).toISOString(),
  runner: { path: resolve(out, 'runner.mjs'), bytes: runner.length, sha256: sha(runner) },
  limits: { overallMs: 600_000, cleanupReserveMs: 90_000, chromeStartupMs: 40_000, cdpMs: 45_000, appWaitMs: 90_000 },
  policy: 'One owned Chrome, separate fresh contexts; server-only geometry/score/worker503 faults. Network.setBypassServiceWorker=true and Network.setCacheDisabled=true. QA SW adapter suppresses registration; NO SW upgrade/cache-recovery coverage. QA clipboard adapter rejects without calling native clipboard. API requests are blocked before the server and fail acceptance. No installs, pipeline, deployment or protected-data writes. Raw errors/URLs/postal exist only in QA receipts; copied diagnostics are independently allowlisted. Page-target network plus attached-worker observations are not complete worker/network accounting or performance measurements.',
  interventions: { bypassServiceWorker: true, cacheDisabled: true, suppressServiceWorkerRegistration: true, rejectClipboardWithoutNativeWrite: true },
  checks: [], scenarios: [], network: [], errors: [], pageEvents: [], asyncErrors: [], targets: [], faults: [], captures: [], overflow: [], cleanup: {},
};
const delay = ms => new Promise(done => setTimeout(done, ms));
const asError = error => error instanceof Error ? error : Error(String(error));
const errorText = error => asError(error).stack;
let chrome, profile, ws, current, sequence = 0, stderr = '', cleaning = false, transportError, asyncError;
let changedFault = false;
const pending = new Map(), sessions = new Map(), eventTasks = new Set();

function within(path, base) {
  const part = relative(base, path);
  if (part === '..' || part.startsWith('..' + sep) || isAbsolute(part)) throw Error('Path escapes permitted root: ' + path);
  return path;
}
function remaining(end = workDeadline) {
  const ms = end - Date.now();
  if (ms <= 0) throw Error('Wall-clock budget exhausted');
  return ms;
}
function health() {
  remaining();
  if (transportError) throw transportError;
  if (asyncError) throw asyncError;
}
function check(name, pass, detail = null) {
  report.checks.push({ name, pass: Boolean(pass), detail });
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
function trackEvent(task) {
  const caught = task.catch(error => {
    append(report.asyncErrors, { at: Date.now(), error: errorText(error) }, 100, 'asyncErrors');
    asyncError ??= asError(error);
  });
  eventTasks.add(caught);
  void caught.then(() => eventTasks.delete(caught));
}
async function drainEvents(end = workDeadline) {
  while (eventTasks.size) {
    const tasks = [...eventTasks];
    let timer;
    try {
      await Promise.race([
        Promise.all(tasks),
        new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Event drain timeout')), Math.min(10_000, remaining(end))); }),
      ]);
    } finally { clearTimeout(timer); }
  }
}
async function send(method, params = {}, sessionId, timeout = 45_000, end = cleaning ? overallDeadline : workDeadline) {
  const budget = Math.min(timeout, remaining(end));
  if (ws?.readyState !== WebSocket.OPEN) throw Error('CDP socket not open: ' + method);
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
  const response = await send('Runtime.evaluate', {
    expression: '(' + fn.toString() + ')(' + JSON.stringify(arg ?? null) + ')', returnByValue: true, awaitPromise: true,
  }, context.sessionId, 45_000, end);
  if (response.exceptionDetails) throw Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result.value;
}
async function serverJson(path, options = {}, end = workDeadline) {
  const response = await fetch(origin + path, { ...options, signal: AbortSignal.timeout(Math.min(10_000, remaining(end))) });
  if (!response.ok) throw Error('QA server HTTP ' + response.status + ': ' + path);
  return response.json();
}
function sameServer(status) {
  return status.build === build && status.pid === report.preview.pid && status.nextPid === report.preview.nextPid
    && status.snapshot === report.preview.snapshot;
}
async function fault(mode, end = workDeadline) {
  const before = await serverJson('/__qa/status', {}, end);
  if (!sameServer(before)) throw Error('Preview identity changed; refusing QA fault mutation');
  changedFault = true;
  const result = await serverJson('/__qa/fault', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }),
  }, end);
  const after = await serverJson('/__qa/status', {}, end);
  report.faults.push({ mode, at: Date.now(), before, result, after });
  if (!sameServer(after) || after.mode !== mode) throw Error('QA fault readback mismatch: ' + mode);
}
function snapshotIdentity(snapshot) {
  if (typeof snapshot !== 'string' || !isAbsolute(snapshot)) throw Error('Preview snapshot must be absolute');
  const base = within(realpathSync(within(resolve(snapshot), resolve(root, 'tmp'))), realpathSync(resolve(root, 'tmp')));
  const choices = [base, resolve(base, 'web')].filter(path => existsSync(resolve(path, '.next/BUILD_ID')));
  check('exactly one preview web build root', choices.length === 1, choices);
  const web = within(realpathSync(choices[0]), base);
  check('snapshot BUILD_ID matches', readFileSync(resolve(web, '.next/BUILD_ID'), 'utf8').trim() === build);
  const bundleBytes = readFileSync(resolve(web, 'data-bundle.json'));
  const bundle = JSON.parse(bundleBytes).bundle;
  check('snapshot has a safe pinned bundle identifier', typeof bundle === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(bundle), bundle);
  report.snapshot = { web, bundle, bundleConfigSha256: sha(bundleBytes) };
  report.publicBuildExpectation = 'app_build_id=null: no explicitly injected public app build ID is supplied to this acceptance. The Next BUILD_ID is verified separately, never substituted into copied diagnostics.';
}

// No native clipboard method or service-worker registration is invoked by these adapters.
function pageAdapters() {
  const qa = window.__qaFailure = { stages: [], unhandled: [], clipboardCalls: [], swCalls: [], overflow: false, installed: false };
  if (typeof window.__qaFailureRecord !== 'function') throw Error('CDP failure-event binding was not installed');
  const stringify = value => {
    try { return String(value); } catch { return '[unprintable error]'; }
  };
  const stack = value => {
    try { return typeof value?.stack === 'string' ? value.stack : null; } catch { return null; }
  };
  let emitted = 0;
  const emit = event => {
    if (++emitted > 100) { qa.overflow = true; return; }
    window.__qaFailureRecord(JSON.stringify({
      ...event, documentUrl: location.href, timeOrigin: performance.timeOrigin, at: performance.now(),
    }));
  };
  // The binding delivers into the Node receipt before navigation destroys this Window.
  window.addEventListener('error', event => {
    const resource = event.target && event.target !== window && event.target instanceof Element ? event.target : null;
    emit(resource ? { kind: 'resource-error', tag: resource.tagName, url: resource.src || resource.href || null }
      : { kind: 'window-error', message: event.message || '', url: event.filename || null,
        line: event.lineno ?? null, column: event.colno ?? null, stack: stack(event.error) });
  }, true);
  window.addEventListener('unhandledrejection', event => {
    const detail = { kind: 'unhandled-rejection', message: stringify(event.reason), stack: stack(event.reason) };
    emit(detail);
    if (qa.unhandled.length >= 100) qa.overflow = true;
    else qa.unhandled.push({ ...detail, at: performance.now() });
  });
  emit({ kind: 'document-start' });
  const add = (list, value, cap) => { if (list.length >= cap) qa.overflow = true; else list.push(value); };
  Object.defineProperty(navigator, 'clipboard', { configurable: false, value: Object.freeze({
    writeText(value) {
      add(qa.clipboardCalls, { value, at: performance.now() }, 20);
      return Promise.reject(new DOMException('QA clipboard intentionally denied', 'NotAllowedError'));
    },
  }) });
  Object.defineProperty(navigator, 'serviceWorker', { configurable: false, value: Object.freeze({
    controller: null,
    getRegistration() { add(qa.swCalls, 'getRegistration', 30); return Promise.resolve(undefined); },
    register() { add(qa.swCalls, 'register-suppressed', 30); return Promise.reject(new Error('QA SW registration suppressed')); },
  }) });
  qa.installed = true;
  let previous;
  const record = () => {
    const main = document.querySelector('main');
    if (!main) return;
    const next = { status: main.dataset.mapStatus ?? null, stage: main.dataset.mapStage ?? null, reason: main.dataset.mapFailure ?? null };
    const key = JSON.stringify(next);
    if (key === previous) return;
    previous = key;
    add(qa.stages, { ...next, at: performance.now() }, 1_000);
  };
  new MutationObserver(record).observe(document, {
    subtree: true, childList: true, attributes: true, attributeFilter: ['data-map-status', 'data-map-stage', 'data-map-failure'],
  });
}
function facts() {
  const rect = node => {
    const r = node?.getBoundingClientRect();
    return r ? { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom } : null;
  };
  const shown = node => {
    const r = rect(node), style = node && getComputedStyle(node);
    return !!r && r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  };
  const clippedRect = node => {
    const r = rect(node);
    if (!shown(node)) return null;
    let left = Math.max(0, r.x), top = Math.max(0, r.y);
    let right = Math.min(innerWidth, r.right), bottom = Math.min(innerHeight, r.bottom);
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent), box = parent.getBoundingClientRect();
      const x = box.left + parent.clientLeft, y = box.top + parent.clientTop;
      if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
        left = Math.max(left, x); right = Math.min(right, x + parent.clientWidth);
      }
      if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
        top = Math.max(top, y); bottom = Math.min(bottom, y + parent.clientHeight);
      }
    }
    return { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top), right, bottom };
  };
  const inView = node => {
    const r = rect(node), clipped = clippedRect(node);
    return !!r && !!clipped && clipped.width > 0 && clipped.height > 0
      && clipped.width >= r.width - 1 && clipped.height >= r.height - 1;
  };
  const hit = node => {
    if (!inView(node)) return false;
    const r = rect(node), target = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return target === node || node.contains(target);
  };
  const buttons = [...document.querySelectorAll('button')];
  const button = name => buttons.find(node => (node.getAttribute('aria-label') || node.textContent.trim()) === name);
  const buttonFacts = node => ({ present: !!node, visible: inView(node), hit: hit(node), disabled: node?.disabled ?? null,
    focused: !!node && document.activeElement === node, rect: rect(node) });
  const copies = buttons.filter(node => node.textContent.trim() === 'Copy diagnostics');
  const diagnostics = copies.map(copy => {
    const owner = copy.parentElement?.parentElement;
    const textarea = owner?.querySelector('textarea');
    const label = textarea && [...owner.querySelectorAll('label')].find(node => node.htmlFor === textarea.id);
    return {
      copy: buttonFacts(copy), select: buttonFacts([...owner.querySelectorAll('button')].find(node => node.getAttribute('aria-label') === 'Select diagnostics')),
      hide: buttonFacts([...owner.querySelectorAll('button')].find(node => node.getAttribute('aria-label') === 'Hide diagnostics')),
      status: owner?.querySelector('[role="status"]')?.textContent.trim() ?? null,
      textarea: { present: !!textarea, value: textarea?.value ?? null, readOnly: textarea?.readOnly ?? null, label: label?.textContent.trim() ?? null,
        visible: inView(textarea), hit: hit(textarea), rect: rect(textarea), focused: !!textarea && document.activeElement === textarea,
        selectionStart: textarea?.selectionStart ?? null, selectionEnd: textarea?.selectionEnd ?? null },
    };
  });
  const main = document.querySelector('main'), summary = document.querySelector('[aria-label="Walk summary"]');
  const metrics = {}, metricVisible = {}, metricBounds = {};
  for (const strong of summary?.querySelectorAll('strong') ?? []) {
    const label = strong.parentElement.querySelector('span')?.textContent.trim();
    if (['Walk distance', 'Covered', 'Uncovered', 'Longest gap'].includes(label)) {
      metrics[label] = strong.textContent.replace(/\s+/g, ' ').trim();
      metricVisible[label] = inView(strong) && hit(strong);
      metricBounds[label] = { rect: rect(strong), clipped: clippedRect(strong), hit: hit(strong) };
    }
  }
  const map = window.__shiokRouteMap, debug = window.__shiokRouteDebug;
  let featureCount = 0, routeIds = [], basemap = false, tilesLoaded = false, moving = null, mapProbeError = null;
  try {
    const features = map?.getLayer('shiokest-route-line')
      ? map.queryRenderedFeatures({ layers: ['shiokest-route-line'] }).filter(feature => feature.properties?.render_key === debug?.routeKey) : [];
    featureCount = features.length; routeIds = [...new Set(features.map(feature => feature.properties?.route_id))];
    basemap = !!map?.getSource('onemap') && map.isSourceLoaded('onemap');
    tilesLoaded = !!map?.areTilesLoaded(); moving = map?.isMoving() ?? null;
  } catch (error) { mapProbeError = String(error); }
  const input = document.querySelector('#postal-search-input'), submit = document.querySelector('#postal-search-button');
  return {
    url: location.href, timeOrigin: performance.timeOrigin, viewport: [innerWidth, innerHeight],
    shell: !!main && !!document.querySelector('h1'), input: input?.value ?? null,
    inputUsable: inView(input) && hit(input) && !input.disabled, submitUsable: inView(submit) && hit(submit) && !submit.disabled,
    inputHydrated: !!input && Object.keys(input).some(key => key.startsWith('__reactProps$') && typeof input[key]?.onChange === 'function'),
    mapStatus: main?.dataset.mapStatus ?? null, mapStage: main?.dataset.mapStage ?? null, mapReason: main?.dataset.mapFailure ?? null,
    summary: { postal: summary?.getAttribute('data-postal') ?? null, metrics, metricVisible, metricBounds,
      rect: rect(summary), clipped: clippedRect(summary),
      ancestors: (() => {
        const ancestors = [];
        for (let node = summary?.parentElement; node && ancestors.length < 8; node = node.parentElement) {
          const style = getComputedStyle(node);
          ancestors.push({ tag: node.tagName, className: String(node.className), rect: rect(node),
            clientHeight: node.clientHeight, scrollHeight: node.scrollHeight, scrollTop: node.scrollTop,
            overflowX: style.overflowX, overflowY: style.overflowY, minHeight: style.minHeight, maxHeight: style.maxHeight });
        }
        return ancestors;
      })() },
    alerts: [...document.querySelectorAll('[role="alert"]')].map(node => node.textContent.trim()),
    geometryMessage: (document.body?.textContent ?? '').includes('Walk geometry could not load. Your record is still available.'),
    retryGeometry: buttonFacts(button('Retry geometry')), retrySelection: buttonFacts(button('Retry selection')), reload: buttonFacts(button('Reload page')),
    diagnostics, qa: window.__qaFailure ?? null,
    mapPresent: !!map, routeKey: debug?.routeKey ?? null, featureCount, routeIds, basemap, tilesLoaded, moving, mapProbeError,
    documentWidth: document.documentElement.scrollWidth,
  };
}
function walkIntact(value) {
  return value.summary.postal === '018956' && Object.entries(metrics).every(([key, expected]) => value.summary.metrics[key] === expected);
}
function usableWalk(value) {
  return walkIntact(value) && Object.keys(metrics).every(key => value.summary.metricVisible[key]);
}
function healthy(value) {
  return value.mapStatus === 'ready' && value.mapStage === null && value.mapReason === null && usableWalk(value)
    && value.shell && value.inputUsable && value.submitUsable
    && value.featureCount === 4 && value.routeIds.length === 1 && value.routeIds[0] === 'primary' && !!value.routeKey
    && value.basemap && value.tilesLoaded && !value.moving && value.diagnostics.length === 0 && !value.mapProbeError;
}
const geometryFailed = value => value.geometryMessage && value.retryGeometry.present && walkIntact(value)
  && value.diagnostics.length === 1 && !['error', 'partial'].includes(value.mapStatus);
const scoreFailed = value => value.alerts.includes('Shelter-map data could not load. Try this postal code again.')
  && value.retrySelection.present && value.diagnostics.length === 1 && !['error', 'partial'].includes(value.mapStatus);
const workerFailed = value => value.mapStatus === 'error' && value.mapStage === 'map-startup'
  && ['error', 'timeout'].includes(value.mapReason) && value.reload.present && value.diagnostics.length === 1 && walkIntact(value);

async function sample(context, name, end = workDeadline) {
  const value = await call(context, facts, null, end);
  append(context.receipt.samples, { name, at: Date.now(), value }, 1_000, context.name + ' samples');
  report.lastSample = { name, scenario: context.name, value };
  if (!value.qa?.installed || value.qa.overflow) throw Error('QA adapter missing or page receipt overflow');
  return value;
}
async function waitFor(context, name, predicate, limit = 90_000) {
  const end = Math.min(workDeadline, Date.now() + Math.min(limit, 90_000));
  let value;
  while (Date.now() < end) {
    health();
    try { value = await sample(context, name, end); }
    catch (error) {
      if (Date.now() >= end) throw Error('App wait expired: ' + name + '; ' + asError(error).message);
      throw error;
    }
    if (predicate(value)) return value;
    await delay(Math.max(0, Math.min(250, end - Date.now())));
  }
  throw Error('App wait expired: ' + name + ' ' + JSON.stringify(value));
}
async function waitNetwork(context, name, predicate, limit = 45_000) {
  const end = Math.min(workDeadline, Date.now() + limit);
  while (Date.now() < end) {
    health();
    const found = predicate();
    if (found) return found;
    await delay(Math.max(0, Math.min(100, end - Date.now())));
  }
  throw Error('Network wait expired: ' + context.name + ' ' + name);
}
function signature(value) {
  return JSON.stringify([value.timeOrigin, value.viewport, value.mapStatus, value.mapStage, value.mapReason, value.summary,
    value.routeKey, value.featureCount, value.routeIds, value.basemap, value.tilesLoaded, value.moving, value.diagnostics]);
}
async function capture(context, name, predicate) {
  let before, last, stable = 0;
  if (predicate) {
    const end = Math.min(workDeadline, Date.now() + 25_000);
    while (Date.now() < end) {
      health(); before = await sample(context, name + ' settling', end);
      const next = signature(before);
      stable = predicate(before) && context.pendingData.size === 0 && next === last ? stable + 1 : 0;
      last = next;
      if (stable >= 3) break;
      await delay(Math.max(0, Math.min(250, end - Date.now())));
    }
    check(name + ' stable capture state', stable >= 3, { before, pendingData: [...context.pendingData] });
  } else before = await sample(context, name + ' before');
  const frame = (await send('Page.getFrameTree', {}, context.sessionId)).frameTree.frame;
  check(name + ' belongs to verified main Document', frame.id === context.frameId && frame.loaderId === context.loaderId, frame);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, context.sessionId);
  const bytes = Buffer.from(shot.data, 'base64'), path = resolve(out, context.name + '-' + name + '.png');
  writeFileSync(path, bytes, { flag: 'wx' });
  const after = await sample(context, name + ' after');
  const afterFrame = (await send('Page.getFrameTree', {}, context.sessionId)).frameTree.frame;
  report.captures.push({ scenario: context.name, name, path, bytes: bytes.length, sha256: sha(bytes),
    frameId: frame.id, loaderId: frame.loaderId, afterFrame, before, after, pendingDataAfter: [...context.pendingData] });
  if (predicate) check(name + ' screenshot facts match', predicate(after) && signature(before) === signature(after)
    && !context.pendingData.size && afterFrame.id === frame.id && afterFrame.loaderId === frame.loaderId, { before, after });
}
async function click(context, name) {
  const point = await call(context, label => {
    const matches = [...document.querySelectorAll('button')].filter(node => (node.getAttribute('aria-label') || node.textContent.trim()) === label);
    if (matches.length !== 1) throw Error('Expected one button: ' + label + ', found ' + matches.length);
    const button = matches[0];
    button.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    const r = button.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
    if (button.disabled || r.width <= 0 || r.height <= 0 || x < 0 || y < 0 || x >= innerWidth || y >= innerHeight
      || document.elementFromPoint(x, y)?.closest('button') !== button) throw Error('Button is not actionable: ' + label);
    return { x, y };
  }, name);
  context.receipt.actions.push({ type: 'click', name, at: Date.now(), point });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point }, context.sessionId);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point }, context.sessionId);
}
async function viewport(context, width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, context.sessionId);
  context.receipt.actions.push({ type: 'viewport', width, height, at: Date.now() });
  await waitFor(context, 'viewport ' + width + 'x' + height, value => value.viewport[0] === width && value.viewport[1] === height, 10_000);
}
async function typePostal(context) {
  await call(context, () => { const input = document.querySelector('#postal-search-input'); input.focus(); input.select(); });
  await send('Input.insertText', { text: '018956' }, context.sessionId);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' }, context.sessionId);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }, context.sessionId);
}

function validateDiagnostic(value, kind) {
  const calls = value.qa.clipboardCalls;
  check(kind + ' explicit clipboard attempt only', calls.length === 1, calls);
  const raw = calls[0].value;
  check(kind + ' bounded clipboard string', typeof raw === 'string' && raw.length <= 2_048, { type: typeof raw, length: raw?.length });
  const diagnostic = JSON.parse(raw);
  const keys = ['schema', 'app_build_id', 'artifact_bundle_id', 'artifact_identity_source', 'area', 'status', 'stage', 'reason',
    'artifact_role', 'http_status', 'elapsed_ms', 'elapsed_basis'];
  check(kind + ' exact diagnostic schema keys', JSON.stringify(Object.keys(diagnostic).sort()) === JSON.stringify(keys.sort()), diagnostic);
  check(kind + ' pinned identities are truthful', diagnostic.schema === 'shiok-diagnostics-v1' && diagnostic.app_build_id === null
    && diagnostic.artifact_bundle_id === report.snapshot.bundle && diagnostic.artifact_identity_source === 'pinned-config', diagnostic);
  check(kind + ' no location, URL, path or secret-bearing extras', !/018956|560234|https?:|[A-Z]:[\\/]|\/data\/|\/api\/|QA clipboard/i.test(raw)
    && raw === JSON.stringify(diagnostic, null, 2), diagnostic);
  check(kind + ' finite operation duration', Number.isSafeInteger(diagnostic.elapsed_ms) && diagnostic.elapsed_ms >= 0
    && diagnostic.elapsed_ms <= 600_000, diagnostic);
  if (kind === 'worker') {
    check('worker diagnostic names actual UI startup callback, not an invented worker cause', diagnostic.area === 'map'
      && diagnostic.status === value.mapStatus && diagnostic.stage === value.mapStage && diagnostic.reason === value.mapReason
      && diagnostic.stage === 'map-startup' && ['error', 'timeout'].includes(diagnostic.reason)
      && diagnostic.artifact_role === null && diagnostic.http_status === null && diagnostic.elapsed_basis === 'map-attempt'
      && value.qa.stages.some(stage => stage.status === diagnostic.status && stage.stage === diagnostic.stage && stage.reason === diagnostic.reason), diagnostic);
  } else {
    check(kind + ' exact artifact classification', diagnostic.area === (kind === 'geometry' ? 'geometry-data' : 'score-data')
      && diagnostic.status === 'error' && diagnostic.stage === 'artifact-fetch' && diagnostic.reason === 'http'
      && diagnostic.http_status === 503 && diagnostic.artifact_role === (kind === 'geometry' ? 'geometry-index' : 'score-index')
      && diagnostic.elapsed_basis === 'artifact-operation', diagnostic);
  }
  const control = value.diagnostics[0];
  check(kind + ' readonly labelled fallback exactly matches clicked snapshot', value.diagnostics.length === 1
    && control.status === 'Copy unavailable.' && control.textarea.present
    && control.textarea.readOnly && control.textarea.label === 'Diagnostics' && control.textarea.value === raw, control);
  return diagnostic;
}
const manualUsable = value => {
  const control = value.diagnostics[0], field = control?.textarea;
  return value.diagnostics.length === 1 && field?.visible && field.hit && field.rect.height >= 96 && field.rect.height <= 144
    && field.rect.width <= value.viewport[0] && control.copy.visible && control.copy.hit
    && control.select.visible && control.select.hit && control.hide.visible && control.hide.hit
    && value.documentWidth <= value.viewport[0] + 1;
};
async function copyAndManual(context, kind, failed, captureBoth = false) {
  const manualReady = value => failed(value) && manualUsable(value) && (kind === 'score' || usableWalk(value))
    && (kind === 'worker' || (value.basemap && value.tilesLoaded && !value.moving));
  const before = await sample(context, kind + ' before explicit Copy');
  check(kind + ' did not auto-copy', before.qa.clipboardCalls.length === 0 && failed(before), before);
  await click(context, 'Copy diagnostics');
  const copied = await waitFor(context, kind + ' rejected clipboard fallback', value => failed(value)
    && value.qa.clipboardCalls.length === 1 && value.diagnostics[0]?.textarea.present, 15_000);
  context.receipt.diagnostic = validateDiagnostic(copied, kind);
  await waitFor(context, kind + ' manual controls and rendered record usable', manualReady, 15_000);
  await click(context, 'Select diagnostics');
  const selected = await waitFor(context, kind + ' manual text selected', value => value.diagnostics[0]?.textarea.focused
    && value.diagnostics[0].textarea.selectionStart === 0
    && value.diagnostics[0].textarea.selectionEnd === value.diagnostics[0].textarea.value.length, 10_000);
  check(kind + ' Select performed no extra OS copy', selected.qa.clipboardCalls.length === 1);
  await capture(context, 'manual-390x844', manualReady);
  if (captureBoth) {
    await viewport(context, 320, 667);
    await waitFor(context, 'small manual controls and unclipped record usable', manualReady, 15_000);
    await capture(context, 'manual-320x667', manualReady);
  }
  await click(context, 'Hide diagnostics');
  const hidden = await waitFor(context, kind + ' Hide restores Copy focus', value => failed(value)
    && !value.diagnostics[0].textarea.present && !value.diagnostics[0].select.present && !value.diagnostics[0].hide.present
    && value.diagnostics[0].copy.focused && value.diagnostics[0].status === '', 10_000);
  check(kind + ' Hide did not copy again', hidden.qa.clipboardCalls.length === 1);
}

async function blockApi(context, params, sessionId) {
  await send('Fetch.failRequest', { requestId: params.requestId, errorReason: 'BlockedByClient' }, sessionId);
  append(context.receipt.blockedApis, { at: Date.now(), params }, 30, 'blocked APIs');
  throw Error('Unexpected application API attempt; blocked before server');
}
function receive(message) {
  if (message.id) {
    const handler = pending.get(message.id);
    if (handler) message.error ? handler.reject(Error(JSON.stringify(message.error))) : handler.done(message.result);
    return;
  }
  const binding = sessions.get(message.sessionId);
  if (!binding) return;
  const context = binding.context, { method, params } = message;
  if (method === 'Runtime.executionContextCreated') {
    if (context.executionContexts.size >= 200) { asyncError ??= Error('Execution context receipt capacity exceeded'); return; }
    context.executionContexts.set(params.context.id, params.context);
  }
  if (method === 'Runtime.bindingCalled' && params.name === '__qaFailureRecord') {
    if (typeof params.payload !== 'string' || params.payload.length > 32_768) throw Error('Invalid failure-event binding payload');
    const payload = JSON.parse(params.payload), execution = context.executionContexts.get(params.executionContextId);
    if (!['document-start', 'window-error', 'unhandled-rejection', 'resource-error'].includes(payload.kind)
      || !Number.isFinite(payload.timeOrigin) || typeof payload.documentUrl !== 'string') throw Error('Malformed failure-event binding record');
    append(report.pageEvents, { scenario: context.name, sessionId: message.sessionId, receivedAt: Date.now(), phase: context.phase,
      executionContextId: params.executionContextId, frameId: execution?.auxData?.frameId ?? null, payload }, 1_000, 'page events');
  }
  if (method === 'Target.attachedToTarget') {
    const observation = { scenario: context.name, at: Date.now(), params, observerReady: false };
    append(report.targets, observation, 200, 'targets');
    if (params.targetInfo.type === 'service_worker') { asyncError ??= Error('Unexpected actual service worker target'); return; }
    if (params.targetInfo.type !== 'worker') return;
    sessions.set(params.sessionId, { context, worker: true });
    trackEvent((async () => {
      await send('Runtime.enable', {}, params.sessionId);
      await send('Network.enable', {}, params.sessionId);
      await send('Network.setCacheDisabled', { cacheDisabled: true }, params.sessionId);
      await send('Network.setBypassServiceWorker', { bypass: true }, params.sessionId);
      await send('Fetch.enable', { patterns: [{ urlPattern: '*://*/api/*', requestStage: 'Request' }] }, params.sessionId);
      observation.observerReady = true;
    })().catch(error => {
      // A deliberately failed worker can disappear before its observer is enabled.
      // This optional observer is not the503 proof; the page Network receipt is mandatory.
      observation.observerError = errorText(error);
      report.workerObservationIncomplete = true;
    }));
  }
  if (method.startsWith('Network.') && ['requestWillBeSent', 'responseReceived', 'loadingFinished', 'loadingFailed', 'requestServedFromCache'].includes(method.slice(8))) {
    append(report.network, { scenario: context.name, worker: binding.worker, sessionId: message.sessionId,
      receivedAt: Date.now(), phase: context.phase, method, params }, 12_000, 'network');
    const id = message.sessionId + ':' + params.requestId;
    if (method === 'Network.requestWillBeSent') {
      const url = new URL(params.request.url);
      if (url.pathname.startsWith('/api/')) asyncError ??= Error('Unexpected API attempt');
      if (url.pathname === '/sw.js') asyncError ??= Error('Unexpected actual SW download');
      if (!binding.worker && url.origin === origin && url.pathname.startsWith('/data/')) context.pendingData.set(id, params.request.url);
      if (!binding.worker && params.type === 'Document') context.documents.set(params.requestId, params);
    }
    if (method === 'Network.responseReceived') {
      if (!binding.worker) context.responses.set(params.requestId, params);
      if (params.response.status >= 400) context.pendingData.delete(id);
    }
    if (method === 'Network.loadingFinished' || method === 'Network.loadingFailed') context.pendingData.delete(id);
    if (!binding.worker && method === 'Network.loadingFinished') context.finished.add(params.requestId);
  }
  if (method === 'Runtime.exceptionThrown' || method === 'Log.entryAdded'
    || (method === 'Runtime.consoleAPICalled' && ['warn', 'error'].includes(params.type))) {
    append(report.errors, { scenario: context.name, worker: binding.worker, sessionId: message.sessionId,
      receivedAt: Date.now(), phase: context.phase, method, params }, 1_500, 'errors');
  }
  if (method === 'Fetch.requestPaused') trackEvent(blockApi(context, params, message.sessionId));
}
async function launchChrome() {
  profile = mkdtempSync(resolve(root, 'tmp/failure-diagnostics-browser-'));
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
    if (!endpoint) await delay(Math.max(0, Math.min(100, end - Date.now())));
  }
  if (!endpoint) throw Error('Browser startup exceeded 40 seconds');
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(endpoint).hostname)) throw Error('Non-local CDP endpoint');
  report.browserEndpoint = endpoint;
  ws = new WebSocket(endpoint);
  ws.onmessage = event => { try { receive(JSON.parse(event.data)); } catch (error) { asyncError ??= asError(error); } };
  await new Promise((done, reject) => {
    const timer = setTimeout(() => { ws.close(); reject(Error('Browser websocket startup timeout')); }, remaining(end));
    ws.onopen = () => { clearTimeout(timer); done(); };
    ws.onerror = () => { clearTimeout(timer); reject(Error('Browser websocket startup failed')); };
    ws.onclose = () => { clearTimeout(timer); reject(Error('Browser websocket closed during startup')); };
  });
  ws.onerror = () => { if (!cleaning) transportError = Error('CDP websocket error'); };
  ws.onclose = () => {
    if (!cleaning) transportError = Error('CDP websocket closed');
    for (const request of [...pending.values()]) request.reject(Error('CDP websocket closed'));
  };
}
async function createContext(name) {
  const { browserContextId } = await send('Target.createBrowserContext', { disposeOnDetach: true });
  const receipt = { name, browserContextId, freshContext: true, samples: [], documents: [], actions: [], blockedApis: [], startedAt: new Date().toISOString() };
  report.scenarios.push(receipt);
  const context = { name, receipt, browserContextId, phase: 'fault', executionContexts: new Map(),
    documents: new Map(), responses: new Map(), finished: new Set(), pendingData: new Map() };
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  context.targetId = targetId;
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  context.sessionId = sessionId; receipt.sessionId = sessionId; receipt.targetId = targetId;
  sessions.set(sessionId, { context, worker: false });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Runtime.addBinding', { name: '__qaFailureRecord' }, sessionId);
  await send('Log.enable', {}, sessionId);
  await send('Network.enable', { maxTotalBufferSize: 50_000_000, maxResourceBufferSize: 10_000_000 }, sessionId);
  await send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId);
  await send('Network.setBypassServiceWorker', { bypass: true }, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: '(' + pageAdapters.toString() + ')()' }, sessionId);
  await send('Fetch.enable', { patterns: [{ urlPattern: '*://*/api/*', requestStage: 'Request' }] }, sessionId);
  await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, sessionId);
  return context;
}
async function documentIdentity(context, loaderId) {
  const request = await waitNetwork(context, 'completed exact main Document', () => [...context.documents.values()].find(value =>
    value.frameId === context.frameId && value.loaderId === loaderId && context.finished.has(value.requestId)
    && new URL(value.request.url).origin === origin && new URL(value.request.url).pathname === '/'));
  const response = context.responses.get(request.requestId);
  check(context.name + ' main Document HTTP200', response?.response.status === 200 && response.frameId === context.frameId
    && response.loaderId === loaderId, response);
  const frame = (await send('Page.getFrameTree', {}, context.sessionId)).frameTree.frame;
  check(context.name + ' live main frame matches Document loader', frame.id === context.frameId && frame.loaderId === loaderId, frame);
  const result = await send('Network.getResponseBody', { requestId: request.requestId }, context.sessionId);
  const bytes = Buffer.from(result.body, result.base64Encoded ? 'base64' : 'utf8'), html = bytes.toString('utf8');
  const path = resolve(out, context.name + '-document-' + context.receipt.documents.length + '.html');
  writeFileSync(path, bytes, { flag: 'wx' });
  const index = html.indexOf(build);
  const timeOrigin = await call(context, () => performance.timeOrigin);
  const record = { requestId: request.requestId, frameId: request.frameId, loaderId, timeOrigin, path, url: request.request.url,
    bytes: bytes.length, sha256: sha(bytes), expectedBuildPresent: index >= 0,
    buildExcerpt: index < 0 ? null : html.slice(Math.max(0, index - 50), index + build.length + 50) };
  context.receipt.documents.push(record);
  context.loaderId = loaderId;
  check(context.name + ' actual main HTML contains expected build', index >= 0, record);
  check(context.name + ' persistent event binding acknowledged this main Document', report.pageEvents.some(event =>
    event.scenario === context.name && event.frameId === context.frameId && event.payload.kind === 'document-start'
    && event.payload.timeOrigin === timeOrigin), record);
  return record;
}
async function navigate(context) {
  const result = await send('Page.navigate', { url: origin + '/?debugMap=1' }, context.sessionId);
  if (result.errorText || !result.loaderId || !result.frameId) throw Error('Navigation lacked new main Document: ' + JSON.stringify(result));
  context.frameId = result.frameId;
  await documentIdentity(context, result.loaderId);
  await waitFor(context, 'hydrated search usable', value => value.shell && value.inputHydrated && value.inputUsable && value.submitUsable);
  await typePostal(context);
}
function faultResponses(context, kind) {
  return report.network.filter(event => {
    if (event.scenario !== context.name || event.method !== 'Network.responseReceived' || event.params.response.status !== 503) return false;
    const url = new URL(event.params.response.url);
    if (url.origin !== origin) return false;
    if (kind === 'worker') return url.pathname === '/maplibre/6.1.0/maplibre-gl-worker.mjs';
    return kind === 'geometry' ? /\/data\/[^/]+\/geom\/postal-prefix\/018\.json(?:\.gz)?$/.test(url.pathname)
      : /\/data\/[^/]+\/scores\/index\.json(?:\.gz)?$/.test(url.pathname);
  });
}
async function runScenario(context, kind) {
  const failed = kind === 'geometry' ? geometryFailed : kind === 'score' ? scoreFailed : workerFailed;
  await navigate(context);
  const failure = await waitFor(context, kind + ' current UI failure', failed);
  const actualResponses = await waitNetwork(context, kind + ' actual503 response', () => {
    const found = faultResponses(context, kind); return found.length ? found : null;
  });
  context.receipt.actualFaultResponses = actualResponses;
  check(kind + ' failure UI observed with real fault', failed(failure) && actualResponses.length > 0, failure);
  check(kind + ' search remains usable', failure.inputUsable && failure.submitUsable, failure);
  if (kind !== 'score') check(kind + ' four walk metrics usable before manual expansion', usableWalk(failure), failure.summary);
  await copyAndManual(context, kind, failed, kind === 'geometry');
  context.phase = 'recovery';
  await fault('clear');
  if (kind === 'worker') {
    const previous = context.loaderId, before = await sample(context, 'before explicit Reload');
    check('worker recovery has selected postal in URL', new URL(before.url).searchParams.get('postal') === '018956', before.url);
    await click(context, 'Reload page');
    const next = await waitNetwork(context, 'new main Document after explicit Reload', () => [...context.documents.values()].find(value =>
      value.frameId === context.frameId && value.loaderId !== previous && context.finished.has(value.requestId)
      && new URL(value.request.url).origin === origin && new URL(value.request.url).pathname === '/'));
    await documentIdentity(context, next.loaderId);
    const ready = await waitFor(context, 'worker clear and reload current route', healthy);
    check('worker recovery is a new Document with same postal', ready.timeOrigin !== before.timeOrigin
      && ready.input === '018956' && new URL(ready.url).searchParams.get('postal') === '018956', ready);
  } else {
    const documentCount = context.receipt.documents.length, previousTimeOrigin = (await sample(context, 'before retry')).timeOrigin;
    await click(context, kind === 'geometry' ? 'Retry geometry' : 'Retry selection');
    const ready = await waitFor(context, kind + ' clear and retry current route', healthy);
    check(kind + ' recovered without reloading', ready.timeOrigin === previousTimeOrigin && context.receipt.documents.length === documentCount, ready);
  }
  await capture(context, kind === 'geometry' ? 'healthy-320x667' : 'healthy-390x844', healthy);
  if (kind === 'geometry') {
    await viewport(context, 1440, 950);
    await waitFor(context, 'healthy desktop route and tiles', healthy);
    await capture(context, 'healthy-1440x950', healthy);
  }
}
async function closeContext(context) {
  // Await the final page sample before reading error arrays. Never snapshot the ledger
  // in an expression whose later awaited operand can append new page/transport errors.
  const final = await sample(context, 'final page ledger');
  context.receipt.finalPageLedger = { unhandled: final.qa.unhandled, stages: final.qa.stages, clipboardCalls: final.qa.clipboardCalls, swCalls: final.qa.swCalls };
  await drainEvents();
  health();
  check(context.name + ' final page has no unhandled rejections', final.qa.unhandled.length === 0, final.qa.unhandled);
  await send('Target.disposeBrowserContext', { browserContextId: context.browserContextId });
  await drainEvents();
  for (const [id, binding] of sessions) if (binding.context === context) sessions.delete(id);
  context.receipt.disposedAt = new Date().toISOString();
}

try {
  report.preview = await serverJson('/__qa/status');
  check('preview expected build, fresh clear mode and concrete process identities', report.preview.build === build && report.preview.mode === 'clear'
    && Number.isSafeInteger(report.preview.pid) && report.preview.pid > 0 && Number.isSafeInteger(report.preview.nextPid) && report.preview.nextPid > 0, report.preview);
  snapshotIdentity(report.preview.snapshot);
  await launchChrome();
  for (const kind of ['geometry', 'score', 'worker']) {
    await fault(kind);
    current = await createContext(kind);
    await runScenario(current, kind);
    await closeContext(current);
    current = null;
  }
  report.previewAfter = await serverJson('/__qa/status');
  check('same preview and clear fault mode at end', sameServer(report.previewAfter) && report.previewAfter.mode === 'clear', report.previewAfter);
  await drainEvents();
  health();
} catch (error) {
  report.failure = errorText(error);
  console.error(report.failure);
  if (current && ws?.readyState === WebSocket.OPEN && Date.now() + 8_000 < workDeadline) {
    try {
      await capture(current, 'unexpected-failure');
      const final = await sample(current, 'failure page ledger');
      current.receipt.finalPageLedger = { unhandled: final.qa?.unhandled, stages: final.qa?.stages, clipboardCalls: final.qa?.clipboardCalls };
    } catch (captureError) { report.failureCaptureError = errorText(captureError); }
  }
} finally {
  cleaning = true;
  if (changedFault) {
    try { await fault('clear', Math.min(overallDeadline, Date.now() + 12_000)); report.cleanup.faultCleared = true; }
    catch (error) { report.cleanup.faultClearError = errorText(error); }
  } else report.cleanup.faultCleared = true;
  if (ws?.readyState === WebSocket.OPEN) {
    try { await send('Browser.close', {}, undefined, 5_000); report.cleanup.closeSent = true; }
    catch (error) { report.cleanup.closeError = errorText(error); }
  }
  if (chrome) {
    const end = Math.min(overallDeadline - 40_000, Date.now() + 25_000);
    while (Date.now() < end && chrome.exitCode === null && chrome.signalCode === null) await delay(250);
    report.cleanup.spawnExited = chrome.exitCode !== null || chrome.signalCode !== null;
  }
  if (profile) {
    within(profile, resolve(root, 'tmp'));
    const command = "$ErrorActionPreference='Stop'; $profile='" + profile.replaceAll("'", "''")
      + "'; function Owned { @(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($profile) }) };"
      + " $owned=@(Owned); $before=@($owned | Select-Object ProcessId,Name,CommandLine);"
      + " foreach($item in $owned){ $live=Get-Process -Id $item.ProcessId -ErrorAction SilentlyContinue; if($live -and -not $live.HasExited){ Stop-Process -Id $item.ProcessId -Force -ErrorAction SilentlyContinue } };"
      + " $end=[DateTime]::UtcNow.AddSeconds(25); do { $remaining=@(Owned | Where-Object { $live=Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; $live -and -not $live.HasExited });"
      + " if($remaining.Count -eq 0){break}; Start-Sleep -Milliseconds 500 } while([DateTime]::UtcNow -lt $end);"
      + " @{before=$before; remaining=@($remaining | Select-Object ProcessId,Name,CommandLine); check='Exact fresh profile in CIM command line plus live Get-Process; no directory deletion'} | ConvertTo-Json -Depth 4 -Compress";
    const audit = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command],
      { cwd: root, windowsHide: true, encoding: 'utf8', timeout: Math.max(1, Math.min(38_000, overallDeadline - Date.now())), maxBuffer: 2_000_000 });
    report.cleanup.processAudit = { command, exitCode: audit.status, stdout: audit.stdout, stderr: audit.stderr, error: audit.error?.message ?? null };
    try { report.cleanup.verified = audit.status === 0 && JSON.parse(audit.stdout).remaining.length === 0; }
    catch { report.cleanup.verified = false; }
  } else report.cleanup.verified = !chrome;
  ws?.close();
  for (const request of [...pending.values()]) request.reject(Error('QA run ended'));
  pending.clear();
  await delay(0);
  try { await drainEvents(overallDeadline); }
  catch (error) { report.cleanup.eventDrainError = errorText(error); asyncError ??= asError(error); }
  // Final ledger is constructed only after awaited samples, target teardown and event drain.
  report.errorLedger = {
    page: report.scenarios.map(scenario => ({ name: scenario.name, final: scenario.finalPageLedger ?? null })),
    persistentPageEvents: [...report.pageEvents],
    raw: [...report.errors], async: [...report.asyncErrors],
    transport: transportError ? errorText(transportError) : null,
    asynchronousFailure: asyncError ? errorText(asyncError) : null,
  };
  report.errorLedger.classified = [...report.errors, ...report.pageEvents]
    .map(event => ({ event, ...errorDisposition(event, report.network) }));
  report.errorLedger.unexpected = report.errorLedger.classified.filter(item => item.disposition === 'unexpected');
  report.stderr = stderr;
  report.finishedAt = new Date().toISOString();
  report.elapsedMs = Date.now() - started;
  report.ok = !report.failure && !transportError && !asyncError && report.checks.every(item => item.pass)
    && report.scenarios.length === 3 && report.scenarios.every(scenario => scenario.disposedAt)
    && report.errorLedger.unexpected.length === 0
    && report.cleanup.verified && report.cleanup.faultCleared && report.elapsedMs <= 600_000;
  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, ok: report.ok, elapsedMs: report.elapsedMs, checks: report.checks.length, captures: report.captures.length, cleanupVerified: report.cleanup.verified }));
  process.exit(report.ok ? 0 : 1);
}
