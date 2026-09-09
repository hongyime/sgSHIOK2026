import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const label = process.argv[2];
if (!/^[a-z0-9-]+$/.test(label || '')) throw Error('Fresh label required');
const directory = resolve(root, 'qa/revamp-r1/automatic-upgrade-20260909');
const out = mkdtempSync(resolve(directory, label + '-'));
const origin = 'http://127.0.0.1:4330';
const started = Date.now(), deadline = started + 600_000, workEnd = deadline - 75_000;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const runner = readFileSync(new URL(import.meta.url));
writeFileSync(resolve(out, 'runner.mjs'), runner, { flag: 'wx' });
const report = { root, hostname: process.env.COMPUTERNAME, out, startedAt: new Date().toISOString(),
  runnerSha256: hash(runner), checks: [], events: [], requests: [], versions: [], documents: [], samples: [], captures: [], pageErrors: [], cleanup: {},
  policy: 'One fresh Chrome profile and one unchanged origin. HTTP cache/SW enabled. No test registration.update, forced-update, cache clearing, script injection for reload, or network bypass. A/B worker bytes are pinned by the proxy. Chromium/SwiftShader emulation, not physical-device or latency evidence.' };
let chrome, ws, profile, id = 0, stderr = '', cleaning = false, transportError;
const pending = new Map(), documents = new Map(), responses = new Map(), complete = new Set(), failed = new Set(), dataPending = new Map(), latestVersions = new Map();
const delay = ms => new Promise(done => setTimeout(done, ms));
const budget = (end = cleaning ? deadline : workEnd) => { const ms = end - Date.now(); if (ms <= 0) throw Error('QA budget exhausted'); return ms; };
const health = () => { budget(); if (transportError) throw transportError; };
function check(name, pass, detail) { report.checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name); if (!pass) throw Error(name); }
function append(list, value, cap = 6000) { if (list.length >= cap) throw Error('Receipt capacity exceeded'); list.push(value); }
async function json(url, options = {}) { const response = await fetch(url, { ...options, signal: AbortSignal.timeout(Math.min(10_000, budget())) }); if (!response.ok) throw Error('HTTP ' + response.status + ' ' + url); return response.json(); }
function send(method, params = {}, end = cleaning ? deadline : workEnd) {
  const ms = Math.min(45_000, budget(end));
  return new Promise((done, reject) => {
    const n = ++id, timer = setTimeout(() => { pending.delete(n); reject(Error('CDP timeout ' + method)); }, ms);
    pending.set(n, { done: value => { clearTimeout(timer); pending.delete(n); done(value); }, reject: error => { clearTimeout(timer); pending.delete(n); reject(error); } });
    try { ws.send(JSON.stringify({ id: n, method, params })); } catch (error) { pending.get(n).reject(error); }
  });
}
async function call(fn, arg, end = workEnd) {
  const result = await send('Runtime.evaluate', { expression: '(' + fn.toString() + ')(' + JSON.stringify(arg ?? null) + ')', returnByValue: true, awaitPromise: true }, end);
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
function facts() {
  const map = window.__shiokRouteMap, debug = window.__shiokRouteDebug, main = document.querySelector('main');
  let features = [], basemap = false, tiles = false, center = null, moving = null;
  try { if (map?.getLayer('shiokest-route-line')) features = map.queryRenderedFeatures({ layers: ['shiokest-route-line'] }).filter(feature => feature.properties?.render_key === debug?.routeKey);
    basemap = !!map?.getSource('onemap') && map.isSourceLoaded('onemap'); tiles = !!map?.areTilesLoaded(); center = map?.getCenter().toArray(); moving = map?.isMoving(); } catch {}
  return { url: location.href, timeOrigin: performance.timeOrigin, status: main?.dataset.mapStatus, stage: main?.dataset.mapStage,
    error: main?.dataset.mapFailure, body: document.body?.innerText, input: document.querySelector('#postal-search-input')?.value,
    controller: navigator.serviceWorker?.controller?.scriptURL ?? null, key: debug?.routeKey, features: features.length, basemap, tiles, center, moving,
    viewport: [innerWidth, innerHeight], controllerChanges: window.__qaControllerChanges ?? [],
    unhandled: window.__qaUnhandled ?? [], buildIds: [...new Set((JSON.stringify(window.__next_f || []).match(/\\"b\\":\\"([^\\"]+)\\"/g) || []))] };
}
async function sample(name, end = workEnd) { const value = await call(facts, null, end); append(report.samples, { name, at: Date.now(), value }, 1500); report.lastSample = { name, value }; return value; }
async function until(name, test, limit = 90_000) {
  const end = Math.min(workEnd, Date.now() + limit); let value;
  while (Date.now() < end) { health(); value = await sample(name, end); if (test(value)) return value; await delay(Math.min(300, Math.max(0, end - Date.now()))); }
  throw Error('Wait failed: ' + name + ' ' + JSON.stringify(value));
}
const routeReady = value => value.status === 'ready' && value.features > 0 && value.basemap && value.tiles && !value.moving;
const plainReady = value => value.status === 'idle' && value.basemap && value.tiles && !value.moving;
async function capture(name, predicate) {
  const signature = value => JSON.stringify([value.url, value.timeOrigin, value.status, value.key, value.features, value.basemap, value.tiles, value.center, value.moving]);
  let last, previous, stable = 0;
  const end = Math.min(workEnd, Date.now() + 30_000);
  while (Date.now() < end) { last = await sample(name + ' settle', end); const current = signature(last);
    if (predicate(last) && !dataPending.size && current === previous) stable++; else stable = 0;
    previous = current; if (stable >= 4) break; await delay(300); }
  check(name + ' settled', stable >= 4, { last, pendingData: [...dataPending] });
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const bytes = Buffer.from(shot.data, 'base64'); writeFileSync(resolve(out, name + '.png'), bytes, { flag: 'wx' });
  const after = await sample(name + ' after');
  report.captures.push({ name, path: resolve(out, name + '.png'), sha256: hash(bytes), bytes: bytes.length, before: last, after });
  check(name + ' matching screenshot facts', predicate(after) && !dataPending.size && signature(last) === signature(after)); return after;
}
async function documentBody(name, navigation) {
  const end = Math.min(workEnd, Date.now() + 90_000); let request;
  while (Date.now() < end) {
    health();
    request = [...documents.values()].findLast(value => value.loaderId === navigation.loaderId && value.frameId === navigation.frameId);
    if (request && failed.has(request.requestId)) throw Error('Document download failed: ' + name);
    if (request && complete.has(request.requestId)) break;
    request = undefined; await delay(250);
  }
  if (!request) throw Error('No completed Document: ' + name);
  const response = responses.get(request.requestId), body = await send('Network.getResponseBody', { requestId: request.requestId });
  const bytes = Buffer.from(body.body, body.base64Encoded ? 'base64' : 'utf8'), text = bytes.toString('utf8');
  const result = { name, requestId: request.requestId, loaderId: request.loaderId, url: request.request.url, response: response?.response,
    sha256: hash(bytes), bytes: bytes.length, buildA: text.includes(report.server.buildA), buildB: text.includes(report.server.buildB) };
  report.documents.push(result); writeFileSync(resolve(out, name + '.html'), bytes, { flag: 'wx' });
  check(name + ' Document HTTP200', response?.response.status === 200, result); return result;
}
async function navigate(path, name) {
  const result = await send('Page.navigate', { url: origin + path, transitionType: 'typed' });
  report.events.push({ name: 'navigation ' + name, at: Date.now(), result });
  if (result.errorText) throw Error('Navigation ' + name + ': ' + result.errorText);
  if (!result.loaderId || !result.frameId) throw Error('Expected a new Document navigation: ' + name);
  return documentBody(name, result);
}
function receive(event) {
  const message = JSON.parse(event.data);
  if (message.id) { const p = pending.get(message.id); if (p) message.error ? p.reject(Error(JSON.stringify(message.error))) : p.done(message.result); return; }
  const { method, params } = message;
  if (method === 'Network.requestWillBeSent') {
    if (params.type === 'Document') documents.set(params.requestId, params);
    if (new URL(params.request.url).pathname.startsWith('/data/')) dataPending.set(params.requestId, params.request.url);
    if (new URL(params.request.url).pathname.startsWith('/api/')) transportError = Error('Unexpected API request');
    append(report.requests, { method, id: params.requestId, loaderId: params.loaderId, type: params.type, url: params.request.url, verb: params.request.method, at: Date.now() });
  } else if (method === 'Network.responseReceived') {
    responses.set(params.requestId, params);
    if (params.response.status >= 400) dataPending.delete(params.requestId);
    append(report.requests, { method, id: params.requestId, type: params.type, url: params.response.url, status: params.response.status,
      fromServiceWorker: params.response.fromServiceWorker, fromDiskCache: params.response.fromDiskCache, at: Date.now() });
  } else if (method === 'Network.loadingFinished' || method === 'Network.loadingFailed') {
    (method === 'Network.loadingFinished' ? complete : failed).add(params.requestId);
    dataPending.delete(params.requestId); append(report.requests, { method, ...params, at: Date.now() });
  } else if (method === 'ServiceWorker.workerVersionUpdated') {
    for (const version of params.versions) { latestVersions.set(version.versionId, version); append(report.versions, { ...version, at: Date.now() }); }
  } else if (method === 'Runtime.bindingCalled' && params.name === '__qaRecordError') {
    append(report.pageErrors, { at: Date.now(), payload: JSON.parse(params.payload) });
  } else if (['Runtime.exceptionThrown', 'Page.frameNavigated', 'Log.entryAdded'].includes(method)) {
    append(report.events, { method, params, at: Date.now() });
    if (method === 'Runtime.exceptionThrown') append(report.pageErrors, { at: Date.now(), exception: params });
  }
}
try {
  report.server = await json(origin + '/__qa/status'); check('fresh proxy serves A', report.server.active === 'A');
  profile = mkdtempSync(resolve(root, 'tmp/automatic-upgrade-browser-')); report.profile = profile;
  const args = ['--headless=new', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--disable-default-apps', '--disable-extensions', '--disable-sync', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'];
  report.chromeArgs = args;
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', args, { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
  report.chromePid = chrome.pid; chrome.on('error', error => { transportError = error; }); chrome.stderr.on('data', chunk => { stderr += chunk; if (stderr.length > 1_000_000) transportError = Error('stderr cap'); });
  const end = Math.min(workEnd, Date.now() + 40_000); let endpoint;
  while (!endpoint && Date.now() < end) { health(); endpoint = /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1]; if (!endpoint) await delay(100); }
  if (!endpoint) throw Error('Owned browser startup deadline');
  const url = new URL(endpoint); url.protocol = 'http:'; url.pathname = '/json';
  const page = (await json(url)).find(target => target.type === 'page'); report.pageTargetId = page.id;
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((done, reject) => { const timer = setTimeout(() => reject(Error('CDP websocket startup')), 15_000); ws.onopen = () => { clearTimeout(timer); done(); }; ws.onerror = error => { clearTimeout(timer); reject(error); }; });
  ws.onmessage = event => { try { receive(event); } catch (error) { transportError = error; } };
  ws.onclose = () => { if (!cleaning) transportError = Error('CDP socket closed'); for (const p of [...pending.values()]) p.reject(Error('CDP socket closed')); };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable', { maxTotalBufferSize: 40_000_000, maxResourceBufferSize: 8_000_000 }); await send('ServiceWorker.enable'); await send('Log.enable');
  await send('Runtime.addBinding', { name: '__qaRecordError' });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__qaControllerChanges=[];window.__qaUnhandled=[];navigator.serviceWorker.addEventListener('controllerchange',()=>window.__qaControllerChanges.push({at:performance.now(),url:navigator.serviceWorker.controller?.scriptURL}));window.addEventListener('unhandledrejection',e=>{window.__qaUnhandled.push(String(e.reason));window.__qaRecordError(JSON.stringify({url:location.href,timeOrigin:performance.timeOrigin,message:String(e.reason)}))});` });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const initial = await navigate('/?postal=018956', 'A-initial'); await until('A selected walk', routeReady); await until('A controller', value => !!value.controller);
  check('initial Document is build A only', initial.buildA && !initial.buildB); await capture('A-selected', routeReady);
  const aRoot = await navigate('/', 'A-controlled-root'); await until('A plain basemap', plainReady); await capture('A-root', plainReady);
  check('A controlled root is build A', aRoot.buildA && aRoot.response.fromServiceWorker === true, aRoot);
  report.cacheBefore = await call(async () => {
    for (const name of ['other-app-v1', 'sgshiok-shell-v999']) await (await caches.open(name)).put('/__qa/sentinel', new Response(name));
    const cache = await caches.open('sgshiok-static-v1'), shell = await cache.match('/');
    return { names: await caches.keys(), staticUrls: (await cache.keys()).map(request => request.url), cachedRoot: shell ? { date: shell.headers.get('date'), cacheControl: shell.headers.get('cache-control'), text: await shell.text() } : null };
  });
  const versionsA = new Set([...latestVersions.values()].filter(v => v.scriptURL === origin + '/sw.js').map(v => v.versionId));
  check('A worker version observed before switch', versionsA.size > 0);
  report.cachedDataA = report.cacheBefore.staticUrls.filter(url => url.includes('/data/'));
  report.cachedChunksA = report.cacheBefore.staticUrls.filter(url => url.includes('/_next/static/') && url.endsWith('.js'));
  check('baseline contains cached data and JS chunks', report.cachedDataA.length > 0 && report.cachedChunksA.length > 0);
  const switched = await fetch(origin + '/__qa/select/B', { method: 'POST', headers: { 'x-shiok-qa': 'automatic-upgrade' }, signal: AbortSignal.timeout(10_000) });
  check('proxy switched to B', switched.status === 204); report.switchedAt = Date.now();
  const returning = await navigate('/', 'first-returning-navigation');
  report.firstReturning = await sample('first returning state');
  const bOwned = () => [...latestVersions.values()].find(v => v.scriptURL === origin + '/sw.js' && !versionsA.has(v.versionId) && v.status === 'activated' && v.controlledClients?.includes(page.id));
  const upgraded = await until('B worker controls same page automatically', value => !!value.controller && !!bOwned());
  report.automaticController = { version: bOwned(), sample: upgraded, elapsedMs: Date.now() - report.switchedAt };
  report.workerIdentityReceipt = await json(origin + '/__qa/status');
  const bResponseTimeMs = bOwned().scriptResponseTime * 1000;
  const bWorkerResponses = report.workerIdentityReceipt.requests.filter(request => request.path === '/sw.js' && request.active === 'B' && request.status === 200 && request.workerSha256 === report.server.workerHashes.B && request.serviceWorker === 'script');
  check('activated worker is correlated with pinned B bytes', Number.isFinite(bResponseTimeMs) && bResponseTimeMs >= report.switchedAt - 1000 && bWorkerResponses.some(request => Math.abs(Date.parse(request.at) - bResponseTimeMs) < 5000), { bResponseTimeMs, responses: bWorkerResponses });
  check('no injected registration update was needed', !!report.automaticController.version);
  const revisited = await navigate('/?postal=018956', 'B-ordinary-revisit'); await until('B selected walk', routeReady);
  check('ordinary revisit executes B Document only', revisited.buildB && !revisited.buildA && revisited.response.fromServiceWorker === true, revisited);
  await capture('B-selected', routeReady);
  report.cacheAfter = await call(async () => {
    const sentinels = await Promise.all(['other-app-v1', 'sgshiok-shell-v999'].map(async name => ({ name, body: await (await (await caches.open(name)).match('/__qa/sentinel'))?.text() })));
    const urls = (await (await caches.open('sgshiok-static-v1')).keys()).map(request => request.url);
    return { names: await caches.keys(), sentinels, staticUrls: urls };
  });
  check('foreign and future sentinels survive', report.cacheAfter.sentinels.every(item => item.body === item.name));
  check('versioned data and old cached assets retained', report.cacheBefore.staticUrls.filter(url => /\/(data|_next\/static)\//.test(url)).every(url => report.cacheAfter.staticUrls.includes(url)));
  report.oldChunkOriginChecks = [];
  for (const old of report.cachedChunksA) {
    health(); const response = await fetch(old, { signal: AbortSignal.timeout(Math.min(10_000, budget())) });
    report.oldChunkOriginChecks.push({ url: old, status: response.status }); await response.body?.cancel();
  }
  check('B origin lacks an A chunk while cached A assets survive', report.oldChunkOriginChecks.some(item => item.status === 404));
  const rootB = await navigate('/', 'B-plain-revisit'); await until('B plain basemap', plainReady); await capture('B-root', plainReady);
  check('plain revisit executes B', rootB.buildB && !rootB.buildA);
  const finalState = await sample('final');
  check('no uncaught exception or rejection across all Documents', report.pageErrors.length === 0 && finalState.unhandled.length === 0, report.pageErrors);
} catch (error) {
  report.failure = error.stack; console.error(error.stack);
  if (ws?.readyState === WebSocket.OPEN && Date.now() < workEnd - 5000) try {
    report.failureState = await sample('failure'); const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(resolve(out, 'failure.png'), Buffer.from(shot.data, 'base64'), { flag: 'wx' });
  } catch (captureError) { report.failureCaptureError = captureError.message; }
} finally {
  cleaning = true;
  try { report.serverAfter = await json(origin + '/__qa/status'); } catch (error) { report.serverAfterError = error.message; }
  if (ws?.readyState === WebSocket.OPEN) try { await send('Browser.close', {}, Math.min(deadline, Date.now() + 5000)); } catch (error) { report.cleanup.closeError = error.message; }
  if (chrome) { const end = Math.min(deadline - 40_000, Date.now() + 25_000); while (Date.now() < end && chrome.exitCode === null && chrome.signalCode === null) await delay(250); }
  if (profile) {
    const command = "$ErrorActionPreference='Stop'; $profile='" + profile.replaceAll("'", "''") + "'; function Owned { @(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($profile) }) }; $owned=@(Owned); $before=@($owned|Select-Object ProcessId,CommandLine); foreach($item in $owned){Stop-Process -Id $item.ProcessId -Force -ErrorAction SilentlyContinue};$end=[DateTime]::UtcNow.AddSeconds(25);do{$remaining=@(Owned|Where-Object{$p=Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue;$p -and -not $p.HasExited});if(!$remaining.Count){break};Start-Sleep -Milliseconds 500}while([DateTime]::UtcNow -lt $end);@{before=$before;remaining=@($remaining|Select-Object ProcessId,CommandLine)}|ConvertTo-Json -Depth 4 -Compress";
    const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { cwd: root, windowsHide: true, encoding: 'utf8', timeout: Math.max(1, Math.min(38_000, deadline - Date.now())) });
    report.cleanup.audit = { command, exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
    try { report.cleanup.verified = result.status === 0 && JSON.parse(result.stdout).remaining.length === 0; } catch { report.cleanup.verified = false; }
  } else report.cleanup.verified = !chrome;
  ws?.close(); for (const p of [...pending.values()]) p.reject(Error('QA finished'));
  report.stderr = stderr; report.elapsedMs = Date.now() - started; report.finishedAt = new Date().toISOString();
  report.transportError = transportError?.stack;
  report.ok = !report.failure && !transportError && report.pageErrors.length === 0 && report.checks.every(c => c.pass) && report.cleanup.verified && report.elapsedMs <= 600_000;
  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, ok: report.ok, checks: report.checks.length, captures: report.captures.length, cleanupVerified: report.cleanup.verified }));
  process.exit(report.ok ? 0 : 1);
}
