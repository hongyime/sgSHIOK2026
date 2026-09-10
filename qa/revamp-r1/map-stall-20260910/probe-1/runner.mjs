import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import os from 'node:os';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Working root guard');
const label = process.argv[2];
if (!/^probe-[0-9]+$/.test(label ?? '')) throw Error('Fresh probe-N required');
const out = resolve(root, 'qa/revamp-r1/map-stall-20260910', label);
mkdirSync(out);
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
const profile = mkdtempSync(resolve(root, 'tmp/map-stall-browser-'));
const report = { root, host: os.hostname(), profile, startedAt: new Date().toISOString(), boundaries: [], events: [], responses: [], errors: [], captures: [], availableMiB: os.freemem() / 1048576 };
const start = performance.now(), deadline = Date.now() + 480000;
let chrome, ws, stderr = '', sequence = 0, context, profiling = false;
const pending = new Map(), contexts = new Map();
const delay = ms => new Promise(done => setTimeout(done, ms));
const stamp = () => performance.now() - start;
const save = () => writeFileSync(resolve(out, 'progress.json'), JSON.stringify(report, null, 2) + '\n');
function send(method, params = {}, milliseconds = 15000) {
  const entry = { method, at: stamp(), params: method === 'Runtime.evaluate' ? params : undefined };
  report.boundaries.push(entry);
  return new Promise((done, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); entry.timeout = true; entry.finished = stamp(); save(); reject(Error('CDP timeout: ' + method)); }, Math.min(milliseconds, Math.max(1, deadline - Date.now())));
    pending.set(id, m => { clearTimeout(timer); entry.finished = stamp(); if (m.error) { entry.error = m.error; reject(Error(m.error.message)); } else done(m.result); });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression, name) {
  const started = stamp();
  const result = await send('Runtime.evaluate', { expression, uniqueContextId: context?.uniqueId, returnByValue: true, awaitPromise: false, timeout: 5000 });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  const item = { name, started, finished: stamp(), value: result.result.value };
  report.boundaries.push(item); save(); console.log(JSON.stringify(item));
  return item.value;
}
async function until(read, accept, milliseconds) {
  const end = Math.min(deadline, Date.now() + milliseconds);
  while (Date.now() < end) { const value = await read(); if (accept(value)) return value; await delay(500); }
  throw Error('Boundary state timeout');
}
async function capture(name) {
  const result = await send('Page.captureScreenshot', { format: 'png' }, 30000);
  writeFileSync(resolve(out, name + '.png'), Buffer.from(result.data, 'base64'), { flag: 'wx' });
  report.captures.push({ name, at: stamp() }); save();
}
try {
  const httpStart = stamp(), response = await fetch('http://127.0.0.1:4362/?postal=018956&debugMap=1', { signal: AbortSignal.timeout(30000) });
  const html = await response.text();
  report.http = { status: response.status, bytes: Buffer.byteLength(html), milliseconds: stamp() - httpStart, correctBuild: html.includes('sou6pZfEMMmsCl52vdXg4') };
  if (!response.ok || !report.http.correctBuild) throw Error('Wrong current preview');
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-sandbox', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
  report.chromePid = chrome.pid;
  chrome.on('exit', (code, signal) => { report.chromeExit = { code, signal, at: stamp() }; });
  chrome.stderr.on('data', bytes => { stderr += bytes; });
  const endpoint = await until(async () => /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1], Boolean, 45000);
  const tabs = await (await fetch('http://' + new URL(endpoint).host + '/json', { signal: AbortSignal.timeout(5000) })).json();
  ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((done, reject) => { const timer = setTimeout(() => reject(Error('WebSocket startup timeout')), 15000); ws.onopen = () => { clearTimeout(timer); done(); }; ws.onerror = error => { clearTimeout(timer); reject(error); }; });
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { pending.get(m.id)?.(m); pending.delete(m.id); return; }
    if (m.method === 'Runtime.executionContextCreated') { contexts.set(m.params.context.uniqueId, m.params.context); report.events.push({ method: m.method, at: stamp(), context: m.params.context }); }
    else if (m.method === 'Runtime.executionContextsCleared') { contexts.clear(); report.events.push({ method: m.method, at: stamp() }); }
    else if (m.method === 'Runtime.executionContextDestroyed') { for (const [id, c] of contexts) if (c.id === m.params.executionContextId) contexts.delete(id); report.events.push({ method: m.method, at: stamp(), params: m.params }); }
    else if (m.method === 'Runtime.exceptionThrown') report.errors.push(m.params);
    else if (m.method === 'Network.responseReceived') report.responses.push({ at: stamp(), url: m.params.response.url, status: m.params.response.status });
    else if (['Page.domContentEventFired', 'Page.loadEventFired', 'Inspector.targetCrashed'].includes(m.method)) report.events.push({ method: m.method, at: stamp(), params: m.params });
  };
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable'); await send('Inspector.enable');
  context = [...contexts.values()].find(c => c.auxData?.isDefault);
  await evaluate('40 + 2', 'blank-page responsiveness');
  await send('Profiler.enable'); await send('Profiler.start'); profiling = true;
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:4362/?postal=018956&debugMap=1' });
  context = await until(async () => [...contexts.values()].find(c => c.origin === 'http://127.0.0.1:4362' && c.auxData?.isDefault), Boolean, 45000);
  await evaluate('document.readyState', 'new-context DOM responsiveness');
  await until(() => evaluate('({state:document.readyState,map:!!window.__shiokRouteMap,status:document.querySelector("main")?.dataset.mapStatus})', 'cheap DOM/map handle'), v => v.map, 90000);
  await capture('before-map-inspection-390x844');
  await until(() => evaluate('window.__shiokRouteMap.isStyleLoaded()', 'style readiness'), Boolean, 60000);
  await evaluate('window.__shiokRouteMap.areTilesLoaded()', 'tile readiness');
  await evaluate('({key:window.__shiokRouteDebug?.routeKey,count:window.__shiokRouteMap.queryRenderedFeatures({layers:["shiokest-route-line"]}).filter(f=>f.properties.render_key===window.__shiokRouteDebug?.routeKey).length})', 'current route query');
  await evaluate('document.body.innerText.slice(0,1200)', 'visible text query');
  await capture('after-map-inspection-390x844');
  report.ok = true;
} catch (error) {
  report.ok = false; report.failure = String(error.stack ?? error); console.error(report.failure); process.exitCode = 1;
  if (ws?.readyState === WebSocket.OPEN) try { await capture('failure'); } catch (e) { report.captureFailure = String(e); }
} finally {
  if (profiling && ws?.readyState === WebSocket.OPEN) try { const result = await send('Profiler.stop', {}, 15000); writeFileSync(resolve(out, 'page.cpuprofile'), JSON.stringify(result.profile), { flag: 'wx' }); } catch (e) { report.profileFailure = String(e); }
  if (ws?.readyState === WebSocket.OPEN) try { await send('Browser.close', {}, 10000); } catch (e) { report.closeObservation = String(e); }
  ws?.close();
  for (const [, finish] of pending) finish({ error: { message: 'Probe closed' } }); pending.clear();
  const cleanup = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', resolve(root, 'qa/revamp-r1/map-stall-20260910/cleanup.ps1'), '-Profile', profile], { cwd: root, windowsHide: true, encoding: 'utf8', timeout: 45000 });
  report.cleanup = { exitCode: cleanup.status, stdout: cleanup.stdout, stderr: cleanup.stderr, error: cleanup.error?.message };
  try { report.cleanup.verified = cleanup.status === 0 && JSON.parse(cleanup.stdout).verified; } catch { report.cleanup.verified = false; }
  if (!report.cleanup.verified) { report.ok = false; process.exitCode = 1; }
  chrome?.stderr?.destroy(); chrome?.unref();
  report.finishedAt = new Date().toISOString(); report.availableMiBAfter = os.freemem() / 1048576;
  writeFileSync(resolve(out, 'result.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ ok: report.ok, captures: report.captures.length, cleanupVerified: report.cleanup.verified, out }));
}
