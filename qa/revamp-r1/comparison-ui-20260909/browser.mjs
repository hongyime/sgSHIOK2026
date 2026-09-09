import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong root');
const [label, build] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label || '') || !/^[\w-]+$/.test(build || '')) throw Error('Fresh label and expected build required');
const out = resolve(root, 'qa/revamp-r1/comparison-ui-20260909', label + '-' + Date.now());
mkdirSync(out);
const profile = mkdtempSync(resolve(root, 'tmp/comparison-browser-')), origin = 'http://127.0.0.1:4326';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { root, hostname: process.env.COMPUTERNAME, build, out, profile, startedAt: new Date().toISOString(),
  runnerSha256: sha(readFileSync(new URL(import.meta.url))),
  checks: [], captures: [], network: [], errors: [], cleanup: {},
  policy: 'Actual snapshot + immutable data. Functional headless Chrome/SwiftShader, not representative performance or a physical-device claim. Zero installs/pipeline/deployment.' };
let chrome, ws, id = 0, stderr = '';
const pending = new Map(), delay = ms => new Promise(done => setTimeout(done, ms)), deadline = Date.now() + 720000;
function check(name, pass, detail) { report.checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name); if (!pass) throw Error(name); }
function send(method, params = {}) {
  return new Promise((done, reject) => {
    const n = ++id, timer = setTimeout(() => { pending.delete(n); reject(Error('CDP timeout: ' + method)); }, 45000);
    pending.set(n, { done: value => { clearTimeout(timer); done(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
const call = (fn, arg) => evaluate('(' + fn.toString() + ')(' + JSON.stringify(arg ?? null) + ')');
async function facts() {
  const map = window.__shiokRouteMap, d = window.__shiokRouteDebug, panel = document.querySelector('[data-comparison-panel]');
  const rect = n => { const r = n?.getBoundingClientRect(); return r ? { x:r.x,y:r.y,width:r.width,height:r.height } : null; };
  const data = await map?.getSource('shiokest-route')?.getData?.();
  const tableViewport = rect(panel?.querySelector('[aria-label="Compared walks"]'));
  const visibleHeadings = panel && tableViewport ? [...panel.querySelectorAll('thead th')].slice(1).flatMap(n => {
    const r = rect(n);
    return r.x >= tableViewport.x + 111 && r.x + r.width <= tableViewport.x + tableViewport.width + 1
      && r.y >= tableViewport.y - 1 && r.y + r.height <= tableViewport.y + tableViewport.height + 1 ? [n.querySelector('span')?.textContent] : [];
  }) : [];
  let features = []; try { features = map?.queryRenderedFeatures({layers:['shiokest-route-line']}) || []; } catch {}
  const padding = d?.padding || {top:0,bottom:0,left:0,right:0};
  const points = (data?.features || []).flatMap(f => f.geometry.coordinates.map(p => map.project(p)));
  return { status:document.querySelector('main')?.dataset.mapStatus, open:!!panel, routeKey:d?.routeKey,
    featureCount:features.filter(f=>f.properties?.render_key===d?.routeKey).length, routeCount:data?.features?.length || 0,
    routeFits:points.length>1 && points.every(p=>p.x>=padding.left-2&&p.x<=innerWidth-padding.right+2&&p.y>=padding.top-2&&p.y<=innerHeight-padding.bottom+2),
    moving:map?.isMoving(), basemap:!!map?.getSource('onemap')&&map.isSourceLoaded('onemap'), viewport:[innerWidth,innerHeight], padding,
    saved:JSON.parse(localStorage.getItem('shiok:comparison:v1') || 'null'),
    columns:panel?[...panel.querySelectorAll('thead th')].slice(1).map(n=>n.querySelector('span')?.textContent):[],
    rows:panel?[...panel.querySelectorAll('tbody tr')].map(n=>[...n.children].map(c=>c.textContent.trim())):[],
    panel:rect(panel),tableViewport,visibleHeadings,search:rect(document.querySelector('form')),logo:rect(document.querySelector('h1')),
    overflow:document.documentElement.scrollWidth>innerWidth, summary:document.querySelector('[aria-label="Walk summary"]')?.textContent,
    focus:document.activeElement?.getAttribute('aria-label')||document.activeElement?.textContent,
    focusId:document.activeElement?.id,attribution:rect(document.querySelector('a[href="https://www.onemap.gov.sg/"]')?.parentElement),
    aboutVisible:!!document.querySelector('footer:not([hidden])'),url:location.href };
}
async function waitFor(name, predicate, limit=90000) {
  let value; const end=Math.min(deadline,Date.now()+limit);
  while(Date.now()<end) { value=await call(facts);report.lastSample={name,value};if(predicate(value))return value;await delay(500); }
  check(name,false,value);
}
async function click(target) {
  const hit = await call(target => {
    const n = target.css ? document.querySelector(target.css) : [...document.querySelectorAll('button')].find(n=>n.textContent===target.text);
    if(!n)return{missing:true}; n.scrollIntoView({block:'nearest',inline:'nearest'});n.focus({preventScroll:true});
    const r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
    return{x,y,width:r.width,height:r.height,text:n.textContent,disabled:n.disabled,hit:document.elementFromPoint(x,y)?.closest('button')===n};
  }, target);
  check('reachable control: '+hit.text,hit.hit&&!hit.disabled,hit);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13}); await delay(100);
}
async function search(postal) {
  await call(()=>{const n=document.querySelector('#postal-search-input');n.focus();n.select();});
  await send('Input.insertText',{text:postal});await click({css:'#postal-search-button'});
  return waitFor('searched '+postal,r=>!r.open&&r.summary?.startsWith('Postal '+postal));
}
async function capture(name) {
  await evaluate('document.fonts.ready.then(()=>true)');
  const before=await call(facts),shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  const bytes=Buffer.from(shot.data,'base64'),path=resolve(out,name+'.png');writeFileSync(path,bytes,{flag:'wx'});
  const after=await call(facts);report.captures.push({name,path,bytes:bytes.length,sha256:sha(bytes),before,after});
  check(name+' current route visible during capture',before.featureCount>0&&after.featureCount>0&&before.routeKey===after.routeKey,after);
  check(name+' no page overflow',!after.overflow&&after.panel.x>=0&&after.panel.x+after.panel.width<=after.viewport[0]+1&&after.search.y>after.logo.y,after);
  check(name+' attribution remains unobscured',after.attribution&&after.panel.y+after.panel.height<=after.attribution.y+1,after);
  check(name+' visible measurements retain a postal heading',after.visibleHeadings.length>0,after.visibleHeadings);
}
try {
  const status=await(await fetch(origin+'/__qa/status')).json();check('expected served build',status.build===build,status);
  chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],
    {cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,TEMP:profile,TMP:profile}});
  report.chromePid=chrome.pid;chrome.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-12000);});
  const start=Date.now();let tabs;
  while(Date.now()-start<40000&&!tabs){const endpoint=/DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1];
    if(endpoint){const url=new URL(endpoint);url.protocol='http:';url.pathname='/json';tabs=await(await fetch(url)).json();}else await delay(250);}
  const target=tabs?.find(tab=>tab.type==='page');if(!target)throw Error('Owned browser did not start');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((done,reject)=>{ws.onopen=done;ws.onerror=reject;});
  ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(p)m.error?p.reject(Error(m.error.message)):p.done(m.result);return;}
    if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params);
    if(m.method==='Network.responseReceived'&&report.network.length<1500){const r=m.params.response;report.network.push({id:m.params.requestId,url:r.url,status:r.status,type:m.params.type});}};
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin+'/?postal=018956&transit=bus'});
  const ready = r=>r.status==='ready'&&r.basemap&&r.featureCount>0&&!r.moving;
  const initial = await waitFor('initial walk outcome',r=>r.status==='error'||ready(r),180000);
  if(initial.status==='error'){
    report.startupRecovery={before:initial,policy:'At most one explicit existing Reload page action. Startup failure remains a T01/T02 finding, not a first-load pass.'};
    await click({text:'Reload page'});
    await waitFor('walk after one explicit reload',ready,180000);
    report.startupRecovery.recovered=true;
  }
  const document=report.network.findLast(r=>r.type==='Document'),body=await send('Network.getResponseBody',{requestId:document.id});
  const html=Buffer.from(body.body,body.base64Encoded?'base64':'utf8');report.document={...document,sha256:sha(html),bytes:html.length};
  check('actual HTML identifies build',html.toString('utf8').includes(build));
  await click({text:'Add to comparison'});
  let value=await waitFor('first comparison',r=>r.open&&r.rows[0]?.[1]?.includes('Exit E')&&r.featureCount>0&&!r.moving);
  check('opening focuses close command',value.focus==='Close comparison',value.focus);
  await click({text:'Bus'});
  value=await waitFor('shared bus category',r=>r.saved?.category==='bus'&&r.rows[1]?.[1]==='81 m'&&r.featureCount>0&&!r.moving);
  check('four real default metrics',JSON.stringify(value.rows.slice(1).map(row=>row[1]))===JSON.stringify(['81 m','55%','37 m','20 m']),value.rows);
  await click({text:'Add postal'});await search('018990');await click({text:'Add to comparison'});
  value=await waitFor('second column no fabricated route',r=>r.columns.length===2&&r.rows[0]?.[2]?.includes('no verified walk')&&r.routeCount===0);
  check('unrouted column does not become zero-valued walk',value.rows.slice(1).every(row=>row[2]==='Unavailable'),value.rows);
  await click({text:'Add postal'});await search('079908');await click({text:'Add to comparison'});
  await waitFor('three columns',r=>r.columns.length===3&&r.rows[0]?.[3]&&!r.rows[0][3].includes('Loading'));
  check('fourth add is explicitly disabled',await call(()=>[...document.querySelectorAll('button')].find(n=>n.textContent==='Add postal')?.disabled));
  await click({css:'[aria-label="Show postal 018956 on map"]'});
  await waitFor('selected real route',r=>r.saved?.activePostal==='018956'&&r.featureCount>0&&!r.moving);
  for(const [width,height] of [[1440,950],[390,844],[390,667],[320,667]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await call(()=>{const n=document.querySelector('[aria-label="Compared walks"]');n.scrollLeft=0;n.scrollTop=0;});
    await waitFor('resized current route',r=>r.viewport[0]===width&&r.featureCount>0&&!r.moving&&r.routeFits);
    await capture('comparison-top-'+width+'x'+height);
    await call(()=>{const n=document.querySelector('[aria-label="Compared walks"]');n.scrollTop=n.scrollHeight;});
    await capture('comparison-metrics-'+width+'x'+height);
    if(width<700){
      await call(()=>{const n=document.querySelector('[aria-label="Compared walks"]');n.scrollLeft=n.scrollWidth;});
      await capture('comparison-last-column-'+width+'x'+height);
    }
  }
  await click({css:'[aria-label="Remove postal 018990"]'});
  value=await waitFor('remove keeps other homes',r=>r.columns.length===2);
  check('remove restores keyboard focus',value.focus==='Remove postal 079908',value.focus);
  await click({css:'[data-comparison-close]'});
  value=await waitFor('close restores inspector',r=>!r.open&&r.summary?.startsWith('Postal 079908'));
  check('close returns focus and data control',value.focus==='Compare (2)'&&value.aboutVisible,value);
  await send('Page.reload',{ignoreCache:false});
  value=await waitFor('reload keeps shortlist closed',r=>!r.open&&r.saved?.postals.length===2&&r.summary?.startsWith('Postal 079908'));
  check('reload retains ordered shortlist',JSON.stringify(value.saved.postals)===JSON.stringify(['018956','079908'])&&value.saved.activePostal==='018956',value.saved);
  await click({text:'Compare (2)'});await waitFor('reopen selected route',r=>r.open&&r.featureCount>0&&!r.moving);
  await click({text:'Clear list'});
  value=await waitFor('clear removes route',r=>r.open&&r.columns.length===0&&r.routeCount===0);
  check('minimal saved payload',JSON.stringify(Object.keys(value.saved).sort())===JSON.stringify(['activePostal','category','postals','version'])&&value.saved.activePostal===null,value.saved);
  check('no uncaught browser errors',report.errors.length===0,report.errors);
  const requests=report.network.filter(r=>new URL(r.url).pathname.startsWith('/api/'));check('no live API request',requests.length===0,requests);
} catch(error) {
  report.failure=error.stack;console.error(error.stack);
  if(ws?.readyState===1)try{const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const bytes=Buffer.from(shot.data,'base64'),path=resolve(out,'failure.png');writeFileSync(path,bytes,{flag:'wx'});report.failureCapture={path,sha256:sha(bytes)};}catch(e){report.failureCaptureError=e.message;}
} finally {
  if(ws?.readyState===1)try{await send('Browser.close');report.cleanup.closeSent=true;}catch(e){report.cleanup.closeError=e.message;}
  if(chrome){let end=Date.now()+5000;while(chrome.exitCode===null&&chrome.signalCode===null&&Date.now()<end)await delay(100);
    if(chrome.exitCode===null&&chrome.signalCode===null){report.cleanup.killSent=chrome.kill();end=Date.now()+5000;while(chrome.exitCode===null&&chrome.signalCode===null&&Date.now()<end)await delay(100);}
    report.cleanup.chromeExited=chrome.exitCode!==null||chrome.signalCode!==null;}
  ws?.close();for(const p of pending.values())p.reject(Error('Acceptance ended'));pending.clear();
  report.stderr=stderr;report.finishedAt=new Date().toISOString();report.ok=!report.failure&&report.checks.every(c=>c.pass);
  writeFileSync(resolve(out,'browser.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({out,ok:report.ok,captures:report.captures.length,cleanup:report.cleanup}));process.exitCode=report.ok?0:1;
}
