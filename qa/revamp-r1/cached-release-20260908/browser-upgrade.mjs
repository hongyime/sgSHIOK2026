import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const name = process.argv[2];
if (!/^[a-z0-9-]+$/.test(name || '')) throw Error('Fresh output name required');
const mode = process.argv[3] || 'automatic';
if (!['automatic', 'explicit-update'].includes(mode)) throw Error('Unknown diagnostic mode');
const out = resolve(root, 'qa/revamp-r1/cached-release-20260908', name);
if (existsSync(out)) throw Error('Preserve earlier evidence');
mkdirSync(out);
const origin = 'http://127.0.0.1:4324';
const control = async value => {
  const response = await fetch(`${origin}/__qa/select/${value}`, { method: 'POST', headers: { 'x-shiok-qa': 'local-upgrade' } });
  if (response.status !== 204) throw Error('Proxy control failed');
};
await control('online'); await control('A');
const server = await (await fetch(`${origin}/__qa/status`)).json();
const workerBefore = Buffer.from(await (await fetch(origin + '/sw.js')).arrayBuffer());
const workerBeforeSha256 = createHash('sha256').update(workerBefore).digest('hex');
if (workerBeforeSha256 !== 'c1a9e34ed80456e93ade73cd90706269e47a75cc6782dad3d9f12620cf6b2390') throw Error('Baseline worker must equal reviewed A source');
const report = { origin, server, startedAt: new Date().toISOString(), checks: [], captures: [], exceptions: [], requests: [], workerVersions: [], serviceWorkerBypassed: false, cachesCleared: false };
report.mode = mode;
report.explicitWorkerUpdate = mode === 'explicit-update';
report.workerBeforeSha256 = workerBeforeSha256;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--remote-debugging-port=0', `--user-data-dir=${resolve(root, 'tmp/cached-upgrade-' + Date.now())}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
report.browser = { pid: chrome.pid, stderr: '' };
chrome.stderr.on('data', chunk => { report.browser.stderr = (report.browser.stderr + chunk).slice(-10000); });
chrome.on('error', error => { report.browser.error = error.message; });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const pending = new Map();
let ws, send, evaluate;
function check(name, pass, details) {
  report.checks.push({ name, pass, details });
  console.log(pass ? 'PASS' : 'FAIL', name, JSON.stringify(details ?? ''));
  if (!pass) throw Error(name);
}
const facts = `(()=>{const m=window.__shiokRouteMap,d=window.__shiokRouteDebug;return {key:d?.routeKey,center:m?.getCenter(),zoom:m?.getZoom(),moving:m?.isMoving(),basemapLoaded:!!m?.getSource('onemap')&&m.isSourceLoaded('onemap'),routeCount:m?.getLayer('shiokest-route-line')?m.queryRenderedFeatures({layers:['shiokest-route-line']}).filter(f=>f.properties.render_key===d?.routeKey).length:0,status:document.querySelector('main')?.dataset.mapStatus,text:document.body?.innerText||'',worker:!!navigator.serviceWorker?.controller,buildPayload:JSON.stringify(self.__next_f||[]),width:innerWidth,height:innerHeight}})()`;
try {
  let tabs;
  const startup = Date.now();
  while (Date.now() - startup < 90000) {
    try {
      const address = /DevTools listening on (ws:\/\/[^\s]+)/.exec(report.browser.stderr)?.[1];
      if (!address) { await delay(300); continue; }
      const endpoint = new URL(address);
      if (!['127.0.0.1', '[::1]', 'localhost'].includes(endpoint.hostname)) throw Error('Unexpected debugger host');
      endpoint.protocol = 'http:'; endpoint.pathname = '/json';
      report.browser.debugJsonUrl = endpoint.href;
      tabs = await (await fetch(endpoint, { signal: AbortSignal.timeout(3000) })).json(); break;
    }
    catch { if (chrome.exitCode !== null) break; await delay(500); }
  }
  if (!tabs) throw Error('Browser startup deadline');
  ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id;
    const timer = setTimeout(() => { pending.delete(key); reject(Error('CDP timeout ' + method)); }, 30000);
    pending.set(key, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    ws.send(JSON.stringify({ id: key, method, params }));
  });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) { const waiter = pending.get(message.id); pending.delete(message.id); if (waiter) message.error ? waiter.reject(Error(message.error.message)) : waiter.resolve(message.result); }
    else if (message.method === 'Runtime.exceptionThrown') report.exceptions.push(message.params.exceptionDetails);
    else if (message.method === 'Network.responseReceived') {
      const r = message.params.response;
      if (r.url.startsWith(origin)) report.requests.push({ requestId: message.params.requestId, resourceType: message.params.type, url: r.url, status: r.status, fromServiceWorker: r.fromServiceWorker, mimeType: r.mimeType, headers: r.headers });
    } else if (message.method === 'ServiceWorker.workerVersionUpdated') report.workerVersions.push(...message.params.versions);
  };
  evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const until = async (expression, ms = 180000) => {
    const started = Date.now();
    while (Date.now() - started < ms) {
      if (await evaluate(`location.protocol==='chrome-error:' || document.body?.innerText.includes('HTTP ERROR 502')`)) throw Error('Browser navigation failed before app load');
      if (await evaluate(expression)) return;
      await delay(300);
    }
    throw Error('Condition deadline ' + expression);
  };
  const route = () => until(`window.__shiokRouteMap?.getLayer('shiokest-route-line') && !window.__shiokRouteMap.isMoving() && window.__shiokRouteMap.isSourceLoaded('shiokest-route') && window.__shiokRouteMap.queryRenderedFeatures({layers:['shiokest-route-line']}).some(f=>f.properties.render_key===window.__shiokRouteDebug.routeKey) && window.__shiokRouteMap.isSourceLoaded('onemap')`);
  const capture = async label => {
    const before = await evaluate(facts);
    const documentRequest = report.requests.filter(request => request.resourceType === 'Document' && request.mimeType === 'text/html').at(-1);
    const response = await send('Network.getResponseBody', { requestId: documentRequest.requestId });
    const document = response.base64Encoded ? Buffer.from(response.body, 'base64').toString('utf8') : response.body;
    before.document = { requestId: documentRequest.requestId, fromServiceWorker: documentRequest.fromServiceWorker,
      sha256: createHash('sha256').update(document).digest('hex'), buildA: document.includes(server.buildA), buildB: document.includes(server.buildB) };
    const png = await send('Page.captureScreenshot', { format: 'png' });
    const after = await evaluate(facts);
    writeFileSync(resolve(out, label + '.png'), Buffer.from(png.data, 'base64'));
    const stable = before.key === after.key && before.routeCount === after.routeCount && before.zoom === after.zoom && JSON.stringify(before.center) === JSON.stringify(after.center) && !before.moving && !after.moving;
    report.captures.push({ label, before, after, stable });
    check('stable screenshot ' + label, stable);
    return before;
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('ServiceWorker.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin + '/?postal=018956' });
  await route(); await until('!!navigator.serviceWorker.controller');
  let state = await capture('A-shared');
  check('A real selected route and expected build', state.routeCount === 4 && state.document.buildA, { build: server.buildA, features: state.routeCount, document: state.document });
  await send('Page.navigate', { url: origin + '/' });
  await until(`document.querySelector('main')?.dataset.mapStatus==='idle' && !!window.__shiokRouteMap?.getSource('onemap') && window.__shiokRouteMap.isSourceLoaded('onemap')`);
  report.beforeCaches = await evaluate(`(async()=>{for(const name of ['other-app-v1','sgshiok-shell-v999'])await(await caches.open(name)).put('/sentinel',new Response(name));return caches.keys()})()`);
  const versionsA = new Set(report.workerVersions.filter(version => version.scriptURL === origin + '/sw.js').map(version => version.versionId));
  report.successfulAChunks = [...new Set(report.requests.filter(request => request.status === 200 && request.url.includes('/_next/static/') && request.url.endsWith('.js')).map(request => request.url))];
  await control('B');
  report.swHeader = Object.fromEntries((await fetch(origin + '/sw.js')).headers);
  report.servedWorkerSha256 = createHash('sha256').update(Buffer.from(await (await fetch(origin + '/sw.js')).arrayBuffer())).digest('hex');
  check('served worker changed from pinned A to current B', report.servedWorkerSha256 !== report.workerBeforeSha256);
  check('served B worker equals reviewed source', report.servedWorkerSha256 === '173611b9a193b0db26ed9b1ef8913962a319f2bf40dedf347adc7c3e1f150eff', report.servedWorkerSha256);
  report.rootHeader = Object.fromEntries((await fetch(origin + '/')).headers);
  check('actual worker response requires revalidation', report.swHeader['cache-control']?.includes('max-age=0'), report.swHeader);
  check('actual root response requires revalidation', report.rootHeader['cache-control']?.includes('max-age=0') && report.rootHeader['cache-control']?.includes('must-revalidate'), report.rootHeader);
  const upgradeStart = Date.now();
  const upgraded = () => report.workerVersions.some(version => version.scriptURL === origin + '/sw.js' && !versionsA.has(version.versionId) && version.status === 'activated');
  if (mode === 'explicit-update') {
    report.updateResult = await evaluate(`(async()=>{try{const registration=await navigator.serviceWorker.getRegistration('/');await registration.update();return {ok:true,active:registration.active?.state,waiting:registration.waiting?.state}}catch(e){return {ok:false,name:e.name,message:e.message}}})()`);
    check('explicit update request succeeds', report.updateResult.ok, report.updateResult);
  } else report.navigationResult = await send('Page.navigate', { url: origin + '/' });
  while (!upgraded() && Date.now() - upgradeStart < 90000) await delay(500);
  check(mode === 'explicit-update' ? 'worker activated after explicit diagnostic update' : 'normal navigation activates updated worker without forced update', upgraded(), report.workerVersions);
  // The navigation which discovered B may still be served by A. The next one must use B.
  await send('Page.navigate', { url: origin + '/?postal=018956' });
  await route();
  state = await capture('B-shared-mobile');
  check('B selected route after same-profile upgrade', state.worker && state.routeCount === 4 && state.document.buildB, { features: state.routeCount, build: server.buildB, document: state.document });
  report.afterCaches = await evaluate('caches.keys()');
  check('unrelated and future cache preserved', ['other-app-v1', 'sgshiok-shell-v999', 'sgshiok-static-v1', 'sgshiok-shell-v2'].every(name => report.afterCaches.includes(name)), report.afterCaches);
  report.sentinels = await evaluate(`Promise.all(['other-app-v1','sgshiok-shell-v999'].map(async name=>({name,body:await(await(await caches.open(name)).match('/sentinel'))?.text()})))`);
  check('foreign and future cache contents unchanged', report.sentinels.every(item => item.body === item.name), report.sentinels);
  report.oldChunkChecks = [];
  for (const url of report.successfulAChunks) {
    const response = await fetch(url);
    if (response.status === 404) report.oldChunkChecks.push({ url, status: 404 });
  }
  check('new server actually lacks at least one old JS chunk', report.oldChunkChecks.length > 0, report.oldChunkChecks);
  for (const [width, height] of [[1440, 950], [390, 667], [320, 667]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await delay(900); await route();
    state = await capture(`B-selected-${width}x${height}`);
    check('current features at ' + width, state.routeCount === 4 && state.basemapLoaded);
  }
  await control('offline');
  report.beforeOutage = await (await fetch(origin + '/__qa/status')).json();
  await send('Page.navigate', { url: origin + '/?postal=018956' });
  // External tiles may remain online; this is origin outage, not a whole-device offline claim.
  await route(); state = await capture('B-origin-offline');
  report.afterOutage = await (await fetch(origin + '/__qa/status')).json();
  check('cached B shell and visited route survive origin outage', state.document.buildB && state.document.fromServiceWorker === true && state.routeCount === 4 && state.worker && report.afterOutage.counts.failures > report.beforeOutage.counts.failures, { document: state.document, before: report.beforeOutage.counts, after: report.afterOutage.counts });
  await control('online');
  await send('Page.navigate', { url: origin + '/' });
  await until(`document.querySelector('main')?.dataset.mapStatus==='idle' && window.__shiokRouteMap?.getSource('onemap') && window.__shiokRouteMap.isSourceLoaded('onemap')`);
  state = await capture('B-return-root');
  check('B root basemap remains usable', state.document.buildB && state.basemapLoaded && state.status === 'idle');
  check('no uncaught app errors', report.exceptions.length === 0, report.exceptions);
} catch (error) {
  report.failure = error.stack; process.exitCode = 1; console.error(error);
  if (evaluate) try { report.failureState = await evaluate(facts); } catch {}
} finally {
  await control('online').catch(() => undefined);
  report.finishedAt = new Date().toISOString();
  report.serverAfter = await (await fetch(origin + '/__qa/status')).json().catch(() => null);
  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n');
  if (send && ws?.readyState === 1) try { await send('Browser.close'); } catch {}
  ws?.close(); if (chrome.exitCode === null) chrome.kill();
  for (const waiter of pending.values()) waiter.reject(Error('shutdown')); pending.clear();
  process.exit(process.exitCode || 0);
}
