import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';
import os from 'node:os';
import { COUNTERS } from '../loading-profile-20260912/analyze.mjs';

const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/ux-reset-20260912/observed-'));
const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));
const origin = 'http://127.0.0.1:4384', hash = bytes => createHash('sha256').update(bytes).digest('hex');
const started = Date.now(), deadline = started + 600000, workEnd = deadline - 60000;
const report = { root, hostname: process.env.COMPUTERNAME, out, profile, origin, startedAt: new Date().toISOString(), entries: [], checks: [], errors: [], denied: [] };
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
let chrome, sampler, samplerClosed, hostTimer, ws, stderr = '', sequence = 0, closing = false, mainSession;
const pending = new Map(), workerSessions = new Set();
const record = entry => report.entries.push({ sequence: report.entries.length, timeMs: Date.now() - started, ...entry });
function send(method, params = {}, sessionId = '', timeout = 20000) {
  return new Promise((done, reject) => {
    const remaining = (closing ? deadline : workEnd) - Date.now();
    if (remaining <= 0) { reject(Error('QA deadline')); return; }
    const id = ++sequence; record({ kind: 'send', id, method, sessionId, params });
    const timer = setTimeout(() => finish(undefined, { kind: 'timeout', message: method + ' timeout' }), Math.min(remaining, timeout));
    function finish(result, error) {
      clearTimeout(timer); pending.delete(id);
      // Response bodies are hashed separately; retain identity/size, not duplicate bodies in telemetry.
      record({ kind: 'reply', id, sessionId, ...(error ? { error } : { result: method === 'Network.getResponseBody' ? { bodyCharacters: result.body.length, base64Encoded: result.base64Encoded } : result }) });
      error ? reject(Object.assign(Error(error.message), { cdp: { id, method, sessionId, error } })) : done(result);
    }
    pending.set(id, finish);
    try { ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }
    catch (e) { finish(undefined, { kind: 'connection', message: e.message }); }
  });
}
async function evaluate(fn) {
  const r = await send('Runtime.evaluate', { expression: '(' + fn.toString() + ')()', returnByValue: true, awaitPromise: true }, mainSession);
  if (r.exceptionDetails) throw Error(r.exceptionDetails.text);
  return r.result.value;
}
async function until(name, get, predicate, limit = 90000) {
  const end = Math.min(workEnd, Date.now() + limit);
  while (Date.now() < end) { const value = await get(); report.last = { name, value }; if (predicate(value)) return value; await new Promise(done => setTimeout(done, 250)); }
  throw Error(name + ' timeout');
}
function check(name, pass, detail) { report.checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name); if (!pass) throw Error(name); }
function facts() {
  const m = window.__shiokRouteMap, d = window.__shiokRouteDebug;
  let features = []; try { features = m?.queryRenderedFeatures({ layers: ['shiokest-route-line'] }) ?? []; } catch {}
  return { status: document.querySelector('main')?.dataset.mapStatus, routeKey: d?.routeKey,
    count: features.filter(f => f.properties?.render_key === d?.routeKey).length,
    keys: [...new Set(features.map(f => f.properties?.render_key))], basemap: !!m?.getSource('onemap') && m.isSourceLoaded('onemap'),
    tiles: m?.areTilesLoaded(), moving: m?.isMoving(), viewport: [innerWidth, innerHeight] };
}
const ready = f => f.status === 'ready' && f.count > 0 && f.keys.length === 1 && f.keys[0] === f.routeKey && f.basemap && f.tiles && !f.moving;
const fixture = JSON.parse(readFileSync(resolve(root, 'web/lib/__tests__/fixtures/published-walks.provenance.json')));
function anchors() { return Object.values(fixture.sources).map(s => { const actual = hash(readFileSync(resolve(root, s.path))); assert.equal(actual, s.sha256, s.path); return { path: s.path, sha256: actual }; }); }
try {
  report.host = []; report.hostCounters = '';
  assert.ok(os.freemem() / 1048576 >= 1024, 'Host memory gate before browser');
  hostTimer = setInterval(() => report.host.push({ at: Date.now(), availableMiB: os.freemem() / 1048576, cpus: os.cpus().map(c => c.times) }), 1000);
  sampler = spawn('typeperf.exe', [...COUNTERS, '-si', '1', '-sc', '300'], { cwd: root, windowsHide: true, stdio: ['ignore','pipe','pipe'] });
  sampler.stdout.on('data', b => { report.hostCounters += b; });
  sampler.stderr.on('data', b => { report.hostCounters += b; });
  samplerClosed = new Promise(done => sampler.on('close', code => { report.samplerExit = code; done(); }));
  await until('valid host counters before browser', async () => {
    if (sampler.exitCode !== null) throw Error('Host counter sampler exited: ' + report.hostCounters);
    return report.hostCounters;
  }, text => /\(PDH-CSV/.test(text) && text.split('\n').length >= 3, 15000);
  report.anchorsBefore = anchors();
  const build = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/ux-reset-20260912/build-1/build.json')));
  assert.ok(build.sources.every(s => hash(readFileSync(resolve(root, s.path))) === s.sha256));
  report.preview = await (await fetch(origin + '/__qa/status', { signal: AbortSignal.timeout(5000) })).json();
  assert.equal(report.preview.buildId, build.buildId);
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
  report.chromePid = chrome.pid; chrome.stderr.on('data', b => { stderr += b; });
  const endpoint = await until('owned browser', async () => /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1], Boolean, 45000);
  ws = new WebSocket(endpoint);
  await new Promise((done, reject) => { const timer = setTimeout(() => reject(Error('Connection timeout')), 10000); ws.onopen = () => { clearTimeout(timer); done(); }; ws.onerror = () => { clearTimeout(timer); reject(Error('CDP connection')); }; });
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { pending.get(m.id)?.(m.result, m.error ? { kind: 'cdp', ...m.error } : undefined); return; }
    const p = m.params, sessionId = m.sessionId ?? '';
    if (m.method.startsWith('Target.') || ['Network.requestWillBeSent', 'Network.responseReceived', 'Network.loadingFinished', 'Network.loadingFailed', 'Fetch.requestPaused', 'Runtime.exceptionThrown'].includes(m.method)) record({ kind: 'event', method: m.method, sessionId, params: p });
    if (m.method === 'Target.attachedToTarget' && p.targetInfo.type === 'worker') {
      workerSessions.add(p.sessionId);
      void send('Network.enable', {}, p.sessionId).catch(e => report.errors.push({ worker: e.message, cdp: e.cdp }));
    }
    if (m.method === 'Runtime.exceptionThrown') report.errors.push({ sessionId, runtime: p });
    if (m.method === 'Fetch.requestPaused') {
      const u = new URL(p.request.url);
      const allowed = ['GET', 'HEAD'].includes(p.request.method) && !u.username && !u.password && ((u.origin === origin && !u.pathname.startsWith('/api/')) || (u.origin === 'https://www.onemap.gov.sg' && !u.search && (/^\/maps\/tiles\/Grey_HD\/\d+\/\d+\/\d+\.png$/.test(u.pathname) || u.pathname === '/web-assets/images/logo/om_logo.png')));
      if (!allowed) report.denied.push({ sessionId, url: u.href });
      void send(allowed ? 'Fetch.continueRequest' : 'Fetch.failRequest', allowed ? { requestId: p.requestId } : { requestId: p.requestId, errorReason: 'BlockedByClient' }, sessionId).catch(e => report.errors.push({ interception: e.message, cdp: e.cdp }));
    }
  };
  ws.onclose = () => { if (!closing) report.errors.push({ connection: 'Unexpected close' }); for (const done of [...pending.values()]) done(undefined, { kind: 'connection', message: 'CDP closed' }); };
  const targets = await send('Target.getTargets');
  const page = targets.targetInfos.find(t => t.type === 'page' && t.url === 'about:blank');
  assert.ok(page); report.pageTarget = page.targetId;
  mainSession = (await send('Target.attachToTarget', { targetId: page.targetId, flatten: true })).sessionId; report.mainSession = mainSession;
  for (const domain of ['Page', 'Runtime', 'Network']) await send(domain + '.enable', {}, mainSession);
  await send('Network.setCacheDisabled', { cacheDisabled: false }, mainSession);
  await send('Network.setBypassServiceWorker', { bypass: true }, mainSession);
  await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] }, mainSession);
  await send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true }, mainSession);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }, mainSession);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: readFileSync(resolve(root, 'qa/revamp-r1/loading-diagnosis/browser-probe.js'), 'utf8') }, mainSession);
  await send('Network.clearBrowserCache', {}, mainSession);
  report.policy = { cold: 'Fresh profile, HTTP cache cleared once; server filesystem cache uncontrolled',
    warm: 'Same browser HTTP cache, fresh document and JS memory', serviceWorker: 'bypassed',
    workers: 'Unpaused, late Network attachment can miss worker bytes', interception: 'GET allowlist IPC overhead remains',
    renderer: 'Desktop headless SwiftShader, 390x844, not representative phone', pairs: 1 };
  report.samples = [];
  async function click(selector, text) {
    const target = await evaluate(() => {
      const { selector, text } = window.__qaClick;
      const el = [...document.querySelectorAll(selector)].find(e => e.textContent.trim() === text);
      if (!el) throw Error('Missing click target ' + text);
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect();
      const x = r.x + r.width / 2, y = r.y + r.height / 2;
      return { x, y, width: r.width, height: r.height, disabled: !!el.disabled,
        hit: el.contains(document.elementFromPoint(x, y)) };
    });
    check('usable click target ' + text, target.hit && !target.disabled && target.height >= 43, target);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1 }, mainSession);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1 }, mainSession);
  }
  async function tap(selector, text) {
    await send('Runtime.evaluate', { expression: 'window.__qaClick=' + JSON.stringify({selector,text}) }, mainSession);
    await click(selector, text);
  }
  function ui() {
    const panel = document.querySelector('aside');
    const box = e => { const r=e?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right} : null; };
    const controls = [...(panel?.querySelectorAll('[aria-label="Transit stop or exit type"] button') ?? [])];
    return { panelText: panel?.innerText, panel: box(panel), search: box(document.querySelector('[aria-label="Postal-code search"]')),
      pressed: controls.filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.textContent.trim()),
      controls: controls.map(b => ({ text:b.textContent.trim(),disabled:b.disabled,box:box(b) })),
      detailsHidden: document.querySelector('#walk-details')?.hidden,
      destination: panel?.querySelector('[aria-label="Walk summary"] strong')?.textContent,
      url: location.href, viewport:[innerWidth,innerHeight], overflow: document.documentElement.scrollWidth > innerWidth,
      technicalOpen: [...document.querySelectorAll('details')].find(d => d.querySelector(':scope > summary')?.textContent === 'Technical record')?.open };
  }
  async function capture(name) {
    await until(name + ' current route', () => evaluate(facts), ready, 120000);
    const before=await evaluate(facts), interfaceState=await evaluate(ui);
    const shot=await send('Page.captureScreenshot', {format:'png',captureBeyondViewport:false}, mainSession);
    const after=await evaluate(facts), png=Buffer.from(shot.data,'base64');
    writeFileSync(resolve(out,name+'.png'),png,{flag:'wx'});
    report.samples.push({name,before,after,ui:interfaceState,bytes:png.length,sha256:hash(png)});
    check(name+' current route stable',ready(before)&&ready(after)&&before.routeKey===after.routeKey);
    if(interfaceState.panel){
      check(name+' panel fits, equal search width',!interfaceState.overflow&&interfaceState.panel.x>=0&&interfaceState.panel.right<=interfaceState.viewport[0]&&Math.abs(interfaceState.panel.width-interfaceState.search.width)<2,interfaceState);
      check(name+' no technical dump',!interfaceState.panelText.includes('Locked score')&&!interfaceState.panelText.includes('Four display rows')&&!interfaceState.technicalOpen);
    }
  }
  await send('Page.navigate',{url:origin+'/?debugMap=1&postal=018956'},mainSession);
  await capture('mobile-suggested');
  const suggested=(await evaluate(facts)).routeKey;
  for(const [label,mode] of [['MRT/LRT','mrt_lrt'],['Bus stops','bus'],['Suggested','best_transit']]){
    await tap('aside [aria-label="Transit stop or exit type"] button',label);
    await until(label+' selected',()=>evaluate(ui),u=>u.pressed[0]===label,10000);
    await capture('mobile-'+mode);
    const state=await evaluate(ui);
    check(label+' URL selection matches',mode==='best_transit'?!new URL(state.url).searchParams.has('transit'):new URL(state.url).searchParams.get('transit')===mode,state);
  }
  check('Suggested restores original route',(await evaluate(facts)).routeKey===suggested);
  await tap('aside button','Walk details');
  await until('walk details open',()=>evaluate(ui),u=>u.detailsHidden===false);
  await capture('mobile-details');
  await tap('aside button','Collapse walk details');
  for(const [width,height] of [[320,667],[1440,950]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},mainSession);
    await capture('collapsed-'+width);
    await tap('aside button','Walk details');
    await capture('details-'+width);
    await tap('aside button','Collapse walk details');
  }
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false},mainSession);
  await tap('footer summary','About data');
  await until('about data removes result overlay',()=>evaluate(ui),u=>!u.panel);
  check('Technical record initially closed',!(await evaluate(ui)).technicalOpen);
  await tap('footer summary','Technical record');
  await until('Technical record opens on request',()=>evaluate(ui),u=>u.technicalOpen);
  await capture('technical-opt-in');
  await tap('footer summary','About data');
  await capture('returned-to-walk');
  check('no denied requests or application exceptions', !report.denied.length && !report.errors.some(e => e.runtime));

} catch (e) { report.failure = e.stack; report.failureCommand = e.cdp; console.error(e.stack); }
finally {
  closing = true;
  clearInterval(hostTimer);
  if (sampler && sampler.exitCode === null) sampler.kill();
  if (samplerClosed) await samplerClosed;
  if (ws?.readyState === 1) try { await send('Browser.close', {}, '', 5000); } catch (e) { report.closeError = e.message; }
  ws?.close(); report.cleanup = cleanup(profile); chrome?.stderr?.destroy(); chrome?.unref();
  report.anchorsAfter = anchors(); report.anchorsUnchanged = JSON.stringify(report.anchorsBefore) === JSON.stringify(report.anchorsAfter);
  report.stderr = stderr; report.elapsedMs = Date.now() - started;
  report.ok = !report.failure && !report.errors.length && !report.denied.length && report.cleanup.verified && report.anchorsUnchanged;
  report.scope = 'Actual pointer clicks on saved transit choices, disclosures and responsive layout. Headless desktop at emulated sizes; not a physical phone or representative performance benchmark. No pipeline/install/deploy.';
  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, ok: report.ok, checks: report.checks.length, cleanup: report.cleanup.verified }));
  process.exitCode = report.ok ? 0 : 1;
}
