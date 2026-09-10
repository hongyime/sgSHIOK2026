import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { cleanup } from './cleanup.mjs';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [label, buildName = 'source-freshness-20260909-1', port = '4334'] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label ?? '') || !/^[a-z0-9-]+$/.test(buildName) || !/^\d{4}$/.test(port)) throw Error('Invalid bounded QA inputs');
const origin = 'http://127.0.0.1:' + port;
const built = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/cached-release-20260908', buildName, 'build.json')));
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/cross-feature-20260910', label + '-'));
const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { root, hostname: process.env.COMPUTERNAME, label, origin, out, profile, build: built.buildId,
  startedAt: new Date().toISOString(), checks: [], captures: [], samples: [], network: [], documents: [], responses: [], completedRequests: [], errors: [], faults: [], deniedTraffic: [] };
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
const started = Date.now(), deadline = started + 720000, workEnd = deadline - 75000;
const delay = ms => new Promise(done => setTimeout(done, ms));
let chrome, ws, sequence = 0, stderr = '', closing = false, blockGeometry = true, holdRetry = false;
const heldRetry = [];
const pending = new Map();
const anchorPaths = ['web/data-bundle.json', 'web/public/data/generated_20260805_prefer_scored_routed/manifest.json', 'web/public/data/lamp_posts_v1/manifest.json', 'raw/manifest.json'];
const identities = () => anchorPaths.map(path => { const bytes = readFileSync(resolve(root, path)); return { path, bytes: bytes.length, sha256: sha(bytes) }; });
function check(name, pass, detail, fatal = true) { report.checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name); if (!pass && fatal) throw Error(name); }
function send(method, params = {}, timeout = 45000) {
  return new Promise((done, reject) => {
    const remaining = (closing ? deadline : workEnd) - Date.now();
    if (remaining <= 0) { reject(Error('QA deadline')); return; }
    const id = ++sequence, timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout ' + method)); }, Math.min(timeout, remaining));
    pending.set(id, { finish(value, error) { clearTimeout(timer); pending.delete(id); error ? reject(Error(error.message)) : done(value); } });
    ws.send(JSON.stringify({ id, method, params }));
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
    panel:rect(panel), scroll:panel && { left:panel.scrollLeft,top:panel.scrollTop,width:panel.clientWidth,height:panel.clientHeight,fullWidth:panel.scrollWidth,fullHeight:panel.scrollHeight },
    text:panel?.textContent, shared:!!panel?.querySelector('[aria-label="Shared shortlist"]'), saved,
    controls:[...panel?.querySelectorAll('button') ?? []].map(n => ({ label:n.getAttribute('aria-label') || n.textContent, disabled:n.disabled })),
    focus:{ tag:active?.tagName,label:active?.getAttribute('aria-label') || (active?.tagName === 'BODY' ? 'BODY' : active?.textContent),rect:focusRect,visible:!!hit && (hit === active || active.contains(hit)),outline:active ? getComputedStyle(active).outline : null,headingPostal:active?.closest('thead th')?.querySelector('button[aria-pressed]')?.textContent },
    selectedPostal:panel?.querySelector('thead button[aria-pressed="true"]')?.textContent,
    search:rect(document.querySelector('form')),brand:rect(document.querySelector('h1')),result:rect(document.querySelector('[aria-label="Walk summary"]')?.parentElement),
    footer:rect(document.querySelector('footer')),credit:rect(document.querySelector('[class*=oneMapAttribution]')),
    overflow:document.documentElement.scrollWidth > innerWidth,deniedSaves:window.__qaDeniedSaves,clipboardAttempts:window.__qaClipboard,
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
  await until('settle '+name, () => evaluate(facts), predicate);
  await evaluate(() => new Promise((done,reject) => { const m = window.__shiokRouteMap, timer = setTimeout(() => reject(Error('idle deadline')),20000); m.once('idle',() => { clearTimeout(timer); done(true); }); m.triggerRepaint(); }));
  const before = await evaluate(facts), shot = await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}), after = await evaluate(facts), bytes = Buffer.from(shot.data,'base64');
  writeFileSync(resolve(out,name+'.png'),bytes,{flag:'wx'});
  report.captures.push({name,bytes:bytes.length,sha256:sha(bytes),before,after});
  check(name+' current stable route',predicate(before) && predicate(after) && before.routeKey === after.routeKey);
  check(name+' no document overflow',!before.overflow&&!after.overflow);
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
  const status = await fetch(origin+'/__qa/status',{signal:AbortSignal.timeout(5000)}); report.preview = await status.json();
  check('live preview matches pinned build',status.ok && report.preview.build === built.buildId);
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-networking','--disable-component-update','--disable-sync','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,TEMP:profile,TMP:profile}});
  report.chromePid = chrome.pid; chrome.stderr.on('data',data=>{stderr+=data;});
  const endpoint = await until('owned browser',async()=>/DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1],Boolean,45000);
  const tabs = await (await fetch('http://'+new URL(endpoint).host+'/json',{signal:AbortSignal.timeout(5000)})).json();
  ws = new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((done,reject)=>{const timer=setTimeout(()=>reject(Error('CDP handshake')),15000);ws.onopen=()=>{clearTimeout(timer);done();};ws.onerror=()=>{clearTimeout(timer);reject(Error('CDP connection'));};});
  ws.onmessage = event => {
    const m = JSON.parse(event.data); if(m.id)pending.get(m.id)?.finish(m.result,m.error);
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
        send('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'}).catch(error=>report.errors.push({fault:error.message}));return;
      }
      const target=/\/geom\/h3\/886520db15fffff\.json(?:\.gz)?$/.test(url.pathname);
      if(target)report.faults.push({url:request.url,blocked:blockGeometry,held:holdRetry,time:Date.now()});
      if(target&&holdRetry){heldRetry.push(requestId);return;}
      const action=target&&blockGeometry?send('Fetch.fulfillRequest',{requestId,responseCode:503,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from('{"error":"QA geometry failure"}').toString('base64')}):send('Fetch.continueRequest',{requestId});
      action.catch(error=>report.errors.push({fault:error.message}));
    }
  };
  ws.onclose=()=>{for(const p of [...pending.values()])p.finish(null,{message:'CDP closed'});if(!closing)report.unexpectedClose=true;};
  for(const domain of ['Page','Runtime','Network'])await send(domain+'.enable');
  await send('Network.setCacheDisabled',{cacheDisabled:true}); await send('Network.setBypassServiceWorker',{bypass:true});
  await send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__qaDocumentMarker=Date.now(); window.__qaDenySave=false; window.__qaDeniedSaves=0; window.__qaClipboard=[]; const original=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){if(window.__qaDenySave&&k==='shiok:comparison:v1'){window.__qaDeniedSaves++;throw new DOMException('QA storage denied','QuotaExceededError');}return original.call(this,k,v);}; Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value)=>{window.__qaClipboard.push(value);throw new DOMException('QA clipboard denied','NotAllowedError');}}});`});
  await shape(320,667); await send('Page.navigate',{url:origin+'/?debugMap=1'});
  await until('plain basemap',()=>evaluate(facts),f=>f.basemap&&f.tiles&&!f.moving,180000);
  await capture('plain-320x667',false);
  const doc=report.documents.at(-1),body=await send('Network.getResponseBody',{requestId:doc.id}),html=Buffer.from(body.body,body.base64Encoded?'base64':'utf8');
  writeFileSync(resolve(out,'document.html'),html,{flag:'wx'}); report.document={...doc,bytes:html.length,sha256:sha(html)};
  check('actual HTML pins build',doc.status===200&&html.includes(Buffer.from(built.buildId)));
  await evaluate(()=>{localStorage.setItem('shiok:comparison:v1',JSON.stringify({version:1,postals:['079908'],category:'bus',activePostal:'079908'}));});
  await fragment('compare=1&postals=018956%2C018990%2C079908&transit=bus&active=018956');
  await until('comparison geometry failure with current A',()=>evaluate(facts),f=>ready(f)&&f.controls.some(c=>c.label==='Retry postal 018990'),180000);
  check('fault reached actual geometry request',report.faults.some(f=>f.blocked));
  await activate('Copy diagnostics');
  await until('manual diagnostics',()=>evaluate(facts),f=>f.manual.length===1);
  await activate('Select diagnostics');
  let f=await evaluate(facts); report.diagnostic=f.manual[0];
  check('manual diagnostics selected and keyboard visible',f.focus.tag==='TEXTAREA'&&f.focus.visible&&f.manual[0].selection[0]===0&&f.manual[0].selection[1]===f.manual[0].value.length,f.focus);
  const diagnostics=JSON.parse(f.manual[0].value);
  check('diagnostics exact schema and clipboard/manual payload',JSON.stringify(Object.keys(diagnostics).sort())===JSON.stringify(['schema','app_build_id','artifact_bundle_id','artifact_identity_source','area','status','stage','reason','artifact_role','http_status','elapsed_ms','elapsed_basis'].sort())
    && diagnostics.schema==='shiok-diagnostics-v1' && diagnostics.app_build_id===null && diagnostics.artifact_bundle_id==='generated_20260805_prefer_scored_routed'
    && diagnostics.artifact_identity_source==='pinned-config' && diagnostics.area==='geometry-data'&&diagnostics.status==='error'&&diagnostics.stage==='artifact-fetch'&&diagnostics.reason==='http'
    &&diagnostics.artifact_role==='geometry-shard'&&diagnostics.http_status===503&&Number.isSafeInteger(diagnostics.elapsed_ms)&&diagnostics.elapsed_ms>=0&&diagnostics.elapsed_basis==='artifact-operation'
    &&f.clipboardAttempts.length===1&&f.clipboardAttempts[0]===f.manual[0].value,diagnostics);
  check('diagnostics exclude postals and URLs',!/018956|018990|079908|debugMap|https?:|QA storage/.test(f.manual[0].value));
  check('diagnostics capture actually scrolled',f.scroll.left>0&&f.scroll.top>0,f.scroll);
  await capture('diagnostics-scrolled-320x667');
  await activate('Hide diagnostics'); await until('hide returns copy focus',()=>evaluate(facts),f=>f.manual.length===0&&f.focus.label==='Copy diagnostics');
  await tabTo('Retry postal 018990');
  const beforeRetry=await evaluate(facts),retryStarted=Date.now(); blockGeometry=false;holdRetry=true;
  await key('Enter','Enter',13);
  const duringRetry=await until('held retry request pending',()=>evaluate(facts),()=>heldRetry.length>0);
  report.samples.push({name:'Retry focus',before:beforeRetry,during:duringRetry});
  check('Retry retains exact keyboard column during held loading',duringRetry.focus.tag==='TH'&&duringRetry.focus.headingPostal==='018990'&&duringRetry.focus.label==='Postal 018990 comparison column'&&duringRetry.focus.visible,duringRetry.focus,false);
  check('Retry column has visible focus outline',!!duringRetry.focus.outline&&!/\bnone\b|\b0px\b/.test(duringRetry.focus.outline),duringRetry.focus.outline,false);
  holdRetry=false;for(const requestId of heldRetry.splice(0))await send('Fetch.continueRequest',{requestId});
  const completedRetry=await until('retry response fully received',async()=>report.responses.find(r=>r.time>=retryStarted&&r.status===200&&/\/geom\/h3\/886520db15fffff\.json(?:\.gz)?$/.test(new URL(r.url).pathname)&&report.completedRequests.some(c=>c.id===r.id)),Boolean);
  report.completedRetry=completedRetry;
  await until('retry completed without reload',()=>evaluate(facts),f=>!f.controls.some(c=>c.label==='Retry postal 018990')&&!f.text?.includes('Loading')&&ready(f));
  f=await evaluate(facts);check('retry preserves current A and Document',f.documentMarker===beforeRetry.documentMarker&&f.selectedPostal==='018956'&&f.routeKey===beforeRetry.routeKey,f);
  check('retry focus stays on same column after completion',f.focus.tag==='TH'&&f.focus.headingPostal==='018990'&&f.focus.visible,f.focus,false);
  check('unverified walk remains honest after transport recovery',f.controls.some(c=>c.label==='Show postal 018990 on map'&&c.disabled)&&f.text.includes('Straight-line estimate; no verified walk.'),f.text);
  await capture('retry-recovered-320x667');
  await evaluate(()=>{window.__qaDenySave=true;});
  const beforeSave=await evaluate(facts);
  await activate('Save shortlist on this device');
  await until('save denial',()=>evaluate(facts),f=>f.text?.includes('Saved for this visit only.'));
  f=await evaluate(facts);check('failed Save preserves exact shared URL and saved list',f.shared&&f.url===beforeSave.url&&f.saved===beforeSave.saved&&f.deniedSaves>beforeSave.deniedSaves&&f.focus.label==='Save shortlist on this device'&&f.focus.visible,f);
  await capture('save-denied-320x667');
  await evaluate(()=>{window.__qaDenySave=false;}); await key('Enter','Enter',13);
  await until('Save completes',()=>evaluate(facts),f=>!f.shared&&f.focus.label==='Share comparison');
  f=await evaluate(facts);check('successful Save removes shared fragment with visible focus',!f.url.includes('compare=1')&&f.focus.visible&&JSON.parse(f.saved).postals.join(',')==='018956,018990,079908',f);
  await fragment('compare=1&postals=018956%2C018990&transit=bus&active=018956');
  await until('shared two-walk list',()=>evaluate(facts),f=>f.shared&&f.selectedPostal==='018956'&&!f.text?.includes('079908')&&ready(f));
  await activate('Use my saved shortlist');
  await until('Use saved restores all three',()=>evaluate(facts),f=>!f.shared&&f.text?.includes('079908')&&f.focus.label==='Share comparison'&&ready(f));
  f=await evaluate(facts);check('Use saved restores persisted list and reachable focus',f.focus.visible&&f.selectedPostal==='018956',f);
  for(const [width,height]of [[1440,950],[390,844],[390,667],[320,667]]){
    await shape(width,height);await capture('comparison-'+width+'x'+height);
    await tabTo('Compared walks');await key('End','End',35,2);
    for(let n=0;n<12;n++)await key('ArrowRight','ArrowRight',39);
    await until('keyboard scroll completed',()=>evaluate(facts),f=>f.scroll.top>=f.scroll.fullHeight-f.scroll.height-1&&f.scroll.left>=f.scroll.fullWidth-f.scroll.width-1);
    const last=await evaluate(()=>{const p=document.querySelector('[data-comparison-panel]'),n=p.querySelector('tbody tr:last-child td:last-child'),r=n.getBoundingClientRect(),pr=p.getBoundingClientRect(),label=p.querySelector('tbody tr:last-child th').getBoundingClientRect(),head=p.querySelector('thead th:last-child').getBoundingClientRect();return{cell:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},bounds:{left:pr.x+p.clientLeft,right:pr.x+p.clientLeft+p.clientWidth,bottom:pr.y+p.clientTop+p.clientHeight},labelRight:label.right,headBottom:head.bottom,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===n};});
    check('rightmost final metric reachable '+width+'x'+height,last.hit&&last.cell.x>=last.labelRight-1&&last.cell.right<=last.bounds.right+1&&last.cell.bottom<=last.bounds.bottom+1&&last.cell.y>=last.headBottom-1,last);
    if(width===320)await capture('comparison-keyboard-end-320x667');
  }
  await activate('Remove postal 079908');await until('removal focus',()=>evaluate(facts),f=>!f.text?.includes('079908')&&f.focus.label==='Remove postal 018990');
  f=await evaluate(facts);check('removal focus visible',f.focus.visible,f.focus);
  await activate('Clear list');await until('empty focuses Close',()=>evaluate(facts),f=>f.text?.includes('No homes added.')&&f.focus.label==='Close comparison');
  await key('Escape','Escape',27);await until('comparison closed',()=>evaluate(facts),f=>!f.panel);
  check('no uncaught errors or blocked application requests',!report.errors.length&&!report.unexpectedClose&&report.deniedTraffic.length===0,report.errors);
}catch(error){report.failure=error.stack;console.error(error.stack);if(ws?.readyState===1)try{const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},10000),bytes=Buffer.from(shot.data,'base64');writeFileSync(resolve(out,'failure.png'),bytes,{flag:'wx'});report.failureCapture={sha256:sha(bytes),bytes:bytes.length};}catch(e){report.failureCaptureError=e.message;}}
finally{
  closing=true;if(ws?.readyState===1)try{await send('Browser.close',{},5000);}catch(e){report.closeError=e.message;}ws?.close();
  report.cleanup=cleanup(profile);report.stderr=stderr;report.elapsedMs=Date.now()-started;report.anchorsAfter=identities();
  report.anchorsUnchanged=JSON.stringify(report.anchorsBefore)===JSON.stringify(report.anchorsAfter);
  report.ok=!report.failure&&!report.errors.length&&!report.unexpectedClose&&report.deniedTraffic.length===0&&report.checks.every(c=>c.pass)&&report.cleanup.verified&&report.anchorsUnchanged;
  report.limits='Functional local Chromium/SwiftShader with CSS viewport emulation, synthetic geometry503 and storage/clipboard denial. SW/cache bypass; no M17, physical-device/native-zoom, representative latency, production release or full-suite claim. No pipeline/install/build/deploy executed by this runner.';
  writeFileSync(resolve(out,'browser.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({out,ok:report.ok,checks:report.checks.length,captures:report.captures.length,cleanupVerified:report.cleanup.verified}));
  process.exitCode=report.ok?0:1;
}
