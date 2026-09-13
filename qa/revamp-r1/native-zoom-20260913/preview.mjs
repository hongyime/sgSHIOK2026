import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
let code=readFileSync(resolve(root,'qa/revamp-r1/completion-20260913/preview-2.mjs'),'utf8');
code=code.replaceAll('qa/revamp-r1/completion-20260913','qa/revamp-r1/native-zoom-20260913')
  .replaceAll('build-2/build.json','build-1/build.json').replaceAll('4337','4340').replaceAll('4411','4415').replaceAll('4412','4416');
const runner=resolve(root,'qa/revamp-r1/native-zoom-20260913',`preview-${Date.now()}.mjs`);
writeFileSync(runner,code,{flag:'wx'});await import(pathToFileURL(runner).href);
