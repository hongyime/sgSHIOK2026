import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { cleanup } from '../../cross-feature-20260910/cleanup.mjs';
import os from 'node:os';


const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
const out = "C:\\sgSHIOK2026\\qa\\revamp-r1\\selection-recovery-20260913\\corrected-6kmGYF";
const profile = "C:\\sgSHIOK2026\\tmp\\layout-confirmation-browser-nRehkT";
const origin = 'http://127.0.0.1:4420', hash = bytes => createHash('sha256').update(bytes).digest('hex');
const started = Date.now(), deadline = started + 240000, workEnd = deadline - 60000;
const report = { root, hostname: process.env.COMPUTERNAME, out, profile, origin, startedAt: new Date().toISOString(), entries: [], checks: [], errors: [], denied: [] };
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
let chrome, sampler, samplerClosed, hostTimer, ws, stderr = '', sequence = 0, closing = false, mainSession;
const pending = new Map(), workerSessions = new Set();
let scoreMode='fail';const heldScores=[];report.scoreFaults=[];
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
  report.availableMiB=os.freemem()/1048576;assert.ok(report.availableMiB>=1024,'Host memory gate');
  report.anchorsBefore = anchors();
  const build = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/selection-recovery-20260913/build-2/build.json')));
  assert.ok(build.sources.every(s => hash(readFileSync(resolve(root, s.path))) === s.sha256));
  report.preview = await (await fetch(origin + '/__qa/status', { signal: AbortSignal.timeout(5000) })).json();
  assert.equal(report.preview.buildId, build.buildId);
  mkdirSync(resolve(profile,'Default'));writeFileSync(resolve(profile,'Default/Preferences'),JSON.stringify({partition:{default_zoom_level:{x:Math.log(2)/Math.log(1.2)}}}),{flag:'wx'});
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--window-size=1440,950','--force-device-scale-factor=1', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { cwd: root, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TEMP: profile, TMP: profile } });
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
      if(u.origin===origin&&u.pathname.startsWith('/data/generated_20260805_prefer_scored_routed/scores/')&&scoreMode!=='pass'){
        report.scoreFaults.push({path:u.pathname,method:p.request.method,mode:scoreMode});
        if(scoreMode==='hold')heldScores.push({requestId:p.requestId,sessionId});
        else void send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:503,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from('{}').toString('base64')},sessionId).catch(e=>report.errors.push({interception:e.message,cdp:e.cdp}));
        return;
      }

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

  report.scope='Current native200%zoom selection retry, complete metric reading and keyboard camera task. Controlled score503/hold; no data changes. SW bypassed, desktop SwiftShader, not phone/screenreader/performance/old-client-release acceptance.';
  async function key(key,code,vk,modifiers=0){
    await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key,code,windowsVirtualKeyCode:vk,modifiers},mainSession);
    if(key==='Enter')await send('Input.dispatchKeyEvent',{type:'char',text:'\r',key,code,windowsVirtualKeyCode:vk,modifiers},mainSession);
    await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:vk,modifiers},mainSession);
  }
  function focus(){
    const e=document.activeElement,r=e?.getBoundingClientRect(),s=e?getComputedStyle(e):null;
    let clip={left:0,top:0,right:innerWidth,bottom:innerHeight};
    for(let a=e?.parentElement;a;a=a.parentElement){const cs=getComputedStyle(a),b=a.getBoundingClientRect();if(cs.overflowX!=='visible'){clip.left=Math.max(clip.left,b.left+a.clientLeft);clip.right=Math.min(clip.right,b.left+a.clientLeft+a.clientWidth);}if(cs.overflowY!=='visible'){clip.top=Math.max(clip.top,b.top+a.clientTop);clip.bottom=Math.min(clip.bottom,b.top+a.clientTop+a.clientHeight);}}
    const geometry=(function focusGeometry(rect, clip, canvas, outlineWidth, outlineOffset) {
  const fits = box => box.right > box.left && box.bottom > box.top
    && box.left >= clip.left - 0.5 && box.top >= clip.top - 0.5
    && box.right <= clip.right + 0.5 && box.bottom <= clip.bottom + 0.5;
  const controlFits = !!rect && fits(rect);
  const edge = outlineWidth + outlineOffset;
  const ring = rect && Number.isFinite(edge) && outlineWidth > 0 ? {
    left: rect.left - edge, right: rect.right + edge,
    top: rect.top - edge, bottom: rect.bottom + edge,
  } : null;
  const ringFits = !!ring && fits(ring);
  return { controlFits, ring, ringFits, fits: canvas ? ringFits && edge <= 0 : controlFits };
})(r,clip,e?.tagName==='CANVAS',parseFloat(s?.outlineWidth),parseFloat(s?.outlineOffset));const fits=geometry.fits;
    const x=r?(e.tagName==='CANVAS'?r.right-4:r.x+r.width/2):0,y=r?r.y+r.height/2:0,hit=e?.contains(document.elementFromPoint(x,y));
    return{geometry,tag:e?.tagName,id:e?.id,text:e?.textContent?.trim(),label:e?.getAttribute('aria-label'),clip,box:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,hit,visible:fits&&hit&&s?.visibility==='visible'&&s.opacity!=='0',focusVisible:e?.matches(':focus-visible'),outline:s?.outlineStyle,outlineWidth:s?.outlineWidth};
  }
  async function tabTo(text,tag='BUTTON'){
    for(let i=0;i<40;i++){const f=await evaluate(focus);if(f.tag===tag&&(tag==='CANVAS'||f.text===text)){await shot('focus-'+tag+'-'+text.replaceAll(' ','-').replaceAll('/','-'));check('keyboard focus '+text,f.visible&&f.focusVisible&&f.geometry.ringFits,f);return f;}await key('Tab','Tab',9);}
    throw Error('Keyboard target unreachable '+text);
  }
  async function shot(name){
    const before=await evaluate(focus),state=await evaluate(facts),uiState=await evaluate(ui);
    const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},mainSession),png=Buffer.from(image.data,'base64');
    writeFileSync(resolve(out,name+'.png'),png,{flag:'wx'});
    report.samples.push({name,before,after:await evaluate(focus),state,ui:uiState,bytes:png.length,sha256:hash(png)});
  }
  await send('Page.navigate',{url:origin+'/?debugMap=1&postal=018956'},mainSession);
  await until('controlled score failure',()=>evaluate(ui),u=>u.bodyText.includes('Retry selection'),60000);
  report.nativeZoom=await evaluate(()=>({inner:[innerWidth,innerHeight],outer:[outerWidth,outerHeight],dpr:devicePixelRatio,scale:visualViewport.scale,cssZoom:getComputedStyle(document.documentElement).zoom,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}));
  check('native200%zoom and reduced-motion preference',Math.abs(report.nativeZoom.outer[0]/report.nativeZoom.inner[0]-2)<.03&&report.nativeZoom.dpr===2&&report.nativeZoom.scale===1&&report.nativeZoom.reduced,report.nativeZoom);
  await tabTo('Retry selection');await shot('retry-before');
  scoreMode='hold';await key('Enter','Enter',13);
  await until('retry pending without its control',()=>evaluate(ui),u=>!u.bodyText.includes('Retry selection')&&heldScores.length>0,15000);
  report.retryFocus=await evaluate(focus);await shot('retry-pending');
  check('native selection Retry keeps visible search focus',report.retryFocus.id==='postal-search-input'&&report.retryFocus.visible&&report.retryFocus.focusVisible,report.retryFocus);
  scoreMode='pass';for(const held of heldScores.splice(0))await send('Fetch.continueRequest',{requestId:held.requestId},held.sessionId);
  await until('real selected route after retry',()=>evaluate(facts),ready,120000);await capture('retry-recovered');
  check('success does not reclaim search focus',(await evaluate(focus)).id==='postal-search-input');
  function metricFacts(){
    const summary=document.querySelector('[aria-label="Walk summary"]'),panel=document.querySelector('aside');
    const visibleText=e=>{const range=document.createRange();range.selectNodeContents(e);const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);let clip={left:0,top:0,right:innerWidth,bottom:innerHeight};for(let a=e.parentElement;a;a=a.parentElement){const s=getComputedStyle(a),r=a.getBoundingClientRect();if(s.overflowX!=='visible'){clip.left=Math.max(clip.left,r.left+a.clientLeft);clip.right=Math.min(clip.right,r.left+a.clientLeft+a.clientWidth);}if(s.overflowY!=='visible'){clip.top=Math.max(clip.top,r.top+a.clientTop);clip.bottom=Math.min(clip.bottom,r.top+a.clientTop+a.clientHeight);}}return{rects:rects.map(r=>({x:r.x,y:r.y,width:r.width,height:r.height})),clip,visible:rects.length>0&&rects.every(r=>r.left>=clip.left-.5&&r.right<=clip.right+.5&&r.top>=clip.top-.5&&r.bottom<=clip.bottom+.5&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))};};
    return{scrollTop:panel.scrollTop,scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,metrics:[...summary.querySelectorAll('[class*="walkMetrics"] > div')].map(e=>({label:e.querySelector('span').textContent,value:e.querySelector('strong').textContent,labelPaint:visibleText(e.querySelector('span')),valuePaint:visibleText(e.querySelector('strong'))}))};
  }
  const seen=new Map();report.metricReadings=[];
  for(let i=0;i<12;i++){
    const before=await evaluate(metricFacts);assert.equal(before.metrics.length,4);
    await shot('metrics-'+i);const after=await evaluate(metricFacts);report.metricReadings.push({before,after});
    for(const a of before.metrics){const b=after.metrics.find(m=>m.label===a.label);if(a.labelPaint.visible&&a.valuePaint.visible&&b.labelPaint.visible&&b.valuePaint.visible&&a.value===b.value)seen.set(a.label,a.value);}
    if(seen.size===4)break;
    const point=await evaluate(()=>{const r=document.querySelector('aside').getBoundingClientRect();return{x:r.right-20,y:r.y+r.height/2};});
    await send('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:56},mainSession);
    await new Promise(done=>setTimeout(done,200));
  }
  report.readMetrics=Object.fromEntries(seen);check('all four complete metric labels and values read',seen.size===4,report.readMetrics);
  await tabTo('MRT/LRT exits');await shot('walk-controls-return');await tabTo('Bus stops');await shot('active-bus-focus');
  const mapFocus=await tabTo('map canvas','CANVAS');
  check('keyboard map has visible outline',mapFocus.outline!=='none'&&parseFloat(mapFocus.outlineWidth)>0,mapFocus);
  function camera(){const m=window.__shiokRouteMap,c=m.getCenter();return{lng:c.lng,lat:c.lat,zoom:m.getZoom(),moving:m.isMoving(),url:location.href,routeKey:window.__shiokRouteDebug.routeKey};}
  const originalCamera=await evaluate(camera);report.camera=[{step:'before',...originalCamera}];
  await key('ArrowRight','ArrowRight',39);const right=await until('keyboard pan right',()=>evaluate(camera),c=>!c.moving&&c.lng>originalCamera.lng+.000001,10000);report.camera.push({step:'right',...right});
  await key('ArrowLeft','ArrowLeft',37);const left=await until('keyboard pan left',()=>evaluate(camera),c=>!c.moving&&c.lng<right.lng-.000001,10000);report.camera.push({step:'left',...left});
  await key('=','Equal',187);const zoomIn=await until('keyboard zoom in',()=>evaluate(camera),c=>!c.moving&&c.zoom>left.zoom+.01,10000);report.camera.push({step:'zoom-in',...zoomIn});
  await key('-','Minus',189);const zoomOut=await until('keyboard zoom out',()=>evaluate(camera),c=>!c.moving&&c.zoom<zoomIn.zoom-.01,10000);report.camera.push({step:'zoom-out',...zoomOut});
  check('keyboard camera preserves selection and URL',report.camera.every(c=>c.routeKey===originalCamera.routeKey&&c.url===originalCamera.url),report.camera);
  await capture('keyboard-map');check('canvas remains keyboard focused',(await evaluate(focus)).tag==='CANVAS');
  await key('Tab','Tab',9);report.keyboardExit=await evaluate(focus);await shot('keyboard-exit');check('keyboard can leave canvas',report.keyboardExit.tag!=='CANVAS'&&report.keyboardExit.visible&&report.keyboardExit.focusVisible&&report.keyboardExit.geometry.ringFits,report.keyboardExit);
  check('no page-observed route API requests',(report.previewRequests??[]).length===0);
  check('no application exceptions',!report.errors.some(e=>e.runtime));

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
