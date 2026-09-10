import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const directory = resolve(root, 'qa/revamp-r1/frontend-retention-20260910');
const out = mkdtempSync(resolve(directory, 'global-'));
const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));
const origin = 'http://127.0.0.1:4346';
const sha = b => createHash('sha256').update(b).digest('hex');
const started = Date.now(), deadline = started + 480000, workEnd = deadline - 75000;
const report = { root, hostname: process.env.COMPUTERNAME, out, profile, origin,
  startedAt: new Date().toISOString(), setup: 'Fresh current-build worker-controlled profile. QA-only fault route deliberately throws a client effect; no production exception injection, cache clearing or SW bypass.',
  checks: [], captures: [], samples: [], requests: [], responses: [], completed: [], documents: [], versions: [], errors: [], denied: [] };
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
let ws, chrome, closing = false, sequence = 0, stderr = '', preview;
const pending = new Map();
const delay = ms => new Promise(done => setTimeout(done, ms));
function check(name, pass, detail, fatal = true) {
  report.checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name);
  if (!pass && fatal) throw Error(name);
}
function send(method, params = {}, timeout = 45000) {
  return new Promise((done, reject) => {
    const remaining = (closing ? deadline : workEnd) - Date.now();
    if (remaining <= 0) { reject(Error('QA deadline')); return; }
    const id = ++sequence, timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout ' + method)); }, Math.min(timeout, remaining));
    pending.set(id, { finish(value, error) { clearTimeout(timer); pending.delete(id); error ? reject(Error(error.message)) : done(value); } });
    ws.send(JSON.stringify({ id, method, params }));
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
  return { url: location.href, timeOrigin: performance.timeOrigin, text: document.body.innerText,
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
async function shot(name) {
  const before = await evaluate(facts), s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }), after = await evaluate(facts), bytes = Buffer.from(s.data, 'base64');
  writeFileSync(resolve(out, name + '.png'), bytes, { flag: 'wx' });
  report.captures.push({ name, bytes: bytes.length, sha256: sha(bytes), before, after });
  return after;
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
  const tab = tabs.find(t => t.type === 'page'); report.targetId = tab.id;
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((done, reject) => { const timer = setTimeout(() => reject(Error('CDP handshake')), 15000); ws.onopen = () => { clearTimeout(timer); done(); }; ws.onerror = () => { clearTimeout(timer); reject(Error('CDP connection')); }; });
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
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
      send(allowed ? 'Fetch.continueRequest' : 'Fetch.failRequest', allowed ? { requestId } : { requestId, errorReason: 'BlockedByClient' }).catch(e => report.errors.push({ harness: e.message }));
    }
  };
  ws.onclose = () => { for (const p of [...pending.values()]) p.finish(null, { message: 'CDP closed' }); };
  for (const domain of ['Page','Runtime','Network','ServiceWorker']) await send(domain + '.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  const switched=await fetch(origin+'/__qa/switch',{method:'POST',headers:{'x-shiok-qa':preview.nonce},signal:AbortSignal.timeout(5000)});
  check('switch to current build',switched.status===204);
  await send('Page.navigate',{url:origin+'/__qa/seed'});
  await until('seed',()=>evaluate(()=>document.title),v=>v==='Retained-tab fixture seed');
  await evaluate(async()=>{await navigator.serviceWorker.register('/sw.js',{scope:'/'});await navigator.serviceWorker.ready;return true;});
  await until('current worker controller',()=>evaluate(()=>navigator.serviceWorker.controller?.scriptURL),Boolean);
  const faultUrl=origin+'/qa-global-fault?postal=018956#compare=018956,018990';
  await send('Page.navigate',{url:faultUrl});
  const ready=f=>f.text.includes("SHIOK couldn't load")&&f.controls.some(b=>b.label==='Reload page');
  const before=await until('actual global error',()=>evaluate(facts),ready,45000);
  await shot('global-error-390x844');
  for(const [width,height] of [[320,667],[1440,950]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await until('global viewport',()=>evaluate(facts),f=>ready(f)&&f.viewport[0]===width);
    const f=await shot('global-error-'+width+'x'+height);
    check('global controls fit '+width+'x'+height,!f.overflow&&f.url===faultUrl,f);
  }
  const point=await evaluate(()=>{const n=[...document.querySelectorAll('button')].find(b=>b.textContent==='Reload page');const r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
  const after=await until('native Reload result',()=>evaluate(facts),f=>ready(f)&&f.timeOrigin!==before.timeOrigin,45000);
  check('native Reload preserves exact postal and share URL',after.url===faultUrl,{before:before.url,after:after.url});
  await shot('global-error-after-native-reload');
  await delay(2500);
  check('no automatic reload loop', (await evaluate(facts)).timeOrigin===after.timeOrigin);
  report.fault={fixture:'QA-only client effect throws; absent from tracked app source',url:faultUrl,before:before.timeOrigin,after:after.timeOrigin};
  check('no denied browser traffic',report.denied.length===0,report.denied);
  report.expectedExceptions=report.errors;
  report.outcome='Actual global error native Reload preserves full URL; not a route/upgrade acceptance run';
  report.exitCode = report.checks.some(c => !c.pass) ? 1 : 0;
} catch (e) { report.error = e.stack; report.exitCode = 1; console.error(e.stack); }
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
