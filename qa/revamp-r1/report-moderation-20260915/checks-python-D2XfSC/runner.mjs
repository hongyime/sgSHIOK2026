import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
process.env.TEMP = process.env.TMP = resolve(root, 'tmp');
const mode = process.argv[2];
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/report-moderation-20260915', `checks-${mode}-`));
const commands = {
  focused: [process.execPath, 'web/scripts/test-web.mjs', 'lib/__tests__/moderator-auth.test.ts',
    'lib/__tests__/report-lifecycle.test.ts', '--reporter=json', `--outputFile=${resolve(out, 'vitest.json')}`, '--testTimeout=15000'],
  full: [process.execPath, 'web/scripts/test-without-production-data.mjs', '--reporter=dot', '--testTimeout=15000'],
  types: [process.execPath, 'web/node_modules/typescript/bin/tsc', '--project', 'web/tsconfig.json', '--noEmit', '--incremental', 'false'],
  python: [resolve(root, '.venv/Scripts/python.exe'), '-B', '-m', 'pytest', 'tests/test_report_cleanup_health.py',
    'tests/test_collect_report_cleanup_health.py', 'tests/test_readme.py', 'tests/test_agent_docs.py', 'tests/test_repo_integrity.py', '-q', '-p', 'no:cacheprovider'],
};
assert.ok(Object.hasOwn(commands, mode));
const paths = ['web/app/api/moderation/auth.ts', 'web/lib/__tests__/moderator-auth.test.ts', 'web/lib/report-lifecycle.ts'];
const sources = base => Object.fromEntries(paths.map(p => [p, createHash('sha256').update(readFileSync(resolve(base, p))).digest('hex')]));
const before = sources(root); const started = Date.now();
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
const command = commands[mode];
const run = spawnSync(command[0], command.slice(1), { cwd: root, windowsHide: true, encoding: 'utf8',
  timeout: mode === 'full' ? 900000 : 240000, maxBuffer: 32 * 1024 * 1024 });
for (const s of ['stdout', 'stderr']) writeFileSync(resolve(out, `${s}.txt`), run[s] ?? '', { flag: 'wx' });
const result = { mode, command, exit: run.status, error: run.error?.code ?? null, elapsedMs: Date.now() - started,
  before, after: sources(root) };
result.sourceStable = JSON.stringify(result.before) === JSON.stringify(result.after);
if (mode === 'focused') {
  try { const v = JSON.parse(readFileSync(resolve(out, 'vitest.json'), 'utf8'));
    result.tests = { passed: v.numPassedTests, failed: v.numFailedTests, files: v.testResults.length };
  } catch { result.reportParseFailed = true; }
}
if (mode === 'full') {
  const match = run.stdout?.match(/\{\s*"snapshot":\s*"[^]*$/);
  if (match) { result.isolation = JSON.parse(match[0]); result.snapshotSources = sources(result.isolation.snapshot); }
}
writeFileSync(resolve(out, 'summary.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ out, ...result }, null, 2));
process.exitCode = result.sourceStable ? (run.status ?? 1) : 1;
