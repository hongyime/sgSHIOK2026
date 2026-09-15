import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
process.env.TEMP = process.env.TMP = resolve(root, 'tmp');
const mode = process.argv[2];
const focused = ['lib/__tests__/report-http.test.ts', 'lib/__tests__/report-store.test.ts', 'lib/__tests__/reports.test.ts', 'lib/__tests__/report-lifecycle.test.ts', 'lib/__tests__/report-submission.test.ts'];
const commands = {
  focused: [process.execPath, 'web/node_modules/vitest/vitest.mjs', 'run', '--root', resolve(root, 'web'), '--globals', '--maxWorkers', '1', '--no-file-parallelism', '--reporter=json', ...focused],
  isolated: [process.execPath, 'web/scripts/test-without-production-data.mjs', ...focused, '--reporter=dot', '--testTimeout=15000'],
  full: [process.execPath, 'web/scripts/test-without-production-data.mjs', '--reporter=dot', '--testTimeout=15000'],
  docs: [resolve(root, '.venv/Scripts/python.exe'), '-B', '-m', 'pytest', 'tests/test_readme.py', 'tests/test_agent_docs.py', 'tests/test_repo_integrity.py', '-q', '-p', 'no:cacheprovider'],
  types: [process.execPath, 'web/node_modules/typescript/bin/tsc', '--project', 'web/tsconfig.json', '--noEmit', '--incremental', 'false'],
  integrity: [resolve(root, '.venv/Scripts/python.exe'), '-B', 'scripts/check_repo_integrity.py'],
};
assert.ok(Object.hasOwn(commands, mode));
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/report-http-20260915/checks-'));
const command = commands[mode], started = Date.now();
const paths = ['web/app/api/reports/http.ts', 'web/app/api/reports/route.ts', 'web/app/api/reports/store.ts', 'web/lib/__tests__/report-http.test.ts', 'web/lib/__tests__/report-store.test.ts', 'web/lib/report-submission.ts', 'web/lib/__tests__/report-submission.test.ts'];
const hashes = () => Object.fromEntries(paths.map(path => [path, createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')]));
const sourceHashesAtStart = hashes();
const run = spawnSync(command[0], command.slice(1), { cwd: root, windowsHide: true, encoding: 'utf8', timeout: mode === 'full' ? 900000 : 240000, maxBuffer: 32 * 1024 * 1024 });
for (const stream of ['stdout', 'stderr']) writeFileSync(resolve(out, `${stream}.txt`), run[stream] ?? '', { flag: 'wx' });
const result = { mode, command, exit: run.status, elapsedMs: Date.now() - started, error: run.error?.code ?? null };
if (mode === 'focused') try {
  const report = JSON.parse(run.stdout);
  Object.assign(result, { tests: report.numTotalTests, passed: report.numPassedTests, failed: report.numFailedTests, files: report.testResults.length });
} catch { result.reportParseFailed = true; }
result.sources = hashes();
result.sourceHashesAtStart = sourceHashesAtStart;
result.sourceStable = JSON.stringify(sourceHashesAtStart) === JSON.stringify(result.sources);
if (mode === 'full' || mode === 'isolated') {
  const match = run.stdout?.match(/\{\s*"snapshot":\s*"[^]*$/);
  if (match) {
    const isolation = JSON.parse(match[0]);
    result.isolation = isolation;
    result.snapshotSources = Object.fromEntries(paths.map(path => [path, createHash('sha256').update(readFileSync(resolve(isolation.snapshot, path))).digest('hex')]));
  }
}
writeFileSync(resolve(out, 'summary.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ out, ...result }, null, 2));
process.exitCode = result.sourceStable ? (run.status ?? 1) : 1;
