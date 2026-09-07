import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const out = resolve(root, 'qa/revamp-r1/loading-diagnosis');
mkdirSync(out, { recursive: true });
if (existsSync(resolve(out, 'capture.json'))) throw Error('Preserve existing capture; do not overwrite evidence');
const profile = resolve(root, 'tmp/loading-diagnosis-' + Date.now());
const port = 9817, started = Date.now(), delay = ms => new Promise(r => setTimeout(r, ms));
const summary = { startedAt: new Date().toISOString(), root, host: process.env.COMPUTERNAME, commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), browserProfile: 'New unique ignored profile', url: 'http://localhost:4318/?postal=018956', samples: [], errors: [], policy: { viewport: [390,844], cold: 'Fresh browser/profile, empty HTTP cache, no prior app memory; service worker bypassed', warm: 'Same browser/profile and HTTP cache, same URL re-navigation; app JS memory reset; service worker bypassed', throttling: 'None; CPU rate 1; local server and real remote OneMap tiles', rendering: 'Headless Chrome SwiftShader, device scale 1, desktop engine at mobile viewport; not a phone benchmark', requestScope: 'Page plus auto-attached dedicated worker Network events, supplemented by worker resource timing; startup attachment can miss early worker requests, never claimed whole-app bytes', deadlineMs: 120000, maximumPairsThisRun: 1 } };
const sampler = spawn('typeperf.exe', ['\\Memory\\Available MBytes', '\\Memory\\Pages Input/sec', '\\Memory\\Pages Output/sec', '\\Memory\\Page Reads/sec', '\\Processor(_Total)\\% Processor Time', '-si', '2', '-sc', '180', '-f', 'CSV', '-o', resolve(out, 'host-pressure.csv')], { windowsHide: true, stdio: 'ignore' });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--remote-debugging-port=' + port, '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws, send, evaluate, active, tracing = false;
const sessions = new Map(), pending = new Map(), trace = []; let nextId = 0, droppedTraceEvents = 0;
try {
  let tabs;
  while (Date.now() - started < 90000) { try { tabs = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); break; } catch { await delay(500); } }
  if (!tabs) throw Error('Browser startup exceeded 90 seconds; no retry');
  summary.browser = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json();
  delete summary.browser.webSocketDebuggerUrl;
  ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  send = (method, params = {}, sessionId, timeout = 10000) => new Promise((resolve, reject) => {
    const id = ++nextId, timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, timeout);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } }); ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
  ws.onmessage = event => {
    const message = JSON.parse(event.data), p = message.params;
    if (message.id) { const job = pending.get(message.id); pending.delete(message.id); if (job) message.error ? job.reject(Error(message.error.message)) : job.resolve(message.result); return; }
    if (message.method === 'Tracing.dataCollected') { for (const item of p.value) { if (trace.length < 120000) trace.push(item); else droppedTraceEvents++; } return; }
    if (message.method === 'Target.attachedToTarget') { sessions.set(p.sessionId, { type: p.targetInfo.type, url: p.targetInfo.url, attachedWall: Date.now() }); if (p.targetInfo.type === 'worker') { send('Network.enable', {}, p.sessionId).catch(e => summary.errors.push(e.message)); send('Runtime.enable', {}, p.sessionId).catch(e => summary.errors.push(e.message)); } return; }
    if (!active) return;
    const key = (message.sessionId || 'page') + ':' + p?.requestId;
    if (message.method === 'Network.requestWillBeSent') active.requests[key] = { target: message.sessionId ? sessions.get(message.sessionId)?.type || 'child' : 'page', url: p.request.url, type: p.type, start: p.timestamp, wallTime: p.wallTime, initiator: p.initiator };
    if (message.method === 'Network.responseReceived' && active.requests[key]) Object.assign(active.requests[key], { headersAt: p.timestamp, status: p.response.status, protocol: p.response.protocol, mime: p.response.mimeType, fromDiskCache: p.response.fromDiskCache, fromServiceWorker: p.response.fromServiceWorker, timing: p.response.timing, contentEncoding: p.response.headers['content-encoding'], contentLength: p.response.headers['Content-Length'] || p.response.headers['content-length'] });
    if (message.method === 'Network.loadingFinished' && active.requests[key]) Object.assign(active.requests[key], { end: p.timestamp, encodedBytes: p.encodedDataLength });
    if (message.method === 'Network.loadingFailed' && active.requests[key]) Object.assign(active.requests[key], { end: p.timestamp, error: p.errorText });
    if (message.method === 'Runtime.exceptionThrown') active.errors.push(p.exceptionDetails.exception?.description || p.exceptionDetails.text);
  };
  evaluate = async expression => { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setBypassServiceWorker', { bypass: true });
  await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: readFileSync(resolve(out, 'browser-probe.js'), 'utf8') });
  await send('Network.clearBrowserCache');
  await send('Tracing.start', { categories: 'devtools.timeline,v8,blink.user_timing', options: 'record-as-much-as-possible', transferMode: 'ReportEvents' }); tracing = true;
  for (const cache of ['cold', 'warm']) {
    active = { cache, startedAt: new Date().toISOString(), requests: {}, errors: [], workerResourceTimings: [] };
    summary.samples.push(active); const start = Date.now();
    console.log(cache + ' navigation started');
    await send('Page.navigate', { url: summary.url });
    let route = false;
    while (Date.now() - start < 120000) {
      route = await evaluate(`window.__loadingDiagnosis?.events.some(e=>e.name==='current-selected-route-visible')`);
      if (route) break;
      await delay(250);
    }
    active.navigationToObservationWallMs = Date.now() - start; active.timedOut = !route;
    active.page = await evaluate(`({timeOrigin:performance.timeOrigin,now:performance.now(),events:window.__loadingDiagnosis?.events,longTasks:window.__loadingDiagnosis?.longTasks,memory:window.__loadingDiagnosis?.memory,navigation:performance.getEntriesByType('navigation').map(e=>e.toJSON()),resources:performance.getEntriesByType('resource').map(e=>e.toJSON()),status:document.querySelector('main')?.dataset.mapStatus,selectedPostal:document.querySelector('[data-postal]')?.dataset.postal})`);
    const facts = `(()=>{const m=window.__shiokRouteMap,d=window.__shiokRouteDebug,p=d?.padding;const box=p?[[p.left,p.top],[innerWidth-p.right,innerHeight-p.bottom]]:undefined;return {at:performance.now(),width:innerWidth,height:innerHeight,key:d?.routeKey,center:m?.getCenter(),zoom:m?.getZoom(),moving:m?.isMoving(),padding:p,status:document.querySelector('main')?.dataset.mapStatus,basemapLoaded:m?.getSource('onemap')?m.isSourceLoaded('onemap'):false,count:m?.getLayer('shiokest-route-line')?m.queryRenderedFeatures(box,{layers:['shiokest-route-line']}).filter(f=>f.properties.render_key===d?.routeKey).length:0}})()`;
    active.beforeScreenshot = await evaluate(facts);
    active.screenshot = cache + '-390x844.png';
    writeFileSync(resolve(out, active.screenshot), Buffer.from((await send('Page.captureScreenshot', { format: 'png' }, undefined, 15000)).data, 'base64'));
    active.afterScreenshot = await evaluate(facts);
    const a = active.beforeScreenshot, b = active.afterScreenshot;
    active.sameCaptureState = a.count === b.count && a.key === b.key && a.zoom === b.zoom && JSON.stringify(a.center) === JSON.stringify(b.center) && a.width === b.width && a.height === b.height && !a.moving && !b.moving;
    active.loadedCapture = active.sameCaptureState && a.count > 0;
    for (const [session, info] of sessions) if (info.type === 'worker') { try { const result = await send('Runtime.evaluate', { expression: '({timeOrigin:performance.timeOrigin,resources:performance.getEntriesByType("resource").map(e=>e.toJSON())})', returnByValue: true }, session, 2000); active.workerResourceTimings.push({ ...info, result: result.result.value }); } catch (error) { active.errors.push('Worker resource timing: ' + error.message); } }
    await evaluate('window.__loadingDiagnosis?.stop()');
    writeFileSync(resolve(out, cache + '.json'), JSON.stringify(active, null, 2) + '\n');
    console.log(cache + ' capture ' + JSON.stringify({ timedOut: active.timedOut, wallMs: active.navigationToObservationWallMs, count: a.count, sameCaptureState: active.sameCaptureState }));
    active = undefined;
  }
  summary.gate = 'One required mobile pair only. Inspect sustained host pressure and timeout evidence before any further samples; this script never repeats automatically.';
} catch (error) { summary.errors.push(error.stack); console.error(error); }
finally {
  if (tracing) { try { await send('Tracing.end'); await delay(1000); } catch (error) { summary.errors.push(error.message); } }
  writeFileSync(resolve(out, 'timeline.json.gz'), gzipSync(JSON.stringify({ traceEvents: trace, droppedTraceEvents })));
  summary.trace = { file: 'timeline.json.gz', events: trace.length, droppedTraceEvents };
  summary.finishedAt = new Date().toISOString(); summary.elapsedMs = Date.now() - started;
  writeFileSync(resolve(out, 'capture.json'), JSON.stringify(summary, null, 2) + '\n');
  if (ws?.readyState === WebSocket.OPEN) { try { await send('Browser.close', {}, undefined, 2000); } catch {} ws.close(); }
  // Only the browser and sampler created by this diagnostic are stopped.
  if (chrome.exitCode === null) chrome.kill();
  if (sampler.exitCode === null) sampler.kill();
}
