import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

// Parent reviews and authorizes execution. No proxy controls, installs, cache clearing or SW bypass.
// Usage: node C:/sgSHIOK2026/qa/revamp-r1/map-startup-20260909/browser.mjs <run-label> <expected-build-B>
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root; use C:\\sgSHIOK2026');
const [label, expectedBuildId] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label || '') || !/^[A-Za-z0-9_-]+$/.test(expectedBuildId || '')) {
  throw Error('Required arguments: <run-label> <expected-build-B>');
}
const folder = resolve(root, 'qa/revamp-r1/map-startup-20260909');
const out = resolve(folder, `${label}-${Date.now()}-${randomUUID().slice(0, 8)}`);
if (!out.startsWith(folder + sep) || existsSync(out)) throw Error('Unsafe or existing output directory');
const origin = 'http://127.0.0.1:4324';
const workerUrl = `${origin}/maplibre/6.1.0/maplibre-gl-worker.mjs`;
const selectedUrl = `${origin}/?postal=018956`;
const budgets = { failure: 100000, recovery: 120000, cleanup: 20000 };
mkdirSync(out);
const profile = mkdtempSync(resolve(root, 'tmp/map-startup-'));
const report = {
  schemaVersion: 1, root, out, profile, origin, selectedUrl, workerUrl, expectedBuildId,
  startedAt: new Date().toISOString(), budgetsMs: budgets, expectedComponentDeadlineMs: 30000,
  policies: { serviceWorkerBypassed: false, cachesCleared: false, cacheSeeded: false,
    forcedWorkerUpdate: false, proxyModified: false, timerDurationModified: false, freshProfile: true },
  checks: [], captures: [], samples: [], pauses: [], releases: [], network: [],
  exceptions: [], console: [], logs: [], proxySnapshots: [], dropped: {}, cleanup: {},
  responsive: [], browser: { stderr: '', executable: 'C:/Program Files/Google/Chrome/Application/chrome.exe' },
  limitations: [
    'A selected-postal local startup regression, not whole-device offline, cache-upgrade or production acceptance.',
    'Page-target Fetch must emit the exact worker requestPaused event; absent interception is a harness failure, never a successful fault injection.',
    'All matching initial worker requests are held so another worker cannot conceal the stalled-startup condition.',
    'The diagnostic wraps only 30000 ms function timers to observe scheduling/firing; it forwards their duration and arguments unchanged.',
    'Timer stacks and exact timeout copy tie the observation to the watchdog; loaded-host scheduling delay is recorded, not representative latency.',
    'Page-target network may omit worker fetches; bounded proxy receipts are supplementary, not exhaustive.',
    'Screenshots require parent visual inspection; responsive checks are attempted only inside the recovery budget.',
    'Owned Chrome profile and new evidence remain on disk; cleanup never deletes or enumerates other browser profiles.',
  ],
};
let phase = 'failure', deadline = Date.now() + budgets.failure, chrome, ws, sequence = 0;
let mainLoader = null, navigationLoader = null, interrupt = null, holding = true, fetchEnabled = false;
const pending = new Map(), held = new Map(), responses = new Map(), documents = new Map();
const completed = new Set();
const delay = ms => new Promise(done => setTimeout(done, ms));
const stamp = () => ({ phase, at: new Date().toISOString() });
const remaining = (max = 5000) => Math.max(1, Math.min(max, deadline - Date.now()));
function append(key, value, limit = 2500) {
  if (report[key].length < limit) report[key].push({ ...stamp(), ...value });
  else report.dropped[key] = (report.dropped[key] || 0) + 1;
}
function check(name, pass, details, fatal = true) {
  report.checks.push({ ...stamp(), name, pass: Boolean(pass), details });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  if (!pass && fatal) throw Error(name);
}
function send(method, params = {}, max = 5000) {
  return new Promise((done, reject) => {
    if (ws?.readyState !== 1) { reject(Error(`CDP unavailable: ${method}`)); return; }
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, remaining(max));
    pending.set(id, { done: result => { clearTimeout(timer); done(result); },
      reject: error => { clearTimeout(timer); reject(error); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression, max = 5000) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, max);
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function proxyStatus(label) {
  try {
    const response = await fetch(`${origin}/__qa/status`, { signal: AbortSignal.timeout(remaining()) });
    if (!response.ok) throw Error(`Proxy status HTTP ${response.status}`);
    const value = await response.json();
    report.proxySnapshots.push({ ...stamp(), label, value });
    return value;
  } catch (error) { report.proxySnapshots.push({ ...stamp(), label, error: error.message }); return null; }
}

const diagnostics = `(() => {
  const d = { timers: [], states: [], errors: [], rejections: [], dropped: 0 };
  const push = (list, value) => { if (list.length < 200) list.push(value); else d.dropped++; };
  window.__mapStartupQA = d;
  const nativeSetTimeout = window.setTimeout;
  window.setTimeout = function(callback, milliseconds, ...args) {
    if (milliseconds !== 30000 || typeof callback !== 'function') {
      return Reflect.apply(nativeSetTimeout, this, [callback, milliseconds, ...args]);
    }
    const timer = { scheduledAt: performance.now(), scheduledWallMs: Date.now(),
      delayMs: milliseconds, stack: new Error('30000ms timer registration').stack };
    push(d.timers, timer);
    return Reflect.apply(nativeSetTimeout, this, [function(...values) {
      timer.firedAt = performance.now(); timer.firedWallMs = Date.now();
      return Reflect.apply(callback, this, values);
    }, milliseconds, ...args]);
  };
  new MutationObserver(() => {
    const status = document.querySelector('main')?.dataset.mapStatus;
    if (status && d.states.at(-1)?.status !== status) push(d.states, {
      status, at: performance.now(), wallMs: Date.now()
    });
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-map-status'] });
  window.addEventListener('error', e => push(d.errors, { at:performance.now(), message:e.message || null,
    filename:e.filename || null, stack:e.error?.stack || null, resource:e.target?.src || e.target?.href || null }), true);
  window.addEventListener('unhandledrejection', e => push(d.rejections, {
    at:performance.now(), reason:String(e.reason), stack:e.reason?.stack || null
  }));
})()`;
const facts = `(() => {
  const m = window.__shiokRouteMap, debug = window.__shiokRouteDebug, errors = {};
  const safe = (name, fn) => { try { return fn(); } catch(e) { errors[name] = String(e); return null; } };
  const rect = n => { if(!n) return null; const r=n.getBoundingClientRect();
    return {x:r.x,y:r.y,width:r.width,height:r.height}; };
  const visible = n => !!n && n.getBoundingClientRect().width > 0 && n.getBoundingClientRect().height > 0 &&
    getComputedStyle(n).visibility !== 'hidden' && getComputedStyle(n).display !== 'none';
  const retry = [...document.querySelectorAll('button')].find(n => n.textContent.trim() === 'Retry map' && visible(n));
  const summary = document.querySelector('[aria-label="Walk summary"]');
  const metrics = summary ? [...summary.querySelectorAll('div > strong')].map(n => ({value:n.textContent,
    label:n.parentElement.querySelector('span')?.textContent})).filter(n =>
      ['Walk distance','Covered','Uncovered','Longest gap'].includes(n.label)) : [];
  const style = safe('style', () => m?.getStyle());
  const layers = ['shiokest-route-line','shortest-route-line'].map(id => safe(id, () => {
    if(!m?.getLayer(id)) return {id,exists:false,currentCount:0};
    const features=m.queryRenderedFeatures({layers:[id]});
    return {id,exists:true,allCount:features.length,currentCount:debug?.routeKey ?
      features.filter(f=>f.properties?.render_key===debug.routeKey).length : 0,
      keys:[...new Set(features.map(f=>f.properties?.render_key))]};
  }));
  return {url:location.href, now:performance.now(), wallMs:Date.now(), readyState:document.readyState,
    status:document.querySelector('main')?.dataset.mapStatus || null,
    text:document.body?.innerText || '', postal:summary?.dataset.postal || null, metrics,
    summaryText:summary?.innerText || null, retry:retry ? {text:retry.textContent,disabled:retry.disabled,rect:rect(retry)} : null,
    statusText:[...document.querySelectorAll('[role="status"],[role="alert"]')].map(n=>n.textContent),
    mapExists:!!m, key:debug?.routeKey || null, debug:debug ? JSON.parse(JSON.stringify(debug)) : null,
    routeCount:layers.find(l=>l?.id==='shiokest-route-line')?.currentCount ?? 0, layers,
    sources:Object.keys(style?.sources || {}).map(id=>({id,type:style.sources[id].type,
      loaded:safe(id+'.loaded',()=>m.isSourceLoaded(id))})),
    basemapLoaded:safe('basemap',()=>!!m?.getSource('onemap')&&m.isSourceLoaded('onemap')),
    routeSourceLoaded:safe('routeSource',()=>!!m?.getSource('shiokest-route')&&m.isSourceLoaded('shiokest-route')),
    loaded:safe('loaded',()=>m?.loaded()), styleLoaded:safe('styleLoaded',()=>m?.isStyleLoaded()),
    moving:safe('moving',()=>m?.isMoving()), center:safe('center',()=>m?.getCenter()), zoom:safe('zoom',()=>m?.getZoom()),
    padding:safe('padding',()=>m?.getPadding()), canvas:safe('canvas',()=>rect(m?.getCanvas())),
    worker:{controlled:!!navigator.serviceWorker?.controller,scriptURL:navigator.serviceWorker?.controller?.scriptURL || null},
    diagnostic:window.__mapStartupQA || null, errors, viewport:{width:innerWidth,height:innerHeight},
    overflow:document.documentElement.scrollWidth>innerWidth};
})()`;

async function recordDocument(requestId) {
  const response = responses.get(requestId);
  if (!response || response.type !== 'Document') return null;
  if (documents.has(response.loaderId)) return documents.get(response.loaderId);
  const body = await send('Network.getResponseBody', { requestId }, 8000);
  const bytes = Buffer.from(body.body, body.base64Encoded ? 'base64' : 'utf8');
  const record = { ...response, bytes:bytes.length, sha256:createHash('sha256').update(bytes).digest('hex'),
    containsExpectedBuild:bytes.toString('utf8').includes(expectedBuildId) };
  documents.set(response.loaderId, record);
  return record;
}
async function actualDocument() {
  if (mainLoader !== navigationLoader) return { error:'The main frame no longer belongs to the pinned navigation', mainLoader, navigationLoader };
  if (documents.has(navigationLoader)) return documents.get(navigationLoader);
  const response = [...responses.values()].find(r => r.type === 'Document' && r.loaderId === navigationLoader);
  try { return response ? await recordDocument(response.requestId) : { error:'Actual Document response missing' }; }
  catch(error) { return {error:error.message}; }
}
async function capture(label) {
  const result = { ...stamp(), label };
  report.captures.push(result);
  try { result.before = await evaluate(facts); } catch(error) { result.beforeError = error.message; }
  try {
    const png = await send('Page.captureScreenshot', { format:'png' }, 10000);
    result.path = resolve(out, label + '.png');
    writeFileSync(result.path, Buffer.from(png.data, 'base64'), {flag:'wx'});
  } catch(error) { result.screenshotError = error.message; }
  try { result.after = await evaluate(facts); } catch(error) { result.afterError = error.message; }
  result.document = await actualDocument();
  const a=result.before, b=result.after;
  result.stable = Boolean(a && b && a.status===b.status && a.key===b.key && a.routeCount===b.routeCount &&
    JSON.stringify(a.metrics)===JSON.stringify(b.metrics) && a.zoom===b.zoom &&
    JSON.stringify(a.center)===JSON.stringify(b.center) && !a.moving && !b.moving);
  return result;
}
async function observe(predicate, stage, until) {
  let latest;
  while (Date.now()<until && Date.now()<deadline) {
    if (interrupt) throw interrupt;
    try {
      latest=await evaluate(facts, Math.min(5000, Math.max(1,until-Date.now())));
      const documentResponse=[...responses.values()].find(r=>r.type==='Document'&&r.loaderId===navigationLoader);
      const currentDocument=mainLoader===navigationLoader && !!documentResponse && completed.has(documentResponse.requestId);
      report.samples.push({...stamp(),stage,status:latest.status,now:latest.now,metrics:latest.metrics,
        routeCount:latest.routeCount,key:latest.key,retry:latest.retry,currentDocument});
      if(currentDocument && predicate(latest)) return {reached:true,latest};
    } catch(error) { report.samples.push({...stamp(),stage,error:error.message}); }
    await delay(Math.min(400,Math.max(0,until-Date.now())));
  }
  return {reached:false,latest};
}
async function releaseInterception(reason) {
  holding=false;
  const queued=[...held.values()];
  const jobs=queued.map(async request => {
    try {
      await send('Fetch.continueRequest',{requestId:request.requestId},2000);
      report.releases.push({...stamp(),requestId:request.requestId,reason,continued:true});
      held.delete(request.requestId);
    } catch(error) { report.releases.push({...stamp(),requestId:request.requestId,reason,error:error.message}); }
  });
  await Promise.all(jobs);
  if(fetchEnabled) {
    try { await send('Fetch.disable',{},3000); fetchEnabled=false; held.clear();
      report.releases.push({...stamp(),reason,fetchDisabled:true}); }
    catch(error) { report.releases.push({...stamp(),reason,disableError:error.message}); }
  }
}
const completeMetrics = s => s.metrics?.length===4 && new Set(s.metrics.map(m=>m.label)).size===4 &&
  s.metrics.every(m=>typeof m.value==='string' && /\d/.test(m.value) && !/unavailable/i.test(m.value));
const realRoute = s => s.postal==='018956' && completeMetrics(s) && s.routeCount===4 &&
  s.routeSourceLoaded===true && s.basemapLoaded===true && s.moving===false && s.status==='ready';
const stop = signal => { interrupt=Error(`Interrupted: ${signal}`);
  for(const waiter of pending.values()) waiter.reject(interrupt); pending.clear(); };
process.on('SIGINT',stop); process.on('SIGTERM',stop);
try {
  report.failureStartedAt=new Date().toISOString();
  const status=await proxyStatus('before-run');
  check('proxy already online B at expected build; no controls issued',status?.active==='B' &&
    status?.offline===false && status?.buildB===expectedBuildId,status);
  chrome=spawn(report.browser.executable,[
    '--headless=new','--no-first-run','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader',
    '--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank',
  ],{cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe']});
  report.browser.pid=chrome.pid;
  chrome.stderr.on('data',chunk=>{report.browser.stderr=(report.browser.stderr+chunk).slice(-16000);});
  chrome.on('error',error=>{report.browser.error=error.message;});
  let tabs;
  const startupLimit=Math.min(deadline-45000,Date.now()+35000);
  while(!tabs && Date.now()<startupLimit) {
    if(interrupt) throw interrupt;
    if(chrome.exitCode!==null || report.browser.error) throw Error('Owned Chrome exited or failed to start');
    const address=/DevTools listening on (ws:\/\/[^\s]+)/.exec(report.browser.stderr)?.[1];
    if(address) {
      const url=new URL(address);
      if(!['127.0.0.1','[::1]','localhost'].includes(url.hostname)) throw Error('Nonlocal debugger');
      url.protocol='http:';url.pathname='/json';
      try {tabs=await(await fetch(url,{signal:AbortSignal.timeout(remaining(2000))})).json();}
      catch(error){report.browser.discoveryError=error.message;}
    }
    if(!tabs) await delay(300);
  }
  const target=tabs?.find(tab=>tab.type==='page');
  if(!target) throw Error('Owned Chrome startup deadline');
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done,reject)=>{
    const timer=setTimeout(()=>reject(Error('CDP connection timeout')),remaining());
    ws.onopen=()=>{clearTimeout(timer);done();};
    ws.onerror=()=>{clearTimeout(timer);reject(Error('CDP connection error'));};
  });
  ws.onmessage=event=>{
    const message=JSON.parse(event.data);
    if(message.id) {const waiter=pending.get(message.id);pending.delete(message.id);
      if(waiter) message.error?waiter.reject(Error(message.error.message)):waiter.done(message.result);return;}
    const p=message.params;
    switch(message.method) {
      case 'Page.frameNavigated':if(!p.frame.parentId)mainLoader=p.frame.loaderId;break;
      case 'Fetch.requestPaused': {
        const request={...stamp(),wallMs:Date.now(),requestId:p.requestId,networkId:p.networkId,
          url:p.request.url,resourceType:p.resourceType,responseStatusCode:p.responseStatusCode,
          held:holding && p.request.url===workerUrl};
        append('pauses',request,200);
        if(request.held) held.set(p.requestId,request);
        else void send('Fetch.continueRequest',{requestId:p.requestId},2000).catch(error=>
          report.releases.push({...stamp(),requestId:p.requestId,error:error.message}));
        break;
      }
      case 'Runtime.exceptionThrown':append('exceptions',p,300);break;
      case 'Runtime.consoleAPICalled':append('console',{type:p.type,args:p.args.map(a=>({value:a.value,description:a.description})),stackTrace:p.stackTrace},500);break;
      case 'Log.entryAdded':append('logs',p.entry,500);break;
      case 'Network.requestWillBeSent':append('network',{event:message.method,requestId:p.requestId,
        loaderId:p.loaderId,type:p.type,url:p.request.url,initiator:p.initiator,timestamp:p.timestamp});break;
      case 'Network.responseReceived': {
        const r=p.response;
        const record={...stamp(),requestId:p.requestId,loaderId:p.loaderId,type:p.type,url:r.url,
          status:r.status,mimeType:r.mimeType,fromServiceWorker:r.fromServiceWorker===true,
          fromDiskCache:r.fromDiskCache===true,headers:r.headers,timing:r.timing};
        responses.set(p.requestId,record);append('network',{event:message.method,...record});break;
      }
      case 'Network.loadingFinished': {
        completed.add(p.requestId);append('network',{event:message.method,...p});
        if(responses.get(p.requestId)?.type==='Document') void recordDocument(p.requestId).catch(error=>
          append('logs',{type:'document-capture',requestId:p.requestId,error:error.message},500));
        break;
      }
      case 'Network.loadingFailed':append('network',{event:message.method,...p});break;
      case 'Network.requestServedFromCache':append('network',{event:message.method,...p});break;
    }
  };
  await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
  await send('Network.enable',{maxTotalBufferSize:16000000,maxResourceBufferSize:3000000});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:diagnostics});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  // A timed-out enable command may still have reached Chrome; cleanup must attempt disable.
  fetchEnabled=true;
  await send('Fetch.enable',{patterns:[{urlPattern:workerUrl,requestStage:'Request'}]});
  const navigation=await send('Page.navigate',{url:selectedUrl},30000);
  navigationLoader=navigation.loaderId;
  check('selected-page navigation started',!!navigationLoader && !navigation.errorText,navigation);
  const failed=await observe(s=>s.status==='error' && s.retry && !s.retry.disabled &&
    s.text.includes('The map did not start.') && s.postal==='018956' && completeMetrics(s) &&
    report.pauses.some(p=>p.held && p.url===workerUrl),'held-worker-timeout',deadline-12000);
  const failure=await capture('startup-timeout-390x844');
  const state=failure.after || failed.latest;
  const initialPause=report.pauses.find(p=>p.held && p.url===workerUrl);
  const errorState=state?.diagnostic?.states.find(s=>s.status==='error');
  const timers=(state?.diagnostic?.timers || []).filter(t=>t.firedAt!==undefined);
  const candidateTimers=timers.filter(t=>initialPause && errorState && t.scheduledWallMs<=initialPause.wallMs &&
    t.firedWallMs>=initialPause.wallMs && t.firedWallMs<=errorState.wallMs && t.firedAt-t.scheduledAt>=29950);
  report.timeoutEvidence={initialPause,errorState,candidateTimers,allTimers:state?.diagnostic?.timers || [],
    pauseToErrorMs:initialPause && errorState ? errorState.wallMs-initialPause.wallMs : null,
    source:'Observed 30000ms timer scheduling/firing, held Fetch request and exact visible startup-timeout copy; no artificial clock advance.'};
  check('actual Document is expected build B',failure.document?.status===200 && failure.document.containsExpectedBuild,failure.document);
  check('worker really intercepted at Request stage and never manually released before error',!!initialPause &&
    initialPause.responseStatusCode===undefined && report.releases.length===0,report.pauses);
  check('startup deadline displays error and usable Retry while keeping four metrics',failed.reached &&
    candidateTimers.length>0 && state?.routeCount===0 && !!failure.path && failure.stable,report.timeoutEvidence);
  report.failureMetrics=state.metrics;
  await proxyStatus('after-timeout');
  report.failureElapsedMs=Date.now()-Date.parse(report.failureStartedAt);
  check('failure attempt bounded at 100 seconds',report.failureElapsedMs<=budgets.failure,report.failureElapsedMs);

  phase='recovery';deadline=Date.now()+budgets.recovery;report.recoveryStartedAt=new Date().toISOString();
  await releaseInterception('allow-real-retry');
  check('Fetch interception disabled before Retry',!fetchEnabled,{remainingHeld:held.size});
  const click=await evaluate(`(() => {const button=[...document.querySelectorAll('button')].find(n=>n.textContent.trim()==='Retry map');
    if(!button || button.disabled)return {error:'Retry map missing or disabled'};
    button.scrollIntoView({block:'nearest',inline:'nearest'});const r=button.getBoundingClientRect();
    const x=r.x+r.width/2,y=r.y+r.height/2;
    return {x,y,text:button.textContent,visible:r.width>0&&r.height>0&&x>=0&&y>=0&&x<innerWidth&&y<innerHeight,
      hit:document.elementFromPoint(x,y)?.closest('button')===button,status:document.querySelector('main')?.dataset.mapStatus};})()`);
  check('actual Retry map button is visible and hit-testable',click.visible && click.hit && click.status==='error',click);
  report.retryClick={...stamp(),...click};
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:click.x,y:click.y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:click.x,y:click.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:click.x,y:click.y,button:'left',clickCount:1});
  const recovered=await observe(s=>realRoute(s) && JSON.stringify(s.metrics)===JSON.stringify(report.failureMetrics),
    'actual-Retry-recovery',deadline-12000);
  const recovery=await capture('retry-recovered-390x844');
  check('Retry restores four CURRENT route features and unchanged metrics',recovered.reached &&
    realRoute(recovery.after || {}) && JSON.stringify(recovery.after?.metrics)===JSON.stringify(report.failureMetrics) &&
    recovery.stable && !!recovery.path,recovery);
  check('recovery remains on the actual expected-B Document',recovery.document?.containsExpectedBuild &&
    recovery.document.loaderId===navigationLoader,recovery.document);
  report.recoveryPassed=true;
  for(const [width,height] of [[1440,950],[390,667],[320,667]]) {
    if(deadline-Date.now()<22000){report.responsive.push({width,height,status:'not-run',reason:'recovery budget reserve'});continue;}
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await delay(600);
    const fit=await observe(realRoute,`responsive-${width}x${height}`,Math.min(deadline-12000,Date.now()+7000));
    const shot=await capture(`retry-recovered-${width}x${height}`);
    const pass=fit.reached && shot.stable && !!shot.path && realRoute(shot.after || {}) &&
      shot.after?.viewport.width===width && shot.after?.viewport.height===height && !shot.after?.overflow &&
      JSON.stringify(shot.after?.metrics)===JSON.stringify(report.failureMetrics) && shot.document?.containsExpectedBuild;
    report.responsive.push({width,height,status:pass?'passed':'failed',capture:shot.label});
    check(`responsive current route ${width}x${height}`,pass,{capture:shot.label},false);
  }
  await proxyStatus('after-recovery');
  report.recoveryElapsedMs=Date.now()-Date.parse(report.recoveryStartedAt);
  check('recovery attempt bounded at 120 seconds',report.recoveryElapsedMs<=budgets.recovery,report.recoveryElapsedMs,false);
  check('no uncaught page exceptions',report.exceptions.length===0,report.exceptions,false);
} catch(error) {
  report.failure=error.stack;console.error(error.stack);
  if(ws?.readyState===1 && deadline-Date.now()>1000) {
    try{await capture(`${phase}-harness-failure`);}catch(e){report.failureCaptureError=e.message;}
  }
} finally {
  phase='cleanup';deadline=Date.now()+budgets.cleanup;
  try{await releaseInterception('finally');}catch(error){report.cleanup.releaseError=error.message;}
  report.cleanup.fetchDisabled=!fetchEnabled;report.cleanup.unresolvedHeldRequestIds=[...held.keys()];
  report.cleanup.proxyModified=false;
  if(chrome) {
    if(ws?.readyState===1)try{await send('Browser.close',{},2000);report.cleanup.browserCloseSent=true;}
    catch(error){report.cleanup.browserCloseError=error.message;}
    let end=Date.now()+remaining(2000);
    while(chrome.exitCode===null && chrome.signalCode===null && Date.now()<end)await delay(100);
    if(chrome.exitCode===null && chrome.signalCode===null){
      report.cleanup.ownedChromeKillSent=chrome.kill();end=Date.now()+remaining(8000);
      while(chrome.exitCode===null && chrome.signalCode===null && Date.now()<end)await delay(100);
    }
    report.cleanup.chromeExited=chrome.exitCode!==null || chrome.signalCode!==null;
    report.cleanup.chromeExitCode=chrome.exitCode;report.cleanup.chromeSignalCode=chrome.signalCode;
  }
  ws?.close();for(const waiter of pending.values())waiter.reject(Error('Diagnostic shutdown'));pending.clear();
  process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);
  report.documents=[...documents.values()];report.finishedAt=new Date().toISOString();
  report.ok=!report.failure && report.checks.every(c=>c.pass) && report.recoveryPassed===true &&
    report.cleanup.fetchDisabled && (!chrome || report.cleanup.chromeExited===true);
  writeFileSync(resolve(out,'browser.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({report:resolve(out,'browser.json'),ok:report.ok,responsive:report.responsive,cleanup:report.cleanup},null,2));
  process.exitCode=report.ok?0:1;
}
