import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const runName = process.argv[2];
if (runName && !/^[a-z0-9-]+$/.test(runName)) throw Error('Invalid run name');
const base = resolve(root, 'qa/revamp-r1/direct-visual-20260908');
const out = runName ? resolve(base, runName) : base;
if (runName) { if (existsSync(out)) throw Error('Preserve previous run'); mkdirSync(out); }
if (existsSync(resolve(out, 'browser.json'))) throw Error('Preserve existing capture');
const url = process.env.SHIOK_BROWSER_QA_URL || 'http://localhost:4319/';
const debugPort = 9843;
const delay = ms => new Promise(r => setTimeout(r, ms));
const routeSources = ['shortest-route', 'shiokest-route', 'exposure-gaps', 'transit-node'];
const report = {
  root, host: process.env.COMPUTERNAME,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  buildId: readFileSync(resolve(root, 'web/.next/BUILD_ID'), 'utf8').trim(),
  url, startedAt: new Date().toISOString(), checks: [], captures: [], errors: [],
  conditions: 'Owner authorized execution under existing host pressure. One headless Chrome/SwiftShader session, no throttle; local production build; real data and OneMap raster. Not a performance comparison or real-phone benchmark.',
};
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader', `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${resolve(root, 'tmp/direct-visual-' + Date.now())}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let ws, send, evaluate;
const pending = new Map();
const started = Date.now();
const check = (name, pass, detail) => {
  report.checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`, detail === undefined ? '' : JSON.stringify(detail));
  if (!pass) throw Error(name);
};
const probe = `(() => {
  const writes = [], objects = new WeakMap(); let nextId = 0, value;
  window.__directWrites = writes;
  Object.defineProperty(window, '__shiokRouteMap', { configurable: true, get: () => value, set(map) {
    value = map; if (!map) return;
    const patch = id => { const source = map.getSource(id); if (!source?.setData || source.__directPatched) return;
      source.__directPatched = true; const original = source.setData;
      source.setData = function(data, ...args) {
        if (data && typeof data === 'object' && !objects.has(data)) objects.set(data, ++nextId);
        writes.push({ at: performance.now(), source: id, objectId: objects.get(data), count: data?.features?.length, key: data?.features?.[0]?.properties?.render_key });
        return original.call(this, data, ...args);
      };
    };
    const add = map.addSource;
    map.addSource = function(id, spec) { const result = add.call(this, id, spec); patch(id); return result; };
    Object.keys(map.getStyle()?.sources || {}).forEach(patch);
  } });
})()`;
const factsExpression = `(() => {
  const m=window.__shiokRouteMap,d=window.__shiokRouteDebug,p=d?.padding;
  const box=p?[[p.left,p.top],[innerWidth-p.right,innerHeight-p.bottom]]:undefined;
  const rect=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
  return { at:performance.now(),width:innerWidth,height:innerHeight,postal:document.querySelector('[data-postal]')?.dataset.postal,
    key:d?.routeKey,status:document.querySelector('main')?.dataset.mapStatus,padding:p,center:m?.getCenter(),zoom:m?.getZoom(),moving:m?.isMoving(),
    count:m?.getLayer('shiokest-route-line')?m.queryRenderedFeatures(box,{layers:['shiokest-route-line']}).filter(f=>f.properties.render_key===d?.routeKey).length:0,
    sourceLoaded:m?.getSource('shiokest-route')?m.isSourceLoaded('shiokest-route'):false,
    basemapLoaded:m?.getSource('onemap')?m.isSourceLoaded('onemap'):false,
    search:rect('#postal-search-input'),identity:rect('[class*=identityRow]'),panel:rect('aside'),attribution:rect('[data-map-overlay="bottom"]'),
    metrics:[...document.querySelectorAll('[aria-label="Walk summary"] [class*=walkMetrics] > div')].map(e=>({text:e.innerText,bottom:e.getBoundingClientRect().bottom})),
    overflow:document.documentElement.scrollWidth>innerWidth,text:document.body.innerText.slice(0,2500) };
})()`;

try {
  let tabs;
  while (Date.now() - started < 90000) {
    try { tabs = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json(); break; }
    catch { await delay(500); }
  }
  if (!tabs) throw Error('Browser startup deadline exceeded');
  ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let nextId = 0;
  send = (method, params = {}, timeout = 30000) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, timeout);
    pending.set(id, { resolve: result => { clearTimeout(timer); resolve(result); }, reject: error => { clearTimeout(timer); reject(error); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { const job = pending.get(m.id); pending.delete(m.id); if (job) m.error ? job.reject(Error(m.error.message)) : job.resolve(m.result); }
    else if (m.method === 'Runtime.exceptionThrown') report.errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  };
  evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const until = async (expression, timeout = 180000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) { if (await evaluate(expression)) return; await delay(250); }
    throw Error('Browser condition deadline: ' + expression);
  };
  const ready = () => until(`window.__shiokRouteMap && !window.__shiokRouteMap.isMoving() && window.__shiokRouteMap.getLayer('shiokest-route-line') && window.__shiokRouteMap.isSourceLoaded('shiokest-route') && ['ready','partial'].includes(document.querySelector('main')?.dataset.mapStatus) && window.__shiokRouteMap.queryRenderedFeatures({layers:['shiokest-route-line']}).some(f=>f.properties.render_key===window.__shiokRouteDebug.routeKey)`);
  const capture = async name => {
    const before = await evaluate(factsExpression);
    const png = Buffer.from((await send('Page.captureScreenshot', { format: 'png' }, 45000)).data, 'base64');
    const after = await evaluate(factsExpression);
    writeFileSync(resolve(out, name + '.png'), png);
    const stable = ['width', 'height', 'key', 'count', 'zoom'].every(k => before[k] === after[k]) && JSON.stringify(before.center) === JSON.stringify(after.center) && !before.moving && !after.moving;
    report.captures.push({ name, sha256: createHash('sha256').update(png).digest('hex'), before, after, stable });
    check('current route screenshot ' + name, stable && before.count > 0 && before.sourceLoaded, { count: before.count, key: before.key, basemapLoaded: before.basemapLoaded });
    return before;
  };
  const click = text => evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Missing button: '+${JSON.stringify(text)});b.click()})()`);
  const clearWrites = () => evaluate('window.__directWrites.length=0');
  const writes = () => evaluate('window.__directWrites');
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setBypassServiceWorker', { bypass: true });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: probe });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, mobile: false, deviceScaleFactor: 1 });
  await send('Page.navigate', { url: url + '?postal=018956' });
  await ready();
  report.initialWrites = await writes();
  report.initialObservationWallMs = Date.now() - started;
  for (const [width, height] of [[390,844],[390,667],[320,667],[1440,950]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, mobile: false, deviceScaleFactor: 1 });
    await delay(1200); await ready();
    const f = await capture(`loaded-${width}x${height}`);
    check('layout ' + width + 'x' + height, !f.overflow && f.metrics.length === 4 && f.metrics.every(m => m.bottom <= f.panel.bottom) && f.panel.bottom <= f.attribution.y && (width > 700 || f.search.y >= f.identity.bottom));
  }
  await click('Walk details'); await delay(1200); await ready();
  await clearWrites();
  await evaluate(`document.querySelector('button[aria-label^="Focus on map for"]').click()`);
  await delay(1500); await ready();
  let w = await writes();
  check('gap focus leaves route sources unchanged', !w.some(x => routeSources.includes(x.source)) && w.some(x => x.source === 'active-exposure-gap'), w);
  await capture('gap-focused');
  await click('Walk details'); await delay(700);
  await clearWrites();
  await click('Night lighting'); await delay(2000); await ready();
  w = await writes();
  check('lamp toggle leaves route sources unchanged', !w.some(x => routeSources.includes(x.source)), w);
  await click('Night lighting shown'); await delay(800);
  await click('Collapse walk details'); await delay(1200); await ready();
  await clearWrites();
  await evaluate(`void window.__shiokRouteMap.fire('error',{error:new Error('Direct validation synthetic renderer failure')})`);
  await until(`document.querySelector('main')?.dataset.mapStatus==='error'`, 15000);
  await click('Retry map'); await ready();
  w = await writes();
  check('retry republishes route sources', routeSources.every(id => w.some(x => x.source === id)), w);
  await capture('retry-recovered');
  await clearWrites();
  await evaluate(`(()=>{const m=window.__shiokRouteMap,s=m.getStyle();const ids=${JSON.stringify([...routeSources, 'active-exposure-gap','transit-pois','feedback-route','feedback-points','lamp-posts'])};s.layers=s.layers.filter(l=>!ids.includes(l.source));for(const id of ids)delete s.sources[id];m.setStyle(s,{diff:false})})()`);
  await until(`window.__directWrites.some(w=>w.source==='shiokest-route')`); await ready();
  w = await writes();
  check('all route sources restored', routeSources.every(id => w.some(x => x.source === id)), w);
  await capture('style-recovered');
  const point = await evaluate(`(()=>{const m=window.__shiokRouteMap,f=m.queryRenderedFeatures({layers:['mrt-exit-dot']}).find(f=>f.properties.id==='mrt:21678');if(!f)return null;const p=m.project(f.geometry.coordinates);return {x:p.x,y:p.y}})()`);
  check('published alternate exit rendered', !!point, point);
  await clearWrites();
  await send('Input.dispatchMouseEvent', { type:'mousePressed', ...point, button:'left', clickCount:1 });
  await send('Input.dispatchMouseEvent', { type:'mouseReleased', ...point, button:'left', clickCount:1 });
  await until(`document.querySelector('[aria-label="Walk summary"]')?.textContent.includes('110 m')`); await ready();
  w = await writes();
  check('alternate selection republishes route', routeSources.every(id => w.some(x => x.source === id)), w);
  await capture('alternate-selected');
  check('no uncaught page exceptions', report.errors.length === 0, report.errors);
} catch (error) {
  report.failure = error.stack; process.exitCode = 1; console.error(error);
  if (evaluate) { try { report.failureState = await evaluate(factsExpression); } catch {} }
} finally {
  report.finishedAt = new Date().toISOString(); report.elapsedMs = Date.now() - started;
  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n');
  if (send && ws?.readyState === WebSocket.OPEN) { try { await send('Browser.close', {}, 3000); } catch {} }
  ws?.close(); if (chrome.exitCode === null) chrome.kill();
  for (const job of pending.values()) job.reject(Error('Diagnostic shutdown')); pending.clear();
}
