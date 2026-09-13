import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { focusGeometry } from './focus-geometry.mjs';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const dir=resolve(root,'qa/revamp-r1/selection-recovery-20260913');
let code=readFileSync(resolve(dir,'browser.mjs'),'utf8');
function replace(before,after){assert.equal(code.split(before).length,2,before);code=code.replace(before,after);}
replace("'observed-'","'corrected-'");
// These are replacement targets in the frozen generator, not the old attempt.
replace("'http://127.0.0.1:4418'","'http://127.0.0.1:4420'");
replace("'qa/revamp-r1/selection-recovery-20260913/build-1/build.json'","'qa/revamp-r1/selection-recovery-20260913/build-2/build.json'");
replace("const fits=!!r&&r.width>0&&r.height>0&&r.left>=clip.left-.5&&r.right<=clip.right+.5&&r.top>=clip.top-.5&&r.bottom<=clip.bottom+.5;",
  'const geometry=('+focusGeometry.toString()+')(r,clip,e?.tagName===\'CANVAS\',parseFloat(s?.outlineWidth),parseFloat(s?.outlineOffset));const fits=geometry.fits;');
replace('return{tag:e?.tagName,id:e?.id,text:e?.textContent?.trim(),label:e?.getAttribute(\'aria-label\'),clip,box:',
  'return{geometry,tag:e?.tagName,id:e?.id,text:e?.textContent?.trim(),label:e?.getAttribute(\'aria-label\'),clip,box:');
replace("check('keyboard focus '+text,f.visible&&f.focusVisible,f);return f;",
  "await shot('focus-'+tag+'-'+text.replaceAll(' ','-').replaceAll('/','-'));check('keyboard focus '+text,f.visible&&f.focusVisible&&f.geometry.ringFits,f);return f;");
replace("await tabTo('MRT/LRT exits');await shot('walk-controls-return');",
  "await tabTo('MRT/LRT exits');await shot('walk-controls-return');await tabTo('Bus stops');await shot('active-bus-focus');");
replace("check('keyboard can leave canvas',report.keyboardExit.tag!=='CANVAS'&&report.keyboardExit.visible&&report.keyboardExit.focusVisible,report.keyboardExit);await shot('keyboard-exit');",
  "await shot('keyboard-exit');check('keyboard can leave canvas',report.keyboardExit.tag!=='CANVAS'&&report.keyboardExit.visible&&report.keyboardExit.focusVisible&&report.keyboardExit.geometry.ringFits,report.keyboardExit);");
const runner=resolve(dir,`browser-generator-${Date.now()}.mjs`);
writeFileSync(runner,code,{flag:'wx'});await import(pathToFileURL(runner).href);
