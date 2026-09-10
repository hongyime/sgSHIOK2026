import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Working root guard');
const label = process.argv[2];
if (!/^browser-[0-9]+$/.test(label ?? '')) throw Error('Fresh browser-N label required');
const out = resolve(root, 'qa/revamp-r1/worker-alignment-20260910', label);
mkdirSync(out);
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));
const origin = 'http://127.0.0.1:4362';
const report = { origin, profile, graphicsMode: 'Chrome default; no forced SwiftShader', checks: [], captures: [], responses: [], failures: [], errors: [], startedAt: new Date().toISOString() };
const deadline = Date.now() + 600000;
let chrome, ws, id = 0, stderr = '';
const pending = new Map(), delay = ms => new Promise(done => setTimeout(done, ms));
function check(name, pass, detail) { report.checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`); if (!pass) throw Error(name); }
function send(method, params = {}) {
  return new Promise((done, reject) => {
    const key = ++id, timer = setTimeout(() => { pending.delete(key); reject(Error('CDP timeout: ' + method)); }, 30000);
    pending.set(key, result => { clearTimeout(timer); result.error ? reject(Error(result.error.message)) : done(result.result); });
    ws.send(JSON.stringify({ id: key, method, params }));
  });
}
async function evaluate(fn) {
  const result = await send('Runtime.evaluate', { expression: `(${fn.toString()})()`, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function until(read, accept, milliseconds = 90000) {
  const end = Math.min(deadline, Date.now() + milliseconds);
  let last;
  while (Date.now() < end) { last = await read(); if (accept(last)) return last; await delay(400); }
  report.lastState = last; throw Error('State timeout');
}
function facts() {
  if (!document.body || !document.documentElement) return { documentReady: false };
  const map = window.__shiokRouteMap, debug = window.__shiokRouteDebug;
  const styleReady = map?.isStyleLoaded() === true;
  const rect = element => { const r = element?.getBoundingClientRect(); return r && { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
  let features = []; try { features = map?.queryRenderedFeatures({ layers: ['shiokest-route-line'] }) ?? []; } catch {}
  return { width: innerWidth, height: innerHeight, key: debug?.routeKey, count: features.filter(f => f.properties.render_key === debug?.routeKey).length,
    basemap: styleReady && map.isSourceLoaded('onemap'), tiles: styleReady && map.areTilesLoaded(), moving: map?.isMoving(), center: map?.getCenter().toArray(), zoom: map?.getZoom(),
    status: document.querySelector('main')?.dataset.mapStatus, overflow: document.documentElement.scrollWidth > innerWidth,
    brand: rect(document.querySelector('h1')), input: rect(document.querySelector('#postal-search-input')), sheet: rect(document.querySelector('aside')),
    about: rect([...document.querySelectorAll('summary')].find(n => n.textContent === 'About data')),
    text: document.body.innerText.slice(0, 1200), version: performance.getEntriesByType('resource').filter(r => r.name.includes('/maplibre/')).map(r => r.name) };
}
const ready = f => f.key && f.count > 0 && f.basemap && f.tiles && !f.moving;
try {
  const identity = await (await fetch(origin + '/__qa/status')).json();
  const expected = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/cached-release-20260908/worker-alignment-20260910/build.json')));
  check('current preview build identity', identity.buildId === expected.buildId, identity);
  report.buildId = identity.buildId;
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-sandbox', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
  chrome.stderr.on('data', value => { stderr += value; });
  const endpoint = await until(async () => /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1], Boolean, 45000);
  const tabs = await (await fetch('http://' + new URL(endpoint).host + '/json')).json();
  ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((done, reject) => { ws.onopen = done; ws.onerror = reject; });
  ws.onmessage = event => { const m = JSON.parse(event.data); if (m.id) { pending.get(m.id)?.(m); pending.delete(m.id); }
    else if (m.method === 'Runtime.exceptionThrown') report.errors.push(m.params.exceptionDetails);
    else if (m.method === 'Network.responseReceived') report.responses.push({ url: m.params.response.url, status: m.params.response.status });
    else if (m.method === 'Network.loadingFailed') report.failures.push(m.params);
  };
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin + '/?postal=018956&debugMap=1' });
  await until(() => evaluate(facts), ready, 180000);
  report.renderer = await evaluate(() => { const gl = window.__shiokRouteMap.getCanvas().getContext('webgl2'); const info = gl?.getExtension('WEBGL_debug_renderer_info'); return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'not exposed'; });
  for (const [width, height] of [[1440, 950], [390, 844], [390, 667], [320, 667]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await until(() => evaluate(facts), f => f.width === width && f.height === height && ready(f));
    await delay(500);
    const before = await evaluate(facts);
    const image = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(resolve(out, `${width}x${height}.png`), Buffer.from(image.data, 'base64'), { flag: 'wx' });
    const after = await evaluate(facts);
    report.captures.push({ before, after, path: `${width}x${height}.png` });
    check(`${width}x${height} current route and loaded basemap`, ready(before) && ready(after) && before.key === after.key && before.count === after.count && JSON.stringify(before.center) === JSON.stringify(after.center) && before.zoom === after.zoom, after);
    check(`${width}x${height} no page overflow`, !after.overflow);
    check(`${width}x${height} brand above left-hand search`, after.brand.x < 60 && after.input.x < 60 && after.brand.bottom <= after.input.y, { brand: after.brand, input: after.input });
    check(`${width}x${height} About data bottom right`, after.about && after.about.right <= width && after.about.right >= width - 40 && after.about.bottom <= height && after.about.y > height - 100, after.about);
  }
  check('no browser runtime exceptions', report.errors.length === 0, report.errors);
  const assetResults = [];
  for (const version of ['6.1.0', '6.4.1']) for (const name of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
    const response = await fetch(`${origin}/maplibre/${version}/${name}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assetResults.push({ version, name, status: response.status, matches: bytes.equals(readFileSync(resolve(root, 'web/public/maplibre', version, name))), cache: response.headers.get('cache-control') });
  }
  check('old and new worker URLs serve exact immutable assets', assetResults.every(r => r.status === 200 && r.matches && r.cache.includes('immutable')), assetResults);
  report.ok = true;
} catch (error) { report.error = String(error.stack ?? error); report.ok = false; console.error(report.error); process.exitCode = 1; }
finally {
  if (ws?.readyState === WebSocket.OPEN) { try { await send('Browser.close'); } catch {} ws.close(); }
  report.cleanup = cleanup(profile);
  chrome?.stderr?.destroy();
  chrome?.unref();
  if (!report.cleanup.verified) { report.ok = false; process.exitCode = 1; }
  report.finishedAt = new Date().toISOString();
  writeFileSync(resolve(out, 'result.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ ok: report.ok, captures: report.captures.length, checks: report.checks.length, cleanup: report.cleanup.verified }));
}
