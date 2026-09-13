// Reuse the reviewed CDP transport/cleanup, with a new bounded keyboard scenario.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const phase=process.argv[2];assert.ok(['baseline','treatment'].includes(phase));
const parent=resolve(root,'qa/revamp-r1/keyboard-recovery-20260913');
const original=readFileSync(resolve(root,'qa/revamp-r1/completion-20260913/browser-3.mjs'),'utf8');
const start="  await send('Page.navigate',{url:origin+'/?debugMap=1&postal=018956'},mainSession);";
const end='\n} catch (e) { report.failure = e.stack;';
assert.equal(original.split(start).length,2);assert.equal(original.split(end).length,2);
let prefix=original.slice(0,original.indexOf(start));
prefix=prefix.replace("'qa/revamp-r1/completion-20260913/observed-'",`'qa/revamp-r1/keyboard-recovery-20260913/${phase}-'`);
prefix=prefix.replace("const started = Date.now()", "let geometryMode='fail', previewMode='fail'; const heldGeometry=[], heldPreview=[];\nconst started = Date.now()");
const intercept="      if (u.origin === origin && u.pathname === '/api/onemap-route') {";
assert.equal(prefix.split(intercept).length,2);
prefix=prefix.replace(intercept,`
      if (u.origin===origin && u.pathname.includes('/geom/') && geometryMode!=='pass') {
        report.geometryRequests??=[]; report.geometryRequests.push({url:u.pathname,mode:geometryMode});
        if(geometryMode==='hold'){heldGeometry.push({requestId:p.requestId,sessionId});return;}
        void send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:503,
          responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from('{}').toString('base64')},sessionId)
          .catch(e=>report.errors.push({interception:e.message}));return;
      }
      if(u.origin===origin && u.pathname==='/api/onemap-route' && previewMode==='hold') {
        heldPreview.push({requestId:p.requestId,sessionId});return;
      }
${intercept}`);
if(phase==='treatment'){
  prefix=prefix.replace("'http://127.0.0.1:4412'","'http://127.0.0.1:4414'");
  prefix=prefix.replace("'qa/revamp-r1/completion-20260913/build-2/build.json'","'qa/revamp-r1/keyboard-recovery-20260913/build-1/build.json'");
}else{
  const guard='  assert.ok(build.sources.every(s => hash(readFileSync(resolve(root, s.path))) === s.sha256));';
  assert.equal(prefix.split(guard).length,2);
  prefix=prefix.replace(guard,`  report.testOnlyDrift=build.sources.filter(s=>hash(readFileSync(resolve(root,s.path)))!==s.sha256).map(s=>({path:s.path,expected:s.sha256,actual:hash(readFileSync(resolve(root,s.path)))}));
  assert.deepEqual(report.testOnlyDrift,[
    {path:'web/lib/__tests__/route-evidence-map-popup.test.ts',expected:'de8a34a917758163d3c320ace771c8f6e136acc2645433a91f64e98dfa1d65dd',actual:'d2f3be58de37d1fd3ae7431c6603fcb489ecfd380d83db7f20ccc0feb9b22157'},
    {path:'web/lib/__tests__/transit-popup.test.ts',expected:'06417d3170eed48783a3cdf9dc885834a7d51058a5fb6b925ba855bd0fbe8a4e',actual:'b77778fd85515dca30ad6cb6935d8c283629db9a65ec3d5aec7b8ea64c513acb'}]);`);
}
const scene=String.raw`
  report.phase=${JSON.stringify(phase)};
  report.scope='Keyboard recovery only; controlled geometry/provider failures, SW bypassed, desktop headless. Not native browser zoom, physical phone, production retention or latency acceptance.';
  const observations=[];report.focusObservations=observations;
  async function key(key,code,vk){
    await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key,code,windowsVirtualKeyCode:vk},mainSession);
    if(key==='Enter')await send('Input.dispatchKeyEvent',{type:'char',text:'\r',unmodifiedText:'\r',key,code,windowsVirtualKeyCode:vk},mainSession);
    await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:vk},mainSession);
  }
  function focus(){const e=document.activeElement,r=e?.getBoundingClientRect(),style=e?getComputedStyle(e):null;return {tag:e?.tagName,label:e?.getAttribute('aria-label'),text:e?.tagName==='BODY'?null:e?.textContent?.trim(),id:e?.id,
    summaryHeading:!!e?.matches('[aria-label="Walk summary"] h2'),focusVisible:!!e?.matches(':focus-visible'),outline:{style:style?.outlineStyle,width:style?.outlineWidth,color:style?.outlineColor},
    rect:r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom}:null,visible:!!e?.checkVisibility(),url:location.href};}
  async function tabTo(label){
    for(let i=0;i<45;i++){const f=await evaluate(focus);if(f.tag==='BUTTON'&&(f.text===label||f.label===label))return f;await key('Tab','Tab',9);}
    throw Error('Keyboard could not reach '+label);
  }
  async function rawShot(name){
    const before=await evaluate(focus),state=await evaluate(facts);
    const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},mainSession),after=await evaluate(focus);
    const bytes=Buffer.from(s.data,'base64');writeFileSync(resolve(out,name+'.png'),bytes,{flag:'wx'});
    report.samples.push({name,before,after,state,bytes:bytes.length,sha256:hash(bytes)});
  }
  async function continuity(name){
    const f=await evaluate(focus),ok=f.tag==='H2'&&f.summaryHeading&&f.text==='Postal 018956'&&f.visible&&f.rect.top>=0&&f.rect.bottom<=844&&f.focusVisible&&f.outline.style==='solid'&&parseFloat(f.outline.width)>=3;
    observations.push({name,pass:ok,focus:f});await rawShot(name);return f;
  }
  await send('Page.navigate',{url:origin+'/?debugMap=1&postal=018956'},mainSession);
  await until('geometry error',()=>evaluate(ui),s=>s.bodyText.includes('Retry geometry'));
  await tabTo('Retry geometry');await rawShot('geometry-retry-before');
  geometryMode='hold';await key('Enter','Enter',13);
  await until('geometry request held',async()=>heldGeometry.length,n=>n>0,10000);
  await continuity('geometry-retry-pending');
  if(report.phase==='treatment'){const s=await evaluate(ui);check('pending retry is loading, not missing geometry',s.bodyText.includes('Loading saved walk...')&&!s.bodyText.includes('No route geometry is published'));}
  await key('Tab','Tab',9);const laterFocus=await evaluate(focus);
  geometryMode='pass';for(const h of heldGeometry.splice(0))await send('Fetch.continueRequest',{requestId:h.requestId},h.sessionId);
  await until('recovered route',()=>evaluate(facts),ready,120000);
  const settled=await evaluate(focus);check('geometry completion preserves later keyboard focus',settled.tag===laterFocus.tag&&settled.id===laterFocus.id&&settled.text===laterFocus.text,{laterFocus,settled});
  await rawShot('geometry-recovered');
  const fixtureScore=JSON.parse(readFileSync(resolve(root,'web/lib/__tests__/fixtures/published-options.json')))['scores/DOWNTOWN_CORE_PART_001.json'].find(s=>s.postal==='018956');
  const known=new Set((fixtureScore.candidates??[]).map(c=>c.node_id));
  for(const r of [fixtureScore,...Object.values(fixtureScore.route_options??{})])for(const v of Object.values(r.best_node??{}))if(typeof v==='string')known.add(v);
  await send('Runtime.evaluate',{expression:'window.__qaKnown='+JSON.stringify([...known])},mainSession);
  const stop=await evaluate(()=>window.__shiokRouteMap.getStyle().sources['transit-pois'].data.features.find(f=>f.properties.kind==='bus_stop'&&!window.__qaKnown.includes(f.properties.id))?.properties.id);
  check('real unsaved bus exists',!!stop,stop);report.unsavedStop=stop;
  await send('Runtime.evaluate',{expression:'window.__qaStop='+JSON.stringify(stop)},mainSession);
  await evaluate(()=>{const m=window.__shiokRouteMap,f=m.getStyle().sources['transit-pois'].data.features.find(f=>f.properties.id===window.__qaStop);m.jumpTo({center:f.geometry.coordinates,zoom:16});m.panBy([0,-180],{duration:0});});
  await until('unsaved marker camera',()=>evaluate(facts),f=>f.tiles&&!f.moving,30000);
  const point=await evaluate(()=>{const m=window.__shiokRouteMap,f=m.queryRenderedFeatures().find(f=>f.source==='transit-pois'&&f.properties.id===window.__qaStop);if(!f)return null;const p=m.project(f.geometry.coordinates);return document.elementFromPoint(p.x,p.y)?.tagName==='CANVAS'?{x:p.x,y:p.y}:null;});
  check('unsaved marker unobscured',!!point,point);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1},mainSession);
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1},mainSession);
  await until('unavailable preview',()=>evaluate(ui),s=>s.bodyText.includes('Retry preview'),45000);
  await tabTo('Retry preview');await rawShot('preview-retry-before');
  previewMode='hold';await key('Enter','Enter',13);
  await until('preview request held',async()=>heldPreview.length,n=>n>0,10000);
  await continuity('preview-retry-pending');
  await key('Tab','Tab',9);const previewLater=await evaluate(focus);
  previewMode='fail';for(const h of heldPreview.splice(0))await send('Fetch.fulfillRequest',{requestId:h.requestId,responseCode:503,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from('{}').toString('base64')},h.sessionId);
  await until('preview error returned',()=>evaluate(ui),s=>s.bodyText.includes('Retry preview'),10000);
  const previewSettled=await evaluate(focus);check('preview failure preserves later keyboard focus',previewSettled.tag===previewLater.tag&&previewSettled.id===previewLater.id&&previewSettled.text===previewLater.text,{previewLater,previewSettled});
  await tabTo('Back to saved walk');await rawShot('back-before');
  const routeBefore=await evaluate(facts);await key('Enter','Enter',13);
  await until('back clears preview',()=>evaluate(ui),s=>!s.bodyText.includes('Back to saved walk'),10000);
  await continuity('back-to-saved');
  const routeAfter=await evaluate(facts);check('back preserves saved geometry',JSON.stringify(routeBefore.geometry)===JSON.stringify(routeAfter.geometry));
  for(const result of observations)report.checks.push({name:result.name+' focus continuity',pass:result.pass,detail:result.focus});
  check('all disappearing controls retain visible focus',observations.every(x=>x.pass),observations);
`;
const suffix=original.slice(original.indexOf(end)).replace("  report.scope = 'Actual pointer clicks on saved transit choices, disclosures and responsive layout. Headless desktop at emulated sizes; not a physical phone or representative performance benchmark. No pipeline/install/deploy.';",'');
const runner=resolve(parent,`runner-${phase}-${Date.now()}.mjs`);
writeFileSync(runner,prefix+scene+suffix,{flag:'wx'});
await import(pathToFileURL(runner).href);
