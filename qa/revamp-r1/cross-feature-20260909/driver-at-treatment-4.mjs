import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [label, build] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label || '') || !/^[\w-]+$/.test(build || '')) throw Error('Fresh label/build required');
const out = resolve(root, 'qa/revamp-r1/cross-feature-20260909', label + '-' + Date.now());
mkdirSync(out, { recursive: true });
const profile = mkdtempSync(resolve(root, 'tmp/cross-feature-browser-'));
const origin = 'http://127.0.0.1:4328', delay = ms => new Promise(done => setTimeout(done, ms));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { root, hostname: process.env.COMPUTERNAME, out, profile, build, startedAt: new Date().toISOString(),
  runnerSha256: sha(readFileSync(new URL(import.meta.url))), checks: [], captures: [], samples: [], errors: [], network: [], cleanup: {},
  policy: 'Functional Chromium/SwiftShader; CSS viewport emulation and separately labelled computed-font doubling, not physical-device or representative latency evidence. No API, pipeline, installation or deployment.' };
let chrome, ws, id = 0, stderr = '';
const pending = new Map(), deadline = Date.now() + 720000;
function check(name, pass, detail) { report.checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name); }
function send(method, params = {}) {
  return new Promise((done, reject) => {
    const n = ++id, timer = setTimeout(() => { pending.delete(n); reject(Error('CDP timeout: ' + method)); }, 45000);
    pending.set(n, { done: value => { clearTimeout(timer); done(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
}
async function call(fn, arg) {
  const r = await send('Runtime.evaluate', { expression: '(' + fn.toString() + ')(' + JSON.stringify(arg ?? null) + ')', returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
function facts() {
  const map = window.__shiokRouteMap, debug = window.__shiokRouteDebug;
  const panel = document.querySelector('[data-comparison-panel]'), table = panel?.querySelector('[aria-label="Compared walks"]');
  const rect = n => { const r = n?.getBoundingClientRect(); return r ? { x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right } : null; };
  const focus = document.activeElement;
  let features = []; try { features = map?.queryRenderedFeatures({ layers:['shiokest-route-line'] }) || []; } catch {}
  return { status:document.querySelector('main')?.dataset.mapStatus, viewport:[innerWidth,innerHeight],
    routeKey:debug?.routeKey, featureCount:features.filter(f=>f.properties?.render_key===debug?.routeKey).length,
    moving:map?.isMoving(), tilesLoaded:map?.areTilesLoaded(), basemap:!!map?.getSource('onemap')&&map.isSourceLoaded('onemap'),
    center:map?.getCenter().toArray(), zoom:map?.getZoom(), panel:rect(panel), table:rect(table),
    tableClientHeight:table?.clientHeight, tableScrollHeight:table?.scrollHeight, tableScrollTop:table?.scrollTop,
    panelScrollTop:panel?.scrollTop, panelScrollLeft:panel?.scrollLeft, panelScrollHeight:panel?.scrollHeight, panelClientHeight:panel?.clientHeight,
    heading:rect(panel?.querySelector('thead th:first-child')), finalRow:rect(panel?.querySelector('tbody tr:last-child')),
    search:rect(document.querySelector('form')), logo:rect(document.querySelector('h1')),
    result:rect(document.querySelector('[aria-label="Walk summary"]')?.parentElement),
    about:rect(document.querySelector('footer:not([hidden])')),
    attribution:rect(document.querySelector('a[href="https://www.onemap.gov.sg/"]')?.parentElement),
    overflow:(document.documentElement?.scrollWidth ?? innerWidth)>innerWidth,
    focus:{tag:focus?.tagName,label:focus?.getAttribute('aria-label'),role:focus?.getAttribute('role'),className:focus?.className,rect:rect(focus)},
    canvas:map ? { tabindex:map.getCanvas().tabIndex, label:map.getCanvas().getAttribute('aria-label'), describedBy:map.getCanvas().getAttribute('aria-describedby'), outline:getComputedStyle(map.getCanvas()).outline } : null,
    shared:panel?.textContent.includes('Shared shortlist'), text:panel?.textContent,
    saved:localStorage.getItem('shiok:comparison:v1'), reduced:matchMedia('(prefers-reduced-motion: reduce)').matches, url:location.href };
}
async function waitFor(name, predicate, limit = 90000) {
  let value; const end = Math.min(deadline, Date.now()+limit);
  while (Date.now()<end) { value=await call(facts); report.lastSample={name,value}; if(predicate(value))return value; await delay(300); }
  throw Error('Wait failed: '+name+' '+JSON.stringify(value));
}
async function key(key, code, value, modifiers = 0) {
  await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:value,modifiers,...(key==='Enter'?{text:'\r'}:{})});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:value,modifiers}); await delay(200);
}
async function tabTo(label, reverse = false) {
  const sequence=[];
  for(let n=0;n<45;n++) {
    const f=await call(facts);sequence.push(f.focus);
    if(f.focus.label===label) { report.samples.push({name:'Tab to '+label,reverse,sequence});return; }
    await key('Tab','Tab',9,reverse?8:0);
  }
  throw Error('Native Tab did not reach '+label+' '+JSON.stringify(sequence));
}
const ready = r => r.status === 'ready' && r.basemap && r.featureCount > 0 && !r.moving;
async function settle(name, selected = true) {
  await call(()=>document.fonts.ready.then(()=>true));
  let previous, streak=0, last; const trace=[],started=Date.now(),until=Math.min(deadline,started+60000);
  while(Date.now()<until) {
    const callStarted=Date.now();
    last=await call(facts);
    const signature=JSON.stringify([last.viewport,last.center,last.zoom,last.panel,last.search,last.routeKey]);
    if(last.basemap&&last.tilesLoaded&&!last.moving&&(!selected||ready(last))&&signature===previous)streak++;else streak=0;
    trace.push({elapsedMs:Date.now()-started,callMs:Date.now()-callStarted,signature,streak,basemap:last.basemap,tilesLoaded:last.tilesLoaded,moving:last.moving,status:last.status});
    if(trace.length>12)trace.shift();
    previous=signature;
    if(streak>=5) { report.samples.push({name:'settled '+name,trace});await call(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>done(true))))); return last; }
    await delay(300);
  }
  report.samples.push({name:'unsettled '+name,trace});throw Error('Raster/layout did not settle: '+name+' '+JSON.stringify(last));
}
async function capture(name, selected = true) {
  const before=await settle(name,selected), shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  const bytes=Buffer.from(shot.data,'base64'),path=resolve(out,name+'.png');writeFileSync(path,bytes,{flag:'wx'});
  const after=await call(facts);report.captures.push({name,path,bytes:bytes.length,sha256:sha(bytes),before,after});
  check(name+' settled map',after.basemap&&after.tilesLoaded&&!after.moving&&(!selected||after.featureCount>0),after);
}
async function viewport(width,height,deviceScaleFactor=1) {
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor,mobile:false});
  await waitFor('viewport',r=>r.viewport[0]===width&&r.viewport[1]===height); await settle('resize');
}
async function inspectTable(name) {
  let value=await call(facts);report.samples.push({name,phase:'top',value});
  check(name+' noncollapsed table',value.tableClientHeight>=Math.min(100,value.heading?.height+44),value);
  await call(()=>document.querySelector('[aria-label="Compared walks"]').focus({preventScroll:true}));
  await key('End','End',35,2);await delay(500);
  value=await call(facts);report.samples.push({name,phase:'keyboard-end',value});
  const visible = value.finalRow && value.table && value.panel && value.finalRow.bottom<=Math.min(value.table.bottom,value.panel.bottom)+1
    &&value.finalRow.y>=Math.max(value.table.y,value.panel.y,value.heading?.bottom ?? 0)-1;
  check(name+' final metric reachable by keyboard',visible,value);
  await capture(name+'-end');
  await call(()=>{document.querySelector('[aria-label="Compared walks"]').scrollTo(0,0);document.querySelector('[data-comparison-panel]').scrollTo(0,0);});
}
try {
  const status=await(await fetch(origin+'/__qa/status')).json();report.preview=status;
  if(status.build!==build)throw Error('Unexpected preview build');
  chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],
    {cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,TEMP:profile,TMP:profile}});
  report.chromePid=chrome.pid;chrome.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-12000);});
  let tabs;const started=Date.now();
  while(Date.now()-started<40000&&!tabs){const endpoint=/DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1];if(endpoint){const url=new URL(endpoint);url.protocol='http:';url.pathname='/json';tabs=await(await fetch(url)).json();}else await delay(250);}
  const target=tabs?.find(t=>t.type==='page');if(!target)throw Error('Owned browser did not start');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((done,reject)=>{ws.onopen=done;ws.onerror=reject;});
  ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(p)m.error?p.reject(Error(m.error.message)):p.done(m.result);return;}
    if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params);
    if(m.method==='Network.responseReceived'&&report.network.length<2000){const r=m.params.response;report.network.push({id:m.params.requestId,url:r.url,status:r.status,type:m.params.type});}};
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin+'/?debugMap=1'});
  await waitFor('plain map before postal',r=>r.basemap&&!r.moving,180000);await capture('plain-390x844',false);
  const document=report.network.findLast(r=>r.type==='Document'),body=await send('Network.getResponseBody',{requestId:document.id});
  const html=Buffer.from(body.body,body.base64Encoded?'base64':'utf8');report.document={...document,sha256:sha(html),bytes:html.length};
  check('actual HTML identifies expected build',html.toString('utf8').includes(build));
  report.mapTargets=await call(()=>{const canvas=window.__shiokRouteMap.getCanvas();return [...document.querySelectorAll('[tabindex]')].filter(n=>n===canvas||n.contains(canvas)).map(n=>({tag:n.tagName,tabindex:n.tabIndex,role:n.getAttribute('role'),label:n.getAttribute('aria-label')}));});
  const outer=await call(()=>{const canvas=window.__shiokRouteMap.getCanvas(),outer=canvas.closest('[role="img"]');if(!outer||outer===canvas||outer.tabIndex<0)return false;outer.focus();return true;});
  if(outer){const before=await call(facts);await key('ArrowRight','ArrowRight',39);await delay(500);const after=await call(facts);report.samples.push({name:'outer-map-keyboard',before,after});check('no dead outer keyboard map target',JSON.stringify(before.center)!==JSON.stringify(after.center),{before,after});}
  await call(()=>{document.activeElement.blur();const n=document.querySelector('main');n.setAttribute('tabindex','-1');n.focus();n.removeAttribute('tabindex');});
  report.mapTabSequence=[];
  for(let n=0;n<20;n++){await key('Tab','Tab',9);const f=await call(facts);report.mapTabSequence.push(f.focus);if(f.focus.tag==='CANVAS')break;}
  check('Tab reaches native map canvas',report.mapTabSequence.at(-1)?.tag==='CANVAS',report.mapTabSequence);
  const before=await call(facts);await key('ArrowRight','ArrowRight',39);await delay(500);
  const after=await call(facts);check('canvas keyboard pans',JSON.stringify(before.center)!==JSON.stringify(after.center),{before,after});
  check('keyboard target describes selected evidence',after.canvas?.describedBy==='route-map-summary'&&!!after.canvas?.label,after.canvas);
  await capture('map-keyboard-focus',false);
  check('canvas has visible focus outline',!after.canvas?.outline.includes('none')&&!after.canvas?.outline.includes('0px'),after.canvas);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await call(()=>{const map=window.__shiokRouteMap;window.__qaCamera=[];for(const name of ['fitBounds','easeTo']){const original=map[name];map[name]=function(...args){window.__qaCamera.push({name,options:args[name==='fitBounds'?1:0]});return original.apply(this,args);};}});
  await call(()=>{document.querySelector('#postal-search-input').focus();});
  await send('Input.insertText',{text:'018956'});await key('Enter','Enter',13);
  await waitFor('typed postal current walk',ready,180000);await capture('inspect-reduced-motion');
  const layout=await call(facts);
  check('approved SHIOK/search/result stack and bottom-right About',layout.result&&Math.abs(layout.search.width-layout.result.width)<1&&layout.search.y>layout.logo.y
    &&layout.result.y>=layout.search.bottom&&layout.about.x>layout.viewport[0]/2&&layout.about.y>layout.viewport[1]/2&&!layout.overflow,layout);
  report.camera=await call(()=>window.__qaCamera);
  check('application fit uses reduced motion',report.camera.some(c=>c.name==='fitBounds')&&report.camera.filter(c=>c.name==='fitBounds').every(c=>c.options?.duration===0),report.camera);
  await call(()=>{localStorage.setItem('shiok:comparison:v1',JSON.stringify({version:1,postals:['079908'],category:'bus',activePostal:'079908'}));location.hash='compare=1&postals=018956%2C018990&transit=bus&active=018956';});
  await waitFor('shared comparison',r=>r.shared&&ready(r),180000);
  for(const [width,height] of [[1440,950],[390,844],[390,667],[320,667]]) {
    await viewport(width,height);await capture('shared-'+width+'x'+height);await inspectTable('shared-'+width+'x'+height);
  }
  await viewport(720,475,2);report.zoomModel='720x475 CSS at DPR2 is 200%-equivalent desktop reflow of 1440x950, not browser Ctrl+plus or a physical display.';
  await capture('reflow-720x475-dpr2');await inspectTable('reflow-720x475-dpr2');
  await viewport(320,667);
  report.textStress=await call(()=>{const nodes=[...document.querySelector('[data-comparison-panel]').querySelectorAll('*')];const sizes=nodes.map(n=>[n,parseFloat(getComputedStyle(n).fontSize)]);window.__qaFonts=nodes.map(n=>[n,n.style.fontSize]);for(const [n,size]of sizes)n.style.fontSize=(size*2)+'px';return {method:'Each existing comparison descendant computed font size doubled once; fixed CSS viewport, not native browser zoom.',nodes:sizes.length};});
  await settle('text doubled');await capture('text-double-320x667');await inspectTable('text-double-320x667');
  await call(()=>{for(const [n,size]of window.__qaFonts)n.style.fontSize=size;delete window.__qaFonts;location.hash='compare=1&postals=018956%2C018990%2C079908&transit=bus&active=018956';});
  await waitFor('three homes settled',r=>ready(r)&&r.text?.includes('079908')&&!r.text.includes('Loading'),180000);
  await settle('three homes');
  await tabTo('Compared walks');
  for(let n=0;n<12;n++)await key('ArrowRight','ArrowRight',39);
  const horizontallyScrolled=await call(facts);
  check('keyboard scroll reaches right-hand columns',horizontallyScrolled.panelScrollLeft>0,horizontallyScrolled);
  await call(()=>document.querySelector('[data-comparison-panel]').scrollTop=0);
  await capture('three-right-scroll');
  report.chromeReachability=await call(()=>[...document.querySelectorAll('[data-comparison-panel] button')].filter(n=>!n.closest('table')).map(n=>{
    const r=n.getBoundingClientRect();return {label:n.getAttribute('aria-label')||n.textContent,rect:{x:r.x,y:r.y,width:r.width,height:r.height},hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===n};}));
  check('all eight commands remain reachable at horizontal end',report.chromeReachability.length===8&&report.chromeReachability.every(n=>n.hit),report.chromeReachability);
  await key('End','End',35,2);await delay(500);
  report.rightmostMetric=await call(()=>{
    const panel=document.querySelector('[data-comparison-panel]'),cell=panel.querySelector('tbody tr:last-child td:last-child');
    const r=cell.getBoundingClientRect(),p=panel.getBoundingClientRect(),heading=panel.querySelector('thead th:last-child').getBoundingClientRect(),label=panel.querySelector('tbody tr:last-child th').getBoundingClientRect();
    return {text:cell.textContent,rect:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},panel:{x:p.x+panel.clientLeft,y:p.y+panel.clientTop,right:p.x+panel.clientLeft+panel.clientWidth,bottom:p.y+panel.clientTop+panel.clientHeight},headingBottom:heading.bottom,labelRight:label.right,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===cell};
  });
  const metric=report.rightmostMetric;
  check('rightmost final metric visible beyond sticky identities',metric.hit&&metric.rect.x>=metric.labelRight-1&&metric.rect.right<=metric.panel.right+1&&metric.rect.y>=metric.headingBottom-1&&metric.rect.bottom<=metric.panel.bottom+1,metric);
  await capture('three-right-end');
  await tabTo('Remove postal 079908');
  await key('Enter','Enter',13);await waitFor('focused rightmost removal',r=>r.text&&!r.text.includes('079908')&&r.focus.label==='Remove postal 018990');
  const removal=await call(()=>{const n=document.activeElement,r=n.getBoundingClientRect();return {label:n.getAttribute('aria-label'),hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===n};});
  check('removal focus remains visible and reachable',removal.hit,removal);await capture('removed-rightmost');
  await tabTo('Clear list',true);await key('Enter','Enter',13);
  await waitFor('clear focuses close',r=>r.text?.includes('No homes added.')&&r.focus.label==='Close comparison');
  await key('Escape','Escape',27);await waitFor('Escape leaves comparison',r=>!r.panel);
  check('no uncaught browser errors',report.errors.length===0,report.errors);
  const api=report.network.filter(r=>new URL(r.url).pathname.startsWith('/api/'));check('no API requests',api.length===0,api);
} catch(error) {
  report.failure=error.stack;console.error(error.stack);
  if(ws?.readyState===1)try{const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}),bytes=Buffer.from(shot.data,'base64'),path=resolve(out,'failure.png');writeFileSync(path,bytes,{flag:'wx'});report.failureCapture={path,sha256:sha(bytes)};}catch(e){report.failureCaptureError=e.message;}
} finally {
  if(ws?.readyState===1)try{await send('Browser.close');report.cleanup.closeSent=true;}catch(e){report.cleanup.closeError=e.message;}
  if(chrome){let end=Date.now()+10000;while(chrome.exitCode===null&&chrome.signalCode===null&&Date.now()<end)await delay(100);
    if(chrome.exitCode===null&&chrome.signalCode===null){report.cleanup.killSent=chrome.kill();end=Date.now()+5000;while(chrome.exitCode===null&&chrome.signalCode===null&&Date.now()<end)await delay(100);}report.cleanup.chromeExited=chrome.exitCode!==null||chrome.signalCode!==null;}
  const cleanupCommand="$ErrorActionPreference='Stop'; $profile='"+profile.replaceAll("'","''")+"'; function Owned { @(Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($profile) }) }; $owned=@(Owned); $before=@($owned | Select-Object ProcessId,Name,CommandLine); foreach($p in $owned){ Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }; $until=[DateTime]::UtcNow.AddSeconds(25); do { $remaining=@(Owned | Where-Object { $p=Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; $p -and -not $p.HasExited }); if($remaining.Count -eq 0){break}; Start-Sleep -Milliseconds 500 } while([DateTime]::UtcNow -lt $until); @{before=$before; remaining=@($remaining | Select-Object ProcessId,Name,CommandLine); check='CIM profile identity plus live Get-Process HasExited after bounded exit grace'} | ConvertTo-Json -Depth 4 -Compress";
  const cleanup=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',cleanupCommand],{cwd:root,windowsHide:true,encoding:'utf8',timeout:60000});
  report.cleanup.processAudit={command:cleanupCommand,exitCode:cleanup.status,stdout:cleanup.stdout,stderr:cleanup.stderr,error:cleanup.error?.message};
  try { report.cleanup.verified=cleanup.status===0&&JSON.parse(cleanup.stdout).remaining.length===0; } catch { report.cleanup.verified=false; }
  ws?.close();for(const p of pending.values())p.reject(Error('Acceptance ended'));pending.clear();
  report.stderr=stderr;report.finishedAt=new Date().toISOString();report.ok=!report.failure&&report.checks.every(c=>c.pass)&&report.cleanup.verified;
  writeFileSync(resolve(out,'browser.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({out,ok:report.ok,checks:report.checks.length,captures:report.captures.length,cleanupVerified:report.cleanup.verified}));
  if(report.cleanup.verified)process.exit(report.ok?0:1);
  process.exitCode=1;
}
