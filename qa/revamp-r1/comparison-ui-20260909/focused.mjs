import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong root');
const label = process.argv[2];
if (!/^[a-z0-9-]+$/.test(label || '')) throw Error('Fresh label required');
const out = resolve(root, 'qa/revamp-r1/comparison-ui-20260909', label);
mkdirSync(out);
const files = ['web/lib/comparison.ts','web/lib/comparison-controller.ts','web/app/page.tsx','web/components/home-comparison.tsx',
  'web/lib/__tests__/comparison.test.ts','web/lib/__tests__/comparison-controller.test.ts','web/lib/__tests__/published-walk-page.test.tsx','web/lib/__tests__/home-comparison.test.tsx'];
const identities = () => files.map(path => ({path, sha256:createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')}));
const before = identities(), args = ['C:/sgSHIOK2026/web/scripts/test-web.mjs',...files.filter(path=>path.includes('/__tests__/')).map(path=>path.replace(/^web\//,'')),'--no-cache','--reporter=dot'];
const start = Date.now(), result = spawnSync(process.execPath,args,{cwd:root,windowsHide:true,encoding:'utf8',maxBuffer:12*1024*1024});
const after = identities();
const report = {command:process.execPath,args,exitCode:result.status,stdout:result.stdout,stderr:result.stderr,error:result.error?.message,
  elapsedSeconds:(Date.now()-start)/1000,before,after,identitiesStable:JSON.stringify(before)===JSON.stringify(after)};
writeFileSync(resolve(out,'checks.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,exitCode:result.status,identitiesStable:report.identitiesStable,stdout:result.stdout,stderr:result.stderr}));
process.exitCode=result.status===0&&report.identitiesStable?0:1;
