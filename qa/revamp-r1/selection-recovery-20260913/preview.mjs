import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
process.env.TEMP=process.env.TMP=resolve(root,'tmp');
let code=readFileSync(resolve(root,'qa/revamp-r1/completion-20260913/preview-2.mjs'),'utf8');
code=code.replaceAll('qa/revamp-r1/completion-20260913','qa/revamp-r1/selection-recovery-20260913')
  .replaceAll('build-2/build.json','build-1/build.json').replaceAll('4337','4340').replaceAll('4411','4417').replaceAll('4412','4418');
const listen="  await listen(data,4340,'localhost');await listen(proxy,4418,'127.0.0.1');";
assert.equal(code.split(listen).length,2);
code=code.replace(listen,"  const check=await fetch('http://[::1]:4340/data/generated_20260805_prefer_scored_routed/manifest.json',{signal:AbortSignal.timeout(5000)});assert.ok(check.ok);assert.equal(createHash('sha256').update(Buffer.from(await check.arrayBuffer())).digest('hex'),hash(resolve(dataRoot,'generated_20260805_prefer_scored_routed/manifest.json')));\n  await listen(proxy,4418,'127.0.0.1');");
const runner=resolve(root,'qa/revamp-r1/selection-recovery-20260913',`preview-${Date.now()}.mjs`);
writeFileSync(runner,code,{flag:'wx'});await import(pathToFileURL(runner).href);
