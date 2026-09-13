import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { freemem } from 'node:os';
import { startReleaseServer } from './release-server-v2.mjs';
import { transientNavigationContext, preservesSelectionUrl, reloadedDocument } from './navigation-proof.mjs';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const dir=resolve(root,'qa/revamp-r1/legacy-reload-20260913'),out=process.argv[2],profile=process.argv[3];
assert.equal(dirname(out),dir);assert.equal(dirname(profile),resolve(root,'tmp'));
const control=JSON.parse(readFileSync(resolve(out,'controller.json')));assert.equal(control.pid,process.ppid);assert.equal(control.profile,profile);
const started=Date.now(),workEnd=started+180000,totalEnd=started+240000;
const sha=b=>createHash('sha256').update(b).digest('hex'),json=p=>JSON.parse(readFileSync(p));
const report={root,hostname:process.env.COMPUTERNAME,startedAt:new Date().toISOString(),checks:[],events:[],captures:[],errors:[],phase:'setup',scope:'Actual captured old frontend/controller to current local frontend on the same origin/profile with one ordinary Reload. No cache clearing, forced worker update, bypass or postal reentry. Not deployment, performance, all-route or physical-device acceptance.'};
writeFileSync(resolve(out,'runner.mjs'),readFileSync(new URL(import.meta.url)),{flag:'wx'});
let server,chrome,chromeClosed,ws,session,pageTarget,stderr='',sequence=0,closing=false,watchdog,currentContext;
const pending=new Map(),backgrounds=new Set();
const remaining=()=>Math.max(0,(closing?totalEnd:workEnd)-Date.now());
const delay=ms=>new Promise(done=>setTimeout(done,Math.min(ms,remaining())));
function check(name,ok,detail){report.checks.push({name,pass:!!ok,detail});if(!ok)throw Error(name);}
function send(method,params={},sid=session,timeout=10000){return new Promise((done,reject)=>{
  if(!remaining()){reject(Error('Browser work deadline'));return;}
  const id=++sequence,t=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},Math.min(timeout,remaining()));
  pending.set(id,(value,error)=>{clearTimeout(t);pending.delete(id);error?reject(Error(error.message)):done(value);});
  try{ws.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));}catch(error){clearTimeout(t);pending.delete(id);reject(error);}
});}
function background(task){backgrounds.add(task);task.catch(error=>report.errors.push({phase:report.phase,message:error.message})).finally(()=>backgrounds.delete(task));}
async function evaluate(fn,arg=null){const r=await send('Runtime.evaluate',{expression:'('+fn.toString()+')('+JSON.stringify(arg)+')',returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;}
async function until(name,get,accept,limit){const end=Math.min(workEnd,Date.now()+limit);while(Date.now()<end){let value;try{value=await get();}catch(error){if(report.phase!=='reload'||ws?.readyState!==1||!transientNavigationContext(error))throw error;(report.navigationContextRetries??=[]).push({name,message:error.message,atMs:Date.now()-started});await delay(200);continue;}report.last={name,value};if(accept(value))return value;await delay(200);}throw Error(name+' timeout');}
async function click(selector){const r=await evaluate(selector=>{const e=document.querySelector(selector),r=e?.getBoundingClientRect(),x=r?.x+r?.width/2,y=r?.y+r?.height/2;return r&&{x,y,width:r.width,height:r.height,hit:e.contains(document.elementFromPoint(x,y)),disabled:e.disabled};},selector);check('native clickable '+selector,r?.hit&&!r.disabled&&r.width>0&&r.height>0,r);for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:r.x,y:r.y,button:'left',clickCount:1});}
function documentFacts(){return{url:location.href,timeOrigin:performance.timeOrigin,title:document.title,input:document.querySelector('#postal-search-input')?.value,text:document.body.innerText.slice(0,16000),canvasCount:document.querySelectorAll('canvas').length,ready:document.readyState,controller:navigator.serviceWorker.controller?{scriptURL:navigator.serviceWorker.controller.scriptURL,state:navigator.serviceWorker.controller.state}:null};}
function controlledVersion(exclude){return report.events.filter(e=>e.method==='ServiceWorker.workerVersionUpdated').reverse().flatMap(e=>e.params.versions).find(v=>v.versionId!==exclude&&v.status==='activated'&&v.controlledClients?.includes(pageTarget));}
function routeFacts(){const m=window.__shiokRouteMap,d=window.__shiokRouteDebug,active=d?.mode==='shortest'?'shortest':'shiokest';let features=[];try{features=m?.queryRenderedFeatures({layers:[active+'-route-line']})??[];}catch{}return{status:document.querySelector('main')?.dataset.mapStatus,routeKey:d?.routeKey,count:features.filter(f=>f.properties?.render_key===d?.routeKey).length,keys:[...new Set(features.map(f=>f.properties?.render_key))],basemap:!!m?.getSource('onemap')&&m.isSourceLoaded('onemap'),tiles:m?.areTilesLoaded(),moving:m?.isMoving(),geometry:m?.getStyle().sources[active+'-route']?.data?.features?.map(f=>f.geometry),url:location.href};}
const ready=f=>f.status==='ready'&&f.count>0&&f.keys.length===1&&f.keys[0]===f.routeKey&&f.basemap&&f.tiles&&!f.moving;
async function shot(name,current=false){const before=await evaluate(current?routeFacts:documentFacts);const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const bytes=Buffer.from(r.data,'base64');writeFileSync(resolve(out,name+'.png'),bytes,{flag:'wx'});const after=await evaluate(current?routeFacts:documentFacts);report.captures.push({name,bytes:bytes.length,sha256:sha(bytes),before,after});if(current)check(name+' selected route stable',ready(before)&&ready(after)&&before.routeKey===after.routeKey&&before.url===after.url&&JSON.stringify(before.geometry)===JSON.stringify(after.geometry),{before,after});}
async function cacheSnapshot(){return evaluate(async()=>{
  const entries=[];let total=0;
  for(const name of (await caches.keys()).sort())for(const key of await(await caches.open(name)).keys()){
    if(entries.length>=200)throw Error('Cache snapshot entry bound');
    const response=await(await caches.open(name)).match(key),reader=response.body?.getReader(),parts=[];let size=0;
    if(reader)for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;total+=value.length;if(size>8*1024*1024||total>32*1024*1024){await reader.cancel();throw Error('Cache snapshot byte bound');}parts.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');entries.push({cache:name,url:key.url,bytes:size,sha256:hash});
  }
  return{entries,totalBytes:total,local:Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])),session:Object.fromEntries(Object.keys(sessionStorage).sort().map(k=>[k,sessionStorage.getItem(k)]))};
});}
const anchors=()=>Object.values(json(resolve(root,'web/lib/__tests__/fixtures/published-walks.provenance.json')).sources).map(s=>{const b=readFileSync(resolve(root,s.path));assert.equal(sha(b),s.sha256,'STOP input mismatch '+s.path);return{path:s.path,sha256:sha(b),bytes:b.length};});
try{
  report.availableMiB=freemem()/1048576;check('host memory gate',report.availableMiB>=1024,report.availableMiB);report.anchorsBefore=anchors();
  const build=json(resolve(root,'qa/revamp-r1/selection-recovery-20260913/build-2/build.json'));
  for(const s of build.sources)assert.equal(sha(readFileSync(resolve(root,s.path))),s.sha256,s.path);
  report.preview=await(await fetch('http://127.0.0.1:4420/__qa/status',{signal:AbortSignal.timeout(5000)})).json();assert.equal(report.preview.buildId,build.buildId);
  const capture=resolve(root,'qa/revamp-r1/production-runtime-20260913/capture-1789294685168');
  const html=readFileSync(resolve(capture,'index.html')),htmlReceipt=json(resolve(capture,'response.json')),oldSummary=json(resolve(root,'qa/revamp-r1/production-runtime-20260913/summary.json'));
  assert.equal(sha(html),oldSummary.html.sha256);report.oldBuild=oldSummary.html.buildId;report.oldHtmlSha256=sha(html);
  const assets=new Map();for(const p of ['initial-assets.json','dependencies.json','dependencies-reviewed.json'])for(const r of json(resolve(capture,p)).responses.filter(r=>r.file)){const bytes=readFileSync(resolve(capture,r.file));assert.equal(sha(bytes),r.sha256,'STOP captured bytes mismatch');assets.set(new URL(r.url).pathname,{bytes,headers:r.headers});}
  assert.equal(assets.size,24);report.oldWorkerSha256=sha(assets.get('/sw.js').bytes);report.currentWorkerSha256=sha(readFileSync(resolve(root,'web/public/sw.js')));
  server=await startReleaseServer({html,htmlHeaders:htmlReceipt.headers,assets,currentOrigin:'http://127.0.0.1:4420',wallMs:170000});report.origin=server.origin;
  chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--window-size=1440,950','--force-device-scale-factor=1','--no-first-run','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-networking','--disable-component-update','--disable-sync','--disable-quic','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,TEMP:profile,TMP:profile}});
  report.chromePid=chrome.pid;chromeClosed=new Promise(done=>{chrome.once('error',error=>{report.chromeError=error.message;done({error:error.message});});chrome.once('close',(code,signal)=>done({code,signal}));});
  chrome.stderr.on('data',b=>{if(stderr.length<65536)stderr+=b.toString();});
  watchdog=setTimeout(()=>{report.workDeadlineFired=true;chrome.kill();void server.close();ws?.close();},remaining());
  const endpoint=await until('Chrome endpoint',()=>/DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1],Boolean,30000);
  ws=new WebSocket(endpoint);await new Promise((done,reject)=>{const t=setTimeout(()=>reject(Error('CDP open timeout')),10000);ws.onopen=()=>{clearTimeout(t);done();};ws.onerror=()=>{clearTimeout(t);reject(Error('CDP open'));};});
  ws.onmessage=event=>{const m=JSON.parse(event.data),p=m.params;if(m.id){pending.get(m.id)?.(m.result,m.error);return;}
    if(report.events.length<12000)report.events.push({atMs:Date.now()-started,phase:report.phase,sessionId:m.sessionId,method:m.method,params:p});else report.droppedEvents=(report.droppedEvents??0)+1;
    if(m.sessionId===session&&m.method==='Runtime.executionContextCreated'&&p.context.auxData?.isDefault)currentContext=p.context.id;
    if(m.sessionId===session&&m.method==='Runtime.executionContextsCleared')currentContext=null;
  };
  ws.onclose=()=>{for(const done of [...pending.values()])done(undefined,{message:'CDP closed'});};
  const targets=await send('Target.getTargets',{},'');pageTarget=targets.targetInfos.find(t=>t.type==='page'&&t.url==='about:blank').targetId;
  session=(await send('Target.attachToTarget',{targetId:pageTarget,flatten:true},'')).sessionId;
  for(const domain of ['Page','Runtime','Network','Log','ServiceWorker'])await send(domain+'.enable');
  report.phase='old';await send('Page.navigate',{url:server.origin+'/?debugMap=1'});
  await until('old document loaded',()=>evaluate(documentFacts),d=>d.ready==='complete'&&d.input==='',30000);await delay(1000);
  check('old real HTML body served',server.requests.some(r=>r.destination==='document'&&r.sha256===report.oldHtmlSha256));
  await click('#postal-search-input');await send('Input.insertText',{text:'018956'});await click('#postal-search-button');
  report.oldSelection=await until('old search writes postal and renders details',()=>evaluate(documentFacts),d=>new URL(d.url).searchParams.get('postal')==='018956'&&d.text.includes('Bayfront Stn Exit B'),60000);
  report.oldControlled=await until('app activates actual old controller',()=>evaluate(documentFacts),d=>d.controller?.state==='activated',30000);
  report.oldVersion=await until('old worker controls this page target',()=>controlledVersion(),Boolean,10000);
  check('old controller script identity received',server.requests.some(r=>r.url==='/sw.js'&&r.sha256===report.oldWorkerSha256&&r.release==='old'));
  await shot('old-selected');
  await evaluate(async()=>{localStorage.setItem('__qa:reload-preserve','local-sentinel');sessionStorage.setItem('__qa:reload-preserve','session-sentinel');await(await caches.open('qa-unrelated-cache')).put('/__qa/preserve',new Response('cache-sentinel'));return true;});
  report.cacheBefore=await cacheSnapshot();report.beforeReload=await evaluate(documentFacts);report.oldContext=currentContext;report.mainFrame=(await send('Page.getFrameTree')).frameTree.frame.id;
  server.flip();report.phase='reload';report.reload={command:'Page.reload',ignoreCache:false,at:new Date().toISOString(),url:report.beforeReload.url};await send('Page.reload',{ignoreCache:false});
  report.newDocument=await until('new Document preserves postal',()=>evaluate(documentFacts),d=>d.timeOrigin!==report.beforeReload.timeOrigin&&new URL(d.url).searchParams.get('postal')==='018956'&&d.input==='018956',30000);
  report.currentRoute=await until('current basemap and selected rendered route',()=>evaluate(routeFacts),ready,90000);report.currentContext=currentContext;report.phase='current';
  report.lighting=await until('automatic lighting renders after reload',()=>evaluate(()=>{const m=window.__shiokRouteMap;return {sourceCount:m?.getStyle().sources['lamp-posts']?.data?.features?.length??0,rendered:m?.queryRenderedFeatures({layers:['lamp-post-dots']})?.length??0};}),s=>s.sourceCount>0&&s.rendered>0,15000);
  check('current HTML contains current build identity',server.requests.some(r=>r.source==='current-preview'&&new URL(r.url,server.origin).pathname==='/'&&r.status===200));
  report.currentHtml=await(await fetch('http://127.0.0.1:4420'+new URL(report.beforeReload.url).pathname+new URL(report.beforeReload.url).search,{signal:AbortSignal.timeout(5000)})).text();
  const documentResponses=server.requests.filter(r=>r.source==='current-preview'&&new URL(r.url,server.origin).pathname==='/'&&r.status===200);check('new document equals current preview HTML',documentResponses.some(r=>r.sha256===sha(Buffer.from(report.currentHtml))));check('current HTML build marker matches verified preview',report.currentHtml.includes(build.buildId));delete report.currentHtml;
  const received=reloadedDocument(report.events,{sessionId:session,frameId:report.mainFrame,url:report.beforeReload.url});
  check('observed reloaded Document response',!!received);
  const documentBody=await send('Network.getResponseBody',{requestId:received.params.requestId});
  const documentBytes=Buffer.from(documentBody.body,documentBody.base64Encoded?'base64':'utf8');
  report.receivedDocument={requestId:received.params.requestId,url:received.params.response.url,fromServiceWorker:received.params.response.fromServiceWorker,bytes:documentBytes.length,sha256:sha(documentBytes)};
  writeFileSync(resolve(out,'current-document.html'),documentBytes,{flag:'wx'});
  check('browser received the exact current HTML',documentResponses.some(r=>r.sha256===report.receivedDocument.sha256));
  check('postal never reentered after ordinary Reload',preservesSelectionUrl(report.beforeReload.url,report.currentRoute.url)&&report.newDocument.input==='018956',{before:report.beforeReload.url,after:report.currentRoute.url});
  await shot('current-recovered',true);
  await until('current controller script fetched by normal lifecycle',()=>server.requests.some(r=>new URL(r.url,server.origin).pathname==='/sw.js'&&r.sha256===report.currentWorkerSha256),Boolean,30000);
  report.currentVersion=await until('new current worker controls this page target',()=>controlledVersion(report.oldVersion.versionId),Boolean,30000);
  report.cacheAfter=await cacheSnapshot();
  for(const entry of report.cacheBefore.entries){const next=report.cacheAfter.entries.find(e=>e.cache===entry.cache&&e.url===entry.url);check('preserved cached '+entry.cache+' '+new URL(entry.url).pathname,next?.sha256===entry.sha256,{before:entry,after:next});}
  check('local storage preserved',JSON.stringify(report.cacheBefore.local)===JSON.stringify(report.cacheAfter.local));check('session storage preserved',JSON.stringify(report.cacheBefore.session)===JSON.stringify(report.cacheAfter.session));
  const exceptions=report.events.filter(e=>e.sessionId===session&&e.method==='Runtime.exceptionThrown'&&e.params.exceptionDetails.executionContextId===report.currentContext);
  check('no current-document runtime exception',exceptions.length===0,exceptions);
  check('no local /api/ request observed',!server.requests.some(r=>r.url.startsWith('/api/')));
  check('no receipt drops or server bounds exceeded',!report.droppedEvents&&!server.stats.limitHit);
  report.completed=true;
}catch(error){report.failure=error.stack;if(ws?.readyState===1&&remaining()>4000)try{await shot('failure');}catch(captureError){report.failureCaptureError=captureError.message;}}
finally{
  closing=true;clearTimeout(watchdog);
  if(ws?.readyState===1)try{await send('Browser.close',{},'',4000);}catch(error){report.closeError=error.message;}
  ws?.close();if(server){await server.close();report.server={requests:server.requests,...server.snapshot()};}
  report.cleanup=cleanup(profile);chrome?.stderr?.destroy();chrome?.unref();
  if(chromeClosed)report.chromeTerminal=await Promise.race([chromeClosed,new Promise(done=>setTimeout(()=>done({unverified:true}),3000))]);
  await Promise.allSettled([...backgrounds]);
  try{report.anchorsAfter=anchors();report.anchorsUnchanged=JSON.stringify(report.anchorsBefore)===JSON.stringify(report.anchorsAfter);}catch(error){report.failure=error.stack;}
  report.stderr=stderr;report.elapsedMs=Date.now()-started;
  report.finalBoundsClear=!!report.server?.closed&&!report.server.limitHit&&report.server.activeSockets===0&&report.server.activeUpstreams===0&&report.server.inFlightBytes===0&&!report.droppedEvents;
  report.ok=!!report.completed&&!report.failure&&!report.errors.length&&report.cleanup.verified&&report.finalBoundsClear&&report.anchorsUnchanged&&!report.chromeTerminal?.unverified&&Date.now()<=totalEnd;
  writeFileSync(resolve(out,'browser.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({out,ok:report.ok,failure:report.failure,checks:report.checks.length,passed:report.checks.filter(c=>c.pass).length,cleanup:report.cleanup.verified,elapsedMs:report.elapsedMs},null,2));process.exitCode=report.ok?0:1;
}
