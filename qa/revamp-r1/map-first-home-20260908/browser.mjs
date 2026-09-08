import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const name = process.argv[2];
if (!/^[a-z0-9-]+$/.test(name || '')) throw Error('Fresh run name required');
const out = resolve(root, 'qa/revamp-r1/map-first-home-20260908', name);
if (existsSync(out)) throw Error('Preserve previous captures');
mkdirSync(out);
const url = 'http://localhost:4320/';
const report = { url, buildId: readFileSync(resolve(root,'web/.next/BUILD_ID'),'utf8').trim(), startedAt: new Date().toISOString(), checks: [], captures: [], exceptions: [], failedRequests: [], serviceWorkerBypassed: false };
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--no-first-run','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-port=9844',`--user-data-dir=${resolve(root,'tmp/map-first-'+Date.now())}`,'about:blank'], { windowsHide: true, stdio:'ignore' });
const delay = ms => new Promise(r=>setTimeout(r,ms));
const pending = new Map(); let ws, send, evaluate;
const check = (name, pass, detail) => { report.checks.push({name,pass,detail}); console.log(pass?'PASS':'FAIL',name,JSON.stringify(detail??'')); if(!pass)throw Error(name); };
const facts = `(()=>{const m=window.__shiokRouteMap,d=window.__shiokRouteDebug,p=d?.padding;const box=p?[[p.left,p.top],[innerWidth-p.right,innerHeight-p.bottom]]:undefined;const rect=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};return {width:innerWidth,height:innerHeight,key:d?.routeKey,center:m?.getCenter(),zoom:m?.getZoom(),moving:m?.isMoving(),basemapLoaded:m?.getSource('onemap')?m.isSourceLoaded('onemap'):false,routeCount:m?.getLayer('shiokest-route-line')?m.queryRenderedFeatures(box,{layers:['shiokest-route-line']}).filter(f=>f.properties.render_key===d?.routeKey).length:0,status:document.querySelector('main')?.dataset.mapStatus,brand:rect('h1'),input:rect('#postal-search-input'),submit:rect('#postal-search-button'),dock:rect('footer'),about:rect('footer details'),body:rect('footer details > div'),panel:rect('aside'),overflow:document.documentElement.scrollWidth>innerWidth,text:document.body.innerText,worker:!!navigator.serviceWorker?.controller}})()`;
try {
  let tabs; const start=Date.now();
  while(Date.now()-start<90000){try{tabs=await(await fetch('http://127.0.0.1:9844/json')).json();break;}catch{await delay(500);}}
  if(!tabs)throw Error('Browser startup deadline');
  ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;
  send=(method,params={})=>new Promise((r,j)=>{const key=++id,t=setTimeout(()=>{pending.delete(key);j(Error('CDP timeout '+method));},30000);pending.set(key,{resolve:v=>{clearTimeout(t);r(v);},reject:e=>{clearTimeout(t);j(e);}});ws.send(JSON.stringify({id:key,method,params}));});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const q=pending.get(m.id);pending.delete(m.id);if(q)m.error?q.reject(Error(m.error.message)):q.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')report.exceptions.push(m.params.exceptionDetails.text);else if(m.method==='Network.loadingFailed')report.failedRequests.push(m.params);};
  evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const until=async expr=>{const start=Date.now();while(Date.now()-start<180000){if(await evaluate(expr))return;await delay(250);}throw Error('Condition deadline '+expr);};
  const basemap=()=>until(`window.__shiokRouteMap?.getSource('onemap') && window.__shiokRouteMap.isSourceLoaded('onemap') && !window.__shiokRouteMap.isMoving()`);
  const route=()=>until(`window.__shiokRouteMap?.getLayer('shiokest-route-line') && !window.__shiokRouteMap.isMoving() && window.__shiokRouteMap.isSourceLoaded('shiokest-route') && window.__shiokRouteMap.queryRenderedFeatures({layers:['shiokest-route-line']}).some(f=>f.properties.render_key===window.__shiokRouteDebug.routeKey)`);
  const capture=async label=>{const before=await evaluate(facts);const png=await send('Page.captureScreenshot',{format:'png'});const after=await evaluate(facts);writeFileSync(resolve(out,label+'.png'),Buffer.from(png.data,'base64'));const stable=before.key===after.key&&before.routeCount===after.routeCount&&before.zoom===after.zoom&&JSON.stringify(before.center)===JSON.stringify(after.center)&&!before.moving&&!after.moving;report.captures.push({label,before,after,stable});check('stable '+label,stable);return before;};
  const layout=f=>{check('brand beside input '+f.width,f.brand.right<=f.input.x&&Math.abs((f.brand.y+f.brand.height/2)-(f.input.y+f.input.height/2))<4);check('icon inside field '+f.width,f.submit.x>=f.input.x&&f.submit.right<=f.input.right+1&&f.submit.bottom<=f.input.bottom+1);check('bottom-center disclosure '+f.width,Math.abs(f.dock.x+f.dock.width/2-f.width/2)<2&&!f.overflow&&f.dock.bottom<=f.height-24);};
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url});await basemap();
  check('plain homepage has a basemap and no route error',await evaluate(`document.querySelector('main').dataset.mapStatus==='idle' && !document.querySelector('aside')`));
  report.initialDataRequests=await evaluate(`performance.getEntriesByType('resource').filter(r=>r.name.includes('/data/')&&(r.name.includes('/scores/')||r.name.includes('/geom/'))).map(r=>r.name)`);
  check('no score or geometry fetch before search',report.initialDataRequests.length===0,report.initialDataRequests);
  for(const [width,height]of [[390,844],[320,667],[1440,950]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(900);await basemap();layout(await capture(`empty-${width}x${height}`));}
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:667,deviceScaleFactor:1,mobile:false});await delay(700);
  await evaluate(`document.querySelector('footer summary').click()`);await delay(900);let f=await capture('about-expanded');
  check('expanded About data fits and contains source details',f.about.x>=0&&f.about.right<=f.width&&f.about.y>=f.input.bottom&&f.body.height>0&&f.text.includes('Source freshness detail'));
  await evaluate(`document.querySelector('footer summary').click();document.querySelector('#postal-search-input').focus()`);
  await send('Input.insertText',{text:'018956'});
  report.searchInput=await evaluate(`({value:document.querySelector('#postal-search-input').value,focused:document.activeElement.id,valid:document.querySelector('#postal-search-input').validity.valid})`);
  check('real postal input is focused and valid',report.searchInput.value==='018956'&&report.searchInput.focused==='postal-search-input'&&report.searchInput.valid,report.searchInput);
  await evaluate(`window.__searchEvents=[];document.querySelector('form').addEventListener('submit',()=>window.__searchEvents.push('submit'));document.querySelector('#postal-search-input').addEventListener('keydown',e=>window.__searchEvents.push(e.key))`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await until(`window.__searchEvents.includes('submit')`);report.searchEvents=await evaluate(`window.__searchEvents`);check('keyboard Enter submits the form',report.searchEvents.includes('submit'),report.searchEvents);await route();
  for(const [width,height]of [[390,667],[320,667],[1440,950]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(1200);await route();f=await capture(`selected-${width}x${height}`);layout(f);check('current selected route '+width,f.routeCount===4&&f.text.includes('81 m'));if(width<700)check('result clears About dock '+width,f.panel.bottom<f.dock.y);}
  await evaluate(`document.querySelector('footer summary').click()`);await delay(900);await route();f=await capture('selected-about');check('data disclosure does not compete with result panel',!f.panel&&f.routeCount>0);
  await evaluate(`document.querySelector('footer summary').click()`);await delay(900);await route();
  await until(`!!navigator.serviceWorker.controller`);
  await send('Page.navigate',{url});await basemap();f=await capture('return-home-worker-enabled');check('normal returning homepage still shows map',f.worker&&f.basemapLoaded&&f.status==='idle'&&!f.panel);
  await send('Page.navigate',{url:url+'?postal=018956'});await route();f=await capture('shared-postal-worker-enabled');check('normal worker-controlled shared link shows route',f.worker&&f.routeCount===4);
  check('no uncaught application exceptions',report.exceptions.length===0,report.exceptions);
} catch(e){report.failure=e.stack;process.exitCode=1;console.error(e);if(evaluate)try{report.failureState=await evaluate(facts);}catch{}}
finally {report.finishedAt=new Date().toISOString();writeFileSync(resolve(out,'browser.json'),JSON.stringify(report,null,2)+'\n');if(send&&ws?.readyState===1)try{await send('Browser.close');}catch{}ws?.close();if(chrome.exitCode===null)chrome.kill();for(const q of pending.values())q.reject(Error('shutdown'));pending.clear();process.exit(process.exitCode||0);}
