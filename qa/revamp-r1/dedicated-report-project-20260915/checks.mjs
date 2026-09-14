import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
process.env.TEMP = process.env.TMP = resolve(root, 'tmp');
const mode = process.argv[2];
const commands = {
  web: [process.execPath, 'web/node_modules/vitest/vitest.mjs', 'run', '--root', resolve(root, 'web'), '--globals', '--maxWorkers', '1', '--no-file-parallelism', '--reporter=json', 'lib/__tests__/report-store.test.ts', 'lib/__tests__/reports.test.ts', 'lib/__tests__/report-lifecycle.test.ts'],
  guards: [process.execPath, '--test', 'qa/revamp-r1/dedicated-report-project-20260915/project-guard.test.mjs', 'qa/revamp-r1/report-project-stop-20260914/retired-scripts.test.mjs'],
  isolated: [process.execPath, 'web/scripts/test-without-production-data.mjs', 'lib/__tests__/report-store.test.ts', 'lib/__tests__/reports.test.ts', 'lib/__tests__/report-lifecycle.test.ts', '--reporter=dot', '--testTimeout=15000'],
  docs: [resolve(root, '.venv/Scripts/python.exe'), '-B', '-m', 'pytest', 'tests/test_readme.py', 'tests/test_agent_docs.py', 'tests/test_repo_integrity.py', '-q', '-p', 'no:cacheprovider'],
  types: [process.execPath, 'web/node_modules/typescript/bin/tsc', '--project', 'web/tsconfig.json', '--noEmit', '--incremental', 'false'],
  integrity: [resolve(root, '.venv/Scripts/python.exe'), '-B', 'scripts/check_repo_integrity.py'],
};
assert.ok(Object.hasOwn(commands, mode));
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/dedicated-report-project-20260915/checks-'));
const command = commands[mode], started = Date.now();
const run = spawnSync(command[0], command.slice(1), { cwd: root, windowsHide: true, encoding: 'utf8', timeout: 240000, maxBuffer: 16 * 1024 * 1024 });
for (const stream of ['stdout', 'stderr']) writeFileSync(resolve(out, `${stream}.txt`), run[stream] ?? '', { flag: 'wx' });
const result = { mode, command, exit: run.status, elapsedMs: Date.now() - started, error: run.error?.code ?? null };
if (mode === 'web') try {
  const report = JSON.parse(run.stdout);
  Object.assign(result, { tests: report.numTotalTests, passed: report.numPassedTests, failed: report.numFailedTests, files: report.testResults.length });
} catch { result.reportParseFailed = true; }
writeFileSync(resolve(out, 'summary.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ out, ...result }, null, 2));
process.exitCode = run.status ?? 1;
