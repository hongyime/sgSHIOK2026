import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
process.env.TEMP = process.env.TMP = resolve(root, 'tmp');
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/report-project-stop-20260914/checks-'));
const mode = process.argv[2] ?? 'guard';
assert.ok(['guard', 'web', 'docs', 'types', 'integrity'].includes(mode));
const commands = {
  guard: [process.execPath, '--test', 'qa/revamp-r1/report-project-stop-20260914/retired-scripts.test.mjs'],
  web: [process.execPath, 'web/node_modules/vitest/vitest.mjs', 'run', '--root', resolve(root, 'web'), '--globals', '--maxWorkers', '1', '--no-file-parallelism', '--reporter=json', 'lib/__tests__/report-store.test.ts', 'lib/__tests__/reports.test.ts', 'lib/__tests__/report-lifecycle.test.ts'],
  docs: [resolve(root, '.venv/Scripts/python.exe'), '-B', '-m', 'pytest', 'tests/test_readme.py', 'tests/test_agent_docs.py', 'tests/test_repo_integrity.py', '-q', '-p', 'no:cacheprovider'],
  types: [process.execPath, 'web/node_modules/typescript/bin/tsc', '--project', 'web/tsconfig.json', '--noEmit', '--incremental', 'false'],
  integrity: [resolve(root, '.venv/Scripts/python.exe'), '-B', 'scripts/check_repo_integrity.py'],
};
const command = commands[mode];
const started = Date.now();
const result = spawnSync(command[0], command.slice(1), { cwd: root, windowsHide: true, encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024 });
for (const stream of ['stdout', 'stderr']) writeFileSync(resolve(out, `${stream}.txt`), result[stream] ?? '', { flag: 'wx' });
const summary = { mode, command, exit: result.status, elapsedMs: Date.now() - started, error: result.error?.code ?? null };
if (mode === 'web') {
  try {
    const report = JSON.parse(result.stdout);
    Object.assign(summary, { tests: report.numTotalTests, passed: report.numPassedTests, failed: report.numFailedTests, files: report.testResults.length });
  } catch { summary.reportParseFailed = true; }
}
const evidence = readFileSync(resolve(root, 'qa/verification/REVAMP-R1-core-walk.md'));
summary.evidence = { bytes: evidence.length, sha256: createHash('sha256').update(evidence).digest('hex') };
writeFileSync(resolve(out, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ out, ...summary }, null, 2));
process.exitCode = result.status ?? 1;
