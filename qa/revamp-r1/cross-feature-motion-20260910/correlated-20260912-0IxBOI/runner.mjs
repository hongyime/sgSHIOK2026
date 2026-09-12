import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { auditErrors } from './error-audit.mjs';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [label, buildName = 'cross-feature-motion-20260910-1', port = '4352'] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label ?? '') || !/^[a-z0-9-]+$/.test(buildName) || !/^\d{4}$/.test(port)) throw Error('Invalid bounded QA inputs');
const origin = 'http://127.0.0.1:' + port;
const built = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/cached-release-20260908', buildName, 'build.json')));
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/cross-feature-motion-20260910', label + '-'));
const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { root, hostname: process.env.COMPUTERNAME, label, origin, out, profile, build: built.buildId,
  startedAt: new Date().toISOString(), checks: [], captures: [], samples: [], network: [], documents: [], responses: [], completedRequests: [], errors: [], entries: [], faults: [], deniedTraffic: [] };
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
const started = Date.now(), deadline = started + 720000, workEnd = deadline - 75000;
const delay = ms => new Promise(done => setTimeout(done, ms));
let chrome, ws, sequence = 0, stderr = '', closing = false, blockGeometry = false, holdRetry = false;
const heldRetry = [];
const pending = new Map();
const trace = entry => report.entries.push({ timeMs: Date.now() - started, sessionId: report.pageSession, ...entry });
const caught = error => report.errors.push({ fault: error.message, commandId: error.commandId, sessionId: report.pageSession });
const anchorPaths = ['web/data-bundle.json', 'web/public/data/generated_20260805_prefer_scored_routed/manifest.json', 'web/public/data/lamp_posts_v1/manifest.json', 'raw/manifest.json'];
const identities = () => anchorPaths.map(path => { const bytes = readFileSync(resolve(root, path)); return { path, bytes: bytes.length, sha256: sha(bytes) }; });
function check(name, pass, detail, fatal = true) { report.checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name); if (!pass && fatal) throw Error(name); }
function send(method, params = {}, timeout = 45000) {
  return new Promise((done, reject) => {
    const remaining = (closing ? deadline : workEnd) - Date.now();
    if (remaining <= 0) { reject(Error('QA deadline')); return; }
    const id = ++sequence, fetchCommand = /^Fetch\.(continueRequest|failRequest|fulfillRequest)$/.test(method);
    if (fetchCommand) trace({ kind: 'send', id, method, params });
    let timer;
    const finish = (value, error, kind = 'cdp') => {
      clearTimeout(timer); pending.delete(id);
      if (fetchCommand) trace({ kind: 'reply', id, fetchCommand, ...(error ? { error: { ...error, kind } } : {}) });
      if (error) { const failure = Error(error.message); failure.commandId = id; reject(failure); }
      else done(value);
    };
    timer = setTimeout(() => finish(null, { message: 'CDP timeout ' + method }, 'timeout'), Math.min(timeout, remaining));
    pending.set(id, { finish });
    try { ws.send(JSON.stringify({ id, method, params })); }
    catch (error) { finish(null, { message: error.message }, 'connection'); }
  });
}
async function evaluate(fn, arg = null) {
  const r = await send('Runtime.evaluate', { expression: '(' + fn.toString() + ')(' + JSON.stringify(arg) + ')', returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function until(name, fn, predicate, limit = 90000) {
  const end = Math.min(workEnd, Date.now() + limit); let value;
  while (Date.now() < end) { value = await fn(); report.lastSample = { name, value }; if (predicate(value)) return value; await delay(300); }
  throw Error(name + ' timeout: ' + JSON.stringify(value));
}
function facts() {
  const rect = n => { const r = n?.getBoundingClientRect(); return r ? { x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height } : null; };
  const panel = document.querySelector('[data-comparison-panel]'), map = window.__shiokRouteMap, debug = window.__shiokRouteDebug;
  const active = document.activeElement, focusRect = rect(active);
  const hit = focusRect && document.elementFromPoint(focusRect.x + focusRect.width / 2, focusRect.y + focusRect.height / 2);
  let features = []; try { features = map?.queryRenderedFeatures({ layers: ['shiokest-route-line'] }) || []; } catch {}
  let saved; try { saved = localStorage.getItem('shiok:comparison:v1'); } catch { saved = 'denied'; }
  return { viewport:[innerWidth,innerHeight], url:location.href, documentMarker:window.__qaDocumentMarker,
    status:document.querySelector('main')?.dataset.mapStatus, routeKey:debug?.routeKey,
    renderedKeys:[...new Set(features.map(f => f.properties?.render_key))], featureCount:features.filter(f => f.properties?.render_key === debug?.routeKey).length,
    basemap:!!map?.getSource('onemap') && map.isSourceLoaded('onemap'), tiles:map?.areTilesLoaded(), moving:map?.isMoving(),
    center:map?.getCenter().toArray(), reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
    canvasLabel:map?.getCanvas().getAttribute('aria-label'),
    allControls:[...document.querySelectorAll('button,summary')].map(n=>({label:n.getAttribute('aria-label')||n.textContent,disabled:n.disabled})),
    category:panel?.querySelector('[aria-label="Comparison transit category"] [aria-pressed="true"]')?.textContent,
    panel:rect(panel), scroll:panel && { left:panel.scrollLeft,top:panel.scrollTop,width:panel.clientWidth,height:panel.clientHeight,fullWidth:panel.scrollWidth,fullHeight:panel.scrollHeight },
    text:panel?.textContent, shared:!!panel?.querySelector('[aria-label="Shared shortlist"]'), saved,
    controls:[...panel?.querySelectorAll('button') ?? []].map(n => ({ label:n.getAttribute('aria-label') || n.textContent, disabled:n.disabled })),
    focus:{ tag:active?.tagName,label:active?.getAttribute('aria-label') || (active?.tagName === 'BODY' ? 'BODY' : active?.textContent),rect:focusRect,visible:!!hit && (hit === active || active.contains(hit)),outline:active ? getComputedStyle(active).outline : null,headingPostal:active?.closest('thead th')?.querySelector('button[aria-pressed]')?.textContent },
    selectedPostal:panel?.querySelector('thead button[aria-pressed="true"]')?.textContent,
    search:rect(document.querySelector('form')),brand:rect(document.querySelector('h1')),result:rect(document.querySelector('[aria-label="Walk summary"]')?.parentElement),
    footer:rect(document.querySelector('footer')),credit:rect(document.querySelector('[class*=oneMapAttribution]')),
    overflow:(document.documentElement?.scrollWidth ?? 0) > innerWidth,deniedSaves:window.__qaDeniedSaves,clipboardAttempts:window.__qaClipboard,
    manual:[...panel?.querySelectorAll('textarea') ?? []].map(n => ({value:n.value,selection:[n.selectionStart,n.selectionEnd]})) };
}
const ready = f => f.status === 'ready' && f.basemap && f.tiles && !f.moving && f.featureCount > 0
  && f.renderedKeys.length === 1 && f.renderedKeys[0] === f.routeKey
  && (!f.panel || f.routeKey?.endsWith(':comparison:' + f.selectedPostal));
async function key(key, code, number, modifiers = 0) {
  await send('Input.dispatchKeyEvent', { type:'keyDown', key, code, windowsVirtualKeyCode:number, modifiers, ...(key === 'Enter' ? {text:'\r'} : {}) });
  await send('Input.dispatchKeyEvent', { type:'keyUp', key, code, windowsVirtualKeyCode:number, modifiers });
}
async function tabTo(label) {
  const trail = [];
  for (let n = 0; n < 55; n++) { const f = await evaluate(facts); trail.push(f.focus); if (f.focus.label === label) { report.samples.push({ name:'native Tab '+label,trail }); return f; } await key('Tab','Tab',9); }
  throw Error('Tab cannot reach ' + label + ': ' + JSON.stringify(trail));
}
async function activate(label) { const f = await tabTo(label); check('reachable '+label, f.focus.visible, f.focus); await key('Enter','Enter',13); }
async function capture(name, selected = true) {
  const predicate = f => f.basemap && f.tiles && !f.moving && (!selected || ready(f));
  for (let attempt = 1; attempt <= 3; attempt++) {
    let stableSamples = 0, lastKey;
    await until('settle '+name, () => evaluate(facts), f => {
      stableSamples = predicate(f) && f.routeKey === lastKey ? stableSamples + 1 : 0;
      lastKey = f.routeKey;
      return stableSamples >= 3;
    });
    const before = await evaluate(facts), shot = await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}), after = await evaluate(facts), bytes = Buffer.from(shot.data,'base64');
    const stable = predicate(before) && predicate(after) && before.routeKey === after.routeKey;
    const file = name + (stable ? '' : '-transitional-' + attempt) + '.png';
    writeFileSync(resolve(out,file),bytes,{flag:'wx'});
    report.captures.push({name,file,attempt,stable,bytes:bytes.length,sha256:sha(bytes),before,after});
    if (stable) {
      check(name+' current stable route',true);
      check(name+' no document overflow',!before.overflow&&!after.overflow);
      return;
    }
  }
  check(name+' current stable route',false);
}
async function fragment(value) { await evaluate(value => { location.hash = value; }, value); }
async function shape(width,height) { await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false}); await until('viewport',()=>evaluate(facts),f=>f.viewport[0]===width && f.viewport[1]===height); }
try {
  report.anchorsBefore = identities();
  report.buildSources = built.sources.map(s => {
    const current = readFileSync(resolve(root,s.path));
    const expected = s.path === 'web/next.config.js' ? built.generatedConfigSha256
      : s.path === 'web/next-env.d.ts' && sha(current) === s.sha256 ? sha(Buffer.from(current.toString().replaceAll('./.next/dev/types/', './.next/types/'))) : s.sha256;
    return {path:s.path,built:s.sha256,expectedSnapshot:expected,snapshot:sha(readFileSync(resolve(built.snapshot,s.path))),current:sha(current)};
  });
  check('snapshot matches captured source and explicit QA/type derivatives',report.buildSources.every(s=>s.expectedSnapshot===s.snapshot));
  report.currentSourceDifferences = report.buildSources.filter(s=>s.current!==s.built);
  check('treatment source matches current web',label.startsWith('baseline') || report.currentSourceDifferences.length === 0,report.currentSourceDifferences);
  const status = await fetch(origin+'/__qa/status',{signal:AbortSignal.timeout(5000)});
  const {nonce:controlNonce,...previewIdentity}=await status.json();report.preview=previewIdentity;
  check('live preview matches pinned build',status.ok && report.preview.buildId === built.buildId);
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-networking','--disable-component-update','--disable-sync','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,TEMP:profile,TMP:profile}});
  report.chromePid = chrome.pid; chrome.stderr.on('data',data=>{stderr+=data;});
  const endpoint = await until('owned browser',async()=>/DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1],Boolean,45000);
  const tabs = await (await fetch('http://'+new URL(endpoint).host+'/json',{signal:AbortSignal.timeout(5000)})).json();
  const page = tabs.find(t=>t.type==='page');
  report.pageSession = 'direct-page:' + page.id;
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((done,reject)=>{const timer=setTimeout(()=>reject(Error('CDP handshake')),15000);ws.onopen=()=>{clearTimeout(timer);done();};ws.onerror=()=>{clearTimeout(timer);reject(Error('CDP connection'));};});
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.method && /^(Network\.|Fetch\.|Runtime\.exceptionThrown$)/.test(m.method)) trace({ kind: 'event', method: m.method, params: m.params });
    if(m.id)pending.get(m.id)?.finish(m.result,m.error);
    else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails);
    else if(m.method==='Network.requestWillBeSent')report.network.push({url:m.params.request.url,method:m.params.request.method,type:m.params.type});
    else if(m.method==='Network.responseReceived'){
      const r={id:m.params.requestId,url:m.params.response.url,status:m.params.response.status,time:Date.now()};
      report.responses.push(r);if(m.params.type==='Document')report.documents.push(r);
    }
    else if(m.method==='Network.loadingFinished')report.completedRequests.push({id:m.params.requestId,time:Date.now()});
    else if(m.method==='Fetch.requestPaused'){
      const {requestId,request}=m.params;
      const url=new URL(request.url),local=url.origin===origin&&!url.pathname.startsWith('/api/');
      const tiles=url.origin==='https://www.onemap.gov.sg'&&!url.search&&(/^\/maps\/tiles\/Grey_HD\/\d+\/\d+\/\d+\.png$/.test(url.pathname)||url.pathname==='/web-assets/images/logo/om_logo.png');
      if(!['GET','HEAD'].includes(request.method)||(!local&&!tiles)||url.username||url.password){
        report.deniedTraffic.push({url:request.url,method:request.method});
        send('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'}).catch(caught);return;
      }
      const target=/\/geom\/h3\/[^/]+\.json(?:\.gz)?$/.test(url.pathname);
      if(target)report.faults.push({url:request.url,blocked:blockGeometry,held:holdRetry,time:Date.now()});
      if(target&&holdRetry){heldRetry.push(requestId);return;}
      const action=target&&blockGeometry?send('Fetch.fulfillRequest',{requestId,responseCode:503,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from('{"error":"QA geometry failure"}').toString('base64')}):send('Fetch.continueRequest',{requestId});
      action.catch(caught);
    }
  };
  ws.onclose=()=>{for(const p of [...pending.values()])p.finish(null,{message:'CDP closed'});if(!closing){report.unexpectedClose=true;trace({kind:'connectionFault',message:'unexpected close'});}};
  for(const domain of ['Page','Runtime','Network'])await send(domain+'.enable');
  await send('Network.setCacheDisabled',{cacheDisabled:true}); await send('Network.setBypassServiceWorker',{bypass:true});
  await send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__qaDocumentMarker=Date.now(); window.__qaDenySave=false; window.__qaDeniedSaves=0; window.__qaClipboard=[]; const original=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){if(window.__qaDenySave&&k==='shiok:comparison:v1'){window.__qaDeniedSaves++;throw new DOMException('QA storage denied','QuotaExceededError');}return original.call(this,k,v);}; Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value)=>{window.__qaClipboard.push(value);throw new DOMException('QA clipboard denied','NotAllowedError');}}});`});

  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await shape(390,844);await send('Page.navigate',{url:origin+'/?debugMap=1'});
  await until('plain basemap',()=>evaluate(facts),f=>f.basemap&&f.tiles&&!f.moving,90000);
  const doc=report.documents.at(-1),body=await send('Network.getResponseBody',{requestId:doc.id}),html=Buffer.from(body.body,body.base64Encoded?'base64':'utf8');
  writeFileSync(resolve(out,'document.html'),html,{flag:'wx'});report.document={...doc,bytes:html.length,sha256:sha(html)};
  check('actual HTML pins build',doc.status===200&&html.includes(Buffer.from(built.buildId)));
  let f=await evaluate(facts);await tabTo(f.canvasLabel);
  const beforePan=await evaluate(facts);await key('ArrowRight','ArrowRight',39);
  await until('native keyboard pan',()=>evaluate(facts),f=>!f.moving&&JSON.stringify(f.center)!==JSON.stringify(beforePan.center));
  await capture('keyboard-map-390x844',false);
  f=await evaluate(facts);
  check('native map keyboard focus stays visible',f.focus.tag==='CANVAS'&&f.focus.visible&&f.reduced,f.focus);
  await evaluate(()=>{const map=window.__shiokRouteMap;window.__qaCamera=[];
    for(const name of ['fitBounds','easeTo']){const original=map[name];map[name]=function(...args){window.__qaCamera.push({name,options:args[name==='fitBounds'?1:0]});return original.apply(this,args);};}});
  await tabTo('Enter 6-digit Singapore postal code');await send('Input.insertText',{text:'018956'});await key('Enter','Enter',13);
  await until('typed postal',()=>evaluate(facts),ready,90000);await capture('inspect-reduced-390x844');
  const layout=await evaluate(facts);
  check('approved left stack and equal widths',layout.result&&Math.abs(layout.result.width-layout.search.width)<1&&layout.search.y>=layout.brand.bottom&&layout.result.y>=layout.search.bottom,layout);
  await activate('Walk details');
  await until('expanded walk details',()=>evaluate(facts),f=>ready(f)&&f.allControls.some(c=>c.label==='Collapse walk details'));
  await capture('inspect-expanded-390x844');
  await activate('Collapse walk details');await until('collapsed walk details',()=>evaluate(facts),ready);
  holdRetry=true;
  await fragment('compare=1&postals=018956%2C018990%2C049213&transit=bus&active=049213');
  await until('new comparison requests held',()=>evaluate(facts),f=>heldRetry.length>0&&f.controls.some(c=>c.label==='Show postal 018956 on map'&&!c.disabled),90000);
  report.pendingComparison=await evaluate(facts);
  await activate('Show postal 018956 on map');
  await until('cached A ready while other geometry is held',()=>evaluate(facts),f=>ready(f)&&f.selectedPostal==='018956',90000);
  const beforeRelease=await evaluate(facts);holdRetry=false;report.releases=[];
  for(const requestId of heldRetry.splice(0)){
    try{await send('Fetch.continueRequest',{requestId});report.releases.push({requestId,continued:true});}
    catch(error){report.releases.push({requestId,error:error.message,commandId:error.commandId});caught(error);}
  }
  await until('background comparison data complete',()=>evaluate(facts),f=>ready(f)&&!f.text.includes('Loading'),90000);
  f=await evaluate(facts);
  check('late other-postal data cannot replace current A',f.selectedPostal==='018956'&&f.routeKey===beforeRelease.routeKey&&f.documentMarker===beforeRelease.documentMarker,{beforeRelease,after:f});
  await capture('late-background-keeps-A');
  await activate('MRT/LRT');
  await until('rail category ready',()=>evaluate(facts),f=>ready(f)&&f.category==='MRT/LRT'&&!f.text.includes('Loading'),90000);
  f=await evaluate(facts);
  const other=f.controls.find(c=>c.label==='Show postal 049213 on map'&&!c.disabled);
  check('a second published rail walk is selectable',!!other,f.controls);
  await activate(other.label);await until('other rail walk selected',()=>evaluate(facts),f=>ready(f)&&f.selectedPostal!=='018956',90000);
  const otherState=await evaluate(facts);
  await activate('Show postal 018956 on map');await until('back to A',()=>evaluate(facts),f=>ready(f)&&f.selectedPostal==='018956');
  check('selection changes preserve same Document',(await evaluate(facts)).documentMarker===otherState.documentMarker,otherState);
  for(const [width,height] of [[1440,950],[390,844],[390,667],[320,667]]){
    await shape(width,height);await capture('comparison-'+width+'x'+height);
    const current=await evaluate(facts);
    check('comparison viewport retains usable scroll area '+width+'x'+height,current.scroll.height>64&&!current.overflow,current.scroll);
  }
  await send('Emulation.setDeviceMetricsOverride',{width:720,height:475,deviceScaleFactor:2,mobile:false});
  report.reflowModel='720x475 CSS at DPR2: 200%-equivalent desktop reflow from1440x950, not browser Ctrl+plus or a physical device.';
  await capture('desktop-reflow-720x475-dpr2');
  await shape(320,667);
  report.textStress=await evaluate(()=>{
    const nodes=[...document.querySelector('[data-comparison-panel]').querySelectorAll('*')];
    const sizes=nodes.map(n=>[n,parseFloat(getComputedStyle(n).fontSize)]);
    window.__qaFonts=nodes.map(n=>[n,n.style.fontSize]);
    for(const [n,size]of sizes)n.style.fontSize=(size*2)+'px';
    return {method:'Each comparison descendant computed font size doubled once before layout; not native browser zoom.',nodes:sizes.length};
  });
  await capture('comparison-text-double-320x667');
  await tabTo('Compared walks');await key('End','End',35,2);
  for(let n=0;n<16;n++)await key('ArrowRight','ArrowRight',39);
  await until('doubled-text end reachable',()=>evaluate(facts),f=>f.scroll.top>=f.scroll.fullHeight-f.scroll.height-1&&f.scroll.left>=f.scroll.fullWidth-f.scroll.width-1);
  const last=await evaluate(()=>{const p=document.querySelector('[data-comparison-panel]'),n=p.querySelector('tbody tr:last-child td:last-child'),r=n.getBoundingClientRect(),pr=p.getBoundingClientRect(),head=p.querySelector('thead th:last-child').getBoundingClientRect(),label=p.querySelector('tbody tr:last-child th').getBoundingClientRect();return{cell:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},bounds:{right:pr.x+p.clientLeft+p.clientWidth,bottom:pr.y+p.clientTop+p.clientHeight},headBottom:head.bottom,labelRight:label.right,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===n};});
  check('last enlarged-text cell visible beyond sticky headers',last.hit&&last.cell.x>=last.labelRight-1&&last.cell.right<=last.bounds.right+1&&last.cell.bottom<=last.bounds.bottom+1&&last.cell.y>=last.headBottom-1,last);
  await capture('comparison-text-double-keyboard-end');
  await evaluate(()=>{for(const [n,size]of window.__qaFonts)n.style.fontSize=size;delete window.__qaFonts;});
  await activate('Close comparison');
  const closed = await until('shared comparison closed',()=>evaluate(facts),f=>!f.panel&&f.status==='idle'&&f.basemap&&f.tiles&&!f.moving);
  check('closing a shared link restores plain home, not an unrelated inspector',!closed.result&&closed.featureCount===0&&!new URL(closed.url).hash&&closed.focus.label==='Compare',closed);
  await capture('shared-close-plain-320x667',false);
  await tabTo('Enter 6-digit Singapore postal code');await send('Input.insertText',{text:'018956'});await key('Enter','Enter',13);
  await until('explicit inspector search after shared close',()=>evaluate(facts),ready);
  await capture('inspector-after-shared-close-320x667');
  await activate('About data');
  await until('About expanded',()=>evaluate(()=>({open:[...document.querySelectorAll('details')].find(d=>d.querySelector('summary')?.textContent==='About data')?.open})),f=>f.open);
  await capture('about-expanded-320x667');
  await key('Enter','Enter',13);
  await until('About collapsed',()=>evaluate(()=>({open:[...document.querySelectorAll('details')].find(d=>d.querySelector('summary')?.textContent==='About data')?.open})),f=>f.open===false);
  report.camera=await evaluate(()=>window.__qaCamera);
  check('application route fits honor reduced motion',report.camera.some(c=>c.name==='fitBounds')&&report.camera.filter(c=>c.name==='fitBounds').every(c=>c.options.duration===0),report.camera);
  report.errorAudit = auditErrors(report.entries, report.errors, report.pageSession);
  check('no uncaught errors, unexplained Fetch failures or blocked application requests',report.errorAudit.ok&&!report.unexpectedClose&&report.deniedTraffic.length===0,report.errorAudit);
}catch(error){report.failure=error.stack;console.error(error.stack);if(ws?.readyState===1)try{const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},10000),bytes=Buffer.from(shot.data,'base64');writeFileSync(resolve(out,'failure.png'),bytes,{flag:'wx'});report.failureCapture={sha256:sha(bytes),bytes:bytes.length};}catch(e){report.failureCaptureError=e.message;}}
finally{
  closing=true;if(ws?.readyState===1)try{await send('Browser.close',{},5000);}catch(e){report.closeError=e.message;}ws?.close();
  report.cleanup=cleanup(profile);chrome?.stderr?.destroy();chrome?.unref();report.stderr=stderr;report.elapsedMs=Date.now()-started;report.anchorsAfter=identities();
  report.anchorsUnchanged=JSON.stringify(report.anchorsBefore)===JSON.stringify(report.anchorsAfter);
  report.ok=!report.failure&&report.errorAudit?.ok&&!report.unexpectedClose&&report.deniedTraffic.length===0&&report.checks.every(c=>c.pass)&&report.cleanup.verified&&report.anchorsUnchanged;
  report.limits='Functional local Chromium/SwiftShader, real held geometry and keyboard actions, reduced-motion emulation, declared CSS reflow/text-doubling stress. SW/cache bypass; no M17, new storage-failure, physical-device/native-zoom, representative latency, production release or full-suite claim. No pipeline/install/build/deploy executed by this runner.';
  writeFileSync(resolve(out,'browser.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({out,ok:report.ok,checks:report.checks.length,captures:report.captures.length,cleanupVerified:report.cleanup.verified}));
  process.exitCode=report.ok?0:1;
}
