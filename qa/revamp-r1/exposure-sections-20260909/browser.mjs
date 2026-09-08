import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { decodePolyline } from '../../../web/lib/polyline.ts';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [label, build] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label || '') || !/^[\w-]+$/.test(build || '')) throw Error('Fresh label and expected build required');
const out = resolve(root, 'qa/revamp-r1/exposure-sections-20260909', `${label}-${Date.now()}`);
mkdirSync(out);
const profile = mkdtempSync(resolve(root, 'tmp/exposure-browser-'));
const origin = 'http://127.0.0.1:4326';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fixture = JSON.parse(readFileSync(resolve(root, 'web/lib/__tests__/fixtures/published-options.json'), 'utf8'));
const fragment = fixture['geom/h3/886520db39fffff.json'][0].exposure_gaps.slice().sort((a,b) => b.len_m-a.len_m)[0];
const expectedCoordinates = decodePolyline(fragment.geom).map(([lat,lon]) => [lon,lat]);
const report = { root, hostname: process.env.COMPUTERNAME, build, out, profile, startedAt: new Date().toISOString(),
  checks: [], captures: [], actions: [], errors: [], network: [], cleanup: {},
  policy: 'Functional CDP test of actual build and immutable published data. Fresh profile, SwiftShader, source-write instrumentation only. No representative timing, installation, pipeline or deployment claim.' };
let chrome, ws, id = 0, stderr = '';
const pending = new Map(), delay = ms => new Promise(done => setTimeout(done,ms));
const deadline = Date.now()+600000;
function check(name, pass, detail) { report.checks.push({name,pass:!!pass,detail}); console.log(`${pass?'PASS':'FAIL'} ${name}`); if(!pass)throw Error(name); }
function send(method, params={}) {
  return new Promise((done,reject) => {
    const n=++id, timer=setTimeout(()=>{pending.delete(n);reject(Error('CDP timeout: '+method))},45000);
    pending.set(n,{done:value=>{clearTimeout(timer);done(value)},reject:error=>{clearTimeout(timer);reject(error)}});
    ws.send(JSON.stringify({id:n,method,params}));
  });
}
async function evaluate(expression) {
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
  return r.result.value;
}
const facts=`(async () => {
  if(!document.documentElement)return{status:'document_pending'};
  const map=window.__shiokRouteMap,d=window.__shiokRouteDebug,s=document.querySelector('[aria-label="Walk summary"]');
  const group=document.querySelector('[aria-label="Mapped exposed sections"]'),details=group?.closest('details');
  const rect=n=>{const r=n?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null};
  const query=layers=>{try{return map?.queryRenderedFeatures({layers})||[]}catch{return[]}};
  const activeData=await map?.getSource('active-exposure-gap')?.getData?.();
  const walkData=await map?.getSource('shiokest-route')?.getData?.();
  const active=activeData?.features||[];
  const focus=active.find(f=>f.geometry.type==='LineString');
  const projected=focus?.geometry.coordinates.map(p=>map.project(p))||[];
  const padding=d?.padding||{top:0,bottom:0,left:0,right:0};
  const walkPoints=(walkData?.features||[]).flatMap(f=>f.geometry.coordinates.map(p=>map.project(p)));
  const inside=p=>p.x>=padding.left&&p.x<=innerWidth-padding.right&&p.y>=padding.top&&p.y<=innerHeight-padding.bottom;
  return{url:location.href,status:document.querySelector('main')?.dataset.mapStatus,name:s?.querySelector('p strong')?.textContent,
    metrics:s?[...s.querySelectorAll('div > strong')].map(n=>n.textContent):[],routeKey:d?.routeKey,
    routeFeatures:query(['shiokest-route-line','shortest-route-line']).filter(f=>f.properties?.render_key===d?.routeKey).length,
    basemap:!!map?.getSource('onemap')&&map.isSourceLoaded('onemap'),moving:map?.isMoving(),center:map?.getCenter(),zoom:map?.getZoom(),
    active,focusRendered:query(['active-exposure-section-line']).filter(f=>f.properties?.key===focus?.properties.key).length,
    projected,focusFits:projected.length>1&&projected.every(inside),walkFits:walkPoints.length>1&&walkPoints.every(inside),
    sectionOpen:details?.open,sectionButtons:group?[...group.querySelectorAll('button')].map(n=>({text:n.textContent,pressed:n.getAttribute('aria-pressed'),rect:rect(n)})):[],
    focusText:document.activeElement?.textContent,focusId:document.activeElement?.id,overflow:document.documentElement.scrollWidth>innerWidth,
    viewport:[innerWidth,innerHeight],padding,search:rect(document.querySelector('form')),panel:rect(document.querySelector('aside')),
    writes:window.__qaExposureWrites||[]};
})()`;
async function waitFor(name, predicate, limit=70000) {
  const end=Math.min(deadline,Date.now()+limit);let value;
  while(Date.now()<end) {
    value=await evaluate(facts);
    report.lastSample={name,value};
    if(value.status==='ready'&&value.basemap&&!value.moving&&value.routeFeatures>0&&predicate(value))return value;
    await delay(500);
  }
  check(name,false,value);
}
const summaryNamed=name=>`[...document.querySelectorAll('summary')].find(n=>n.textContent.startsWith(${JSON.stringify(name)}))`;
async function click(expression, keyboard=true) {
  const hit=await evaluate(`(()=>{const n=${expression};if(!n)return{missing:true};n.focus({preventScroll:true});n.scrollIntoView({block:'nearest'});const r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return{x,y,text:n.textContent,hit:document.elementFromPoint(x,y)?.closest('button,summary')===n}})()`);
  check('control hit: '+hit.text,hit.hit,hit);report.actions.push({...hit,keyboard});
  if(keyboard) {
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  } else {
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:hit.x,y:hit.y,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:hit.x,y:hit.y,button:'left',clickCount:1});
  }
  await evaluate('new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))');
}
async function capture(name, focused=false) {
  await evaluate('document.fonts.ready.then(()=>true)');
  const before=await evaluate(facts),shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  const bytes=Buffer.from(shot.data,'base64'),path=resolve(out,name+'.png');writeFileSync(path,bytes,{flag:'wx'});
  const after=await evaluate(facts);report.captures.push({name,path,bytes:bytes.length,sha256:sha(bytes),before,after});
  check(name+' current route during capture',before.routeKey===after.routeKey&&before.routeFeatures>0&&after.routeFeatures>0,{before,after});
  check(name+' equal-width stack without overflow',!after.overflow&&Math.abs(after.search.width-after.panel.width)<=2,after);
  if(focused)check(name+' exact section visible and framed',before.focusRendered>0&&after.focusRendered>0&&after.focusFits&&
    JSON.stringify(after.active[0]?.geometry.coordinates)===JSON.stringify(expectedCoordinates),after);
}
try {
  const status=await(await fetch(origin+'/__qa/status')).json();check('served expected build',status.build===build,status);
  chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],
    {cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,TEMP:profile,TMP:profile}});
  report.chromePid=chrome.pid;chrome.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-12000)});
  const start=Date.now();let tabs;
  while(Date.now()-start<40000&&!tabs) {
    const endpoint=/DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1];
    if(endpoint){const url=new URL(endpoint);url.protocol='http:';url.pathname='/json';tabs=await(await fetch(url)).json()}else await delay(250);
  }
  const target=tabs?.find(tab=>tab.type==='page');if(!target)throw Error('Owned browser did not start');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((done,reject)=>{ws.onopen=done;ws.onerror=reject});
  ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(p)m.error?p.reject(Error(m.error.message)):p.done(m.result);return}
    if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params);
    if(m.method==='Network.responseReceived'&&report.network.length<1000){const r=m.params.response;report.network.push({requestId:m.params.requestId,url:r.url,status:r.status,type:m.params.type})}};
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin+'/?postal=018956&transit=bus'});
  let current=await waitFor('initial bus walk',r=>r.name==='Bayfront Stn Exit B/MBS',180000);
  const document=report.network.findLast(r=>r.type==='Document'),body=await send('Network.getResponseBody',{requestId:document.requestId});
  const html=Buffer.from(body.body,body.base64Encoded?'base64':'utf8');report.document={...document,bytes:html.length,sha256:sha(html)};
  check('actual HTML contains expected build',html.toString('utf8').includes(build));
  check('logical metrics remain published values',JSON.stringify(current.metrics)===JSON.stringify(['81 m','55%','37 m','20 m']),current.metrics);
  await capture('walk-390x844');
  await evaluate(`(()=>{window.__qaExposureWrites=[];for(const id of ['shortest-route','shiokest-route','exposure-gaps','transit-node','active-exposure-gap']){const source=window.__shiokRouteMap.getSource(id),original=source.setData;source.setData=function(...args){window.__qaExposureWrites.push(id);return original.apply(this,args)}}})()`);
  await click(summaryNamed('Mapped exposed sections'));
  current=await waitFor('expanded explorer',r=>r.sectionOpen===true);
  check('three real mapped sections',current.sectionButtons.length===3,current.sectionButtons);
  await click(`document.querySelector('[aria-label="Mapped exposed sections"] button')`);
  await waitFor('selected section',r=>r.focusRendered>0&&r.focusFits);
  for(const [width,height] of [[1440,950],[390,844],[390,667],[320,667]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await waitFor('resized section',r=>r.focusRendered>0&&r.focusFits);
    await capture(`section-${width}x${height}`,true);
  }
  current=await evaluate(facts);check('section selection/layout made no base-route writes',current.writes.every(id=>id==='active-exposure-gap'),current.writes);
  const beforePanCenter=current.center;
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:170,y:540});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:170,y:540,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:205,y:520,button:'left',buttons:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:205,y:520,button:'left',clickCount:1});
  current=await waitFor('intentional pan settled',r=>r.focusRendered>0);
  const pannedCenter=current.center;
  check('native gesture moved the map',JSON.stringify(pannedCenter)!==JSON.stringify(beforePanCenter),{beforePanCenter,pannedCenter});
  await evaluate(`(()=>{const input=document.querySelector('#postal-search-input');input.focus();input.select()})()`);
  await send('Input.insertText',{text:'018955'});await delay(700);
  current=await evaluate(facts);check('unrelated query edit does not undo pan',JSON.stringify(current.center)===JSON.stringify(pannedCenter),{pannedCenter,current:current.center});
  await click(`[...document.querySelectorAll('button')].find(n=>n.textContent==='Back to walk')`);
  current=await waitFor('back to whole walk',r=>r.active.length===0&&r.walkFits);
  check('back restores keyboard focus to disclosure',current.focusText?.startsWith('Mapped exposed sections'),current.focusText);
  await capture('back-to-walk-320x667');
  await click(`document.querySelector('[aria-label="Mapped exposed sections"] button')`);
  await waitFor('section selected again',r=>r.focusRendered>0);
  await click(summaryNamed('Mapped exposed sections'));
  current=await waitFor('closed explorer',r=>r.active.length===0&&r.sectionOpen===false&&r.walkFits);
  check('closing returns keyboard focus',current.focusText?.startsWith('Mapped exposed sections'),current.focusText);
  await capture('closed-320x667');
  // Programmatic replacement deliberately leaves native focus in the outgoing
  // explorer, reproducing the DOM-removal boundary of a deferred response.
  await click(summaryNamed('Mapped exposed sections'));
  await waitFor('reopened explorer',r=>r.sectionOpen===true);
  await click(`document.querySelector('[aria-label="Mapped exposed sections"] button')`);
  await waitFor('focused before replacement',r=>r.focusRendered>0);
  await evaluate(`(()=>{const n=[...document.querySelectorAll('[aria-label="Transit stop or exit type"] button')].find(n=>n.querySelector('span')?.textContent==='MRT/LRT exits');if(!n)throw Error('Missing MRT control');n.click()})()`);
  report.actions.push({kind:'programmatic replacement with native focus retained',target:'MRT/LRT exits'});
  current=await waitFor('MRT replacement',r=>r.name==='BAYFRONT MRT STATION Exit E'&&r.active.length===0);
  check('context replacement restores focus to stable walk control',current.focusText==='Walk details',current.focusText);
  await click(summaryNamed('Mapped exposed sections'));
  await waitFor('MRT explorer opened',r=>r.sectionOpen===true);
  await click(`document.querySelector('[aria-label="Mapped exposed sections"] button')`);
  await waitFor('MRT section focused',r=>r.focusRendered>0);
  await evaluate(`(()=>{const n=[...document.querySelectorAll('button')].find(n=>n.textContent==='Shortest walk');if(!n)throw Error('Missing shortest control');n.click()})()`);
  report.actions.push({kind:'programmatic replacement with native focus retained',target:'Shortest walk'});
  current=await waitFor('shortest replacement',r=>r.active.length===0&&!r.sectionOpen&&r.metrics[2]==='Unavailable');
  check('unavailable explorer removal restores focus',current.focusText==='Walk details',current.focusText);
  await capture('shortest-focus-return-320x667');
  await evaluate(`(()=>{[...document.querySelectorAll('button')].find(n=>n.textContent==='Sheltered walk').click()})()`);
  await waitFor('sheltered restored',r=>r.metrics[2]!=='Unavailable');
  await evaluate(`(()=>{document.querySelector('#postal-search-input').focus();[...document.querySelectorAll('[aria-label="Transit stop or exit type"] button')].find(n=>n.querySelector('span')?.textContent==='Bus stops').click()})()`);
  report.actions.push({kind:'programmatic replacement with focus outside explorer',target:'Bus stops'});
  current=await waitFor('bus restored without focus steal',r=>r.name==='Bayfront Stn Exit B/MBS');
  check('outside keyboard focus is not stolen',current.focusId==='postal-search-input',current.focusId);
  check('no uncaught browser error',report.errors.length===0,report.errors);
  const final=await(await fetch(origin+'/__qa/status')).json();check('no live preview request',!final.requests.some(r=>r.path.startsWith('/api/')),final.requests.filter(r=>r.path.startsWith('/api/')));
} catch(error){
  report.failure=error.stack;console.error(error.stack);
  if(ws?.readyState===1)try{
    const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    const bytes=Buffer.from(shot.data,'base64'),path=resolve(out,'failure.png');writeFileSync(path,bytes,{flag:'wx'});
    report.failureCapture={path,bytes:bytes.length,sha256:sha(bytes),claim:'Failure diagnostic only, not an accepted view'};
  }catch(captureError){report.failureCaptureError=captureError.message}
}
finally {
  if(ws?.readyState===1)try{await send('Browser.close');report.cleanup.closeSent=true}catch(error){report.cleanup.closeError=error.message}
  if(chrome){let end=Date.now()+5000;while(chrome.exitCode===null&&chrome.signalCode===null&&Date.now()<end)await delay(100);
    if(chrome.exitCode===null&&chrome.signalCode===null){report.cleanup.killSent=chrome.kill();end=Date.now()+5000;while(chrome.exitCode===null&&chrome.signalCode===null&&Date.now()<end)await delay(100)}
    report.cleanup.chromeExited=chrome.exitCode!==null||chrome.signalCode!==null}
  ws?.close();for(const p of pending.values())p.reject(Error('Acceptance ended'));pending.clear();
  report.stderr=stderr;report.finishedAt=new Date().toISOString();report.ok=!report.failure&&report.checks.every(c=>c.pass);
  writeFileSync(resolve(out,'browser.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({out,ok:report.ok,captures:report.captures.length,cleanup:report.cleanup}));process.exitCode=report.ok?0:1;
}
