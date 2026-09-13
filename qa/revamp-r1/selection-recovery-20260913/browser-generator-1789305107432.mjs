import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { cleanup } from '../cross-feature-20260910/cleanup.mjs';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const started=Date.now();
const dir=resolve(root,'qa/revamp-r1/selection-recovery-20260913');
const out=mkdtempSync(resolve(dir,'corrected-')),profile=mkdtempSync(resolve(root,'tmp/layout-confirmation-browser-'));
const original=readFileSync(resolve(root,'qa/revamp-r1/completion-20260913/browser-3.mjs'),'utf8');
const start="  await send('Page.navigate',{url:origin+'/?debugMap=1&postal=018956'},mainSession);";
const end='\n} catch (e) { report.failure = e.stack;';
assert.equal(original.split(start).length,2);assert.equal(original.split(end).length,2);
let prefix=original.slice(0,original.indexOf(start));
function replace(before,after){assert.equal(prefix.split(before).length,2,before);prefix=prefix.replace(before,after);}
replace("import { mkdtempSync, readFileSync, writeFileSync }","import { mkdirSync, mkdtempSync, readFileSync, writeFileSync }");
replace("from '../cross-feature-20260910/cleanup.mjs'","from '../../cross-feature-20260910/cleanup.mjs'");
replace("import { COUNTERS } from '../loading-profile-20260912/analyze.mjs';",'');
replace("const out = mkdtempSync(resolve(root, 'qa/revamp-r1/completion-20260913/observed-'));",'const out = '+JSON.stringify(out)+';');
replace("const profile = mkdtempSync(resolve(root, 'tmp/layout-confirmation-browser-'));",'const profile = '+JSON.stringify(profile)+';');
replace("'http://127.0.0.1:4412'","'http://127.0.0.1:4420'");
replace("'qa/revamp-r1/completion-20260913/build-2/build.json'","'qa/revamp-r1/selection-recovery-20260913/build-2/build.json'");
replace('deadline = started + 600000','deadline = started + 240000');
const sampleStart=prefix.indexOf('  report.host = [];'),sampleEnd=prefix.indexOf('  report.anchorsBefore = anchors();');
assert.ok(sampleStart>0&&sampleEnd>sampleStart);
prefix=prefix.slice(0,sampleStart)+"  report.availableMiB=os.freemem()/1048576;assert.ok(report.availableMiB>=1024,'Host memory gate');\n"+prefix.slice(sampleEnd);
const launch="  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new',";
replace(launch,"  mkdirSync(resolve(profile,'Default'));writeFileSync(resolve(profile,'Default/Preferences'),JSON.stringify({partition:{default_zoom_level:{x:Math.log(2)/Math.log(1.2)}}}),{flag:'wx'});\n"+launch+" '--window-size=1440,950','--force-device-scale-factor=1',");
replace("  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }, mainSession);","  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]},mainSession);");
replace('const pending = new Map(), workerSessions = new Set();',"const pending = new Map(), workerSessions = new Set();\nlet scoreMode='fail';const heldScores=[];report.scoreFaults=[];");
const interception='      const u = new URL(p.request.url);';
replace(interception,interception+String.raw`
      if(u.origin===origin&&u.pathname.startsWith('/data/generated_20260805_prefer_scored_routed/scores/')&&scoreMode!=='pass'){
        report.scoreFaults.push({path:u.pathname,method:p.request.method,mode:scoreMode});
        if(scoreMode==='hold')heldScores.push({requestId:p.requestId,sessionId});
        else void send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:503,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from('{}').toString('base64')},sessionId).catch(e=>report.errors.push({interception:e.message,cdp:e.cdp}));
        return;
      }
`);
const scene=String.raw`
  report.scope='Current native200%zoom selection retry, complete metric reading and keyboard camera task. Controlled score503/hold; no data changes. SW bypassed, desktop SwiftShader, not phone/screenreader/performance/old-client-release acceptance.';
  async function key(key,code,vk,modifiers=0){
    await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key,code,windowsVirtualKeyCode:vk,modifiers},mainSession);
    if(key==='Enter')await send('Input.dispatchKeyEvent',{type:'char',text:'\r',key,code,windowsVirtualKeyCode:vk,modifiers},mainSession);
    await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:vk,modifiers},mainSession);
  }
  function focus(){
    const e=document.activeElement,r=e?.getBoundingClientRect(),s=e?getComputedStyle(e):null;
    let clip={left:0,top:0,right:innerWidth,bottom:innerHeight};
    for(let a=e?.parentElement;a;a=a.parentElement){const cs=getComputedStyle(a),b=a.getBoundingClientRect();if(cs.overflowX!=='visible'){clip.left=Math.max(clip.left,b.left+a.clientLeft);clip.right=Math.min(clip.right,b.left+a.clientLeft+a.clientWidth);}if(cs.overflowY!=='visible'){clip.top=Math.max(clip.top,b.top+a.clientTop);clip.bottom=Math.min(clip.bottom,b.top+a.clientTop+a.clientHeight);}}
    const geometry=(function focusGeometry(rect, clip, canvas, outlineWidth, outlineOffset) {
  const fits = box => box.right > box.left && box.bottom > box.top
    && box.left >= clip.left - 0.5 && box.top >= clip.top - 0.5
    && box.right <= clip.right + 0.5 && box.bottom <= clip.bottom + 0.5;
  const controlFits = !!rect && fits(rect);
  const edge = outlineWidth + outlineOffset;
  const ring = rect && Number.isFinite(edge) && outlineWidth > 0 ? {
    left: rect.left - edge, right: rect.right + edge,
    top: rect.top - edge, bottom: rect.bottom + edge,
  } : null;
  const ringFits = !!ring && fits(ring);
  return { controlFits, ring, ringFits, fits: canvas ? ringFits && edge <= 0 : controlFits };
})(r,clip,e?.tagName==='CANVAS',parseFloat(s?.outlineWidth),parseFloat(s?.outlineOffset));const fits=geometry.fits;
    const x=r?(e.tagName==='CANVAS'?r.right-4:r.x+r.width/2):0,y=r?r.y+r.height/2:0,hit=e?.contains(document.elementFromPoint(x,y));
    return{geometry,tag:e?.tagName,id:e?.id,text:e?.textContent?.trim(),label:e?.getAttribute('aria-label'),clip,box:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,hit,visible:fits&&hit&&s?.visibility==='visible'&&s.opacity!=='0',focusVisible:e?.matches(':focus-visible'),outline:s?.outlineStyle,outlineWidth:s?.outlineWidth};
  }
  async function tabTo(text,tag='BUTTON'){
    for(let i=0;i<40;i++){const f=await evaluate(focus);if(f.tag===tag&&(tag==='CANVAS'||f.text===text)){await shot('focus-'+tag+'-'+text.replaceAll(' ','-').replaceAll('/','-'));check('keyboard focus '+text,f.visible&&f.focusVisible&&f.geometry.ringFits,f);return f;}await key('Tab','Tab',9);}
    throw Error('Keyboard target unreachable '+text);
  }
  async function shot(name){
    const before=await evaluate(focus),state=await evaluate(facts),uiState=await evaluate(ui);
    const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},mainSession),png=Buffer.from(image.data,'base64');
    writeFileSync(resolve(out,name+'.png'),png,{flag:'wx'});
    report.samples.push({name,before,after:await evaluate(focus),state,ui:uiState,bytes:png.length,sha256:hash(png)});
  }
  await send('Page.navigate',{url:origin+'/?debugMap=1&postal=018956'},mainSession);
  await until('controlled score failure',()=>evaluate(ui),u=>u.bodyText.includes('Retry selection'),60000);
  report.nativeZoom=await evaluate(()=>({inner:[innerWidth,innerHeight],outer:[outerWidth,outerHeight],dpr:devicePixelRatio,scale:visualViewport.scale,cssZoom:getComputedStyle(document.documentElement).zoom,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}));
  check('native200%zoom and reduced-motion preference',Math.abs(report.nativeZoom.outer[0]/report.nativeZoom.inner[0]-2)<.03&&report.nativeZoom.dpr===2&&report.nativeZoom.scale===1&&report.nativeZoom.reduced,report.nativeZoom);
  await tabTo('Retry selection');await shot('retry-before');
  scoreMode='hold';await key('Enter','Enter',13);
  await until('retry pending without its control',()=>evaluate(ui),u=>!u.bodyText.includes('Retry selection')&&heldScores.length>0,15000);
  report.retryFocus=await evaluate(focus);await shot('retry-pending');
  check('native selection Retry keeps visible search focus',report.retryFocus.id==='postal-search-input'&&report.retryFocus.visible&&report.retryFocus.focusVisible,report.retryFocus);
  scoreMode='pass';for(const held of heldScores.splice(0))await send('Fetch.continueRequest',{requestId:held.requestId},held.sessionId);
  await until('real selected route after retry',()=>evaluate(facts),ready,120000);await capture('retry-recovered');
  check('success does not reclaim search focus',(await evaluate(focus)).id==='postal-search-input');
  function metricFacts(){
    const summary=document.querySelector('[aria-label="Walk summary"]'),panel=document.querySelector('aside');
    const visibleText=e=>{const range=document.createRange();range.selectNodeContents(e);const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);let clip={left:0,top:0,right:innerWidth,bottom:innerHeight};for(let a=e.parentElement;a;a=a.parentElement){const s=getComputedStyle(a),r=a.getBoundingClientRect();if(s.overflowX!=='visible'){clip.left=Math.max(clip.left,r.left+a.clientLeft);clip.right=Math.min(clip.right,r.left+a.clientLeft+a.clientWidth);}if(s.overflowY!=='visible'){clip.top=Math.max(clip.top,r.top+a.clientTop);clip.bottom=Math.min(clip.bottom,r.top+a.clientTop+a.clientHeight);}}return{rects:rects.map(r=>({x:r.x,y:r.y,width:r.width,height:r.height})),clip,visible:rects.length>0&&rects.every(r=>r.left>=clip.left-.5&&r.right<=clip.right+.5&&r.top>=clip.top-.5&&r.bottom<=clip.bottom+.5&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))};};
    return{scrollTop:panel.scrollTop,scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,metrics:[...summary.querySelectorAll('[class*="walkMetrics"] > div')].map(e=>({label:e.querySelector('span').textContent,value:e.querySelector('strong').textContent,labelPaint:visibleText(e.querySelector('span')),valuePaint:visibleText(e.querySelector('strong'))}))};
  }
  const seen=new Map();report.metricReadings=[];
  for(let i=0;i<12;i++){
    const before=await evaluate(metricFacts);assert.equal(before.metrics.length,4);
    await shot('metrics-'+i);const after=await evaluate(metricFacts);report.metricReadings.push({before,after});
    for(const a of before.metrics){const b=after.metrics.find(m=>m.label===a.label);if(a.labelPaint.visible&&a.valuePaint.visible&&b.labelPaint.visible&&b.valuePaint.visible&&a.value===b.value)seen.set(a.label,a.value);}
    if(seen.size===4)break;
    const point=await evaluate(()=>{const r=document.querySelector('aside').getBoundingClientRect();return{x:r.right-20,y:r.y+r.height/2};});
    await send('Input.dispatchMouseEvent',{type:'mouseWheel',...point,deltaX:0,deltaY:56},mainSession);
    await new Promise(done=>setTimeout(done,200));
  }
  report.readMetrics=Object.fromEntries(seen);check('all four complete metric labels and values read',seen.size===4,report.readMetrics);
  await tabTo('MRT/LRT exits');await shot('walk-controls-return');await tabTo('Bus stops');await shot('active-bus-focus');
  const mapFocus=await tabTo('map canvas','CANVAS');
  check('keyboard map has visible outline',mapFocus.outline!=='none'&&parseFloat(mapFocus.outlineWidth)>0,mapFocus);
  function camera(){const m=window.__shiokRouteMap,c=m.getCenter();return{lng:c.lng,lat:c.lat,zoom:m.getZoom(),moving:m.isMoving(),url:location.href,routeKey:window.__shiokRouteDebug.routeKey};}
  const originalCamera=await evaluate(camera);report.camera=[{step:'before',...originalCamera}];
  await key('ArrowRight','ArrowRight',39);const right=await until('keyboard pan right',()=>evaluate(camera),c=>!c.moving&&c.lng>originalCamera.lng+.000001,10000);report.camera.push({step:'right',...right});
  await key('ArrowLeft','ArrowLeft',37);const left=await until('keyboard pan left',()=>evaluate(camera),c=>!c.moving&&c.lng<right.lng-.000001,10000);report.camera.push({step:'left',...left});
  await key('=','Equal',187);const zoomIn=await until('keyboard zoom in',()=>evaluate(camera),c=>!c.moving&&c.zoom>left.zoom+.01,10000);report.camera.push({step:'zoom-in',...zoomIn});
  await key('-','Minus',189);const zoomOut=await until('keyboard zoom out',()=>evaluate(camera),c=>!c.moving&&c.zoom<zoomIn.zoom-.01,10000);report.camera.push({step:'zoom-out',...zoomOut});
  check('keyboard camera preserves selection and URL',report.camera.every(c=>c.routeKey===originalCamera.routeKey&&c.url===originalCamera.url),report.camera);
  await capture('keyboard-map');check('canvas remains keyboard focused',(await evaluate(focus)).tag==='CANVAS');
  await key('Tab','Tab',9);report.keyboardExit=await evaluate(focus);await shot('keyboard-exit');check('keyboard can leave canvas',report.keyboardExit.tag!=='CANVAS'&&report.keyboardExit.visible&&report.keyboardExit.focusVisible&&report.keyboardExit.geometry.ringFits,report.keyboardExit);
  check('no page-observed route API requests',(report.previewRequests??[]).length===0);
  check('no application exceptions',!report.errors.some(e=>e.runtime));
`;
const suffix=original.slice(original.indexOf(end)).replace("  report.scope = 'Actual pointer clicks on saved transit choices, disclosures and responsive layout. Headless desktop at emulated sizes; not a physical phone or representative performance benchmark. No pipeline/install/deploy.';",'');
const driver=resolve(out,'driver.mjs');writeFileSync(driver,prefix+scene+suffix,{flag:'wx'});
let child,cleaned,syntaxExit,childTimeoutMs;
try{
  const syntax=spawnSync(process.execPath,['--check',driver],{cwd:root,windowsHide:true,encoding:'utf8',timeout:15000});syntaxExit=syntax.status;
  assert.equal(syntaxExit,0,syntax.stderr);
  childTimeoutMs=Math.min(300000,started+360000-Date.now()-60000);assert.ok(childTimeoutMs>0,'Supervisor setup budget');
  child=spawnSync(process.execPath,[driver],{cwd:root,windowsHide:true,encoding:'utf8',timeout:childTimeoutMs,maxBuffer:4*1024*1024,env:{...process.env,TEMP:profile,TMP:profile}});
}
catch(error){child={status:null,error,stdout:'',stderr:''};}
finally{cleaned=cleanup(profile);}
for(const stream of ['stdout','stderr'])writeFileSync(resolve(out,stream+'.txt'),child[stream]??'',{flag:'wx'});
const elapsedMs=Date.now()-started;
const supervisor={root,out,profile,syntaxExit,childTimeoutMs,childPid:child.pid,exitCode:child.status,error:child.error?.message,cleanup:cleaned,elapsedMs,budgetMs:360000,arithmetic:'At most300000 child +45000independent cleanup +15000receipt reserve =360000ms; setup included by shrinking child budget',pipelineRuns:0,deployments:0};
writeFileSync(resolve(out,'supervisor.json'),JSON.stringify(supervisor,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,exitCode:child.status,cleanup:cleaned.verified,elapsedMs},null,2));process.exitCode=child.status===0&&cleaned.verified&&elapsedMs<=360000?0:1;
