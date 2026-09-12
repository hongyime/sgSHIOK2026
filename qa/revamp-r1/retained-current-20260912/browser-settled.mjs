import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { stablePair, settleCounter } from './capture-state.mjs';
import { auditErrors } from '../resume-20260912/error-audit.mjs';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const directory = resolve(root, 'qa/revamp-r1/retained-current-20260912');
const out = mkdtempSync(resolve(directory, 'observed-'));
const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));
const origin = 'http://127.0.0.1:4372';
const sha = b => createHash('sha256').update(b).digest('hex');
const started = Date.now(), deadline = started + 600000, workEnd = deadline - 75000;
const report = { root, hostname: process.env.COMPUTERNAME, out, profile, origin,
  startedAt: new Date().toISOString(), setup: 'Controlled worker registration/update; only the exact legacy map script insertion is deferred. No cache clearing, SW bypass, response substitution or application-state rewrite.',
  checks: [], captures: [], samples: [], entries: [], requests: [], responses: [], completed: [], documents: [], versions: [], errors: [], denied: [] };
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
let ws, chrome, closing = false, sequence = 0, stderr = '', preview;
const pending = new Map();
const trace = entry => report.entries.push({ timeMs: Date.now() - started, sessionId: report.pageSession, ...entry });
const caught = error => report.errors.push({ fault: error.message, commandId: error.commandId, sessionId: report.pageSession });
const delay = ms => new Promise(done => setTimeout(done, ms));
function check(name, pass, detail, fatal = true) {
  report.checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name);
  if (!pass && fatal) throw Error(name);
}
function send(method, params = {}, timeout = 45000) {
  return new Promise((done, reject) => {
    const remaining = (closing ? deadline : workEnd) - Date.now();
    if (remaining <= 0) { reject(Error('QA deadline')); return; }
    const id = ++sequence, fetchCommand = /^Fetch\.(continueRequest|failRequest|fulfillRequest)$/.test(method);
    if (fetchCommand) trace({ kind: 'send', id, method, params });
    let timer;
    const finish = (value, error, kind = 'cdp') => {
      clearTimeout(timer); pending.delete(id);
      if (fetchCommand) trace({ kind: 'reply', id, fetchCommand, ...(error ? { error: { ...error, kind } } : {}) });
      if (error) { const failure = Error(error.message); failure.commandId = id; reject(failure); }
      else done(value);
    };
    timer = setTimeout(() => finish(null, { message: 'CDP timeout ' + method }, 'timeout'), Math.min(timeout, remaining));
    pending.set(id, { finish });
    try { ws.send(JSON.stringify({ id, method, params })); }
    catch (error) { finish(null, { message: error.message }, 'connection'); }
  });
}
async function evaluate(fn, arg = null) {
  const r = await send('Runtime.evaluate', { expression: '(' + fn.toString() + ')(' + JSON.stringify(arg) + ')', returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function until(name, fn, predicate, limit = 90000) {
  const end = Math.min(workEnd, Date.now() + limit); let value;
  while (Date.now() < end) { value = await fn(); report.lastSample = { name, value }; if (predicate(value)) return value; await delay(250); }
  throw Error(name + ' timeout: ' + JSON.stringify(value));
}
function facts() {
  const m = window.__shiokRouteMap, d = window.__shiokRouteDebug;
  let features = []; try { features = m?.queryRenderedFeatures({ layers: ['shiokest-route-line'] }) || []; } catch {}
  return { url: location.href, timeOrigin: performance.timeOrigin, text: document.body?.innerText ?? '',
    status: document.querySelector('main')?.dataset.mapStatus, controller: navigator.serviceWorker.controller?.scriptURL,
    controllerChanges: window.__qaRetained?.controllerChanges, held: window.__qaRetained?.held,
    released: window.__qaRetained?.released, marker: window.__qaRetained?.marker,
    controls: [...document.querySelectorAll('button')].map(b => ({ label: b.getAttribute('aria-label') || b.textContent, disabled: b.disabled })),
    routeKey: d?.routeKey, featureCount: features.filter(f => f.properties?.render_key === d?.routeKey).length,
    renderedKeys: [...new Set(features.map(f => f.properties?.render_key))],
    basemap: !!m?.getSource('onemap') && m.isSourceLoaded('onemap'), tiles: m?.areTilesLoaded(), moving: m?.isMoving(),
    overflow: document.documentElement.scrollWidth > innerWidth, viewport: [innerWidth, innerHeight] };
}
async function cacheFacts(target) {
  const names = await caches.keys(), result = [];
  for (const name of names) {
    const cache = await caches.open(name), keys = await cache.keys();
    const paths = keys.map(k => new URL(k.url).pathname);
    const samples = [];
    for (const key of keys.filter(k => new URL(k.url).pathname.startsWith('/data/')).slice(0, 4)) {
      const response = await cache.match(key), bytes = await response.arrayBuffer();
      samples.push({ path: new URL(key.url).pathname, bytes: bytes.byteLength,
        sha256: [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('') });
    }
    result.push({ name, paths, samples, sentinel: await (await cache.match('/__qa/sentinel'))?.text(), targetPresent: !!(await cache.match(target)) });
  }
  return result;
}
async function shot(name, selected = true) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (selected) await until('stable capture ' + name, () => evaluate(facts), settleCounter());
    const before = await evaluate(facts), s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }), after = await evaluate(facts);
    const bytes = Buffer.from(s.data, 'base64'), stable = !selected || stablePair(before, after);
    const file = name + (stable ? '' : '-transitional-' + attempt) + '.png';
    writeFileSync(resolve(out, file), bytes, { flag: 'wx' });
    report.captures.push({ name, file, attempt, stable, bytes: bytes.length, sha256: sha(bytes), before, after });
    if (stable) { if (selected) check(name + ' stable screenshot route', true); return after; }
  }
  check(name + ' stable screenshot route', false);
}
async function status() { const r = await fetch(origin + '/__qa/status', { signal: AbortSignal.timeout(5000) }); if (!r.ok) throw Error('QA status unavailable'); return r.json(); }
async function documents() {
  // The seed is fixture HTML, not an application build; Chrome evicts it after navigation.
  for (const doc of report.documents.filter(d => !d.bodySha256 && new URL(d.url).pathname === '/')) {
    if (!report.completed.includes(doc.id)) continue;
    const result = await send('Network.getResponseBody', { requestId: doc.id });
    const bytes = Buffer.from(result.body, result.base64Encoded ? 'base64' : 'utf8');
    const file = 'document-' + report.documents.indexOf(doc) + '.html';
    writeFileSync(resolve(out, file), bytes, { flag: 'wx' });
    Object.assign(doc, { file, bytes: bytes.length, bodySha256: sha(bytes), containsA: bytes.includes(preview.buildA), containsB: bytes.includes(preview.buildB) });
  }
}
try {
  preview = await status(); const { nonce, requests, ...identity } = preview; report.proxy = identity;
  check('fresh proxy begins at A', preview.active === 'A' && requests.length === 0);
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--no-first-run','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-networking','--disable-component-update','--disable-sync','--remote-debugging-port=0','--user-data-dir=' + profile,'about:blank'], { cwd: root, windowsHide: true, stdio: ['ignore','ignore','pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
  report.chromePid = chrome.pid; chrome.stderr.on('data', b => { stderr += b; });
  const endpoint = await until('Chrome', async () => /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1], Boolean, 45000);
  const tabs = await (await fetch('http://' + new URL(endpoint).host + '/json', { signal: AbortSignal.timeout(5000) })).json();
  const tab = tabs.find(t => t.type === 'page'); report.targetId = tab.id; report.pageSession = 'direct-page:' + tab.id;
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((done, reject) => { const timer = setTimeout(() => reject(Error('CDP handshake')), 15000); ws.onopen = () => { clearTimeout(timer); done(); }; ws.onerror = () => { clearTimeout(timer); reject(Error('CDP connection')); }; });
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.method && /^(Network[.]|Fetch[.]|Runtime[.]exceptionThrown$)/.test(m.method)) trace({ kind: 'event', method: m.method, params: m.params });
    if (m.id) pending.get(m.id)?.finish(m.result, m.error);
    else if (m.method === 'Runtime.exceptionThrown') report.errors.push(m.params.exceptionDetails);
    else if (m.method === 'ServiceWorker.workerVersionUpdated') report.versions.push({ at: Date.now(), versions: m.params.versions });
    else if (m.method === 'Network.requestWillBeSent') report.requests.push({ at: Date.now(), id: m.params.requestId, url: m.params.request.url, method: m.params.request.method, type: m.params.type });
    else if (m.method === 'Network.responseReceived') {
      const r = { at: Date.now(), id: m.params.requestId, url: m.params.response.url, status: m.params.response.status, fromServiceWorker: m.params.response.fromServiceWorker, fromDiskCache: m.params.response.fromDiskCache };
      report.responses.push(r); if (m.params.type === 'Document') report.documents.push({ ...r });
    } else if (m.method === 'Network.loadingFinished') report.completed.push(m.params.requestId);
    else if (m.method === 'Fetch.requestPaused') {
      const { request, requestId } = m.params, u = new URL(request.url);
      const allowed = ['GET','HEAD'].includes(request.method) && ((u.origin === origin && !u.pathname.startsWith('/api/')) ||
        (u.origin === 'https://www.onemap.gov.sg' && !u.search && (/^\/maps\/tiles\/Grey_HD\/\d+\/\d+\/\d+\.png$/.test(u.pathname) || u.pathname === '/web-assets/images/logo/om_logo.png')));
      if (!allowed) report.denied.push({ url: request.url, method: request.method });
      send(allowed ? 'Fetch.continueRequest' : 'Fetch.failRequest', allowed ? { requestId } : { requestId, errorReason: 'BlockedByClient' }).catch(caught);
    }
  };
  ws.onclose = () => { for (const p of [...pending.values()]) p.finish(null, { message: 'CDP closed' }); if (!closing) trace({kind:'connectionFault',message:'unexpected close'}); };
  for (const domain of ['Page','Runtime','Network','ServiceWorker']) await send(domain + '.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin + '/__qa/seed' });
  await until('seed document', () => evaluate(() => document.title), t => t === 'Retained-tab fixture seed');
  await evaluate(async () => { await navigator.serviceWorker.register('/sw.js', { scope: '/' }); await navigator.serviceWorker.ready; return true; });
  await until('legacy controller', () => evaluate(() => navigator.serviceWorker.controller?.scriptURL), Boolean);
  report.legacyVersions = report.versions.flatMap(v => v.versions).filter(v => v.status === 'activated').map(v => v.versionId);
  check('legacy activated worker version observed', report.legacyVersions.length > 0);
  await evaluate(async () => { for (const [name, value] of [['unrelated-retained-fixture','foreign'],['sgshiok-static-v99','future']]) await (await caches.open(name)).put('/__qa/sentinel', new Response(value)); });
  const hook = function(target) {
    if (location.pathname !== '/') return;
    const original = Node.prototype.appendChild, queue = [];
    const state = window.__qaRetained = { marker: performance.timeOrigin, held: [], released: [], controllerChanges: 0 };
    navigator.serviceWorker.addEventListener('controllerchange', () => { state.controllerChanges++; });
    Node.prototype.appendChild = function(node) {
      if (node instanceof HTMLScriptElement && new URL(node.src, location.href).pathname === target) {
        state.held.push({ url: node.src, at: performance.now(), connected: node.isConnected });
        queue.push({ parent: this, node }); return node;
      }
      return original.call(this, node);
    };
    window.__qaReleaseRetained = () => {
      Node.prototype.appendChild = original;
      for (const { parent, node } of queue) { state.released.push({ url: node.src, at: performance.now(), connectedBefore: node.isConnected }); original.call(parent, node); }
      return state;
    };
  };
  const injection = await send('Page.addScriptToEvaluateOnNewDocument', { source: '(' + hook.toString() + ')(' + JSON.stringify(preview.target) + ')' });
  await send('Page.navigate', { url: origin + '/?debugMap=1&postal=018956' });
  const retained = await until('A walk text and exact deferred chunk', () => evaluate(facts), f => f.held?.length === 1 && f.text.includes('55%') && f.text.includes('Bayfront'));
  report.samples.push({ name: 'retained-A', facts: retained });
  await documents();
  check('retained Document is actual A HTML', report.documents.some(d => d.containsA && !d.containsB));
  report.cachesBefore = await evaluate(cacheFacts, origin + preview.target);
  const beforeSwitch = await status();
  check('target not requested or cached before switch', !beforeSwitch.requests.some(r => r.path.startsWith(preview.target)) && !report.requests.some(r => new URL(r.url).pathname === preview.target) && report.cachesBefore.every(c => !c.targetPresent));
  check('real versioned data cached before switch', report.cachesBefore.some(c => c.samples.length > 0));
  await shot('retained-A-pending', false);
  const switchResponse = await fetch(origin + '/__qa/switch', { method: 'POST', headers: { 'x-shiok-qa': preview.nonce }, signal: AbortSignal.timeout(5000) });
  check('switch B accepted', switchResponse.status === 204);
  report.switchedAt = Date.now();
  await evaluate(async () => { const r = await navigator.serviceWorker.getRegistration('/'); await r.update(); return true; });
  await until('B worker controls retained A', async () => ({ facts: await evaluate(facts), versions: report.versions.flatMap(v => v.versions) }), s => s.facts.controllerChanges > 0 && s.versions.some(v => v.status === 'activated' && !report.legacyVersions.includes(v.versionId) && v.controlledClients?.includes(report.targetId)), 45000);
  const controlled = await evaluate(facts); report.samples.push({ name: 'B-controls-retained-A', facts: controlled });
  const controlledStatus = await status();
  check('exact B worker served', controlledStatus.requests.some(r => r.workerSha256 === preview.workerHashes.B));
  check('same Document before first target request', controlled.timeOrigin === retained.timeOrigin && !controlledStatus.requests.some(r => r.path.startsWith(preview.target)));
  await evaluate(() => window.__qaReleaseRetained());
  await until('old chunk through actual fallback', async () => report.responses.filter(r => new URL(r.url).pathname === preview.target), r => r.some(v => v.status === 200), 60000);
  const ready = f => f.text.includes('55%') && f.text.includes('Bayfront') && f.status === 'ready' && f.featureCount === 4 && f.renderedKeys.length === 1 && f.basemap && f.tiles && !f.moving;
  await until('retained A route after B upgrade', () => evaluate(facts), ready, 120000);
  const served = (await status()).requests.filter(r => r.path.startsWith(preview.target));
  check('old module request reached actual B origin200', served.length > 0 && served.every(r => r.activeAtStart === 'B' && r.upstream === preview.bPort && r.status === 200), served);
  const response = report.responses.find(r => new URL(r.url).pathname === preview.target && r.status === 200 && r.fromServiceWorker);
  check('retained module response passed through service worker', !!response);
  await until('old chunk complete', async () => report.completed.includes(response.id), Boolean);
  const body = await send('Network.getResponseBody', {requestId:response.id});
  const bytes = Buffer.from(body.body, body.base64Encoded ? 'base64' : 'utf8');
  report.oldModule = {bytes:bytes.length,sha256:sha(bytes)};
  check('actual old module bytes match archive pin', bytes.length === preview.targetBytes && sha(bytes) === preview.targetSha256, report.oldModule);
  for (const [width,height] of [[390,844],[390,667],[320,667],[1440,950]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await until('retained viewport settled',()=>evaluate(facts),f=>ready(f)&&f.viewport[0]===width&&f.viewport[1]===height);
    const f=await shot('retained-A-on-B-'+width+'x'+height);
    check('same retained Document and selected route '+width+'x'+height,ready(f)&&f.timeOrigin===retained.timeOrigin&&f.url===retained.url&&!f.overflow,f);
  }
  report.retainedAcceptance = {usefulWalkDetails:true,automaticNewDocument:false,oldModuleVerified:true};
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});
  await send('Page.navigate',{url:retained.url});
  const newPage=await until('ordinary navigation to B',()=>evaluate(facts),f=>ready(f)&&f.timeOrigin!==retained.timeOrigin,120000);
  await documents();
  check('new Document is B HTML',report.documents.some(d=>d.containsB&&!d.containsA));
  await shot('new-B-selected-desktop');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await until('B narrow route settled',()=>evaluate(facts),f=>ready(f)&&f.viewport[0]===390);
  await shot('new-B-selected-mobile');
  report.globalErrorScope = 'No deliberate global-error fixture in this build; previously tested separately. This run focuses on retained A and ordinary current B navigation.';
  report.cachesFinal = await evaluate(cacheFacts, origin + preview.target);
  check('foreign and future cache sentinels unchanged', ['unrelated-retained-fixture','sgshiok-static-v99'].every(name => report.cachesBefore.find(c => c.name === name)?.sentinel === report.cachesFinal.find(c => c.name === name)?.sentinel));
  check('sampled cached data unchanged', report.cachesBefore.flatMap(c => c.samples).every(s => report.cachesFinal.flatMap(c => c.samples).some(n => n.path === s.path && n.sha256 === s.sha256 && n.bytes === s.bytes)));
  const bTime = (await evaluate(facts)).timeOrigin; await delay(3000);
  check('no extra Document within bounded recovery observation', (await evaluate(facts)).timeOrigin === bTime);
  check('no denied browser traffic',report.denied.length===0,report.denied);
  report.errorAudit = auditErrors(report.entries, report.errors, report.pageSession);
  check('no application exceptions or unexplained Fetch command failures', report.errorAudit.ok, report.errorAudit);
  report.outcome = 'Retained A renders selected route from actual current-B fallback; ordinary navigation renders current B; sampled caches preserved. Not production identity/security or full transport acceptance.';
  report.exitCode = report.checks.some(c => !c.pass) ? 1 : 0;
} catch (e) { report.error = e.stack; report.exitCode = 1; console.error(e.stack); if (ws?.readyState === 1) try { await shot('failure', false); } catch (error) { report.failureCaptureError = error.message; } }
finally {
  closing = true;
  try { await send('Browser.close', {}, 10000); } catch (e) { report.closeNote = e.message; }
  report.cleanup = cleanup(profile); if (!report.cleanup.verified) report.exitCode = 1;
  ws?.close();
  try {
    const terminal = await status(); const { nonce, ...safe } = terminal; report.proxyFinal = safe;
    const stop = await fetch(origin + '/__qa/stop', { method: 'POST', headers: { 'x-shiok-qa': nonce }, signal: AbortSignal.timeout(5000) });
    report.proxyStopStatus = stop.status; if (stop.status !== 204) report.exitCode = 1;
  } catch (e) { report.proxyStopError = e.message; report.exitCode = 1; }
  writeFileSync(resolve(out, 'chrome.stderr.log'), stderr, { flag: 'wx' });
  report.finishedAt = new Date().toISOString(); report.elapsedSeconds = (Date.now() - started) / 1000;
  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, outcome: report.outcome, exitCode: report.exitCode, checks: report.checks.length, captures: report.captures.length, elapsedSeconds: report.elapsedSeconds, cleanup: report.cleanup.verified }));
  process.exitCode = report.exitCode;
  chrome?.stderr?.destroy(); chrome?.unref();
  // The owned browser and proxy have terminal receipts; don't retain CDP/HTTP idle handles.
  setTimeout(() => process.exit(report.exitCode), 250);
}
