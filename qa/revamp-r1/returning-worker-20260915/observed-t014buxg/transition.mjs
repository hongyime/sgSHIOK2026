import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { freemem } from 'node:os';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { startReleaseServer } from '../legacy-reload-20260913/release-server-v2.mjs';
import { reloadedDocument, transientNavigationContext } from '../legacy-reload-20260913/navigation-proof.mjs';
import { facts, metricFacts } from '../same-document-zoom-20260915/probes.mjs';

const ROOT = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), ROOT);
assert.equal(process.argv[2], '--go');
const BASE = resolve(ROOT, 'qa/revamp-r1/returning-worker-20260915');
const out = process.argv[3];
assert.equal(dirname(out), BASE);
assert.match(out.slice(BASE.length + 1), /^observed-[a-z0-9_]+$/);
const profile = resolve(out, 'profile');
mkdirSync(profile);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const write = (name, value) => writeFileSync(resolve(out, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const started = Date.now(), workEnd = started + 240000;
const report = { root: ROOT, hostname: process.env.COMPUTERNAME, startedAt: new Date(started).toISOString(),
  scope: 'Captured production page/worker -> verified candidate by one ordinary reload, same profile/origin with caches enabled. No cache clear, unregister, bypass, forced worker update or worker override. External requests including basemap tiles denied; route rendering only, not new basemap/phone/performance/rollback acceptance.',
  checks: [], events: [], blocked: [], droppedEvents: 0, notRun: [], passed: false };
let sequence = 0, ws, session, chrome, preview, server, previewIdentity, phase = 'old';
const pending = new Map(), sockets = new Set();
const delay = ms => new Promise(done => setTimeout(done, ms));
const check = (name, ok, detail) => { report.checks.push({ name, passed: !!ok, detail }); assert.ok(ok, name); };
async function until(name, get, accept, milliseconds = 20000) {
  const end = Math.min(workEnd, Date.now() + milliseconds);
  while (Date.now() < end) {
    try { const value = await get(); report.last = { name, value }; if (accept(value)) return value; }
    catch (error) { if (!transientNavigationContext(error)) throw error; }
    await delay(200);
  }
  throw Error(name + ' timeout');
}
function send(method, params = {}, sessionId = session, milliseconds = 15000) {
  return new Promise((done, reject) => {
    if (method !== 'Browser.close' && Date.now() >= workEnd) { reject(Error('Aggregate work deadline')); return; }
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error(method + ' timeout')); },
      method === 'Browser.close' ? milliseconds : Math.min(milliseconds, workEnd - Date.now()));
    pending.set(id, (result, error) => { clearTimeout(timer); pending.delete(id); error ? reject(Error(error.message)) : done(result); });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function clickControl(selector) {
  const point=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)return null;const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return{x,y,visible:r.width>0&&r.height>0&&!!hit&&(hit===e||e.contains(hit))}})()`);
  check('visible control '+selector,point?.visible,point);
  for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:point.x,y:point.y,button:'left',clickCount:1});
}
const deny = createServer((req, res) => { report.blocked.push({ method: req.method, url: req.url }); res.writeHead(403).end(); });
deny.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
deny.on('connect', (req, socket) => { report.blocked.push({ method: 'CONNECT', url: req.url }); socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); });
deny.on('upgrade', (_req, socket) => socket.destroy());
try {
  check('at least 1GiB available before bounded browser', freemem() >= 1073741824);
  const capture = resolve(ROOT, 'qa/revamp-r1/production-runtime-20260913');
  const captured = resolve(capture, 'capture-1789294685168');
  const production = JSON.parse(readFileSync(resolve(capture, 'summary.json')));
  const html = readFileSync(resolve(captured, 'index.html'));
  assert.equal(sha(html), production.html.sha256, 'STOP captured HTML mismatch');
  const assets = new Map();
  for (const name of ['initial-assets.json', 'dependencies.json', 'dependencies-reviewed.json']) {
    const receipts = JSON.parse(readFileSync(resolve(captured, name)));
    for (const receipt of receipts.responses.filter(entry => entry.file)) {
      const bytes = readFileSync(resolve(captured, receipt.file));
      assert.equal(sha(bytes), receipt.sha256, 'STOP captured asset mismatch');
      assert.equal(bytes.length, receipt.decodedBytes);
      assets.set(new URL(receipt.url).pathname, { bytes, headers: receipt.headers });
    }
  }
  assert.equal(assets.size, 24);
  const buildPath = resolve(ROOT, 'qa/revamp-r1/release-finalize-20260915/frontend-brzm8xg4/build.json');
  const buildBytes = readFileSync(buildPath);
  assert.equal(sha(buildBytes), 'd4b98d8d7400a82671e79bcb4802f4cf231170d29d74fd36a36a9b39da842f14');
  const build = JSON.parse(buildBytes);
  const currentWorker = readFileSync(resolve(build.stage, 'web/public/sw.js'));
  assert.equal(sha(currentWorker), build.files.find(file => file.path === 'web/public/sw.js').sha256);
  report.identities = { oldBuildId: production.html.buildId, oldHtmlSha256: sha(html),
    oldWorkerSha256: sha(assets.get('/sw.js').bytes), currentBuildId: build.buildId, currentWorkerSha256: sha(currentWorker), sourceRevision: build.sourceRevision };
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => ['PATH', 'SYSTEMROOT', 'WINDIR', 'SYSTEMDRIVE', 'COMSPEC', 'PATHEXT'].includes(name.toUpperCase())));
  env.TEMP = env.TMP = resolve(ROOT, 'tmp');
  preview = spawn(process.execPath, [resolve(ROOT, 'qa/revamp-r1/release-finalize-20260915/preview.mjs'), '--go', buildPath],
    { cwd: ROOT, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  preview.stdout.on('data', bytes => { stdout += bytes; if (!previewIdentity && stdout.includes('\n')) previewIdentity = JSON.parse(stdout.split('\n')[0]); });
  preview.stderr.on('data', bytes => { stderr = (stderr + bytes).slice(-5000); });
  report.previewPid = preview.pid;
  await until('owned preview identity', () => previewIdentity, Boolean);
  report.preview = previewIdentity;
  check('preview pins candidate build', previewIdentity.buildId === build.buildId);
  report.readinessAttempts=[];
  await until('owned Next ready', async () => {
    const entry={atMs:Date.now()-started};report.readinessAttempts.push(entry);
    try {
      const response = await fetch(previewIdentity.url, { signal: AbortSignal.timeout(3000) });
      entry.status=response.status;await response.arrayBuffer();return response.status;
    } catch(error) { entry.error=error.cause?.code??error.name;return null; }
  }, status => status === 200, 60000);
  report.previewReady = true;
  server = await startReleaseServer({ html, htmlHeaders: production.html.aliasHeaders, assets,
    currentOrigin: previewIdentity.url, wallMs: 230000, maxRequests: 500, maxBytes: 128 * 1024 * 1024 });
  const selected = server.origin + '/?postal=018956&debugMap=1';
  report.selectedUrl = selected;
  await new Promise((done, reject) => { deny.once('error', reject); deny.listen(0, '127.0.0.1', done); });
  const args = ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-background-networking',
    '--disable-component-update', '--disable-sync', '--disable-breakpad', '--disable-quic', '--remote-debugging-port=0',
    '--remote-debugging-address=127.0.0.1', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
    '--window-size=1440,950', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    `--proxy-server=http://127.0.0.1:${deny.address().port}`, '--proxy-bypass-list=127.0.0.1',
    `--user-data-dir=${profile}`, `--crash-dumps-dir=${profile}`, 'about:blank'];
  chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', args, { cwd: ROOT, env: { ...env, TEMP: profile, TMP: profile }, windowsHide: true, stdio: 'ignore' });
  report.chromePid = chrome.pid;
  report.browserStarted = true;
  const portFile = resolve(profile, 'DevToolsActivePort');
  await until('owned Chrome startup', () => existsSync(portFile), Boolean, 20000);
  const [port, path] = readFileSync(portFile, 'utf8').trim().split(/\r?\n/);
  ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((done, reject) => { ws.onopen = done; ws.onerror = reject; });
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) { pending.get(message.id)?.(message.result, message.error); return; }
    if (['Log.entryAdded', 'Runtime.exceptionThrown', 'Network.loadingFailed', 'Page.frameNavigated', 'Runtime.executionContextCreated',
      'Network.responseReceived', 'Network.requestWillBeSent', 'ServiceWorker.workerVersionUpdated'].includes(message.method)) {
      if (report.events.length >= 2500) { report.droppedEvents++; return; }
      report.events.push({ method: message.method, sessionId: message.sessionId, params: message.params, phase, atMs: Date.now() - started });
    }
  };
  report.browser = await send('Browser.getVersion', {}, '');
  const target = await send('Target.createTarget', { url: 'about:blank' }, '');
  session = (await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }, '')).sessionId;
  for (const method of ['Runtime.enable', 'Page.enable', 'Network.enable', 'Log.enable', 'ServiceWorker.enable']) await send(method);
  const first = await send('Page.navigate', { url: selected });
  check('old navigation accepted', !first.errorText, first);
  await until('old document complete',()=>evaluate('document.readyState'),value=>value==='complete',30000);
  // This production version registers its worker in the Search handler, not at idle.
  await clickControl('#postal-search-input');
  const typed=await evaluate('document.querySelector("#postal-search-input").value');
  if(!typed)await send('Input.insertText',{text:'018956'});
  check('old postal input ready',await evaluate('document.querySelector("#postal-search-input").value')==='018956');
  await clickControl('#postal-search-button');
  await until('old page and worker control', () => evaluate('({ready:document.readyState,controlled:!!navigator.serviceWorker.controller,url:location.href})'),
    value => value.ready === 'complete' && value.controlled, 30000);
  check('old page received captured HTML', server.requests.some(entry => entry.source === 'captured-old' && entry.destination === 'document' && entry.sha256 === sha(html)));
  // One extra old navigation establishes a real canonical shell cache before switching.
  await send('Page.reload');
  await until('canonical old shell cached', () => evaluate(`(async()=>{const r=await(await caches.open('sgshiok-static-v1')).match('/');return r?{url:location.href,sha:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer()))).map(v=>v.toString(16).padStart(2,'0')).join('')}:null})()`),
    value => value?.sha === sha(html), 25000);
  const assetPath = [...assets.keys()].find(path => path.endsWith('.js') && path.startsWith('/_next/'));
  const dataPath = '/data/generated_20260805_prefer_scored_routed/manifest.json';
  report.preservationPaths = [assetPath, dataPath];
  await evaluate(`(async()=>{localStorage.setItem('__qa:reload-preserve','local-sentinel');sessionStorage.setItem('__qa:reload-preserve','session-sentinel');await(await caches.open('qa-unrelated-cache')).put('/__qa/preserve',new Response('cache-sentinel'));for(const path of ${JSON.stringify(report.preservationPaths)}){const response=await fetch(path);if(!response.ok)throw Error('seed fetch failed');await(await caches.open('sgshiok-static-v1')).put(path,response)}return true})()`);
  const snapshot = `(async()=>{const entries=[];for(const [name,paths]of[['sgshiok-static-v1',${JSON.stringify(report.preservationPaths)}],['qa-unrelated-cache',['/__qa/preserve']]]){const cache=await caches.open(name);for(const path of paths){const response=await cache.match(path);if(!response)throw Error('missing preserved '+path);const bytes=await response.arrayBuffer();entries.push({name,path,bytes:bytes.byteLength,sha:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('')})}}return {local:localStorage.getItem('__qa:reload-preserve'),session:sessionStorage.getItem('__qa:reload-preserve'),entries}})()`;
  report.before = await evaluate(snapshot);
  const documentBefore = await evaluate('({timeOrigin:performance.timeOrigin,url:location.href})');
  const oldVersions = new Set(report.events.flatMap(event => event.method === 'ServiceWorker.workerVersionUpdated' ? event.params.versions.map(version => version.versionId) : []));
  assert.ok(oldVersions.size > 0, 'Old worker version observed before switch');
  server.flip(); phase = 'reload';
  await send('Page.reload');
  await until('candidate document', () => evaluate('({timeOrigin:performance.timeOrigin,url:location.href,text:document.documentElement.innerHTML})'),
    value => value.timeOrigin !== documentBefore.timeOrigin && value.text.includes(build.buildId), 35000);
  const document = reloadedDocument(report.events, { sessionId: session, frameId: first.frameId, url: selected });
  check('current top-level Document correlated by loader/frame/request', !!document, document);
  const responseBody = await send('Network.getResponseBody', { requestId: document.params.requestId });
  const body = Buffer.from(responseBody.body, responseBody.base64Encoded ? 'base64' : 'utf8');
  check('Document body is current build, not old HTML', body.includes(Buffer.from(build.buildId)) && sha(body) !== sha(html), { sha256: sha(body), bytes: body.length });
  check('browser Document matches a completed candidate HTML response', server.requests.some(entry => entry.release === 'current' && entry.source === 'current-preview' &&
    entry.status === 200 && entry.finishedAt && entry.bytes === body.length && entry.sha256 === sha(body)), { sha256: sha(body), bytes: body.length });
  await until('current worker activates naturally', () => report.events.flatMap(event => event.method === 'ServiceWorker.workerVersionUpdated' ? event.params.versions : []),
    versions => versions.some(version => !oldVersions.has(version.versionId) && version.status === 'activated' && version.controlledClients?.includes(target.targetId) &&
      report.events.some(event => event.phase === 'reload' && event.method === 'ServiceWorker.workerVersionUpdated' && event.params.versions.some(item => item.versionId === version.versionId && item.status === 'activated'))), 25000);
  check('candidate worker was served after switch', server.requests.some(entry => entry.release === 'current' && entry.url === '/sw.js' && entry.sha256 === sha(currentWorker)));
  report.after = await evaluate(snapshot);
  check('local/session/unrelated/immutable/data cache entries preserved', JSON.stringify(report.before) === JSON.stringify(report.after), { before: report.before, after: report.after });
  const route = await until('selected current route renders once', () => evaluate('(' + facts.toString() + ')()'),
    value => value.postal === '018956' && value.count > 0 && value.keys.length === 1 && value.keys[0] === value.routeKey, 65000);
  check('postal survives without re-entry', new URL(route.url).searchParams.get('postal') === '018956', route);
  report.metrics = await evaluate('(' + metricFacts.toString() + ')()');
  check('four walk values readable', report.metrics.length === 4 && report.metrics.every(metric => metric.visible), report.metrics);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const pixels = Buffer.from(shot.data, 'base64');
  writeFileSync(resolve(out, 'current-route.png'), pixels, { flag: 'wx' });
  report.capture = { file: 'current-route.png', bytes: pixels.length, sha256: sha(pixels), route };
  report.passed = true;
} catch (error) { report.failure = error.stack; }
finally {
  if (ws?.readyState === 1) try { await send('Browser.close', {}, '', 4000); } catch (error) { report.closeError = error.message; }
  ws?.close();
  for (const callback of pending.values()) callback(null, { message: 'QA closing' });
  for (const socket of sockets) socket.destroy();
  if (deny.listening) await new Promise(done => deny.close(done));
  if (server) { await server.close(); report.boundary = { requests: server.requests, stats: server.snapshot() }; }
  try {
    if (report.browserStarted) check('no captured browser events dropped', report.droppedEvents === 0, report.droppedEvents);
    else report.notRun.push({ check: 'browser event collection', reason: 'preview_not_ready' });
    if (phase === 'reload') {
      const exceptions = report.events.filter(event => event.phase === 'reload' && event.method === 'Runtime.exceptionThrown');
      check('no runtime exceptions during current navigation', exceptions.length === 0, exceptions);
    } else report.notRun.push({ check: 'current navigation runtime exceptions and transition acceptance', reason: report.previewReady ? 'release_not_switched' : 'preview_not_ready' });
    if (server) check('final drained boundary has no limit or active requests', report.boundary.stats.closed === true && !report.boundary.stats.limitHit && report.boundary.stats.activeUpstreams === 0 && report.boundary.stats.activeSockets === 0, report.boundary.stats);
    else report.notRun.push({ check: 'boundary drain', reason: 'not_applicable_boundary_not_created' });
    if (previewIdentity) {
      const statusResponse = await fetch(previewIdentity.url + '__qa/status', { signal: AbortSignal.timeout(5000) });
      assert.equal(statusResponse.status, 200);
      const finalPreview = await statusResponse.json();report.finalPreview=finalPreview;
      check('after drain staged data hashes unchanged during served reads', finalPreview.dataMismatches.length === 0, finalPreview.dataMismatches);
    }
  } catch (error) { report.finalFailure = error.stack; report.passed = false; }
  chrome?.unref(); preview?.unref(); preview?.stdout.destroy(); preview?.stderr.destroy();
  report.elapsedMs = Date.now() - started;
  report.passed = report.passed && !report.closeError && report.elapsedMs <= 260000;
  write('observation.json', report);
  console.log(JSON.stringify({ out, passed: report.passed, checks: report.checks, failure: report.failure, elapsedMs: report.elapsedMs }, null, 2));
  process.exitCode = report.passed ? 0 : 1;
}
