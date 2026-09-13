import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { freemem } from 'node:os';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';
import { startBoundary } from './network-boundary.mjs';

const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const started=Date.now(),workEnd=started+130000,totalEnd=started+210000;
const dir=resolve(root,'qa/revamp-r1/production-worker-20260913');
const out=resolve(process.argv[2]??'UNSUPERVISED'),profile=resolve(process.argv[3]??'UNSUPERVISED');
assert.equal(dirname(out),dir);assert.match(basename(out),/^observed-[A-Za-z0-9]+$/);
assert.equal(dirname(profile),resolve(root,'tmp'));assert.match(basename(profile),/^layout-confirmation-browser-[A-Za-z0-9]+$/);
const controller=JSON.parse(readFileSync(resolve(out,'controller.json')));
assert.equal(controller.pid,process.ppid);assert.equal(controller.out,out);assert.equal(controller.profile,profile);
const sha=b=>createHash('sha256').update(b).digest('hex');
const readJson=p=>JSON.parse(readFileSync(p));
const old=resolve(root,'qa/revamp-r1/production-runtime-20260913');
const captured=resolve(old,'capture-1789294685168');
const summary=readJson(resolve(old,'summary.json'));
const report={root,hostname:process.env.COMPUTERNAME,out,profile,startedAt:new Date(started).toISOString(),
  scope:'Captured production HTML/scripts with local read-only data. Native Worker observer preserves arguments and result. All external network including OneMap tiles deliberately blocked at browser-wide HTTP proxy. Not live-site, basemap, score, performance, retained-tab or device acceptance.',
  limits:{workMs:130000,totalIncludingCleanupMs:210000,minimumAvailableMiB:1024},events:[],errors:[],checks:[],dataReads:[],canaryDirectHits:0};
writeFileSync(resolve(out,'runner.mjs'),readFileSync(new URL(import.meta.url)),{flag:'wx'});
let boundary,canary,chrome,chromeClosed,ws,session,stderr='',closing=false,sequence=0,watchdog;
const pending=new Map(),commands=new Set(),upstreams=new Set();
const note=(kind,params)=>{if(report.events.length<6000)report.events.push({atMs:Date.now()-started,kind,...params});else report.droppedEvents=(report.droppedEvents??0)+1;};
const left=()=>Math.max(0,(closing?totalEnd:workEnd)-Date.now());
const pause=ms=>new Promise(done=>setTimeout(done,Math.min(ms,left())));
function send(method,params={},sessionId='',timeout=8000){
  return new Promise((done,reject)=>{
    if(left()<=0){reject(Error('QA total/work deadline'));return;}
    const id=++sequence,t=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},Math.min(timeout,left()));
    pending.set(id,(value,error)=>{clearTimeout(t);pending.delete(id);error?reject(Error(error.message)):done(value);});
    try{ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));}catch(e){clearTimeout(t);pending.delete(id);reject(e);}
  });
}
function background(p){commands.add(p);p.catch(e=>report.errors.push(e.message)).finally(()=>commands.delete(p));}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true},session);if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;}
async function until(name,get,predicate,ms){
  const end=Math.min(workEnd,Date.now()+ms);
  while(Date.now()<end){const value=await get();if(predicate(value))return value;await pause(250);}
  throw Error(name+' observation timeout');
}
function check(name,pass,detail){report.checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name);}
const fixture=readJson(resolve(root,'web/lib/__tests__/fixtures/published-walks.provenance.json'));
function anchors(){return Object.values(fixture.sources).map(f=>{const b=readFileSync(resolve(root,f.path));assert.equal(sha(b),f.sha256,'STOP input mismatch '+f.path);return{path:f.path,sha256:sha(b),bytes:b.length};});}
async function readData(path,signal){
  return new Promise((done,reject)=>{
    const receipt={path,startedAt:new Date().toISOString()};report.dataReads.push(receipt);
    const dataDeadline=Date.now()+10000,absoluteSignal=AbortSignal.any([signal,AbortSignal.timeout(10000)]);
    const req=http.request({hostname:'::1',port:4340,path,method:'GET',signal:absoluteSignal,timeout:10000},res=>{
      const chunks=[];let bytes=0;
      res.on('data',b=>{bytes+=b.length;if(Date.now()>=dataDeadline||bytes>8*1024*1024){req.destroy(Error('Data absolute deadline or per-file byte bound'));return;}chunks.push(b);});
      res.on('error',reject);res.on('aborted',()=>reject(Error('Data response aborted')));
      res.on('end',()=>{if(Date.now()>=dataDeadline){reject(Error('Data absolute deadline'));return;}const body=Buffer.concat(chunks);Object.assign(receipt,{status:res.statusCode,bytes:body.length,sha256:sha(body)});done({status:res.statusCode,headers:res.headers,bytes:body});});
    });
    upstreams.add(req);req.on('close',()=>upstreams.delete(req));req.on('timeout',()=>req.destroy(Error('Data request timeout')));req.on('error',e=>{receipt.error=e.message;reject(e);});req.end();
  });
}
const workerProbe=readFileSync(resolve(dir,'worker-observer.js'),'utf8');report.observerSha256=sha(Buffer.from(workerProbe));
try{
  report.availableMiB=freemem()/1048576;check('host memory admission',report.availableMiB>=1024,report.availableMiB);
  report.anchorsBefore=anchors();
  const html=readFileSync(resolve(captured,'index.html')),htmlReceipt=readJson(resolve(captured,'response.json'));
  check('captured HTML identity',sha(html)===summary.html.sha256);report.htmlSha256=sha(html);report.buildId=summary.html.buildId;
  const phases=['initial-assets.json','dependencies.json','dependencies-reviewed.json'].map(p=>readJson(resolve(captured,p)));
  const assets=new Map();for(const r of phases.flatMap(p=>p.responses).filter(r=>r.file)){
    const bytes=readFileSync(resolve(captured,r.file));assert.equal(sha(bytes),r.sha256,'STOP captured input mismatch');assert.equal(bytes.length,r.decodedBytes);
    assets.set(new URL(r.url).pathname,{bytes,headers:r.headers,sha256:r.sha256});
  }
  check('all24 captured assets match',assets.size===24);report.productionAssetHashes=[...assets].map(([path,a])=>({path,sha256:a.sha256,bytes:a.bytes.length}));
  canary=http.createServer((req,res)=>{report.canaryDirectHits++;res.writeHead(500).end('Proxy bypass detected');});
  await new Promise((done,reject)=>{canary.once('error',reject);canary.listen(0,'127.0.0.1',done);});
  report.canaryOrigin='http://127.0.0.1:'+canary.address().port;
  const probeHtml=Buffer.from('<!doctype html><title>Local proxy admission probe</title><p>Local QA only</p>');
  const probeJs=Buffer.from('onmessage=async e=>{const results=[];for(const url of e.data){try{const r=await fetch(url);results.push({url,status:r.status})}catch(error){results.push({url,error:error.name})}};postMessage(results)}');
  assets.set('/__qa/probe.html',{bytes:probeHtml,headers:{'content-type':'text/html; charset=utf-8'},sha256:sha(probeHtml)});
  assets.set('/__qa/probe-worker.js',{bytes:probeJs,headers:{'content-type':'application/javascript'},sha256:sha(probeJs)});
  boundary=await startBoundary({html,htmlHeaders:htmlReceipt.headers,assets,observed404:new Set(phases.flatMap(p=>p.responses).filter(r=>r.status===404).map(r=>new URL(r.url).pathname)),readData,
    limits:{wallMs:Math.min(110000,left()),maxRequests:300,maxResponseBytes:100*1024*1024,maxDataFileBytes:8*1024*1024}});
  report.origin=boundary.origin;
  const args=['--headless=new','--window-size=1440,950','--force-device-scale-factor=1','--no-first-run','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-networking','--disable-component-update','--disable-sync','--disable-quic','--force-webrtc-ip-handling-policy=disable_non_proxied_udp','--proxy-server='+boundary.origin,'--proxy-bypass-list=<-loopback>','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'];
  report.chromeArgs=args;
  chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',args,{cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,TEMP:profile,TMP:profile}});
  chromeClosed=new Promise(done=>{chrome.once('error',e=>{report.chromeError=e.message;done({error:e.message});});chrome.once('close',(code,signal)=>done({code,signal}));});
  report.chromePid=chrome.pid;chrome.stderr.on('data',b=>{if(stderr.length<65536)stderr+=b.toString();});
  watchdog=setTimeout(()=>{report.workDeadlineFired=true;chrome.kill();for(const u of upstreams)u.destroy();void boundary.close();ws?.close();},left());
  const endpoint=await until('owned Chrome',()=>{if(report.chromeError)throw Error(report.chromeError);return /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1];},Boolean,30000);
  ws=new WebSocket(endpoint);
  await new Promise((done,reject)=>{const t=setTimeout(()=>reject(Error('CDP connection timeout')),Math.min(10000,left()));ws.onopen=()=>{clearTimeout(t);done();};ws.onerror=()=>{clearTimeout(t);reject(Error('CDP connection'));};});
  ws.onmessage=e=>{
    const m=JSON.parse(e.data),p=m.params,sid=m.sessionId??'';
    if(m.id){pending.get(m.id)?.(m.result,m.error);return;}
    if(['Target.attachedToTarget','Runtime.exceptionThrown','Log.entryAdded','Network.requestWillBeSent','Network.responseReceived','Network.loadingFailed'].includes(m.method))note(m.method,{sessionId:sid,params:p});
    if(m.method==='Target.attachedToTarget')background((async()=>{try{if(p.targetInfo.type==='worker')for(const domain of ['Runtime','Network'])await send(domain+'.enable',{},p.sessionId);}finally{if(p.waitingForDebugger)await send('Runtime.runIfWaitingForDebugger',{},p.sessionId);}})());
  };
  ws.onclose=()=>{for(const done of [...pending.values()])done(undefined,{message:'CDP closed'});};
  const targets=await send('Target.getTargets'),page=targets.targetInfos.find(t=>t.type==='page'&&t.url==='about:blank');assert.ok(page);
  session=(await send('Target.attachToTarget',{targetId:page.targetId,flatten:true})).sessionId;
  for(const domain of ['Page','Runtime','Network','Log'])await send(domain+'.enable',{},session);
  await send('Network.setBypassServiceWorker',{bypass:true},session);
  await send('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:true,flatten:true},session);
  await send('Page.navigate',{url:boundary.origin+'/__qa/probe.html'},session);
  await until('probe document',()=>evaluate('document.readyState'),s=>s==='complete',10000);
  const targetsToBlock=['http://external.invalid/worker-canary','https://external.invalid/worker-canary',report.canaryOrigin+'/worker-canary'];
  report.canaryTargets=targetsToBlock;
  await evaluate('window.__qaCanary=new Worker("/__qa/probe-worker.js");window.__qaCanary.onmessage=e=>{window.__qaCanaryResults=e.data};window.__qaCanary.postMessage('+JSON.stringify(targetsToBlock)+');true');
  report.canaryResults=await until('worker network canary',()=>evaluate('window.__qaCanaryResults||null'),Array.isArray,15000);
  check('different local origin never reached directly',report.canaryDirectHits===0);
  report.canaryBoundaryReceipts=structuredClone(boundary.requests);
  const expectedCanaries=[
    {authority:'external.invalid',event:'request',method:'GET',path:'/worker-canary'},
    {authority:'external.invalid:443',event:'connect',method:'CONNECT',path:null},
    {authority:new URL(report.canaryOrigin).host,event:'request',method:'GET',path:'/worker-canary'}
  ];
  const matchedCanaries=expectedCanaries.map(expected=>boundary.requests.find(r=>r.status===403&&r.completed&&r.disposition==='blocked'&&Object.entries(expected).every(([key,value])=>r[key]===value)));
  check('proxy observed three distinct blocked worker requests',matchedCanaries.every(Boolean)&&new Set(matchedCanaries.map(r=>r?.id)).size===3,{expectedCanaries,receipts:report.canaryBoundaryReceipts});
  await evaluate('window.__qaCanary.terminate();true');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:workerProbe},session);
  report.applicationStartMs=Date.now()-started;report.applicationStartEpoch=Date.now();
  const appUrl=boundary.origin+'/?postal=018956&debugMap=1';
  const navigation=await send('Page.navigate',{url:appUrl},session);check('application navigation accepted',!navigation.errorText,navigation);
  report.appDocument=await until('verified application document',()=>evaluate('({url:location.href,ready:document.readyState})'),d=>d.url===appUrl&&d.ready!=='loading',15000);
  const htmlRequest=boundary.requests.find(r=>r.path==='/'&&r.secFetchDest==='document'&&r.status===200&&r.completed&&r.sha256===report.htmlSha256&&Date.parse(r.startedAt)>=report.applicationStartEpoch);
  check('application Document received exact captured HTML',!!htmlRequest,htmlRequest);report.htmlRequest=structuredClone(htmlRequest);
  const observationEnd=Math.min(workEnd-8000,Date.now()+65000);
  let attemptedAt=null;
  while(Date.now()<observationEnd){
    report.workerEvents=await evaluate('window.__qaWorkerEvents||[]');
    if(report.workerEvents.some(e=>e.kind==='construct'))attemptedAt??=Date.now();
    if(attemptedAt&&Date.now()-attemptedAt>=4000)break;
    await pause(250);
  }
  report.document=await evaluate('({url:location.href,ready:document.readyState,text:document.body.innerText.slice(0,12000),canvasCount:document.querySelectorAll("canvas").length,workerEvents:window.__qaWorkerEvents||[],routeDebug:window.__shiokRouteDebug||null})');
  report.workerEvents=report.document.workerEvents;
  report.outcome=report.workerEvents.some(e=>e.kind==='construct')?'worker-attempt-observed':'no-worker-observed-within-window';
  const shot=await send('Page.captureScreenshot',{format:'png'},session,10000),bytes=Buffer.from(shot.data,'base64');
  writeFileSync(resolve(out,'observed.png'),bytes,{flag:'wx'});report.screenshot={file:'observed.png',bytes:bytes.length,sha256:sha(bytes)};
  report.observationComplete=true;
}catch(e){report.failure=e.stack;}
finally{
  closing=true;clearTimeout(watchdog);
  if(ws?.readyState===1)try{await send('Browser.close',{},'',4000);}catch(e){report.closeError=e.message;}
  ws?.close();for(const u of upstreams)u.destroy();
  if(boundary){await boundary.close();report.boundary={requests:boundary.requests,stats:boundary.stats};}
  if(canary){canary.closeAllConnections();await new Promise(done=>canary.close(done));report.canaryClosed=!canary.listening;}
  report.cleanup=cleanup(profile);chrome?.stderr?.destroy();chrome?.unref();
  if(chromeClosed)report.chromeTerminal=await Promise.race([chromeClosed,new Promise(done=>setTimeout(()=>done({unverified:true}),3000))]);
  await Promise.allSettled([...commands]);
  try{report.anchorsAfter=anchors();report.anchorsUnchanged=JSON.stringify(report.anchorsBefore)===JSON.stringify(report.anchorsAfter);}catch(e){report.failure=e.stack;}
  report.stderr=stderr;report.elapsedMs=Date.now()-started;report.totalDeadlineMet=Date.now()<=totalEnd;
  report.runCompleted=!!report.observationComplete&&!report.failure&&report.errors.length===0&&report.cleanup.verified&&report.anchorsUnchanged&&report.totalDeadlineMet&&report.canaryDirectHits===0&&report.boundary?.stats.closed===true&&report.canaryClosed===true&&!report.chromeTerminal?.unverified;
  report.appAcceptance=false;
  writeFileSync(resolve(out,'observation.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({out,runCompleted:report.runCompleted,outcome:report.outcome,failure:report.failure,workerEvents:report.workerEvents,checks:report.checks,cleanup:report.cleanup.verified,elapsedMs:report.elapsedMs,totalDeadlineMet:report.totalDeadlineMet},null,2));
  process.exitCode=report.runCompleted?0:1;
}
