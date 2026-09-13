import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';
import os from 'node:os';
import { COUNTERS } from '../loading-profile-20260912/analyze.mjs';

const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/native-zoom-20260913/zoom100-'));
const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));
const origin = 'http://127.0.0.1:4416', hash = bytes => createHash('sha256').update(bytes).digest('hex');
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
  const active = d?.mode === 'shortest' ? 'shortest' : 'shiokest';
  let features = []; try { features = m?.queryRenderedFeatures({ layers: [active + '-route-line'] }) ?? []; } catch {}
  return { status: document.querySelector('main')?.dataset.mapStatus, routeKey: d?.routeKey,
    count: features.filter(f => f.properties?.render_key === d?.routeKey).length,
    keys: [...new Set(features.map(f => f.properties?.render_key))], basemap: !!m?.getSource('onemap') && m.isSourceLoaded('onemap'),
    geometry: m?.getStyle().sources[active + '-route']?.data?.features?.map(f => f.geometry),
    mode: d?.mode, lampCount: m?.getStyle().sources['lamp-posts']?.data?.features?.length ?? 0,
    padding: d?.padding, timeOrigin: performance.timeOrigin, url: location.href,
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
  const build = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/native-zoom-20260913/build-1/build.json')));
  assert.ok(build.sources.every(s => hash(readFileSync(resolve(root, s.path))) === s.sha256));
  report.preview = await (await fetch(origin + '/__qa/status', { signal: AbortSignal.timeout(5000) })).json();
  assert.equal(report.preview.buildId, build.buildId);
  const prefs={partition:{default_zoom_level:{x:0}}};
  mkdirSync(resolve(profile,'Default'));
  writeFileSync(resolve(profile,'Default/Preferences'),JSON.stringify(prefs),{flag:'wx'});
  report.nativeZoom={requestedPercent:100,preferences:prefs,method:'Fresh owned profile native partition default zoom before Chrome launch; no page-scale/device-metrics override'};
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--window-size=1440,950', '--force-device-scale-factor=1', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
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
      if (u.origin === origin && u.pathname === '/api/onemap-route') {
        report.previewRequests ??= [];
        report.previewRequests.push({ method: p.request.method, path: u.pathname, scenario: 'controlled HTTP 503' });
        void send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 503,
          responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
          body: Buffer.from(JSON.stringify({ ok: false, error: 'QA synthetic provider failure' })).toString('base64') }, sessionId)
          .catch(e => report.errors.push({ interception: e.message, cdp: e.cdp }));
        return;
      }
      const allowed = ['GET', 'HEAD'].includes(p.request.method) && !u.username && !u.password && (u.href === 'file:///C:/sgSHIOK2026/postplan.html' || (u.origin === origin && !u.pathname.startsWith('/api/')) || (u.origin === 'https://www.onemap.gov.sg' && !u.search && (/^\/maps\/tiles\/Grey_HD\/\d+\/\d+\/\d+\.png$/.test(u.pathname) || u.pathname === '/web-assets/images/logo/om_logo.png')));
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
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]},mainSession);
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
      bodyText: document.body.innerText,
      lampCount: window.__shiokRouteMap?.getStyle().sources['lamp-posts']?.data?.features?.length ?? 0,
      destination: panel?.querySelector('[aria-label="Walk summary"] strong')?.textContent,
      url: location.href, viewport:[innerWidth,innerHeight], overflow: document.documentElement.scrollWidth > innerWidth,
      technicalOpen: [...document.querySelectorAll('details')].find(d => d.querySelector(':scope > summary')?.textContent === 'Technical record')?.open,
      technicalVisible: [...document.querySelectorAll('details')].find(d => d.querySelector(':scope > summary')?.textContent === 'Technical record')?.checkVisibility() };
  }
  async function capture(name) {
    let previous, consecutive = 0;
    const identity = f => JSON.stringify([f.routeKey, f.viewport, f.padding, f.timeOrigin, f.url]);
    await until(name + ' settled current route', () => evaluate(facts), f => {
      consecutive = ready(f) ? previous && ready(previous) && identity(previous) === identity(f) ? consecutive + 1 : 1 : 0;
      previous = f;
      return consecutive >= 3;
    }, 120000);
    const before=await evaluate(facts), interfaceState=await evaluate(ui);
    const shot=await send('Page.captureScreenshot', {format:'png',captureBeyondViewport:false}, mainSession);
    const after=await evaluate(facts), png=Buffer.from(shot.data,'base64');
    writeFileSync(resolve(out,name+'.png'),png,{flag:'wx'});
    report.samples.push({name,before,after,ui:interfaceState,bytes:png.length,sha256:hash(png)});
    check(name+' current route stable',ready(before)&&ready(after)&&identity(before)===identity(after));
    if(interfaceState.panel){
      check(name+' panel fits, equal search width',!interfaceState.overflow&&interfaceState.panel.x>=0&&interfaceState.panel.right<=interfaceState.viewport[0]&&Math.abs(interfaceState.panel.width-interfaceState.search.width)<2,interfaceState);
      check(name+' no technical dump',!interfaceState.panelText.includes('Locked score')&&!interfaceState.panelText.includes('Four display rows')&&!interfaceState.technicalVisible);
    }
  }

  report.scope='Native Chrome page zoom via fresh-profile setting, reduced-motion media, saved transit and details keyboard acceptance. No device emulation/DOM scaling; headless SwiftShader, SW bypassed; not physical phone, screen reader, performance or release-upgrade acceptance.';
  async function key(key,code,vk){
    await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key,code,windowsVirtualKeyCode:vk},mainSession);
    if(key==='Enter')await send('Input.dispatchKeyEvent',{type:'char',text:'\r',unmodifiedText:'\r',key,code,windowsVirtualKeyCode:vk},mainSession);
    await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:vk},mainSession);
  }
  function focusFacts(){const e=document.activeElement,r=e?.getBoundingClientRect();return {tag:e?.tagName,text:e?.textContent?.trim(),label:e?.getAttribute('aria-label'),box:r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null,focusVisible:e?.matches(':focus-visible'),visible:!!r&&r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}
  async function tabTo(text,tag='BUTTON'){for(let i=0;i<65;i++){const f=await evaluate(focusFacts);if(f.tag===tag&&f.text===text){check('keyboard target visible '+text,f.visible&&f.focusVisible,f);return;}await key('Tab','Tab',9);}throw Error('Unreachable keyboard target '+text);}
  await send('Page.navigate',{url:origin+'/?debugMap=1&postal=018956'},mainSession);
  await until('initial route',()=>evaluate(facts),ready,120000);
  const metrics=await evaluate(()=>({inner:[innerWidth,innerHeight],outer:[outerWidth,outerHeight],dpr:devicePixelRatio,visualScale:visualViewport.scale,documentZoom:getComputedStyle(document.documentElement).zoom,bodyZoom:getComputedStyle(document.body).zoom,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,screen:[screen.width,screen.height]}));
  report.nativeZoom.observed=metrics;
  check('native zoom has expected physical/CSS ratio',Math.abs(metrics.outer[0]/metrics.inner[0]-1)<0.03&&Math.abs(metrics.dpr-1)<0.03&&metrics.visualScale===1,metrics);
  check('no CSS zoom or emulated motion mismatch',['1','normal'].includes(metrics.documentZoom)&&['1','normal'].includes(metrics.bodyZoom)&&metrics.reduced,metrics);
  await evaluate(()=>{const m=window.__shiokRouteMap;window.__qaMotion=[];for(const name of ['fitBounds','easeTo','flyTo']){const fn=m[name];m[name]=function(...args){const o=name==='fitBounds'?args[1]:args[0];window.__qaMotion.push({name,duration:o?.duration,essential:o?.essential});return fn.apply(this,args);};}});
  if(!true){
  await capture('initial');
  const initial=JSON.stringify((await evaluate(facts)).geometry);
  for(const [label,mode] of [['MRT/LRT exits','mrt_lrt'],['Bus stops','bus']]){
    await tabTo(label);await key('Enter','Enter',13);
    await until(label+' selected',()=>evaluate(ui),u=>u.pressed[0]===label,10000);
    await capture(mode);
    const data=await evaluate(facts),geometry=JSON.stringify(data.geometry);
    check(label+' changes actual saved geometry',mode==='mrt_lrt'?geometry!==initial:geometry===initial);
    check(label+' matches URL',new URL(data.url).searchParams.get('transit')===mode);
  }
  await tabTo('Walk details');await key('Enter','Enter',13);
  await until('details open',()=>evaluate(ui),u=>u.detailsHidden===false,10000);
  await capture('details-open');
  const disclosure=await evaluate(()=>[...document.querySelectorAll('#walk-details summary')].find(e=>e.textContent.trim().startsWith('Uncovered sections'))?.textContent.trim());
  check('real uncovered sections disclosure exists',!!disclosure,disclosure);
  await tabTo(disclosure,'SUMMARY');await key('Enter','Enter',13);
  await until('section disclosure opens',()=>evaluate(()=>document.querySelector('[aria-label="Mapped exposed sections"]')?.closest('details')?.open),Boolean,10000);
  // Enumerate real displayed controls; Tab itself must bring each into view.
  const buttons=await evaluate(()=>[...document.querySelectorAll('#walk-details button')].filter(e=>e.checkVisibility()&&!e.disabled&&e.textContent.trim()).map(e=>({text:e.textContent.trim(),pressed:e.getAttribute('aria-pressed')})));
  report.detailsButtons=buttons;
  const gap=buttons.find(b=>/^Section 1/.test(b.text));
  check('real first section exists',!!gap,gap);
  await tabTo(gap.text);await key('Enter','Enter',13);await capture('gap-selected');
  const highlight=await evaluate(()=>window.__shiokRouteMap.getStyle().sources['active-exposure-gap'].data.features);
  check('selected section highlight exists',highlight.length===1,highlight);
  await tabTo('Back to walk');await key('Enter','Enter',13);
  await until('highlight clears',()=>evaluate(()=>window.__shiokRouteMap.getStyle().sources['active-exposure-gap'].data.features.length),n=>n===0,10000);
  const returned=await evaluate(focusFacts);report.returnedSectionFocus=returned;
  check('Back to walk restores visible section disclosure focus',returned.tag==='SUMMARY'&&returned.text===disclosure&&returned.visible&&returned.focusVisible,returned);
  await capture('gap-cleared');
  await tabTo('Collapse walk details');await key('Enter','Enter',13);
  await until('details close',()=>evaluate(ui),u=>u.detailsHidden===true,10000);
  const focus=await evaluate(focusFacts);check('collapse restores visible details focus',focus.text==='Walk details'&&focus.visible&&focus.focusVisible,focus);
  await capture('details-closed');
  report.motion=await evaluate(()=>window.__qaMotion);
  check('reduced-motion camera operations observed',report.motion.some(m=>m.name==='fitBounds'));
  check('reduced-motion operations have zero duration',report.motion.every(m=>m.duration===0),report.motion);
  }
  await tabTo('MRT/LRT exits');await key('Enter','Enter',13);await until('MRT before reset',()=>evaluate(ui),u=>u.pressed[0]==='MRT/LRT exits',10000);
  await tabTo('Walk details');await key('Enter','Enter',13);await until('reset details open',()=>evaluate(ui),u=>u.detailsHidden===false,10000);
  const other=await evaluate(()=>[...document.querySelectorAll('#walk-details summary')].find(e=>e.textContent.trim().startsWith('Other stops'))?.textContent.trim());
  check('other saved MRT choices exist',!!other,other);
  await tabTo(other,'SUMMARY');await key('Enter','Enter',13);
  // The shortest saved Exit C differs from the bundle's declared default Exit E.
  // Do not mistake an unselected button for a nondefault option.
  check('current shortest differs from declared default',await evaluate(()=>!!document.querySelector('[aria-label="Use published default"]')));
  await tabTo('Use published default');await capture('reset-before');await key('Enter','Enter',13);
  await until('reset removes itself',()=>evaluate(()=>!document.querySelector('[aria-label="Use published default"]')),Boolean,10000);
  report.resetFocus=await evaluate(focusFacts);await capture('reset-after');
  check('reset retains visible surviving focus',report.resetFocus.tag==='H2'&&report.resetFocus.text==='Postal 018956'&&report.resetFocus.visible&&report.resetFocus.focusVisible,report.resetFocus);
  check('saved categories make no provider calls',(report.previewRequests??[]).length===0);
  check('no runtime or transport errors',report.errors.length===0&&report.denied.length===0,{errors:report.errors,denied:report.denied});

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

  writeFileSync(resolve(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, ok: report.ok, checks: report.checks.length, cleanup: report.cleanup.verified }));
  process.exitCode = report.ok ? 0 : 1;
}
