import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const out = resolve(root, 'qa/revamp-r1/completion-20260913/checks-' + Date.now());
mkdirSync(out);
const [mode, ...args] = process.argv.slice(2);
const command = mode === 'full'
  ? ['web/scripts/test-without-production-data.mjs', '--reporter=dot', '--testTimeout=15000']
  : mode === 'types'
    ? ['web/node_modules/typescript/bin/tsc', '--project', 'web/tsconfig.json', '--noEmit', '--incremental', 'false']
    : ['node_modules/vitest/vitest.mjs', 'run', '--globals', '--maxWorkers', '1', '--no-file-parallelism', '--reporter=json', ...args];
const cwd = mode === 'focused' ? resolve(root, 'web') : root;
const started = Date.now();
const result = spawnSync(process.execPath, command, { cwd, windowsHide: true, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
writeFileSync(resolve(out, 'stdout.txt'), result.stdout ?? '', { flag: 'wx' });
writeFileSync(resolve(out, 'stderr.txt'), result.stderr ?? '', { flag: 'wx' });
const report = { command: [process.execPath, ...command], cwd, exitCode: result.status, elapsedMs: Date.now() - started };
if (mode === 'focused') {
  try {
    const r = JSON.parse(result.stdout);
    report.counts = { tests: r.numTotalTests, passed: r.numPassedTests, failed: r.numFailedTests };
    report.failures = r.testResults.flatMap(t => t.assertionResults.filter(a => a.status === 'failed').map(a => ({ name: a.fullName, messages: a.failureMessages })));
  } catch { report.outputTail = result.stdout?.slice(-2000); }
}
writeFileSync(resolve(out, 'result.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ out, ...report }, null, 2));
process.exitCode = result.status ?? 1;
