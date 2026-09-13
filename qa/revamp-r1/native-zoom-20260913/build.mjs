import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
let code=readFileSync(resolve(root,'qa/revamp-r1/completion-20260913/build.mjs'),'utf8');
for(const [before,after] of [
  ['qa/revamp-r1/completion-20260913/build-1','qa/revamp-r1/native-zoom-20260913/build-1'],
  ['tmp/completion-20260913-build-1','tmp/native-zoom-20260913-build-1']]){
  assert.equal(code.split(before).length,2);code=code.replace(before,after);
}
const runner=resolve(root,'qa/revamp-r1/native-zoom-20260913',`build-${Date.now()}.mjs`);
writeFileSync(runner,code,{flag:'wx'});await import(pathToFileURL(runner).href);
