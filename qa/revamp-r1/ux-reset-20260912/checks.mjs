import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const out = resolve(root, 'qa/revamp-r1/ux-reset-20260912/checks-' + Date.now());
mkdirSync(out);
const commands = [
  ['focused', process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--globals', '--maxWorkers', '1', '--no-file-parallelism', 'lib/__tests__/published-walk-page.test.tsx', 'lib/__tests__/accessibility-render.test.tsx', 'lib/__tests__/transit-stop-picker.test.tsx', 'lib/__tests__/exposure-section-explorer.test.tsx', 'lib/__tests__/score-card-copy.test.ts'], resolve(root, 'web')],
  ['isolated', process.execPath, ['web/scripts/test-without-production-data.mjs', '--reporter=dot', '--testTimeout=15000'], root],
  ['types', process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--incremental', 'false'], resolve(root, 'web')],
  ['integrity', 'python', ['scripts/check_repo_integrity.py'], root],
];
const report = [];
for (const [name, executable, args, cwd] of commands) {
  const started = Date.now();
  const result = spawnSync(executable, args, { cwd, encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  writeFileSync(resolve(out, name + '.stdout.txt'), result.stdout ?? '', { flag: 'wx' });
  writeFileSync(resolve(out, name + '.stderr.txt'), result.stderr ?? '', { flag: 'wx' });
  report.push({ name, executable, args, cwd, exitCode: result.status, elapsedMs: Date.now() - started, error: result.error?.message });
  console.log(JSON.stringify(report.at(-1)));
  if (result.status !== 0) break;
}
writeFileSync(resolve(out, 'checks.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(out);
process.exitCode = report.some(r => r.exitCode !== 0) ? 1 : 0;
