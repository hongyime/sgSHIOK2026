import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { cleanup } from '../layout-confirmation-20260909/cleanup.mjs';
const root='C:\\sgSHIOK2026';
if(process.cwd()!==root) throw Error('Wrong working root');
const origin='http://127.0.0.1:4334';
const build=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/cached-release-20260908/source-freshness-20260909-1/build.json'))).buildId;
const out=mkdtempSync(resolve(root,'qa/revamp-r1/source-freshness-20260909/browser-'));
const profile=mkdtempSync(resolve(root,'tmp/layout-confirmation-browser-'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const report={root,hostname:process.env.COMPUTERNAME,origin,build,out,profile,startedAt:new Date().toISOString(),checks:[],captures:[],errors:[],requests:[],documents:[]};
writeFileSync(resolve(out,'runner.mjs'),readFileSync(new URL(import.meta.url)),{flag:'wx'});
const started=Date.now(),deadline=started+360000,workEnd=deadline-75000,delay=ms=>new Promise(done=>setTimeout(done,ms));
let chrome,ws,sequence=0,stderr='',closing=false;
const pending=new Map();
function check(name,pass,detail){report.checks.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);if(!pass)throw Error(name);}
function send(method,params={},timeout=45000){return new Promise((done,reject)=>{
  const remaining=(closing?deadline:workEnd)-Date.now();if(remaining<=0){reject(Error('QA deadline'));return;}
  const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},Math.min(timeout,remaining));
  pending.set(id,{finish(result,error){clearTimeout(timer);pending.delete(id);error?reject(Error(error.message)):done(result);}});
  ws.send(JSON.stringify({id,method,params}));
});}
async function evaluate(fn){const result=await send('Runtime.evaluate',{expression:'('+fn.toString()+')()',returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}
async function until(action,predicate,ms=90000){let value;const end=Math.min(workEnd,Date.now()+ms);while(Date.now()<end){value=await action();if(predicate(value))return value;await delay(250);}throw Error('Condition timeout '+JSON.stringify(value));}
function facts(){
  const rect=e=>{const r=e?.getBoundingClientRect();return r?{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null;};
  const footer=document.querySelector('footer'),details=footer?.querySelector('details'),body=details?.querySelector(':scope > div'),nested=body?.querySelector('details');
  const map=window.__shiokRouteMap;
  const dateRows=[...body?.querySelectorAll(':scope > p')??[]].filter(p=>p.querySelector('strong')).map(p=>({text:p.textContent,date:p.querySelector('time')?.dateTime??null,bounds:rect(p)}));
  return {width:innerWidth,height:innerHeight,body:rect(body),footer:rect(footer),about:rect(details),open:details?.open,nestedOpen:nested?.open,
    input:rect(document.querySelector('#postal-search-input')),brand:rect(document.querySelector('h1')),credit:rect(document.querySelector('[class*=oneMapAttribution]')),
    creditLoaded:[...document.querySelectorAll('[class*=oneMapAttribution] img')].some(i=>i.complete&&i.naturalWidth>0),
    basemap:!!map?.getSource('onemap')&&map.isSourceLoaded('onemap'),tiles:map?.areTilesLoaded(),moving:map?.isMoving(),
    status:document.querySelector('main')?.dataset.mapStatus,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
    bodyScrollWidth:body?.scrollWidth,bodyClientWidth:body?.clientWidth,rows:dateRows,
    sources:[...nested?.querySelectorAll('li')??[]].map(li=>({text:li.textContent,bounds:rect(li)})),
    note:body?.textContent.includes('Static manifest-only check, not live monitoring. Checking a source does not update its data.'),
    active:document.activeElement?.textContent};
}
async function capture(name,open,nested=false){
  const ready=f=>f.basemap&&f.tiles&&!f.moving&&f.open===open&&f.nestedOpen===nested;
  await until(()=>evaluate(facts),ready);
  await evaluate(()=>new Promise((done,reject)=>{const m=window.__shiokRouteMap,timer=setTimeout(()=>reject(Error('Map idle timeout')),20000);m.once('idle',()=>{clearTimeout(timer);done(true);});m.triggerRepaint();}));
  const before=await evaluate(facts),image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}),after=await evaluate(facts),bytes=Buffer.from(image.data,'base64');
  writeFileSync(resolve(out,name+'.png'),bytes,{flag:'wx'});report.captures.push({name,bytes:bytes.length,sha256:sha(bytes),before,after});
  check(name+' stable loaded map and disclosure',ready(before)&&ready(after));
  check(name+' retained map-first layout and credit',after.brand.x<=16&&after.input.y>after.brand.bottom&&after.footer.right<=after.width&&Math.abs(after.height-after.footer.bottom-32)<1&&after.footer.bottom<=after.credit.y&&after.creditLoaded&&!after.horizontalOverflow);
  if(open){check(name+' data disclosure contained and internally scrollable',after.about.x>=0&&after.about.y>after.input.bottom&&after.about.right<=after.width&&after.bodyScrollWidth<=after.bodyClientWidth+1);
    check(name+' separate truthful date rows',JSON.stringify(after.rows.map(r=>[r.text,r.date]))===JSON.stringify([
      ['Bundle data reference: 2 Aug 2026, 05:49 SGT','2026-08-01T21:49:20.977Z'],['Bundle generated: 5 Aug 2026, 22:00 SGT','2026-08-05T14:00:15.974Z'],
      ['Publication date: Unknown',null],['Last recorded source-age check: 30 Aug 2026, 01:23 SGT','2026-08-29T17:23:22.780Z']])&&after.note);
  }
  if(open&&!nested)check(name+' all date rows visibly contained',after.rows.length===4&&after.rows.every(r=>r.bounds.height>0&&r.bounds.y>=after.body.y&&r.bounds.bottom<=after.body.bottom&&r.bounds.x>=after.body.x&&r.bounds.right<=after.body.right));
  if(nested){check(name+' real source statuses without fetch-date substitution',JSON.stringify(after.sources.map(s=>s.text))===JSON.stringify([
    'Covered Linkway: 6 Mar 2026, 16:24 SGT. Stale at that check.','MRT/LRT exits: 19 Jul 2026, 10:06 SGT. Within threshold at that check.','Bus Stops: Unknown. Update date unknown.']));
    check(name+' all source rows visible inside scroll owner',after.sources.every(s=>s.bounds.y>=after.body.y&&s.bounds.bottom<=after.body.bottom&&s.bounds.x>=after.body.x&&s.bounds.right<=after.body.right));
  }
}
try{
  const response=await fetch(origin+'/__qa/status',{signal:AbortSignal.timeout(5000)});report.preview=await response.json();
  check('expected built preview',response.ok&&report.preview.build===build&&typeof build==='string');
  chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-networking','--disable-component-update','--disable-sync','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,TEMP:profile,TMP:profile}});
  report.chromePid=chrome.pid;chrome.stderr.on('data',data=>{stderr+=data;});
  const endpoint=await until(async()=>/DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1],Boolean,40000);
  const tabs=await(await fetch('http://'+new URL(endpoint).host+'/json',{signal:AbortSignal.timeout(5000)})).json();
  ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((done,reject)=>{
    const timer=setTimeout(()=>reject(Error('WebSocket handshake timeout')),Math.max(1,Math.min(15000,workEnd-Date.now())));
    ws.onopen=()=>{clearTimeout(timer);done();};ws.onerror=()=>{clearTimeout(timer);reject(Error('WebSocket handshake failed'));};
  });
  ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id)pending.get(m.id)?.finish(m.result,m.error);
    else if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params.exceptionDetails);
    else if(m.method==='Network.requestWillBeSent')report.requests.push({url:m.params.request.url,method:m.params.request.method,type:m.params.type});
    else if(m.method==='Network.responseReceived'&&m.params.type==='Document')report.documents.push({id:m.params.requestId,url:m.params.response.url,status:m.params.response.status});
  };
  ws.onclose=()=>{for(const p of [...pending.values()])p.finish(null,{message:'CDP closed'});if(!closing)report.unexpectedClose=true;};
  for(const domain of ['Page','Runtime','Network'])await send(domain+'.enable');
  await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Network.setBypassServiceWorker',{bypass:true});
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:950,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:origin+'/'});
  await capture('closed-desktop',false);
  const doc=report.documents.at(-1),body=await send('Network.getResponseBody',{requestId:doc.id}),html=Buffer.from(body.body,body.base64Encoded?'base64':'utf8');
  writeFileSync(resolve(out,'document.html'),html,{flag:'wx'});doc.bytes=html.length;doc.sha256=sha(html);doc.buildPresent=html.includes(Buffer.from(build));
  check('actual Document matches build',doc.status===200&&doc.url===origin+'/'&&doc.buildPresent);
  for(const [width,height]of [[1440,950],[390,844],[320,667]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await evaluate(()=>{const d=document.querySelector('footer details');if(!d.open)d.querySelector(':scope > summary').click();d.querySelector(':scope > div').scrollTop=0;});
    await capture('dates-'+width+'x'+height,true);
    await evaluate(()=>{const d=document.querySelector('footer details details');d.querySelector('summary').click();d.scrollIntoView({block:'start'});});
    await capture('sources-'+width+'x'+height,true,true);
    await evaluate(()=>{document.querySelector('footer details details > summary').click();document.querySelector('footer > details > summary').click();});
  }
  check('no application exceptions, API calls, or score/geometry reads',!report.errors.length&&!report.unexpectedClose&&report.requests.every(r=>r.method==='GET'&&!new URL(r.url).pathname.startsWith('/api/')&&!/\/data\/.*\/(scores|geom)\//.test(new URL(r.url).pathname)));
}catch(error){report.failure=error.stack;console.error(error.stack);}
finally{
  closing=true;if(ws?.readyState===WebSocket.OPEN)try{await send('Browser.close',{},5000);}catch(error){report.closeError=error.message;}ws?.close();
  report.cleanup=cleanup(profile);report.stderr=stderr;report.elapsedMs=Date.now()-started;
  report.ok=!report.failure&&!report.errors.length&&!report.unexpectedClose&&report.checks.every(c=>c.pass)&&report.cleanup.verified&&report.captures.length===7;
  report.limits='Desktop/narrow-viewport Chrome/SwiftShader functional checks, cache/SW bypass, no physical-device or performance claim. Existing basemap traffic is not a new source-age check.';
  writeFileSync(resolve(out,'browser.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({out,ok:report.ok,checks:report.checks.length,captures:report.captures.length,elapsedMs:report.elapsedMs,cleanup:report.cleanup.verified}));process.exit(report.ok?0:1);
}
