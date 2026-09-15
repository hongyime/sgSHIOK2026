import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { freemem } from 'node:os';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { facts, metricFacts } from '../same-document-zoom-20260915/probes.mjs';
import { transientNavigationContext } from '../legacy-reload-20260913/navigation-proof.mjs';
import { auditErrors } from '../resume-20260912/error-audit.mjs';
import { auditUrl } from './audit-url.mjs';

const ROOT='C:\\sgSHIOK2026', BASE=resolve(ROOT,'qa/revamp-r1/ship-continuation-20260915');
assert.equal(process.cwd(),ROOT);
const acceptance=process.argv[3]==='--acceptance';
const buttonSubmit=acceptance||process.argv[3]==='--button-submit';
assert.deepEqual(process.argv.slice(2),acceptance?['--go','--acceptance']:buttonSubmit?['--go','--button-submit']:['--go']);
const origin='https://sgshiok-83j94nyc2-theprawnvercel.vercel.app';
const access=new URL(process.env.SHIOK_PREVIEW_ACCESS);
assert.equal(access.origin,origin); assert.equal(access.pathname,'/');
assert.ok(access.searchParams.has('_vercel_share'));
const out=resolve(BASE,acceptance?'interaction-01':buttonSubmit?'browser-02':'browser-01');
assert.ok(!existsSync(out),'One fresh attempt; inspect a failure before any later run');
mkdirSync(out);
writeFileSync(resolve(out,'runner.mjs'),readFileSync(new URL(import.meta.url)),{flag:'wx'});
const profile=mkdtempSync(resolve(ROOT,'tmp/preview-smoke-profile-'));
const started=Date.now(),deadline=started+(acceptance?300000:210000);
const report={origin,deployment:'dpl_DiLpW8ZRPGSiaQHM76JZsocKC7pJ',startedAt:new Date().toISOString(),
  checks:[],responses:[],errors:[],captures:[],blockedMutations:[],routeAttempts:[],droppedResponses:0,passed:false,submitControl:buttonSubmit?'native button click':'CDP keyDown/keyUp only',
  scope:'Fresh authenticated preview in owned Chrome, responsive viewport sizes only. No old-client migration, phone, native zoom or representative performance claim. Page-session network metadata only, not complete worker transfer accounting.'};
let chrome,ws,session,sequence=0,closing=false,routeRequests=0,injectRouteFailure=false,holdRetry=false,releaseRetry; const pending=new Map(),jobs=new Set();
const entries=[],faults=[];
const delay=ms=>new Promise(done=>setTimeout(done,ms));
const safeUrl=auditUrl;
const trace=entry=>entries.push({timeMs:Date.now()-started,sessionId:session,...entry});
const check=(name,value,detail)=>{report.checks.push({name,passed:!!value,detail});assert.ok(value,name);};
function send(method,params={},sid=session){return new Promise((done,reject)=>{
  const id=++sequence,fetchCommand=/^Fetch\.(continueRequest|failRequest|fulfillRequest)$/.test(method);
  if(fetchCommand)trace({kind:'send',id,method,params});
  const finish=(result,error,kind='cdp')=>{clearTimeout(timeout);pending.delete(id);
    if(fetchCommand)trace({kind:'reply',id,fetchCommand,...(error?{error:{kind,code:error.code,message:error.message}}:{})});
    if(error){const failure=Error(String(error.message).split(access.searchParams.get('_vercel_share')).join('[withheld]'));failure.commandId=id;reject(failure);}else done(result);};
  const timeout=setTimeout(()=>finish(undefined,{message:method+' deadline'},'timeout'),closing?5000:Math.max(1,Math.min(15000,deadline-Date.now())));
  pending.set(id,finish);
  ws.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));
});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error('Page evaluation failed');return r.result.value;}
async function until(name,get,accept,ms=45000){const end=Math.min(deadline,Date.now()+ms);while(Date.now()<end){try{const value=await get();report.last={name,value};if(accept(value))return value;}catch(error){if(!transientNavigationContext(error))throw error;}await delay(250);}throw Error(name+' deadline');}
async function inspect(){const f=await evaluate(`(${facts})()`);f.geometrySha256=createHash('sha256').update(f.geometry??'absent').digest('hex');delete f.geometry;f.url=safeUrl(f.url);return f;}
async function settled(name){await until(name,inspect,f=>f.count>0&&f.basemap&&f.tiles&&!f.moving,30000);await delay(300);return until(name+' stable',inspect,f=>f.count>0&&f.basemap&&f.tiles&&!f.moving,15000);}
async function clickButton(label){
  const box=await evaluate(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(label)}||e.getAttribute('aria-label')===${JSON.stringify(label)});if(!e)return null;const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return{enabled:!e.disabled,visible:r.width>0&&r.height>0&&!!hit&&(hit===e||e.contains(hit)),x,y};})()`);
  check(label+' native target',box?.enabled&&box?.visible,box);
  for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:box.x,y:box.y,button:'left',clickCount:1});
}
async function capture(name){
  const before=await inspect(),metrics=await evaluate(`(${metricFacts})()`);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  const bytes=Buffer.from(shot.data,'base64');writeFileSync(resolve(out,name+'.png'),bytes,{flag:'wx'});
  const after=await inspect();report.captures.push({name,before,after,metrics,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
  check(name+' same current rendered route',before.count>0&&after.count>0&&before.routeKey===after.routeKey&&!before.moving&&!after.moving);
  check(name+' basemap loaded',after.basemap);check(name+' four metrics visible',metrics.length===4&&metrics.every(m=>m.visible));
  if(acceptance)check(name+' tiles settled',before.tiles&&after.tiles);
  check(name+' no document overflow',!after.overflow);
}
try{
  check('at least1GiB free before Chrome',freemem()>=1073741824);
  chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
    '--headless=new','--incognito','--no-first-run','--no-default-browser-check','--disable-background-networking',
    '--disable-component-update','--disable-sync','--remote-debugging-port=0',
    '--window-size=1440,950','--use-angle=swiftshader','--enable-unsafe-swiftshader',
    '--user-data-dir='+profile,'--crash-dumps-dir='+profile,'about:blank'],
    {cwd:ROOT,windowsHide:true,stdio:'ignore',env:{...process.env,TEMP:profile,TMP:profile,SHIOK_PREVIEW_ACCESS:''}});
  report.chromePid=chrome.pid;chrome.on('exit',(code,signal)=>{report.chromeExit={code,signal};});
  const portFile=resolve(profile,'DevToolsActivePort');
  await until('Chrome startup',()=>existsSync(portFile),Boolean,25000);
  const [port,path]=readFileSync(portFile,'utf8').trim().split(/\r?\n/);
  ws=new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((done,reject)=>{const timer=setTimeout(()=>reject(Error('Browser connection deadline')),10000);ws.onopen=()=>{clearTimeout(timer);done();};ws.onerror=()=>{clearTimeout(timer);reject(Error('Browser connection failed'));};});
  ws.onerror=()=>{if(!closing)trace({kind:'connectionFault',message:'Browser socket error'});};
  ws.onmessage=event=>{
    const message=JSON.parse(event.data);if(message.id){pending.get(message.id)?.(message.result,message.error);return;}
    if(message.sessionId!==session)return;
    if(['Network.requestWillBeSent','Fetch.requestPaused','Network.loadingFailed','Network.loadingFinished','Network.responseReceived','Runtime.exceptionThrown'].includes(message.method)){
      const p=message.params,r=p.request,response=p.response;
      // Preserve correlation IDs and status, never request headers, cookies or query credentials.
      trace({kind:'event',method:message.method,params:{requestId:p.requestId,networkId:p.networkId,
        ...(r?{request:{url:safeUrl(r.url),method:r.method}}:{}),...(response?{response:{url:safeUrl(response.url),status:response.status}}:{}),
        ...(p.redirectResponse?{redirectResponse:{status:p.redirectResponse.status}}:{}),redirectedRequestId:p.redirectedRequestId,
        responseStatusCode:p.responseStatusCode,responseErrorReason:p.responseErrorReason,errorText:p.errorText,canceled:p.canceled,
        blockedReason:p.blockedReason,corsErrorStatus:p.corsErrorStatus}});
    }
    if(message.method==='Fetch.requestPaused'){
      const {requestId,request}=message.params;
      const isRoute=new URL(request.url).pathname==='/api/onemap-route';
      if(isRoute)routeRequests++;
      const allowed=['GET','HEAD'].includes(request.method)&&(!isRoute||routeRequests<=3);
      if(!allowed)report.blockedMutations.push({method:request.method,url:safeUrl(request.url)});
      const injected=allowed&&isRoute&&injectRouteFailure;
      if(isRoute)report.routeAttempts.push({networkId:message.params.networkId,fetchId:requestId,injected,allowed});
      if(injected){injectRouteFailure=false;report.injectedFailure={networkId:message.params.networkId,fetchId:requestId,status:503};}
      const gate=holdRetry&&allowed&&isRoute&&!injected?new Promise(resolve=>{holdRetry=false;releaseRetry=resolve;}):Promise.resolve(true);
      const job=gate.then(proceed=>send(!proceed?'Fetch.failRequest':injected?'Fetch.fulfillRequest':allowed?'Fetch.continueRequest':'Fetch.failRequest',{requestId,...(!proceed?{errorReason:'Aborted'}:injected?{responseCode:503,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Cache-Control',value:'no-store'}],body:Buffer.from(JSON.stringify({ok:false,error:'Synthetic release acceptance failure'})).toString('base64')}:allowed?{}:{errorReason:'BlockedByClient'})}))
        .catch(error=>{if(!closing){const fault={fault:error.message,commandId:error.commandId,sessionId:session};faults.push(fault);report.errors.push({kind:'interception',...fault});}});
      jobs.add(job);job.finally(()=>jobs.delete(job));return;
    }
    if(message.method==='Runtime.exceptionThrown')report.errors.push({kind:'runtime',text:message.params.exceptionDetails.text});
    if(message.method==='Network.loadingFailed')report.errors.push({kind:'request',error:message.params.errorText,canceled:!!message.params.canceled});
    if(message.method==='Network.responseReceived'){if(report.responses.length>=600){report.droppedResponses++;return;}const r=message.params.response;report.responses.push({requestId:message.params.requestId,url:safeUrl(r.url),status:r.status,mime:r.mimeType,fromDiskCache:r.fromDiskCache,fromServiceWorker:r.fromServiceWorker});}
  };
  const {browserContextId}=await send('Target.createBrowserContext',{disposeOnDetach:true},'');
  const target=await send('Target.createTarget',{url:'about:blank',browserContextId},'');
  session=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true},'')).sessionId;
  for(const method of ['Runtime.enable','Page.enable','Network.enable'])await send(method);
  await send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:950,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:access.href});
  await until('authenticated preview',()=>evaluate(`({origin:location.origin,ready:document.readyState,input:!!document.querySelector('#postal-search-input')})`),v=>v.origin===origin&&v.ready==='complete'&&v.input,60000);
  await evaluate(`document.querySelector('#postal-search-input').focus()`);
  await send('Input.insertText',{text:'018956'});
  if(buttonSubmit){
    const control=await evaluate(`(()=>{const input=document.querySelector('#postal-search-input'),e=document.querySelector('#postal-search-button');const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return{x,y,value:input.value,valid:input.checkValidity(),enabled:!e.disabled,visible:r.width>0&&r.height>0&&!!hit&&(hit===e||e.contains(hit))};})()`);
    check('search button visible and postal valid',control.visible&&control.enabled&&control.valid&&control.value==='018956',control);
    for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:control.x,y:control.y,button:'left',clickCount:1});
  }else for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await until('current selected route',inspect,f=>f.postal==='018956'&&f.count>0&&f.basemap&&!f.moving,75000);
  if(acceptance){
    await settled('initial tiles');report.initial=await inspect();
    await clickButton('MRT/LRT exits');
    await until('MRT category',inspect,f=>f.pressed==='MRT/LRT exits'&&f.routeKey!==report.initial.routeKey&&f.count>0,20000);
    await settled('MRT tiles');await capture('mrt-1440x950');report.mrt=await inspect();
    await clickButton('Bus stops');
    await until('bus category',inspect,f=>f.pressed==='Bus stops'&&f.routeKey!==report.mrt.routeKey&&f.count>0,20000);
    await settled('bus tiles');
    await clickButton('Walk details');
    check('details expanded',await evaluate(`document.querySelector('[aria-controls="walk-details"]').getAttribute('aria-expanded')==='true'`));
    await clickButton('Collapse walk details');
    check('details collapsed',await evaluate(`document.querySelector('#walk-details').hidden`));
  }
  await capture('desktop-1440x950');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await until('responsive selected route',inspect,f=>f.inner[0]===390&&f.count>0&&!f.moving,15000);
  if(acceptance)await settled('mobile tiles');else await delay(500);
  await capture('mobile-390x844');
  if(acceptance){
    for(const [width,height] of [[390,667],[320,667]]){
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
      await settled('small viewport tiles');await capture(`mobile-${width}x${height}`);
    }
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:950,deviceScaleFactor:1,mobile:false});await settled('restored desktop tiles');
    report.saved=await inspect();
    report.poiCandidates=await evaluate(`(()=>{const m=window.__shiokRouteMap,c=m.getCanvas(),r=c.getBoundingClientRect(),seen=new Set();return m.queryRenderedFeatures({layers:['bus-stop-dot','mrt-exit-dot']}).filter(f=>!seen.has(f.properties.id)&&seen.add(f.properties.id)).map(f=>{const p=m.project(f.geometry.coordinates),x=p.x+r.x,y=p.y+r.y;return{id:f.properties.id,kind:f.properties.kind,name:f.properties.name,x,y,visible:x>r.left+10&&x<r.right-10&&y>r.top+10&&y<r.bottom-10&&document.elementFromPoint(x,y)===c};}).filter(f=>f.visible);})()`);
    const visited=new Set([report.saved,report.mrt,report.initial].map(f=>new URL(f.url).searchParams.get('stop')));
    const poi=report.poiCandidates.filter(p=>p.kind==='bus_stop'&&!visited.has(p.id)).sort((a,b)=>b.y-a.y)[0];
    check('visible alternate stop exists',!!poi,poi);injectRouteFailure=true;
    for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:poi.x,y:poi.y,button:'left',clickCount:1});
    await until('online failure visible',()=>evaluate(`document.body.innerText.includes('Online preview unavailable.')`),Boolean,22000);
    report.failedSelection=await inspect();
    check('one selected request received the injected failure',report.injectedFailure?.status===503&&!injectRouteFailure);
    check('failed online preview preserves saved geometry',report.failedSelection.count>0&&report.failedSelection.geometrySha256===report.saved.geometrySha256);
    await capture('online-unavailable-1440x950');
    const attemptsBefore=routeRequests;holdRetry=true;await clickButton('Retry preview');
    await until('explicit retry made one request',()=>routeRequests,n=>n===attemptsBefore+1,15000);
    const actual=report.routeAttempts.at(-1);check('real retry was not injected',actual?.allowed&&!actual.injected&&!!actual.networkId,actual);
    await until('retry visibly loading before forwarding',()=>evaluate(`document.body.innerText.includes('Checking this stop')`),Boolean,10000);
    check('retry forwarding gate exists',typeof releaseRetry==='function');releaseRetry(true);releaseRetry=null;
    report.retryNetworkOutcome=await until('actual retry body completion or network failure',()=>entries.find(e=>['Network.loadingFinished','Network.loadingFailed'].includes(e.method)&&e.params.requestId===actual.networkId),Boolean,20000);
    const normalizedName=poi.name.toLowerCase().replace(/[^a-z0-9]/g,'');
    report.retryOutcome=await until('real retry positive terminal UI',async()=>{
      const f=await inspect();const status=await evaluate(`({unavailable:document.body.innerText.includes('Online preview unavailable.'),loading:document.body.innerText.includes('Checking this stop')})`);
      if(status.unavailable&&!status.loading&&f.count>0&&f.geometrySha256===report.saved.geometrySha256)return 'unavailable';
      if(!status.unavailable&&!status.loading&&f.count>0&&!f.moving&&new URL(f.url).searchParams.get('stop')===poi.id&&f.destination?.toLowerCase().replace(/[^a-z0-9]/g,'')===normalizedName)return 'preview';
      return null;
    },Boolean,18000);
    if(report.retryOutcome==='unavailable')await clickButton('Back to saved walk');else await clickButton('Bus stops');
    await settled('back to saved walk');
    const back=await inspect();check('Back restores saved selection URL',back.url===report.saved.url);
    check('Back clears failed-preview controls',await evaluate(`![...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Retry preview')`));
    await capture('back-to-saved-1440x950');
  }
  const identity=await evaluate(`(async()=>{const paths=['/data/generated_20260805_prefer_scored_routed/manifest.json','/sw.js'];const out=[];for(const path of paths){const r=await fetch(path,{cache:'no-store'});const bytes=await r.arrayBuffer();const hash=await crypto.subtle.digest('SHA-256',bytes);out.push({path,status:r.status,bytes:bytes.byteLength,sha256:[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('')});}return out;})()`);
  report.staticIdentity=identity;
  check('published manifest hash unchanged',identity[0].status===200&&identity[0].sha256==='7108e66e70628f3211883402fc753c2f5809db5a822d6a2415f6ae6459a1070e');
  check('candidate worker bytes served',identity[1].status===200&&identity[1].sha256==='88e523a5d8b4f8dec18b0a741dfae056674552de9e0f5b67d96a82fd554500a4');
  check('no runtime exception observed',!report.errors.some(e=>e.kind==='runtime'));
  await Promise.allSettled([...jobs]);
  report.requestAudit=auditErrors(entries,faults,session);
  report.auditScope='Runtime/Fetch command safety only. HTTP/network completeness is separate and not claimed by passed.';
  check('page request controls completed or exact tile cancellation explained',report.requestAudit.ok);
  check('no page mutation attempted',report.blockedMutations.length===0);
  check('no page response metadata dropped',report.droppedResponses===0);
  report.passed=true;
}catch(error){report.failure=error?.message??'Browser transport failed';
  if(ws?.readyState===WebSocket.OPEN&&session)try{const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(resolve(out,'failure.png'),Buffer.from(shot.data,'base64'),{flag:'wx'});report.failureScreenshot='failure.png';}catch{}
}
finally{
  closing=true;
  releaseRetry?.(false);releaseRetry=null;
  if(ws?.readyState===WebSocket.OPEN){try{await send('Browser.close',{},'');}catch{}ws.close();}
  if(chrome){for(let i=0;i<150&&chrome.exitCode===null&&chrome.signalCode===null;i++)await delay(100);if(chrome.exitCode===null&&chrome.signalCode===null){report.ownedChromeKillRequested=true;chrome.kill();}}
  if(chrome)for(let i=0;i<100&&chrome.exitCode===null&&chrome.signalCode===null;i++)await delay(100);
  report.cleanupConfirmed=!chrome||chrome.exitCode!==null||chrome.signalCode!==null;
  for(const reply of [...pending.values()])reply(undefined,{message:'Browser closed'});
  await Promise.allSettled([...jobs]);
  report.pendingRequestControls=jobs.size;
  report.entries=entries;report.routeRequests=routeRequests;
  if(!report.cleanupConfirmed)report.passed=false;
  report.elapsedMs=Date.now()-started;
  // Never serialize the temporary share URL, auth cookies, request headers or profile.
  writeFileSync(resolve(out,'summary.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({out,passed:report.passed,failure:report.failure,captures:report.captures.map(c=>c.name),elapsedMs:report.elapsedMs}));
}
process.exitCode=report.passed?0:1;
