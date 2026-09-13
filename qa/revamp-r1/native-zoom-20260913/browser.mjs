import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const percent=Number(process.argv[2]);assert.ok([100,200].includes(percent));
const resetOnly=process.argv[3]==='reset';
const treatment=process.argv[4]==='treatment';
const out=resolve(root,'qa/revamp-r1/native-zoom-20260913');
const original=readFileSync(resolve(root,'qa/revamp-r1/completion-20260913/browser-3.mjs'),'utf8');
const start="  await send('Page.navigate',{url:origin+'/?debugMap=1&postal=018956'},mainSession);";
const end='\n} catch (e) { report.failure = e.stack;';
assert.equal(original.split(start).length,2);assert.equal(original.split(end).length,2);
let prefix=original.slice(0,original.indexOf(start));
prefix=prefix.replace("import { mkdtempSync, readFileSync, writeFileSync }", "import { mkdirSync, mkdtempSync, readFileSync, writeFileSync }")
  .replace("'qa/revamp-r1/completion-20260913/observed-'",`'qa/revamp-r1/native-zoom-20260913/zoom${percent}-'`)
  .replace("'http://127.0.0.1:4412'","'http://127.0.0.1:4414'")
  .replace("'qa/revamp-r1/completion-20260913/build-2/build.json'","'qa/revamp-r1/keyboard-recovery-20260913/build-1/build.json'");
if(treatment)prefix=prefix.replace("'http://127.0.0.1:4414'","'http://127.0.0.1:4416'").replace("'qa/revamp-r1/keyboard-recovery-20260913/build-1/build.json'","'qa/revamp-r1/native-zoom-20260913/build-1/build.json'");
const launch="  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new',";
assert.equal(prefix.split(launch).length,2);
prefix=prefix.replace(launch,`  const prefs={partition:{default_zoom_level:{x:${Math.log(percent/100)/Math.log(1.2)}}}};
  mkdirSync(resolve(profile,'Default'));
  writeFileSync(resolve(profile,'Default/Preferences'),JSON.stringify(prefs),{flag:'wx'});
  report.nativeZoom={requestedPercent:${percent},preferences:prefs,method:'Fresh owned profile native partition default zoom before Chrome launch; no page-scale/device-metrics override'};
${launch} '--window-size=1440,950', '--force-device-scale-factor=1',`);
const emulation="  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false }, mainSession);";
assert.equal(prefix.split(emulation).length,2);
prefix=prefix.replace(emulation,"  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]},mainSession);");
const scene=String.raw`
  report.scope='Native Chrome page zoom via fresh-profile setting, reduced-motion media, saved transit and details keyboard acceptance. No device emulation/DOM scaling; headless SwiftShader, SW bypassed; not physical phone, screen reader, performance or release-upgrade acceptance.';
  async function key(key,code,vk){
    await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key,code,windowsVirtualKeyCode:vk},mainSession);
    if(key==='Enter')await send('Input.dispatchKeyEvent',{type:'char',text:'\r',unmodifiedText:'\r',key,code,windowsVirtualKeyCode:vk},mainSession);
    await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:vk},mainSession);
  }
  function focusFacts(){const e=document.activeElement,r=e?.getBoundingClientRect();return {tag:e?.tagName,text:e?.textContent?.trim(),label:e?.getAttribute('aria-label'),box:r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null,focusVisible:e?.matches(':focus-visible'),visible:!!r&&r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}
  async function tabTo(text,tag='BUTTON'){for(let i=0;i<65;i++){const f=await evaluate(focusFacts);if(f.tag===tag&&f.text===text){check('keyboard target visible '+text,f.visible&&f.focusVisible,f);return;}await key('Tab','Tab',9);}throw Error('Unreachable keyboard target '+text);}
  await send('Page.navigate',{url:origin+'/?debugMap=1&postal=018956'},mainSession);
  await until('initial route',()=>evaluate(facts),ready,120000);
  const metrics=await evaluate(()=>({inner:[innerWidth,innerHeight],outer:[outerWidth,outerHeight],dpr:devicePixelRatio,visualScale:visualViewport.scale,documentZoom:getComputedStyle(document.documentElement).zoom,bodyZoom:getComputedStyle(document.body).zoom,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,screen:[screen.width,screen.height]}));
  report.nativeZoom.observed=metrics;
  check('native zoom has expected physical/CSS ratio',Math.abs(metrics.outer[0]/metrics.inner[0]-${percent/100})<0.03&&Math.abs(metrics.dpr-${percent/100})<0.03&&metrics.visualScale===1,metrics);
  check('no CSS zoom or emulated motion mismatch',['1','normal'].includes(metrics.documentZoom)&&['1','normal'].includes(metrics.bodyZoom)&&metrics.reduced,metrics);
  await evaluate(()=>{const m=window.__shiokRouteMap;window.__qaMotion=[];for(const name of ['fitBounds','easeTo','flyTo']){const fn=m[name];m[name]=function(...args){const o=name==='fitBounds'?args[1]:args[0];window.__qaMotion.push({name,duration:o?.duration,essential:o?.essential});return fn.apply(this,args);};}});
  if(!${resetOnly}){
  await capture('initial');
  const initial=JSON.stringify((await evaluate(facts)).geometry);
  for(const [label,mode] of [['MRT/LRT exits','mrt_lrt'],['Bus stops','bus']]){
    await tabTo(label);await key('Enter','Enter',13);
    await until(label+' selected',()=>evaluate(ui),u=>u.pressed[0]===label,10000);
    await capture(mode);
    const data=await evaluate(facts),geometry=JSON.stringify(data.geometry);
    check(label+' changes actual saved geometry',mode==='mrt_lrt'?geometry!==initial:geometry===initial);
    check(label+' matches URL',new URL(data.url).searchParams.get('transit')===mode);
  }
  await tabTo('Walk details');await key('Enter','Enter',13);
  await until('details open',()=>evaluate(ui),u=>u.detailsHidden===false,10000);
  await capture('details-open');
  const disclosure=await evaluate(()=>[...document.querySelectorAll('#walk-details summary')].find(e=>e.textContent.trim().startsWith('Uncovered sections'))?.textContent.trim());
  check('real uncovered sections disclosure exists',!!disclosure,disclosure);
  await tabTo(disclosure,'SUMMARY');await key('Enter','Enter',13);
  await until('section disclosure opens',()=>evaluate(()=>document.querySelector('[aria-label="Mapped exposed sections"]')?.closest('details')?.open),Boolean,10000);
  // Enumerate real displayed controls; Tab itself must bring each into view.
  const buttons=await evaluate(()=>[...document.querySelectorAll('#walk-details button')].filter(e=>e.checkVisibility()&&!e.disabled&&e.textContent.trim()).map(e=>({text:e.textContent.trim(),pressed:e.getAttribute('aria-pressed')})));
  report.detailsButtons=buttons;
  const gap=buttons.find(b=>/^Section 1/.test(b.text));
  check('real first section exists',!!gap,gap);
  await tabTo(gap.text);await key('Enter','Enter',13);await capture('gap-selected');
  const highlight=await evaluate(()=>window.__shiokRouteMap.getStyle().sources['active-exposure-gap'].data.features);
  check('selected section highlight exists',highlight.length===1,highlight);
  await tabTo('Back to walk');await key('Enter','Enter',13);
  await until('highlight clears',()=>evaluate(()=>window.__shiokRouteMap.getStyle().sources['active-exposure-gap'].data.features.length),n=>n===0,10000);
  const returned=await evaluate(focusFacts);report.returnedSectionFocus=returned;
  check('Back to walk restores visible section disclosure focus',returned.tag==='SUMMARY'&&returned.text===disclosure&&returned.visible&&returned.focusVisible,returned);
  await capture('gap-cleared');
  await tabTo('Collapse walk details');await key('Enter','Enter',13);
  await until('details close',()=>evaluate(ui),u=>u.detailsHidden===true,10000);
  const focus=await evaluate(focusFacts);check('collapse restores visible details focus',focus.text==='Walk details'&&focus.visible&&focus.focusVisible,focus);
  await capture('details-closed');
  report.motion=await evaluate(()=>window.__qaMotion);
  check('reduced-motion camera operations observed',report.motion.some(m=>m.name==='fitBounds'));
  check('reduced-motion operations have zero duration',report.motion.every(m=>m.duration===0),report.motion);
  }
  await tabTo('MRT/LRT exits');await key('Enter','Enter',13);await until('MRT before reset',()=>evaluate(ui),u=>u.pressed[0]==='MRT/LRT exits',10000);
  await tabTo('Walk details');await key('Enter','Enter',13);await until('reset details open',()=>evaluate(ui),u=>u.detailsHidden===false,10000);
  const other=await evaluate(()=>[...document.querySelectorAll('#walk-details summary')].find(e=>e.textContent.trim().startsWith('Other stops'))?.textContent.trim());
  check('other saved MRT choices exist',!!other,other);
  await tabTo(other,'SUMMARY');await key('Enter','Enter',13);
  // The shortest saved Exit C differs from the bundle's declared default Exit E.
  // Do not mistake an unselected button for a nondefault option.
  check('current shortest differs from declared default',await evaluate(()=>!!document.querySelector('[aria-label="Use published default"]')));
  await tabTo('Use published default');await capture('reset-before');await key('Enter','Enter',13);
  await until('reset removes itself',()=>evaluate(()=>!document.querySelector('[aria-label="Use published default"]')),Boolean,10000);
  report.resetFocus=await evaluate(focusFacts);await capture('reset-after');
  check('reset retains visible surviving focus',report.resetFocus.tag==='H2'&&report.resetFocus.text==='Postal 018956'&&report.resetFocus.visible&&report.resetFocus.focusVisible,report.resetFocus);
  check('saved categories make no provider calls',(report.previewRequests??[]).length===0);
  check('no runtime or transport errors',report.errors.length===0&&report.denied.length===0,{errors:report.errors,denied:report.denied});
`;
const suffix=original.slice(original.indexOf(end)).replace("  report.scope = 'Actual pointer clicks on saved transit choices, disclosures and responsive layout. Headless desktop at emulated sizes; not a physical phone or representative performance benchmark. No pipeline/install/deploy.';",'');
const runner=resolve(out,`runner-${percent}-${Date.now()}.mjs`);
writeFileSync(runner,prefix+scene+suffix,{flag:'wx'});await import(pathToFileURL(runner).href);
