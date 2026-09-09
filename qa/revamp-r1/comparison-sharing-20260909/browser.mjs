import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong root');
const [label, build] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label || '') || !/^[\w-]+$/.test(build || '')) throw Error('Fresh label/build required');
const out = resolve(root, 'qa/revamp-r1/comparison-sharing-20260909', label + '-' + Date.now());
mkdirSync(out);
const profile = mkdtempSync(resolve(root, 'tmp/sharing-browser-')), origin = 'http://127.0.0.1:4328';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { root, hostname: process.env.COMPUTERNAME, build, out, profile, startedAt: new Date().toISOString(),
  runnerSha256: sha(readFileSync(new URL(import.meta.url))), checks: [], captures: [], network: [], errors: [], cleanup: {},
  policy: 'Real snapshot + immutable published data; functional Chrome/SwiftShader only. No performance, physical-phone, pipeline or deployment claim.' };
const pending = new Map(), delay = ms => new Promise(done => setTimeout(done, ms)), deadline = Date.now() + 720000;
let chrome, ws, id = 0, stderr = '';
function check(name, pass, detail) { report.checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name); if (!pass) throw Error(name); }
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
async function facts() {
  const map = window.__shiokRouteMap, debug = window.__shiokRouteDebug;
  const panel = document.querySelector('[data-comparison-panel]'), dialog = document.querySelector('dialog[open]');
  const rect = n => { const r = n?.getBoundingClientRect(); return r ? { x:r.x, y:r.y, width:r.width, height:r.height } : null; };
  let features = []; try { features = map?.queryRenderedFeatures({ layers:['shiokest-route-line'] }) || []; } catch {}
  const focus = document.activeElement;
  return { status:document.querySelector('main')?.dataset.mapStatus, shared:panel?.textContent.includes('Shared shortlist'), open:!!panel,
    routeKey:debug?.routeKey, featureCount:features.filter(f=>f.properties?.render_key===debug?.routeKey).length,
    routeSourcePresent:!!map?.getSource('shiokest-route'),
    moving:map?.isMoving(), basemap:!!map?.getSource('onemap')&&map.isSourceLoaded('onemap'), viewport:[innerWidth,innerHeight],
    saved:JSON.parse(localStorage.getItem('shiok:comparison:v1') || 'null'), columns:panel?[...panel.querySelectorAll('thead th')].slice(1).map(n=>n.querySelector('span')?.textContent):[],
    panel:rect(panel), dialog:rect(dialog), dialogText:dialog?.textContent, link:dialog?.querySelector('input')?.value,
    search:rect(document.querySelector('form')),logo:rect(document.querySelector('h1')),result:rect(document.querySelector('[aria-label="Walk summary"]')?.parentElement),
    about:rect(document.querySelector('footer:not([hidden])')), attribution:rect(document.querySelector('a[href="https://www.onemap.gov.sg/"]')?.parentElement),
    overflow:(document.documentElement?.scrollWidth ?? innerWidth)>innerWidth, summary:document.querySelector('[aria-label="Walk summary"]')?.textContent,
    focus:focus?.getAttribute('aria-label') || (focus?.tagName==='BUTTON'?focus.textContent:null), focusTag:focus?.tagName,
    focusInDialog:!!dialog?.contains(focus), url:location.href };
}
async function waitFor(name, predicate, limit=90000) {
  let value; const end = Math.min(deadline,Date.now()+limit);
  while(Date.now()<end) { value=await call(facts);report.lastSample={name,value};if(predicate(value))return value;await delay(400); }
  check(name,false,value);
}
async function key(key,code,value,text,modifiers=0) {
  await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:value,modifiers,...(text?{text}:{})});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:value,modifiers});await delay(100);
}
async function click(selector) {
  const hit = await call(selector => {
    const n=document.querySelector(selector);if(!n)return {missing:true};
    n.scrollIntoView({block:'nearest',inline:'nearest'});n.focus({preventScroll:true});const r=n.getBoundingClientRect();
    return { name:n.getAttribute('aria-label')||n.textContent, hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===n, disabled:n.disabled, width:r.width,height:r.height };
  },selector);
  check('reachable '+selector,hit.hit&&!hit.disabled,hit);await key('Enter','Enter',13,'\r');
}
async function capture(name, modal=false) {
  await call(()=>document.fonts.ready.then(()=>true));
  const before=await call(facts),shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  const bytes=Buffer.from(shot.data,'base64'),path=resolve(out,name+'.png');writeFileSync(path,bytes,{flag:'wx'});
  const after=await call(facts);report.captures.push({name,path,bytes:bytes.length,sha256:sha(bytes),before,after});
  check(name+' route current',before.featureCount>0&&after.featureCount>0&&before.routeKey===after.routeKey,after);
  check(name+' fits viewport',!after.overflow&&after.search.y>after.logo.y&&after.search.x===after.logo.x,after);
  if(modal)check(name+' dialog bounded/focused',after.dialog&&after.dialog.x>=0&&after.dialog.y>=0&&after.dialog.x+after.dialog.width<=after.viewport[0]+1&&after.focusInDialog,after.dialog);
  else check(name+' attribution unobscured',after.panel&&after.attribution&&after.panel.y+after.panel.height<=after.attribution.y+1,after.attribution);
}
try {
  const status=await(await fetch(origin+'/__qa/status')).json();check('expected served build',status.build===build,status);
  chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],
    {cwd:root,windowsHide:true,stdio:['ignore','ignore','pipe'],env:{...process.env,TEMP:profile,TMP:profile}});
  report.chromePid=chrome.pid;chrome.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-12000);});
  let tabs;const start=Date.now();
  while(Date.now()-start<40000&&!tabs){const endpoint=/DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1];if(endpoint){const url=new URL(endpoint);url.protocol='http:';url.pathname='/json';tabs=await(await fetch(url)).json();}else await delay(250);}
  const target=tabs?.find(tab=>tab.type==='page');if(!target)throw Error('Owned browser did not start');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((done,reject)=>{ws.onopen=done;ws.onerror=reject;});
  ws.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(p)m.error?p.reject(Error(m.error.message)):p.done(m.result);return;}
    if(m.method==='Runtime.exceptionThrown')report.errors.push(m.params);
    if(m.method==='Network.responseReceived'&&report.network.length<1500){const r=m.params.response;report.network.push({id:m.params.requestId,url:r.url,status:r.status,type:m.params.type});}};
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:"if(location.origin==='"+origin+"'&&!localStorage.getItem('shiok:comparison:v1'))localStorage.setItem('shiok:comparison:v1',JSON.stringify({version:1,postals:['079908'],category:'bus',activePostal:'079908'}));"});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  const fragment='#compare=1&postals=018956%2C018990&transit=bus&active=018956';
  await send('Page.navigate',{url:origin+'/?postal=079908&debugMap=1'+fragment});
  const ready=r=>r.status==='ready'&&r.basemap&&r.featureCount>0&&!r.moving;
  let value=await waitFor('initial shared walk',r=>r.status==='error'||(ready(r)&&r.shared),180000);
  check('first load not blank',ready(value),value);
  check('fragment wins but saved list unchanged',value.columns.join(',')==='018956,018990'&&value.saved.postals.join(',')==='079908'&&new URL(value.url).search==='',value);
  const document=report.network.findLast(r=>r.type==='Document'),body=await send('Network.getResponseBody',{requestId:document.id});
  const html=Buffer.from(body.body,body.base64Encoded?'base64':'utf8');report.document={...document,sha256:sha(html),bytes:html.length};
  check('actual HTML identifies build',html.toString('utf8').includes(build));
  for(const [width,height] of [[1440,950],[390,844],[390,667],[320,667]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await waitFor('resized shared route',r=>r.viewport[0]===width&&ready(r));await capture('shared-'+width+'x'+height);
    await click('[aria-label="Share comparison"]');await waitFor('share modal',r=>!!r.dialog);await capture('dialog-'+width+'x'+height,true);
    for(let n=0;n<7;n++){
      await key('Tab','Tab',9);const focus=await call(facts);
      check('modal keyboard trap '+width+' '+n,focus.focusInDialog,{focus:focus.focus,tag:focus.focusTag});
    }
    await call(()=>document.querySelector('[aria-label="Close share dialog"]').focus());
    await key('Tab','Tab',9,undefined,8);const reverse=await call(facts);
    check('modal reverse wrap '+width,reverse.focusInDialog&&reverse.focus==='Copy link',{focus:reverse.focus,tag:reverse.focusTag});
    await key('Escape','Escape',27);value=await waitFor('Escape closes only dialog',r=>r.open&&!r.dialog);
    check('Escape restores Share focus',value.focus==='Share comparison',value.focus);
  }
  await click('[aria-label="Share comparison"]');
  const copiedLink=(await call(facts)).link;
  check('link contains only minimal fragment state',copiedLink===origin+'/'+fragment,copiedLink);
  await call(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('QA clipboard denied'))}});});
  await click('dialog button:not([aria-label])');
  value=await waitFor('clipboard denial fallback',r=>r.dialogText?.includes('Copy failed. Select the link to copy it.'));
  await call(()=>[...document.querySelectorAll('dialog button')].find(n=>n.textContent==='Select link').click());
  check('manual link selection',await call(()=>{const n=document.querySelector('dialog input');return document.activeElement===n&&n.selectionStart===0&&n.selectionEnd===n.value.length;}));
  await call(()=>{navigator.clipboard.writeText=async value=>{window.__qaCopied=value;};});
  await click('dialog button:not([aria-label])');await waitFor('copy succeeds only on explicit command',r=>r.dialogText?.includes('Copied.'));
  check('copied exact link',await call(()=>window.__qaCopied)===copiedLink);
  await key('Escape','Escape',27);
  await click('[aria-label="Close comparison"]');
  await waitFor('close shared leaves saved list',r=>!r.open&&r.saved.postals.join(',')==='079908'&&new URL(r.url).hash==='');
  await call(()=>history.back());await waitFor('Back reopens shared view',r=>r.shared&&ready(r));
  await call(()=>history.forward());await waitFor('Forward closes shared view',r=>!r.open&&r.saved.postals.join(',')==='079908');
  await call(()=>history.back());await waitFor('Back restores exact shared route again',r=>r.shared&&ready(r));
  await click('[aria-label="Use my saved shortlist"]');
  value=await waitFor('Use saved restores local homes without a write',r=>r.open&&!r.shared&&r.columns.join(',')==='079908'&&new URL(r.url).hash==='');
  check('previous saved state remains intact',value.saved.postals.join(',')==='079908',value.saved);
  await call(fragment=>{location.hash=fragment;},fragment);
  await waitFor('reopening shared link after Use saved',r=>r.shared&&ready(r));
  await click('[aria-label="Save shortlist on this device"]');
  value=await waitFor('explicit Save replaces local state',r=>r.open&&!r.shared&&r.saved.postals.join(',')==='018956,018990'&&new URL(r.url).hash==='');
  check('saved category and active postal retained',value.saved.category==='bus'&&value.saved.activePostal==='018956',value.saved);
  await send('Page.reload',{ignoreCache:false});
  await waitFor('reload restores closed saved shortlist',r=>!r.open&&r.saved.postals.length===2);
  await call(()=>[...document.querySelectorAll('button')].find(n=>n.textContent==='Compare (2)').click());
  await waitFor('saved comparison reopens',r=>r.open&&!r.shared&&ready(r));
  await click('[aria-label="Close comparison"]');
  await call(()=>{const n=document.querySelector('#postal-search-input');n.focus();n.select();});
  await send('Input.insertText',{text:'018956'});await click('#postal-search-button');
  value=await waitFor('normal result restored',r=>!r.open&&r.summary?.startsWith('Postal 018956')&&ready(r));
  check('search and result same width; About at bottom-right',Math.abs(value.search.width-value.result.width)<1&&value.about.x>value.viewport[0]/2&&value.about.y>value.viewport[1]/2,value);
  for(const [width,height] of [[1440,950],[390,844],[390,667],[320,667]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    const before=await waitFor('normal layout '+width,r=>r.viewport[0]===width&&ready(r));
    const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}),bytes=Buffer.from(shot.data,'base64');
    const path=resolve(out,'normal-'+width+'x'+height+'.png');writeFileSync(path,bytes,{flag:'wx'});
    const after=await call(facts);report.captures.push({name:'normal-'+width+'x'+height,path,bytes:bytes.length,sha256:sha(bytes),before,after});
    check('approved normal layout '+width,after.featureCount>0&&!after.overflow&&after.search.y>after.logo.y&&after.result.y>=after.search.y+after.search.height
      &&Math.abs(after.search.width-after.result.width)<1&&after.about.x>width/2&&after.about.y>height/2,after);
  }
  check('no uncaught browser errors',report.errors.length===0,report.errors);
  const api=report.network.filter(r=>new URL(r.url).pathname.startsWith('/api/'));check('no live API calls',api.length===0,api);
} catch(error) {
  report.failure=error.stack;console.error(error.stack);
  if(ws?.readyState===1)try{const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const bytes=Buffer.from(shot.data,'base64'),path=resolve(out,'failure.png');writeFileSync(path,bytes,{flag:'wx'});report.failureCapture={path,sha256:sha(bytes)};}catch(e){report.failureCaptureError=e.message;}
} finally {
  if(ws?.readyState===1)try{await send('Browser.close');report.cleanup.closeSent=true;}catch(e){report.cleanup.closeError=e.message;}
  if(chrome){let end=Date.now()+10000;while(chrome.exitCode===null&&chrome.signalCode===null&&Date.now()<end)await delay(100);
    if(chrome.exitCode===null&&chrome.signalCode===null){report.cleanup.killSent=chrome.kill();end=Date.now()+5000;while(chrome.exitCode===null&&chrome.signalCode===null&&Date.now()<end)await delay(100);}report.cleanup.chromeExited=chrome.exitCode!==null||chrome.signalCode!==null;}
  ws?.close();for(const p of pending.values())p.reject(Error('Acceptance ended'));pending.clear();
  report.stderr=stderr;report.finishedAt=new Date().toISOString();report.ok=!report.failure&&report.checks.every(c=>c.pass);
  writeFileSync(resolve(out,'browser.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({out,ok:report.ok,captures:report.captures.length,cleanup:report.cleanup}));process.exitCode=report.ok?0:1;
}
