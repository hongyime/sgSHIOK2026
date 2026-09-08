import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [name, mode = 'focused'] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(name || '') || !['focused', 'full'].includes(mode)) throw Error('Unique report name and focused/full mode required');
const output = resolve(root, 'qa/revamp-r1/data-cache-recovery-20260909', name);
if (existsSync(output)) throw Error('Preserve previous evidence');
mkdirSync(output);
const report = { commands: [], inputs: [], startedAt: new Date().toISOString(), pipelineRuns: 0, installs: 0, deployment: false };
const sources = JSON.parse(readFileSync(resolve(root, 'web/lib/__tests__/fixtures/published-walks.provenance.json'))).sources;
for (const source of Object.values(sources)) {
  const bytes = readFileSync(resolve(root, source.path));
  const actual = createHash('sha256').update(bytes).digest('hex');
  const item = { path: source.path, bytes: bytes.length, expected: source.sha256, actual, match: actual === source.sha256 && bytes.length === source.bytes };
  report.inputs.push(item);
  if (!item.match) {
    writeFileSync(resolve(output, 'checks.json'), JSON.stringify(report, null, 2) + '\n');
    throw Error('STOP_INPUT_MISMATCH ' + JSON.stringify(item));
  }
}
const commands = mode === 'focused'
  ? [[process.execPath, ['C:/sgSHIOK2026/web/node_modules/vitest/vitest.mjs', 'run', 'lib/__tests__/data-cache-recovery.test.ts', 'lib/__tests__/data-fetch-policy.test.ts', '--root', 'C:/sgSHIOK2026/web', '--maxWorkers=1']]]
  : [
    [process.execPath, ['C:/sgSHIOK2026/web/scripts/test-without-production-data.mjs', '--reporter=dot']],
    [process.execPath, ['C:/sgSHIOK2026/web/node_modules/typescript/bin/tsc', '--project', 'C:/sgSHIOK2026/web/tsconfig.json', '--noEmit', '--incremental', 'false']],
    ['python', ['C:/sgSHIOK2026/scripts/check_repo_integrity.py']],
    ['git', ['diff', '--check']],
  ];
for (const [command, args] of commands) {
  const start = Date.now();
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 12 * 1024 * 1024 });
  const item = { command, args, stdout: result.stdout, stderr: result.stderr, exitCode: result.status, error: result.error?.message, elapsedSeconds: (Date.now() - start) / 1000 };
  report.commands.push(item);
  console.log(JSON.stringify(item));
  if (result.status !== 0) break;
}
report.finishedAt = new Date().toISOString();
report.ok = report.commands.length === commands.length && report.commands.every(item => item.exitCode === 0);
writeFileSync(resolve(output, 'checks.json'), JSON.stringify(report, null, 2) + '\n');
process.exitCode = report.ok ? 0 : 1;
