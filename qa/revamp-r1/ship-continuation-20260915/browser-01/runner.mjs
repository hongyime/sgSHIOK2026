import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { freemem } from 'node:os';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { facts, metricFacts } from '../same-document-zoom-20260915/probes.mjs';
import { transientNavigationContext } from '../legacy-reload-20260913/navigation-proof.mjs';

const ROOT='C:\\sgSHIOK2026', BASE=resolve(ROOT,'qa/revamp-r1/ship-continuation-20260915');
assert.equal(process.cwd(),ROOT); assert.deepEqual(process.argv.slice(2),['--go']);
const origin='https://sgshiok-83j94nyc2-theprawnvercel.vercel.app';
const access=new URL(process.env.SHIOK_PREVIEW_ACCESS);
assert.equal(access.origin,origin); assert.equal(access.pathname,'/');
assert.ok(access.searchParams.has('_vercel_share'));
const out=resolve(BASE,'browser-01');
assert.ok(!existsSync(out),'One fresh attempt; inspect a failure before any later run');
mkdirSync(out);
const profile=mkdtempSync(resolve(ROOT,'tmp/preview-smoke-profile-'));
const started=Date.now(),deadline=started+210000;
const report={origin,deployment:'dpl_DiLpW8ZRPGSiaQHM76JZsocKC7pJ',startedAt:new Date().toISOString(),
  checks:[],responses:[],errors:[],captures:[],blockedMutations:[],droppedResponses:0,passed:false,
  scope:'Fresh authenticated preview in owned Chrome, responsive viewport sizes only. No old-client migration, phone, native zoom or representative performance claim. Page-session network metadata only, not complete worker transfer accounting.'};
let chrome,ws,session,sequence=0,closing=false; const pending=new Map(),jobs=new Set();
const delay=ms=>new Promise(done=>setTimeout(done,ms));
const safeUrl=value=>{try{const u=new URL(value);return u.origin+u.pathname;}catch{return 'invalid-url';}};
const check=(name,value,detail)=>{report.checks.push({name,passed:!!value,detail});assert.ok(value,name);};
function send(method,params={},sid=session){return new Promise((done,reject)=>{
  const id=++sequence,timeout=setTimeout(()=>{pending.delete(id);reject(Error(method+' deadline'));},closing?5000:Math.max(1,Math.min(15000,deadline-Date.now())));
  pending.set(id,(result,error)=>{clearTimeout(timeout);pending.delete(id);error?reject(Error(String(error.message).split(access.searchParams.get('_vercel_share')).join('[withheld]'))):done(result);});
  ws.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));
});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error('Page evaluation failed');return r.result.value;}
async function until(name,get,accept,ms=45000){const end=Math.min(deadline,Date.now()+ms);while(Date.now()<end){try{const value=await get();report.last={name,value};if(accept(value))return value;}catch(error){if(!transientNavigationContext(error))throw error;}await delay(250);}throw Error(name+' deadline');}
async function inspect(){const f=await evaluate(`(${facts})()`);delete f.geometry;f.url=safeUrl(f.url);return f;}
async function capture(name){
  const before=await inspect(),metrics=await evaluate(`(${metricFacts})()`);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  const bytes=Buffer.from(shot.data,'base64');writeFileSync(resolve(out,name+'.png'),bytes,{flag:'wx'});
  const after=await inspect();report.captures.push({name,before,after,metrics,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
  check(name+' same current rendered route',before.count>0&&after.count>0&&before.routeKey===after.routeKey&&!before.moving&&!after.moving);
  check(name+' basemap loaded',after.basemap);check(name+' four metrics visible',metrics.length===4&&metrics.every(m=>m.visible));
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
  ws.onmessage=event=>{
    const message=JSON.parse(event.data);if(message.id){pending.get(message.id)?.(message.result,message.error);return;}
    if(message.method==='Fetch.requestPaused'){
      const {requestId,request}=message.params,allowed=['GET','HEAD'].includes(request.method);
      if(!allowed)report.blockedMutations.push({method:request.method,url:safeUrl(request.url)});
      const job=send(allowed?'Fetch.continueRequest':'Fetch.failRequest',{requestId,...(allowed?{}:{errorReason:'BlockedByClient'})})
        .catch(()=>{if(!closing)report.errors.push({kind:'interception',text:'Request control failed'});});
      jobs.add(job);job.finally(()=>jobs.delete(job));return;
    }
    if(message.method==='Runtime.exceptionThrown')report.errors.push({kind:'runtime',text:message.params.exceptionDetails.text});
    if(message.method==='Network.loadingFailed')report.errors.push({kind:'request',error:message.params.errorText,canceled:!!message.params.canceled});
    if(message.method==='Network.responseReceived'){if(report.responses.length>=600){report.droppedResponses++;return;}const r=message.params.response;report.responses.push({url:safeUrl(r.url),status:r.status,mime:r.mimeType,fromDiskCache:r.fromDiskCache,fromServiceWorker:r.fromServiceWorker});}
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
  for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await until('current selected route',inspect,f=>f.postal==='018956'&&f.count>0&&f.basemap&&!f.moving,75000);
  await capture('desktop-1440x950');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await until('responsive selected route',inspect,f=>f.inner[0]===390&&f.count>0&&!f.moving,15000);
  await delay(500);await capture('mobile-390x844');
  const identity=await evaluate(`(async()=>{const paths=['/data/generated_20260805_prefer_scored_routed/manifest.json','/sw.js'];const out=[];for(const path of paths){const r=await fetch(path,{cache:'no-store'});const bytes=await r.arrayBuffer();const hash=await crypto.subtle.digest('SHA-256',bytes);out.push({path,status:r.status,bytes:bytes.byteLength,sha256:[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('')});}return out;})()`);
  report.staticIdentity=identity;
  check('published manifest hash unchanged',identity[0].status===200&&identity[0].sha256==='7108e66e70628f3211883402fc753c2f5809db5a822d6a2415f6ae6459a1070e');
  check('candidate worker bytes served',identity[1].status===200&&identity[1].sha256==='88e523a5d8b4f8dec18b0a741dfae056674552de9e0f5b67d96a82fd554500a4');
  check('no runtime exception observed',!report.errors.some(e=>e.kind==='runtime'));
  check('page request controls completed without errors',!report.errors.some(e=>e.kind==='interception'));
  check('no page mutation attempted',report.blockedMutations.length===0);
  check('no page response metadata dropped',report.droppedResponses===0);
  report.passed=true;
}catch(error){report.failure=error?.message??'Browser transport failed';
  if(ws?.readyState===WebSocket.OPEN&&session)try{const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(resolve(out,'failure.png'),Buffer.from(shot.data,'base64'),{flag:'wx'});report.failureScreenshot='failure.png';}catch{}
}
finally{
  closing=true;
  if(ws?.readyState===WebSocket.OPEN){try{await send('Browser.close',{},'');}catch{}ws.close();}
  if(chrome){for(let i=0;i<20&&chrome.exitCode===null&&chrome.signalCode===null;i++)await delay(100);if(chrome.exitCode===null&&chrome.signalCode===null){report.ownedChromeKillRequested=true;chrome.kill();}}
  if(chrome)for(let i=0;i<50&&chrome.exitCode===null&&chrome.signalCode===null;i++)await delay(100);
  report.cleanupConfirmed=!chrome||chrome.exitCode!==null||chrome.signalCode!==null;
  for(const reply of [...pending.values()])reply(undefined,{message:'Browser closed'});
  await Promise.allSettled([...jobs]);
  report.pendingRequestControls=jobs.size;
  if(!report.cleanupConfirmed)report.passed=false;
  report.elapsedMs=Date.now()-started;
  // Never serialize the temporary share URL, auth cookies, request headers or profile.
  writeFileSync(resolve(out,'summary.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({out,passed:report.passed,failure:report.failure,captures:report.captures.map(c=>c.name),elapsedMs:report.elapsedMs}));
}
process.exitCode=report.passed?0:1;
