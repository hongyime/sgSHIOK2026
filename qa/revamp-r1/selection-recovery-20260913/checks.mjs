import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
process.env.TEMP = process.env.TMP = resolve(root, 'tmp');
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/selection-recovery-20260913/checks-'));
const [mode, ...args] = process.argv.slice(2);
assert.ok(['focused', 'full', 'types'].includes(mode));
const command = mode === 'full' ? ['web/scripts/test-without-production-data.mjs', '--reporter=dot', '--testTimeout=15000']
  : mode === 'types' ? ['web/node_modules/typescript/bin/tsc', '--project', 'web/tsconfig.json', '--noEmit', '--incremental', 'false']
  : ['node_modules/vitest/vitest.mjs', 'run', '--globals', '--maxWorkers', '1', '--no-file-parallelism', '--reporter=json', ...args];
const cwd = mode === 'focused' ? resolve(root, 'web') : root, started = Date.now();
const sources = ['web/app/page.tsx','web/app/page.module.css','web/lib/__tests__/walk-recovery-focus.test.tsx','web/lib/__tests__/accessibility-render.test.tsx'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')}));
const child = spawnSync(process.execPath, command, { cwd, windowsHide: true, encoding: 'utf8', maxBuffer:32*1024*1024, timeout:600000 });
for (const stream of ['stdout','stderr']) writeFileSync(resolve(out, stream+'.txt'), child[stream]??'', {flag:'wx'});
const report = { command:[process.execPath,...command],cwd,exitCode:child.status,elapsedMs:Date.now()-started,error:child.error?.message,sources };
if(mode==='focused') {
  try { const r=JSON.parse(child.stdout);report.counts={tests:r.numTotalTests,passed:r.numPassedTests,failed:r.numFailedTests};report.failures=r.testResults.flatMap(t=>t.assertionResults.filter(a=>a.status==='failed').map(a=>({name:a.fullName,messages:a.failureMessages}))); }
  catch {report.parseFailed=true;}
}
writeFileSync(resolve(out,'result.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,...report},null,2)); process.exitCode=child.status??1;
