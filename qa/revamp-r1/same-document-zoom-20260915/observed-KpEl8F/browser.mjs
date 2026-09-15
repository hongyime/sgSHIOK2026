import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createServer } from 'node:http';
import { ROOT, BASE, POWERSHELL, METRICS, BUDGET, config, ownedProfile, sameSelection, nativeZoom, allMetrics, transition } from './contract.mjs';
import * as probes from './probes.mjs';

assert.equal(process.cwd(),ROOT,'Wrong working root');
assert.equal(process.argv[2],'--go','No browser without parent exact target and explicit --go');
const configPath=process.argv[3];
assert.ok(configPath && dirname(configPath)===BASE && configPath.endsWith('.json'),'Config must be a new file in the owned QA directory');
const target=config(JSON.parse(readFileSync(configPath,'utf8')));
const out=process.argv[4]??mkdtempSync(resolve(BASE,'observed-')),profile=resolve(out,'profile');
assert.ok(ownedProfile(profile));mkdirSync(profile);mkdirSync(resolve(profile,'tmp'));
const write=(name,bytes)=>writeFileSync(resolve(out,name),bytes,{flag:'wx'});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const started=Date.now(),workEnd=started+BUDGET.work,deadline=workEnd+BUDGET.cleanup;
const report={root:ROOT,hostname:process.env.COMPUTERNAME,out,profile,startedAt:new Date(started).toISOString(),target,
  scope:'Same-document native Windows Chrome shortcuts100->200->100%, keyboard map and complete metric reading. No CSS/page-scale/device-metric emulation. Exact local candidate; no remote calls, physical-phone, screen-reader or performance claim.',
  budget:BUDGET,checks:[],captures:[],transitions:[],errors:[],denied:[],requests:[],localReplies:[],events:[],passed:false};
write('browser.mjs',readFileSync(new URL(import.meta.url)));write('config.json',JSON.stringify(target,null,2)+'\n');
report.harnessSources=Object.fromEntries(['browser.mjs','contract.mjs','probes.mjs','native-shortcut.ps1','processes.ps1'].map(name=>[name,hash(readFileSync(resolve(BASE,name)))]));
const env=Object.fromEntries(['SystemRoot','WINDIR','SystemDrive','USERPROFILE','APPDATA','LOCALAPPDATA','ProgramData','ProgramFiles','ProgramFiles(x86)','ProgramW6432','PATH','ComSpec','PSModulePath'].filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
env.TEMP=env.TMP=resolve(profile,'tmp');
const delay=ms=>new Promise(done=>setTimeout(done,ms));
let chrome,chromeExited,ws,session,sequence=0,closing=false,proxy;
const sockets=new Set(),pending=new Map();
const timeout=(promise,ms,label)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' timeout')),ms);})]).finally(()=>clearTimeout(timer));};
function send(method,params={},sid=session,ms=10000) {
  assert.ok(!['Emulation.setDeviceMetricsOverride','Emulation.setPageScaleFactor'].includes(method),'Forbidden zoom substitute');
  const remaining=(closing?deadline:workEnd)-Date.now();assert.ok(remaining>0,'Aggregate QA deadline');
  const id=++sequence;
  return timeout(new Promise((done,reject)=>{pending.set(id,{done,reject});ws.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));}),Math.min(ms,remaining),method).finally(()=>pending.delete(id));
}
async function evaluate(fn) {
  const result=await send('Runtime.evaluate',{expression:'('+fn.toString()+')()',returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;
}
function check(name,passed,detail) {report.checks.push({name,passed:!!passed,detail});console.log((passed?'PASS ':'FAIL ')+name);assert.ok(passed,name);}
async function until(name,get,accept,ms=15000) {
  const end=Math.min(workEnd,Date.now()+ms);
  while(Date.now()<end){const value=await get();report.last={name,value};if(accept(value))return value;await delay(150);}
  throw Error(name+' timeout');
}
function powershell(file,args=[],ms=15000) {
  const remaining=(closing?deadline:workEnd)-Date.now();assert.ok(remaining>0,'Native helper deadline');
  const stdout=execFileSync(POWERSHELL,['-NoProfile','-NonInteractive','-File',resolve(BASE,file),...args],{cwd:ROOT,windowsHide:true,env,encoding:'utf8',timeout:Math.min(ms,remaining),maxBuffer:1024*1024});
  return JSON.parse(stdout.replace(/^\uFEFF/,''));
}
function native(action) {
  const value=powershell('native-shortcut.ps1',['-BrowserPid',String(chrome.pid),'-Profile',profile,'-Action',action]);
  report.events.push({kind:'native',action,value,atMs:Date.now()-started});return value;
}
const ready=f=>f.status==='ready'&&f.count>0&&f.keys.length===1&&f.keys[0]===f.routeKey&&f.basemap&&f.tiles&&!f.moving;
async function settled(name,ms=45000) {
  let prior,stable=0;
  return until(name,()=>evaluate(probes.facts),f=>{const identity=JSON.stringify([f.routeKey,f.timeOrigin,f.inner,f.geometry]);stable=ready(f)?identity===prior?stable+1:1:0;prior=identity;return stable>=3;},ms);
}
async function capture(name) {
  const before=await settled(name),focus=await evaluate(probes.focusFacts),metrics=await evaluate(probes.metricFacts);
  const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}),bytes=Buffer.from(image.data,'base64');
  const after=await evaluate(probes.facts);write(name+'.png',bytes);
  report.captures.push({name,bytes:bytes.length,sha256:hash(bytes),before,after,focus,metrics});
  check(name+' current selected route stable across capture',ready(after)&&sameSelection(before,after),{before,after});
  check(name+' no horizontal page overflow',!after.overflow);
  return {before:metrics,after:await evaluate(probes.metricFacts)};
}
async function key(key,code,vk) {
  await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key,code,windowsVirtualKeyCode:vk});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:vk});
}
async function tabToCanvas() {
  for(let i=0;i<50;i++) {const focus=await evaluate(probes.focusFacts);if(focus.tag==='CANVAS') {check('keyboard focus reaches visible map canvas',focus.visible&&focus.focusVisible&&parseFloat(focus.outlineWidth)>0,focus);return;}await key('Tab','Tab',9);}
  throw Error('Map canvas unreachable by keyboard');
}
function sourceHashes() {
  return target.sources.map(source=>{const actual=hash(readFileSync(resolve(ROOT,source.path)));assert.equal(actual,source.sha256,source.path);return {...source,actual};});
}
const replies=new Map((target.localReplies??[]).map(reply=>{const bytes=readFileSync(resolve(ROOT,reply.path));assert.equal(hash(bytes),reply.sha256,reply.path);return [reply.url,bytes];}));
try {
  report.sourcesBefore=sourceHashes();
  report.memory=JSON.parse(execFileSync(POWERSHELL,['-NoProfile','-NonInteractive','-Command','Get-CimInstance Win32_OperatingSystem | Select-Object FreePhysicalMemory | ConvertTo-Json -Compress'],{cwd:ROOT,env,windowsHide:true,encoding:'utf8',timeout:10000}));
  assert.ok(report.memory.FreePhysicalMemory>=1048576,'Before browser requires 1GiB free; no retries');
  const response=await fetch(target.origin+'/__qa/status',{redirect:'error',signal:AbortSignal.timeout(5000)});
  assert.equal(response.status,200);report.preview=await response.json();assert.equal(report.preview.buildId,target.buildId,'Exact preview identity');
  proxy=createServer((req,res)=>{req.resume();report.denied.push({kind:'proxy',url:req.url});res.writeHead(403).end();});
  proxy.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
  proxy.on('connect',(req,socket)=>{report.denied.push({kind:'connect',url:req.url});socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');});
  await new Promise((done,reject)=>{proxy.once('error',reject);proxy.listen(0,'127.0.0.1',done);});
  const args=['--no-first-run','--no-default-browser-check','--disable-extensions','--disable-default-apps','--disable-background-networking','--disable-component-update','--disable-sync','--disable-breakpad','--disable-crash-reporter','--disable-quic','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1440,950','--force-device-scale-factor=1',
    `--proxy-server=http://127.0.0.1:${proxy.address().port}`,'--proxy-bypass-list=127.0.0.1;localhost','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
    '--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,`--crash-dumps-dir=${profile}`,`--log-file=${resolve(profile,'chrome.log')}`,'about:blank'];
  report.chromeArguments=args;
  // Headed window is required for actual browser accelerators. It is initially hidden by the spawn flag;
  // the guarded native helper reveals only this owned window before sending its first shortcut.
  chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',args,{cwd:ROOT,env,windowsHide:true,stdio:'ignore'});
  write('owned-child.json',JSON.stringify({pid:chrome.pid,profile})+'\n');
  report.chromePid=chrome.pid;chromeExited=new Promise(done=>chrome.once('exit',(code,signal)=>{report.chromeExit={code,signal};done();}));
  const portPath=resolve(profile,'DevToolsActivePort');
  await until('owned Chrome startup',async()=>existsSync(portPath),Boolean,20000);
  const [port,path]=readFileSync(portPath,'utf8').trim().split(/\r?\n/);ws=new WebSocket(`ws://127.0.0.1:${port}${path}`);
  ws.onmessage=event=>{
    const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(m.error)p?.reject(Error(m.error.message));else p?.done(m.result);return;}
    const p=m.params,sid=m.sessionId;
    if(m.method==='Runtime.exceptionThrown')report.errors.push(p.exceptionDetails);
    if(m.method==='Page.frameNavigated'&&!p.frame.parentId)report.events.push({kind:'navigation',frame:p.frame,atMs:Date.now()-started});
    if(m.method==='Target.attachedToTarget'&&p.waitingForDebugger)void (async()=>{
      await send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]},p.sessionId);
      await send('Runtime.enable',{},p.sessionId);
      await send('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:true,flatten:true},p.sessionId);
      await send('Runtime.runIfWaitingForDebugger',{},p.sessionId);
    })().catch(error=>report.errors.push({worker:error.message}));
    if(m.method==='Fetch.requestPaused')void (async()=>{
      const url=new URL(p.request.url),method=p.request.method;
      assert.ok(report.requests.length<20000,'Request record bound');report.requests.push({url:url.href,method});
      if(replies.has(url.href)&&method==='GET') {
        const bytes=replies.get(url.href);report.localReplies.push({url:url.href,sha256:hash(bytes),bytes:bytes.length});
        await send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'image/png'}],body:bytes.toString('base64')},sid);return;
      }
      const allowed=['GET','HEAD'].includes(method)&&url.origin===target.origin&&!url.username&&!url.password&&!url.pathname.startsWith('/api/');
      if(!allowed)report.denied.push({kind:'page',url:url.href,method});
      await send(allowed?'Fetch.continueRequest':'Fetch.failRequest',allowed?{requestId:p.requestId}:{requestId:p.requestId,errorReason:'BlockedByClient'},sid);
    })().catch(error=>report.errors.push({interception:error.message}));
  };
  ws.onclose=()=>{for(const item of pending.values())item.reject(Error('CDP closed'));pending.clear();};
  await timeout(new Promise((done,reject)=>{ws.onopen=done;ws.onerror=reject;}),5000,'CDP');
  const targets=await send('Target.getTargets',{},null),page=targets.targetInfos.find(t=>t.type==='page'&&t.url==='about:blank');assert.ok(page);
  session=(await send('Target.attachToTarget',{targetId:page.targetId,flatten:true},null)).sessionId;
  for(const domain of ['Page','Runtime','Network'])await send(domain+'.enable');
  await send('Network.setBypassServiceWorker',{bypass:true});
  await send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
  await send('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:true,flatten:true});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:'('+probes.installProbe.toString()+')()'});
  report.initialNative=native('reset');
  await send('Page.navigate',{url:target.target});
  const initial=await settled('initial exact saved route',120000);
  check('selected explicit saved MRT exit loaded',initial.destination?.includes('Exit E')&&initial.postal==='018956'&&initial.pressed==='MRT/LRT exits',initial);
  check('initial browser page zoom100%',initial.dpr===1&&initial.scale===1&&initial.reduced,initial);
  await tabToCanvas();report.markedFocus=await evaluate(probes.markFocus);
  const baseline=await evaluate(probes.facts),windowBaseline=native('inspect');
  const expectedMetrics=Object.fromEntries((await evaluate(probes.metricFacts)).map(m=>[m.label,m.value]));
  assert.deepEqual(Object.keys(expectedMetrics),METRICS);report.expectedMetrics=expectedMetrics;
  const readings={};
  async function readMetrics(label) {
    const captures=[];
    for(let n=0;n<14;n++) {
      captures.push(await capture(label+'-metrics-'+n));
      if(allMetrics(captures,expectedMetrics))break;
      const point=await evaluate(probes.wheelPoint);
      await send('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:56});await delay(150);
    }
    readings[label]=captures;check(label+' all four complete metric values read',allMetrics(captures,expectedMetrics),captures);
  }
  await readMetrics('100-before');
  const zoomIn=await transition({snapshot:()=>evaluate(probes.facts),shortcut:native,wait:factor=>until('native DPR '+factor,()=>evaluate(probes.facts),f=>Math.abs(f.dpr-factor)<.02,5000),factor:2});
  report.transitions.push(zoomIn);await settled('200 percent route');
  const doubled=await evaluate(probes.facts),windowDoubled=native('inspect');
  check('native200% unchanged physical window with doubled DPR',nativeZoom(baseline,doubled,2,windowBaseline,windowDoubled),{baseline,doubled,windowBaseline,windowDoubled});
  check('native200% exact original DOM focus remains visible',(await evaluate(probes.focusFacts)).visible&&doubled.focusSame,await evaluate(probes.focusFacts));
  await readMetrics('200');
  const cameraStart=await evaluate(probes.camera);report.camera=[{step:'before',...cameraStart}];
  await key('ArrowRight','ArrowRight',39);const right=await until('keyboard right',()=>evaluate(probes.camera),c=>!c.moving&&c.lng>cameraStart.lng+.000001);report.camera.push({step:'right',...right});
  await key('ArrowLeft','ArrowLeft',37);const left=await until('keyboard left',()=>evaluate(probes.camera),c=>!c.moving&&c.lng<right.lng-.000001);report.camera.push({step:'left',...left});
  await key('=','Equal',187);const zoomed=await until('keyboard camera zoom in',()=>evaluate(probes.camera),c=>!c.moving&&c.zoom>left.zoom+.01);report.camera.push({step:'zoom-in',...zoomed});
  await key('-','Minus',189);const unzoomed=await until('keyboard camera zoom out',()=>evaluate(probes.camera),c=>!c.moving&&c.zoom<zoomed.zoom-.01);report.camera.push({step:'zoom-out',...unzoomed});
  check('keyboard camera preserves saved selection and URL',report.camera.every(c=>c.url===cameraStart.url&&c.routeKey===cameraStart.routeKey),report.camera);
  check('camera keys are not browser zoom',(await evaluate(probes.facts)).dpr===2);
  await capture('200-keyboard-camera');
  const reset=await transition({snapshot:()=>evaluate(probes.facts),shortcut:native,wait:factor=>until('native reset DPR',()=>evaluate(probes.facts),f=>Math.abs(f.dpr-factor)<.02,5000),factor:1});report.transitions.push(reset);
  await settled('100 percent restored route');const restored=await evaluate(probes.facts),windowRestored=native('inspect');
  check('native100% restores viewport/window/DPR',nativeZoom(baseline,restored,1,windowBaseline,windowRestored),{baseline,restored,windowBaseline,windowRestored});
  check('entire zoom cycle preserved document URL saved selection and exact focus',sameSelection(baseline,restored,{focus:true}),{baseline,restored});
  await readMetrics('100-after');report.metricReadings=readings;
  await key('Tab','Tab',9);const exit=await evaluate(probes.focusFacts);
  check('Tab leaves keyboard map with visible focus',exit.tag!=='CANVAS'&&exit.visible&&exit.focusVisible,exit);await capture('100-keyboard-exit');
  check('one selected document only',report.events.filter(e=>e.kind==='navigation'&&e.frame.url===target.target).length===1,report.events.filter(e=>e.kind==='navigation'));
  check('no provider or unexpected requests',report.denied.length===0&&report.errors.length===0,{denied:report.denied,errors:report.errors});
  report.passed=true;
} catch(error) {report.failure=error.stack;console.error(error.stack);}
finally {
  closing=true;
  if(chrome?.pid) {
    try {
      const owned=powershell('processes.ps1',['-BrowserPid',String(chrome.pid),'-Profile',profile,'-Phase','snapshot'],8000);
      write('owned-before-close.json',JSON.stringify(owned,null,2)+'\n');
      if(ws?.readyState===1)try{await send('Browser.close',{},null,4000);}catch(error){report.closeError=error.message;}
      if(chromeExited)try{await timeout(chromeExited,8000,'owned Chrome exit');}catch(error){report.exitWait=error.message;}
      report.cleanup=powershell('processes.ps1',['-BrowserPid',String(chrome.pid),'-Profile',profile,'-Phase','cleanup','-Receipt',resolve(out,'owned-before-close.json')],35000);
    }catch(error){report.cleanup={verified:false,error:error.stack};}
  } else report.cleanup={verified:true,noBrowserStarted:true};
  ws?.close();for(const item of pending.values())item.reject(Error('QA closed'));pending.clear();
  for(const socket of sockets)socket.destroy();
  if(proxy)await timeout(new Promise(done=>proxy.close(done)),2000,'proxy cleanup').catch(error=>{report.proxyCleanupError=error.message;});
  try{report.sourcesAfter=sourceHashes();report.sourcesUnchanged=JSON.stringify(report.sourcesBefore)===JSON.stringify(report.sourcesAfter);}catch(error){report.sourcesError=error.message;}
  report.elapsedMs=Date.now()-started;
  report.passed=report.passed&&report.cleanup.verified&&report.sourcesUnchanged&&!report.proxyCleanupError&&report.elapsedMs<=BUDGET.total;
  write('browser.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({out,passed:report.passed,checks:report.checks.length,captures:report.captures.length,cleanup:report.cleanup,elapsedMs:report.elapsedMs},null,2));
  process.exitCode=report.passed?0:1;
}
