import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { cleanup } from './cleanup.mjs';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const origin = 'http://127.0.0.1:4332';
const build = 'ENBtn8fzW-j8FH5dZ6qyJ';
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/layout-confirmation-20260909/run-'));
const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));
const sha = value => createHash('sha256').update(value).digest('hex');
const started = Date.now(), deadline = started + 360_000;
const report = { root, hostname: process.env.COMPUTERNAME, origin, build, out, profile,
  startedAt: new Date().toISOString(), checks: [], captures: [], exceptions: [], blockedApis: [],
  limits: 'Functional Chrome/SwiftShader viewport checks, cache and service-worker bypass; not a performance, deployment or physical-device claim. No runtime source edits or pipeline work.' };
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
const delay = ms => new Promise(done => setTimeout(done, ms));
let chrome, ws, sequence = 0, stderr = '', closing = false;
const pending = new Map();
function check(name, pass, detail) {
  report.checks.push({ name, pass: !!pass, detail });
  console.log((pass ? 'PASS ' : 'FAIL ') + name);
  if (!pass) throw Error(name);
}
function send(method, params = {}) {
  return new Promise((done, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout ' + method)); }, 45000);
    pending.set(id, { finish(result, error) { clearTimeout(timer); pending.delete(id); error ? reject(Error(error.message)) : done(result); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(fn) {
  const value = await send('Runtime.evaluate', { expression: '(' + fn.toString() + ')()', returnByValue: true, awaitPromise: true });
  if (value.exceptionDetails) throw Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
  return value.result.value;
}
async function until(action, predicate, timeout = 75000) {
  const end = Math.min(deadline - 15000, Date.now() + timeout); let value;
  while (Date.now() < end) { value = await action(); if (predicate(value)) return value; await delay(250); }
  throw Error('Condition timeout: ' + JSON.stringify(value));
}
function facts() {
  const rect = selector => { const r = document.querySelector(selector)?.getBoundingClientRect(); return r ? { x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height } : null; };
  const map = window.__shiokRouteMap, debug = window.__shiokRouteDebug;
  return { width: innerWidth, height: innerHeight, brand: rect('h1'), input: rect('#postal-search-input'), submit: rect('#postal-search-button'),
    panel: rect('aside'), dock: rect('footer'), about: rect('footer details'), attribution: rect('[class*=oneMapAttribution]'),
    expanded: document.querySelector('footer details')?.open,
    overflow: document.documentElement.scrollWidth > innerWidth, status: document.querySelector('main')?.dataset.mapStatus,
    postal: document.querySelector('[aria-label="Walk summary"]')?.getAttribute('data-postal'),
    moving: map?.isMoving(), tiles: map?.areTilesLoaded(), basemap: !!map?.getSource('onemap') && map.isSourceLoaded('onemap'),
    routeKey: debug?.routeKey,
    routeCount: map?.getLayer('shiokest-route-line') ? map.queryRenderedFeatures({layers:['shiokest-route-line']}).filter(f=>f.properties?.render_key === debug?.routeKey).length : 0,
    creditImageLoaded: [...document.querySelectorAll('[class*=oneMapAttribution] img')].some(i => i.complete && i.naturalWidth > 0),
    optionalAttributionControl: !!document.querySelector('.maplibregl-ctrl-attrib'),
    legendVisible: [...document.querySelectorAll('[aria-label="Map legend"]')].some(e=>e.getBoundingClientRect().height > 0) };
}
async function capture(name, selected, expanded = false) {
  const ready = f => f.basemap && f.tiles && !f.moving && (selected ? f.routeCount === 4 && (expanded || f.postal === '018956') : !f.panel);
  await until(() => evaluate(facts), ready);
  await evaluate(() => new Promise((done, reject) => {
    const m = window.__shiokRouteMap, timer = setTimeout(() => reject(Error('Map idle timeout')), 10000);
    m.once('idle', () => { clearTimeout(timer); done(true); }); m.triggerRepaint();
  }));
  const before = await evaluate(facts);
  const png = await send('Page.captureScreenshot', { format:'png', captureBeyondViewport:false });
  const after = await evaluate(facts), bytes = Buffer.from(png.data, 'base64');
  writeFileSync(resolve(out, name + '.png'), bytes, { flag:'wx' });
  report.captures.push({ name, bytes:bytes.length, sha256:sha(bytes), before, after });
  check(name + ' stable loaded basemap and current route', ready(before) && ready(after) && before.routeKey === after.routeKey);
  check(name + ' top-left brand above search', after.brand.x <= 16 && after.brand.y <= 16 && after.input.y > after.brand.bottom && Math.abs(after.brand.x - after.input.x) < 2);
  check(name + ' search icon inside input', after.submit.x >= after.input.x && after.submit.right <= after.input.right + 1 && after.submit.bottom <= after.input.bottom + 1);
  check(name + ' bottom-right data dock clears visible credit', after.dock.right >= after.width - 16 && after.dock.right <= after.width && after.dock.bottom <= after.attribution.y && after.attribution.bottom <= after.height && after.creditImageLoaded);
  check(name + ' no horizontal overflow or optional attribution widget', !after.overflow && !after.optionalAttributionControl);
  if (selected && !expanded) check(name + ' result matches search width and clears dock', after.panel.y > after.input.bottom && Math.abs(after.panel.x - after.input.x) < 2 && Math.abs(after.panel.width - after.input.width) < 2 && after.panel.bottom < after.dock.y);
  if (expanded) check(name + ' expanded data stays on screen without competing result', after.expanded && !after.panel && after.about.x >= 0 && after.about.right <= after.width && after.about.y > after.input.bottom);
}
try {
  const response = await fetch(origin + '/__qa/status', { signal:AbortSignal.timeout(5000) });
  const status = await response.json(); report.preview = status;
  check('expected current preview build', response.ok && status.build === build && status.mode === 'clear');
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--no-first-run','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-networking','--disable-component-update','--disable-sync','--remote-debugging-port=0','--user-data-dir=' + profile,'about:blank'], { cwd:root, windowsHide:true, stdio:['ignore','ignore','pipe'], env:{ ...process.env,TEMP:profile,TMP:profile } });
  report.chromePid = chrome.pid; chrome.stderr.on('data', data => { stderr += data; });
  const endpoint = await until(async () => /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1], Boolean, 30000);
  const browserUrl = new URL(endpoint);
  const tabs = await (await fetch('http://' + browserUrl.host + '/json', { signal:AbortSignal.timeout(5000) })).json();
  ws = new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((done,reject)=>{ ws.onopen=done; ws.onerror=reject; });
  ws.onmessage = event => { const m = JSON.parse(event.data);
    if(m.id) pending.get(m.id)?.finish(m.result,m.error);
    else if(m.method==='Runtime.exceptionThrown') report.exceptions.push(m.params.exceptionDetails);
    else if(m.method==='Fetch.requestPaused') { report.blockedApis.push(m.params.request.url); void send('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'BlockedByClient'}).catch(e=>report.exceptions.push(e.message)); }
  };
  ws.onclose = () => { for(const p of [...pending.values()]) p.finish(null,{message:'CDP closed'}); if(!closing) report.unexpectedClose=true; };
  for(const domain of ['Page','Runtime','Network']) await send(domain + '.enable');
  await send('Network.setBypassServiceWorker',{bypass:true});
  await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Fetch.enable',{patterns:[{urlPattern:'*://*/api/*',requestStage:'Request'}]});
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:950,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin + '/'});
  await capture('empty-desktop',false);
  await send('Page.navigate',{url:origin + '/?postal=018956'});
  for(const [width,height] of [[1440,950],[390,844],[390,667],[320,667]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await capture('selected-' + width + 'x' + height,true);
  }
  await evaluate(()=>document.querySelector('footer summary').click());
  await capture('about-expanded-320x667',true,true);
  check('no application exceptions or API requests', report.exceptions.length===0 && report.blockedApis.length===0 && !report.unexpectedClose);
} catch(error) { report.failure=error.stack; console.error(error.stack); }
finally {
  closing=true;
  if(ws?.readyState===WebSocket.OPEN) try{await send('Browser.close');}catch(error){report.closeError=error.message;}
  ws?.close();
  if(chrome) { const end=Date.now()+10000; while(chrome.exitCode===null && chrome.signalCode===null && Date.now()<end) await delay(100); }
  report.chromeExited = !chrome || chrome.exitCode!==null || chrome.signalCode!==null;
  report.cleanup=cleanup(profile);
  report.elapsedMs=Date.now()-started; report.stderr=stderr;
  report.ok=!report.failure && report.checks.every(c=>c.pass) && report.cleanup.verified && report.captures.length===6;
  writeFileSync(resolve(out,'browser.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({out,ok:report.ok,checks:report.checks.length,captures:report.captures.length,elapsedMs:report.elapsedMs,chromeExited:report.chromeExited}));
  process.exit(report.ok?0:1);
}
