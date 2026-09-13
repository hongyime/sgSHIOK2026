import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
let code=readFileSync(resolve(root,'qa/revamp-r1/selection-recovery-20260913/preview.mjs'),'utf8');
code=code.replaceAll(".replaceAll('build-2/build.json','build-1/build.json')",'')
  .replaceAll('4417','4419').replaceAll('4418','4420');
const target='const runner=resolve(';
assert.equal(code.split(target).length,2);
code=code.replace(target,"code=code.replaceAll('preview-2.json','preview-3.json').replaceAll('next-2.','next-3.').replaceAll('source-check-2.json','source-check-3.json');\n"+target);
const runner=resolve(root,'qa/revamp-r1/selection-recovery-20260913',`preview-wrapper-${Date.now()}.mjs`);
writeFileSync(runner,code,{flag:'wx'});await import(pathToFileURL(runner).href);
