import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
if (root !== 'C:\\sgSHIOK2026') throw Error('Wrong working root');
const phase = process.argv[2] || 'acceptance';
const out = resolve(root, 'qa/revamp-r1/repair-' + phase);
mkdirSync(out, { recursive: true });
const profile = resolve(root, 'tmp/revamp-browser-' + Date.now());
const debugPort = 9400 + Math.floor(Math.random() * 500);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader', '--remote-debugging-port=' + debugPort, '--user-data-dir=' + profile, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(r => setTimeout(r, ms));
let ws;
const summary = { phase, startedAt: new Date().toISOString(), url: process.env.SHIOK_BROWSER_QA_URL || 'http://localhost:4318/', captures: [], checks: [], errors: [], resourceErrors: [] };
chrome.on('exit',(code,signal)=>{summary.chromeExit={code,signal};});
try {
  let tabs;
  for (let i = 0; i < 240; i++) {
    try { tabs = await (await fetch('http://127.0.0.1:' + debugPort + '/json')).json(); break; } catch (error) { summary.startupLastError=error.message; await delay(500); }
  }
  if (!tabs) throw Error('Browser startup failed');
  ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0;
  const pending = new Map();
  const events = new Map();
  const eventJobs = new Set();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result); }
    else { for (const fn of events.get(m.method) || []) { const job=Promise.resolve().then(()=>fn(m.params,m.sessionId)).catch(error=>{
      if(error.message.includes('Invalid InterceptionId')) summary.cancelledInterceptions=(summary.cancelledInterceptions||0)+1;
      else {summary.errors.push(error.message);console.error(error);}
    });eventJobs.add(job);job.finally(()=>eventJobs.delete(job)); } }
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const key = ++id; pending.set(key, { resolve, reject }); ws.send(JSON.stringify({ id: key, method, params, sessionId }));
  });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const until = async (expr, timeout = 90000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) { if (await evaluate(expr)) return; await delay(200); }
    summary.lastState=await evaluate(`({text:document.body.innerText.slice(0,2000),input:document.querySelector('#postal-search-input')?.value,url:location.href,moving:window.__shiokRouteMap?.isMoving(),key:window.__shiokRouteDebug?.routeKey,features:window.__shiokRouteMap?.getLayer('shiokest-route-line')?window.__shiokRouteMap.queryRenderedFeatures({layers:['shiokest-route-line']}).map(f=>f.properties.render_key):[]})`);
    throw Error('Timed out: ' + expr);
  };
  let addressSearchRequests=0;
  events.set('Network.requestWillBeSent',[p=>{if(p.request.url.includes('/api/onemap-search')) addressSearchRequests++;}]);
  const check = (name, ok, detail) => { summary.checks.push({name,ok,detail}); console.log(name,ok?'PASS':'FAIL'); if(!ok) process.exitCode=1; };
  events.set('Runtime.exceptionThrown', [p => summary.errors.push(p.exceptionDetails.exception?.description || p.exceptionDetails.text)]);
  events.set('Log.entryAdded', [p => { if(p.entry.level==='error' && summary.resourceErrors.length<30) summary.resourceErrors.push({text:p.entry.text,url:p.entry.url}); }]);
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  // Synthetic network failures must reach interception instead of an installed service worker cache.
  await send('Network.setBypassServiceWorker',{bypass:true});
  summary.serviceWorker='bypassed for deterministic network failure and HTTP cache measurement';
  const viewport = async (width, height) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await delay(600);
  };
  const search = async postal => {
    await evaluate(`document.querySelector('#postal-search-input').focus();document.querySelector('#postal-search-input').select()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', modifiers: 2 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', modifiers: 2 });
    await send('Input.insertText', { text: postal });
    await until(`document.querySelector('#postal-search-input').value===${JSON.stringify(postal.replace(/\D/g,'').slice(0,6))}`,3000);
    await evaluate(`document.querySelector('#postal-search-input').form.requestSubmit()`);
  };
  const capture = async name => {
    // Bracket the screenshot with same-selection, same-camera rendered queries.
    const facts = await evaluate(`(() => {
      const m=window.__shiokRouteMap, d=window.__shiokRouteDebug;
      const rect=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};
      const counts={};const p=d?.padding;const box=p?[[p.left,p.top],[innerWidth-p.right,innerHeight-p.bottom]]:undefined;
      for(const id of ['shiokest-route-line','shortest-route-line']) counts[id]=m?.getLayer(id)?m.queryRenderedFeatures(box,{layers:[id]}).filter(f=>f.properties.render_key===d.routeKey).length:0;
      const source=m?.getSource('shiokest-route');const features=source?m.querySourceFeatures('shiokest-route'):[];
      return {time:performance.now(),width:innerWidth,height:innerHeight,counts,debug:d,url:location.href,
        camera:m?{center:m.getCenter(),zoom:m.getZoom(),padding:m.getPadding(),moving:m.isMoving(),loaded:m.isSourceLoaded('shiokest-route'),sourceCount:features.length,
          sample:features.slice(0,1).map(f=>({properties:f.properties,projected:f.geometry.coordinates.map(c=>m.project(c))}))}:null,
        identity:rect('[class*=identityRow]'),search:rect('#postal-search-input'),panel:rect('aside'),
        metrics:[...document.querySelectorAll('[aria-label="Walk summary"] [class*=walkMetrics] > div')].map(e=>({text:e.innerText,bottom:e.getBoundingClientRect().bottom})),attribution:rect('[data-map-overlay="bottom"]'),status:document.querySelector('main')?.dataset.mapStatus,
        overflow:document.documentElement.scrollWidth>innerWidth,text:document.body.innerText.slice(0,1500)};
    })()`);
    writeFileSync(resolve(out, name + '.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
    const after = await evaluate(`(()=>{const m=window.__shiokRouteMap,d=window.__shiokRouteDebug,p=d?.padding;const box=p?[[p.left,p.top],[innerWidth-p.right,innerHeight-p.bottom]]:undefined;return {time:performance.now(),width:innerWidth,height:innerHeight,key:d?.routeKey,center:m?.getCenter(),zoom:m?.getZoom(),count:m?.getLayer('shiokest-route-line')?m.queryRenderedFeatures(box,{layers:['shiokest-route-line']}).filter(f=>f.properties.render_key===d.routeKey).length:0}})()`);
    facts.screenshotEnd=after;
    facts.sameCaptureState=after.width===facts.width&&after.height===facts.height&&after.key===facts.debug?.routeKey&&after.count===facts.counts['shiokest-route-line']&&JSON.stringify(after.center)===JSON.stringify(facts.camera?.center)&&after.zoom===facts.camera?.zoom;
    summary.captures.push({ name, ...facts });
    console.log(name, JSON.stringify({ counts: facts.counts, overflow: facts.overflow, search: facts.search }));
  };
  const ready = async (timeout=90000) => until(`window.__shiokRouteMap && ['ready','partial'].includes(document.querySelector('main')?.dataset.mapStatus) && !window.__shiokRouteMap.isMoving() && window.__shiokRouteMap.getLayer('shiokest-route-line') && window.__shiokRouteMap.isSourceLoaded('shiokest-route') && window.__shiokRouteMap.queryRenderedFeatures({layers:['shiokest-route-line']}).some(f=>f.properties.render_key===window.__shiokRouteDebug.routeKey)`,timeout);
  const fresh = async (query='') => {
    await send('Page.navigate',{url:summary.url+query});
    await until(`Object.keys(document.querySelector('#postal-search-input') || {}).some(k=>k.startsWith('__reactProps'))`);
  };
  const clickText = text => evaluate(`([...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)}) || (()=>{throw Error('Missing button')})()).click()`);
  const validateSearch=async()=>{
    await search('000000');await until(`document.querySelector('[data-postal]')?.dataset.postal==='000000'`);check('S04 unavailable postal',await evaluate(`document.querySelector('[aria-label="Walk summary"]')?.innerText.includes('No shelter-map walk is published')`));
    await fresh('?postal=invalid&stop=unknown');await delay(500);check('S07 malformed URL safe',await evaluate(`!document.querySelector('[data-postal]')`));
    await evaluate(`document.querySelector('#postal-search-input').focus();document.querySelector('#postal-search-input').select()`);await send('Input.insertText',{text:'123456789'});
    check('S02 paste bounded to six digits',await evaluate(`document.querySelector('#postal-search-input').value==='123456'`));
    await search('abc12');check('S02 numeric input',await evaluate(`document.querySelector('#postal-search-input').value==='12'`));
    await evaluate(`document.querySelector('#postal-search-input').value=''`);await evaluate(`document.querySelector('#postal-search-input').form.requestSubmit()`);
    check('S03 accessible validation',await evaluate(`document.body.innerText.includes('6-digit Singapore postal code') || !document.querySelector('#postal-search-input').checkValidity()`));
    await fresh();await evaluate(`document.querySelector('#postal-search-input').focus()`);await send('Input.insertText',{text:'018956'});
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    check('S08 keyboard reaches search button',await evaluate(`document.activeElement.id==='postal-search-button'`));
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await ready();
    check('S02 no address API search',addressSearchRequests===0);
    check('S01/S08 keyboard search retains leading zero',await evaluate(`document.querySelector('[data-postal]')?.dataset.postal==='018956' && !document.querySelector('.maplibregl-ctrl-zoom-in')`));
  };
  if(phase.startsWith('input')) {
    await viewport(390,667);await fresh();await validateSearch();
  } else if(phase.startsWith('tiles')) {
    let failing=true;const successfulTiles=new Set();let completedTiles=0;
    events.set('Network.responseReceived',[p=>{if(p.response.url.includes('/maps/tiles/')&&p.response.status===200)successfulTiles.add(p.requestId);}]);
    events.set('Network.loadingFinished',[p=>{if(successfulTiles.has(p.requestId))completedTiles++;}]);
    events.set('Fetch.requestPaused',[p=>send(failing?'Fetch.failRequest':'Fetch.continueRequest',failing?{requestId:p.requestId,errorReason:'ConnectionFailed'}:{requestId:p.requestId})]);
    await send('Network.setCacheDisabled',{cacheDisabled:true});
    await send('Fetch.enable',{patterns:[{urlPattern:'*onemap.gov.sg/maps/tiles/*'}]});
    await viewport(390,667);await fresh('?postal=018956');await ready();
    await until(`document.querySelector('main').dataset.mapStatus==='partial'`);await capture('tiles-failed');
    check('M04 tile failure preserves selected route',summary.captures.at(-1).counts['shiokest-route-line']>0);
    failing=false;await clickText('Retry map');
    for(let i=0;i<900&&!completedTiles;i++)await delay(100);
    check('M07 retry completes successful raster responses',completedTiles>0,{completedTiles});
    await until(`window.__shiokRouteMap.isSourceLoaded('onemap') && document.querySelector('main').dataset.mapStatus==='ready'`,90000);
    await ready();await capture('tiles-restored');
    check('M07/M13 restored raster capture matches selected route',summary.captures.at(-1).sameCaptureState&&summary.captures.at(-1).counts['shiokest-route-line']>0,{completedTiles});
    events.delete('Fetch.requestPaused');await Promise.all([...eventJobs]);await send('Fetch.disable');
  } else if(phase.startsWith('style')) {
    await viewport(1440,950);await fresh('?postal=018956');await ready();
    await clickText('Walk details');await delay(400);await evaluate(`document.querySelector('#walk-details').scrollTop=99999`);
    await until(`!!document.querySelector('button[aria-label^="Focus on map for"]')`);await evaluate(`document.querySelector('button[aria-label^="Focus on map for"]').click()`);await ready();
    check('W10 starts with rendered focused gap',await evaluate(`window.__shiokRouteMap.queryRenderedFeatures({layers:['active-exposure-gap-ring']}).length>0`));
    const workers=[];
    events.set('Target.attachedToTarget',[async p=>{
      if(p.targetInfo.type==='worker') {await send('Debugger.enable',{},p.sessionId);workers.push(p.sessionId);}
    }]);
    await send('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:false,flatten:true});
    for(let i=0;i<100&&!workers.length;i++)await delay(100);
    if(!workers.length)throw Error('No map worker debugger session');
    const oldKey=await evaluate(`window.__shiokRouteDebug.routeKey`);
    const point=await evaluate(`(()=>{const m=window.__shiokRouteMap;const f=m.queryRenderedFeatures({layers:['mrt-exit-dot']}).find(f=>f.properties.id==='mrt:21678');if(!f)return null;const p=m.project(f.geometry.coordinates);return {x:p.x,y:p.y}})()`);
    if(!point)throw Error('Published candidate is not rendered');
    for(const session of workers)await send('Debugger.pause',{},session);
    try {
      await send('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',clickCount:1});
      await until(`window.__shiokRouteDebug.routeKey!==${JSON.stringify(oldKey)}`,10000);
      const state=await evaluate(`(()=>{const d=window.__shiokRouteDebug,m=window.__shiokRouteMap,features=m.queryRenderedFeatures({layers:['shiokest-route-line']});return {status:document.querySelector('main').dataset.mapStatus,key:d.routeKey,old:features.filter(f=>f.properties.render_key===${JSON.stringify(oldKey)}).length,current:features.filter(f=>f.properties.render_key===d.routeKey).length}})()`);
      check('M05 rendered old route cannot make new selection ready',state.status!=='ready'&&state.old>0&&state.current===0,state);
    } finally {for(const session of workers)await send('Debugger.resume',{},session);}
    await ready();await capture('candidate-rendered');
    check('M05 current worker result settles ready',summary.captures.at(-1).sameCaptureState&&summary.captures.at(-1).counts['shiokest-route-line']>0);
    check('W10 destination change clears old focused gap',await evaluate(`window.__shiokRouteDebug.sourceFeatureCounts.activeGap===0 && window.__shiokRouteMap.queryRenderedFeatures({layers:['active-exposure-gap-ring']}).length===0`));
    check('W13 selected candidate distance is published 110 m',await evaluate(`document.querySelector('[aria-label="Walk summary"]').innerText.includes('110 m')`));
  } else if(phase.startsWith('performance')) {
    summary.profile={server:'Local Next production server; existing immutable local data; direct next build bypasses data helper',browser:'Chrome headless SwiftShader',latencyMs:80,downloadBytesPerSecond:1250000,uploadBytesPerSecond:625000,cpuSlowdown:1,start:'navigation to shared postal URL',end:'current selected route rendered in usable viewport',serviceWorker:'bypassed',requestScope:'CDP page-target observed requests (including cache); completed response encoded bytes through route visibility; worker-internal transfers may be excluded',budgets:'No numerical budget adopted'};
    await send('Network.setBypassServiceWorker',{bypass:true});
    await send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:1250000,uploadThroughput:625000,connectionType:'cellular4g'});
    await send('Emulation.setCPUThrottlingRate',{rate:1});
    summary.measurements=[];
    for(const [w,h] of [[1440,950],[390,844]]) {
      await viewport(w,h);
      for(const cache of ['cold','warm']) {
        if(cache==='cold') await send('Network.clearBrowserCache');
        const requests=new Map();let bytes=0;
        events.set('Network.requestWillBeSent',[(p,session)=>requests.set((session||'page')+p.requestId,{url:p.request.url,type:p.type})]);
        events.set('Network.loadingFinished',[(p,session)=>{if(requests.has((session||'page')+p.requestId))bytes+=p.encodedDataLength;}]);
        const start=Date.now();await fresh('?postal=018956');
        await until(`document.querySelector('[aria-label="Walk summary"]')?.textContent.includes('81 m')`,180000);
        const textMs=Date.now()-start;console.log('text available',w,cache,textMs);await ready(180000);
        const routeMs=Date.now()-start;
        const counts={};for(const r of requests.values()){const kind=r.url.includes('/data/')?'data':r.url.includes('/maps/tiles/')?'tiles':r.url.includes('/maplibre/')?'worker':'app';counts[kind]=(counts[kind]||0)+1;}
        summary.measurements.push({w,h,cache,textMs,routeMs,requests:requests.size,transferBytes:bytes,requestClasses:counts});
        await capture(`${cache}-${w}x${h}`);
        check('M12/M13 measurement capture '+cache+' '+w,summary.captures.at(-1).sameCaptureState&&summary.captures.at(-1).counts['shiokest-route-line']>0);
        console.log('measurement',JSON.stringify(summary.measurements.at(-1)));
      }
    }
  } else {
  await viewport(1440,950);
  await send('Page.navigate', { url: summary.url });
  await until(`Object.keys(document.querySelector('#postal-search-input') || {}).some(k=>k.startsWith('__reactProps'))`);
  await delay(1500);
  await capture('empty-desktop');
  await search('018956');
  console.log('after search',await evaluate(`({value:document.querySelector('#postal-search-input').value,text:document.body.innerText.slice(0,500)})`));
  try { await until(`window.__shiokRouteDebug?.routeCount > 0`); } catch(e) { console.log(await evaluate(`document.body.innerText`)); throw e; }
  await delay(2500);
  for (const [w,h] of (phase.startsWith('preview')?[[390,667]]:[[1440,950],[390,844],[390,667],[320,667]])) {
    await viewport(w,h);
    try { await ready(); } catch(e) { summary.errors.push(e.message); }
    await capture('loaded-' + w + 'x' + h);
    const c=summary.captures.at(-1);
    check('M01/M02/M13/M15 '+w+'x'+h,c.counts['shiokest-route-line']>0&&c.sameCaptureState&&!c.overflow&&c.search.y>=(w<=700?c.identity.bottom:0)&&c.metrics.length===4&&c.metrics.every(m=>m.bottom<=c.panel.bottom)&&c.panel.bottom<c.attribution.y,c.counts);
  }
  if(phase.startsWith('acceptance') || phase.startsWith('preview')) {
    if(!phase.startsWith('preview')) {
    await viewport(390,667);await ready();
    await clickText('Walk details');await delay(600);await ready();await capture('sheet-expanded');
    check('M03 expanded sheet scrolls',await evaluate(`(()=>{const e=document.querySelector('#walk-details');return e.scrollHeight>e.clientHeight&&e.clientHeight>0})()`));
    await evaluate(`document.querySelector('#walk-details').scrollTop=99999`);
    await until(`!!document.querySelector('button[aria-label^="Focus on map for"]')`);
    await evaluate(`document.querySelector('button[aria-label^="Focus on map for"]').click()`);await delay(700);await ready();await capture('gap-focused');
    check('W09 gap focus visible and sheet collapses',await evaluate(`window.__shiokRouteMap.queryRenderedFeatures({layers:['active-exposure-gap-ring']}).length>0 && document.querySelector('[aria-controls="walk-details"]').getAttribute('aria-expanded')==='false'`));
    await clickText('Walk details');await delay(500);await clickText('Collapse walk details');await delay(500);await ready();
    const center=()=>evaluate(`JSON.stringify(window.__shiokRouteMap.getCenter())`);
    const before=await center();
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:200,y:230,button:'left',clickCount:1});
    for(let i=1;i<=5;i++) {await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:200+i*12,y:230+i*5,buttons:1});await delay(30);}
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:260,y:255,button:'left',clickCount:1});await delay(1000);
    const dragged=await center();await delay(1200);check('M10 drag without delayed snap-back',before!==dragged&&dragged===await center());
    let zoom=await evaluate(`window.__shiokRouteMap.getZoom()`);
    await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:180,y:230,deltaY:-140,deltaX:0});await delay(800);
    check('M10 wheel zoom',await evaluate(`window.__shiokRouteMap.getZoom()`)>zoom);
    await evaluate(`document.querySelector('.maplibregl-canvas').focus()`);
    const keyCenter=await center();await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});await delay(500);
    check('M14 keyboard map pan',keyCenter!==await center());
    await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
    zoom=await evaluate(`window.__shiokRouteMap.getZoom()`);
    await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:130,y:230,id:1},{x:230,y:230,id:2}]});
    for(let i=1;i<=5;i++){await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:130-i*6,y:230,id:1},{x:230+i*6,y:230,id:2}]});await delay(30);}
    await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(600);
    check('M10 pinch zoom',await evaluate(`window.__shiokRouteMap.getZoom()`)>zoom);
    await send('Emulation.setTouchEmulationEnabled',{enabled:false});
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await clickText('Walk details');await delay(300);check('M14 reduced-motion layout fit',await evaluate(`!window.__shiokRouteMap.isMoving()`));await clickText('Collapse walk details');
    await fresh('?postal=018956&stop=unknown');await ready();check('S06/S07 shared postal and unknown stop',await evaluate(`document.querySelector('[data-postal]')?.dataset.postal==='018956' && !!window.__shiokRouteMap`));
    }
    await send('Network.setCacheDisabled',{cacheDisabled:true});
    let mode='none',held=[],previewHeld=[],geometryHeld=[];
    events.set('Fetch.requestPaused',[async p=>{
      const url=p.request.url;
      if(mode==='race'&&url.includes('/scores/DOWNTOWN_CORE_PART_001.json')) {held.push(p.requestId);return;}
      if(mode==='geometry-hold'&&url.includes('/geom/h3/')) {geometryHeld.push(p.requestId);return;}
      if(url.includes('/api/onemap-route')) {
        if(mode==='preview-hold') {previewHeld.push(p.requestId);return;}
        await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:503,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from('{"ok":false}').toString('base64')});return;
      }
      if(mode==='geometry'&&url.includes('/geom/h3/')) {await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:503,body:''});return;}
      if(mode==='tiles'&&url.includes('/maps/tiles/')) {await send('Fetch.failRequest',{requestId:p.requestId,errorReason:'ConnectionFailed'});return;}
      await send('Fetch.continueRequest',{requestId:p.requestId});
    }]);
    await send('Fetch.enable',{patterns:[{urlPattern:'*/data/*'},{urlPattern:'*onemap.gov.sg/maps/tiles/*'},{urlPattern:'*/api/onemap-route*'}]});
    if(!phase.startsWith('preview')) {
    mode='race';
    await fresh();await search('018956');
    for(let i=0;i<100&&!held.length;i++)await delay(100);
    check('S05 race A held',held.length>0);
    await search('238801');console.log('B submitted',await evaluate(`document.querySelector('#postal-search-input').value`));await until(`document.querySelector('[data-postal]')?.dataset.postal==='238801'`);await ready();
    mode='none';for(const requestId of held)await send('Fetch.fulfillRequest',{requestId,responseCode:503,body:''});
    await delay(700);await capture('stale-A-failure-B-success');
    check('S05/M11 stale A failure cannot overwrite B',await evaluate(`document.querySelector('[data-postal]')?.dataset.postal==='238801' && location.search.includes('postal=238801') && !document.body.innerText.includes('fetch failed') && window.__shiokRouteDebug.summary.includes('238801')`));
    mode='geometry';await fresh('?postal=018956');
    await until(`document.body.innerText.includes('Retry geometry')`);
    check('M06 geometry error keeps record',await evaluate(`document.querySelector('[data-postal]')?.innerText.includes('81 m')`));
    await capture('geometry-failed');mode='none';await clickText('Retry geometry');await ready();check('M07 geometry recovery without reload',await evaluate(`!document.body.innerText.includes('Retry geometry')`));
    mode='tiles';await fresh('?postal=018956');await ready();await until(`document.querySelector('main')?.dataset.mapStatus==='partial'`);
    await capture('tiles-partial');check('M04 useful partial map',summary.captures.at(-1).counts['shiokest-route-line']>0);
    mode='none';await clickText('Retry map');await until(`document.querySelector('main')?.dataset.mapStatus==='ready'`);await ready();await capture('tiles-recovered');
    check('M07 tile retry recovers',true);
    }
    await evaluate(`void window.__shiokRouteMap.fire('error',{error:new Error('Synthetic non-tile renderer failure')})`);
    await until(`document.querySelector('main')?.dataset.mapStatus==='error'`);
    check('M04 non-tile errors are not suppressed',await evaluate(`document.querySelector('[data-postal]')?.innerText.includes('81 m')`));
    await clickText('Retry map');await ready();
    const chooseStop=async()=>{
      const point=await evaluate(`(()=>{const m=window.__shiokRouteMap,p=window.__shiokRouteDebug.padding;const f=m.queryRenderedFeatures([[p.left,p.top],[innerWidth-p.right,innerHeight-p.bottom]],{layers:['mrt-exit-dot']}).find(f=>!['mrt:21624','mrt:21678'].includes(f.properties.id));if(!f)return null;const c=m.project(f.geometry.coordinates);return {x:c.x,y:c.y,id:f.properties.id}})()`);
      if(!point)throw Error('No rendered alternate exit for preview test');
      await send('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',clickCount:1});
      return point.id;
    };
    await viewport(1440,950);await ready();
    mode='preview';const chosenStop=await chooseStop();await until(`document.body.innerText.includes('Retry preview')`);
    check('W12 failed stop preview preserves published evidence',await evaluate(`document.querySelector('[data-postal]')?.innerText.includes('81 m') && document.body.innerText.includes('Published walk shown')`));
    await capture('preview-failed');
    await fresh('?postal=018956&stop='+encodeURIComponent(chosenStop));await ready();await until(`document.body.innerText.includes('Retry preview')`);
    check('S06 valid shared stop restored',await evaluate(`new URLSearchParams(location.search).get('stop')===${JSON.stringify(chosenStop)}`));
    await clickText('Keep published walk');await ready();
    mode='preview-hold';await chooseStop();for(let i=0;i<100&&!previewHeld.length;i++)await delay(100);
    check('W12 preview request held',previewHeld.length>0);
    await search('238801');await until(`document.querySelector('[data-postal]')?.dataset.postal==='238801'`);await ready();
    mode='none';for(const requestId of previewHeld)await send('Fetch.fulfillRequest',{requestId,responseCode:503,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from('{"ok":false}').toString('base64')});await delay(500);
    check('W10/W12 stale preview failure after B success',await evaluate(`document.querySelector('[data-postal]')?.dataset.postal==='238801' && !document.body.innerText.includes('Retry preview') && window.__shiokRouteDebug.sourceFeatureCounts.activeGap===0`),{chosenStop});
    mode='geometry-hold';await fresh('?postal=018956');await until(`document.querySelector('[data-postal]')?.innerText.includes('81 m')`);
    check('M06 delayed geometry publishes text independently',geometryHeld.length>0 && await evaluate(`!window.__shiokRouteMap`));await capture('geometry-delayed');
    mode='none';for(const requestId of geometryHeld)await send('Fetch.continueRequest',{requestId});await ready();check('M06 delayed geometry eventually renders',true);
    events.delete('Fetch.requestPaused');await Promise.all([...eventJobs]);await send('Fetch.disable');
    await validateSearch();
  }
  }
} catch (error) { summary.failure = error.message; process.exitCode = 1; console.error(error); }
finally {
  writeFileSync(resolve(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  ws?.close(); chrome.kill();
  // Bound shutdown even if a CDP socket or HTTP keep-alive survives Chrome.
  setTimeout(()=>process.exit(process.exitCode || 0),1000).unref();
}
