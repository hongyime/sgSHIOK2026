import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [name, mode = 'focused'] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(name || '') || !['focused', 'full'].includes(mode)) {
  throw Error('Unique report name and focused/full mode required');
}
const output = resolve(root, 'qa/revamp-r1/published-options-20260909', name);
if (existsSync(output)) throw Error('Preserve previous evidence');
mkdirSync(output);
const report = {
  startedAt: new Date().toISOString(), mode, inputs: [], commands: [],
  pipelineRuns: 0, installations: 0, deploymentCommands: 0,
};
const save = () => writeFileSync(resolve(output, 'checks.json'), JSON.stringify(report, null, 2) + '\n');
const provenance = JSON.parse(readFileSync(resolve(root, 'web/lib/__tests__/fixtures/published-walks.provenance.json')));
for (const source of Object.values(provenance.sources)) {
  const bytes = readFileSync(resolve(root, source.path));
  const actual = createHash('sha256').update(bytes).digest('hex');
  const item = { path: source.path, bytes: bytes.length, expected: source.sha256, actual, match: actual === source.sha256 && bytes.length === source.bytes };
  report.inputs.push(item);
  if (!item.match) {
    save();
    throw Error('STOP_INPUT_MISMATCH ' + JSON.stringify(item));
  }
}
const focused = ['lib/__tests__/published-options-fixture.test.ts', 'lib/__tests__/published-transit-options.test.ts'];
const commands = [
  [process.execPath, ['C:/sgSHIOK2026/web/scripts/test-without-production-data.mjs', ...(mode === 'focused' ? focused : []), '--reporter=dot']],
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
  save();
  if (result.status !== 0) break;
}
report.finishedAt = new Date().toISOString();
report.ok = report.commands.length === commands.length && report.commands.every(item => item.exitCode === 0);
save();
process.exitCode = report.ok ? 0 : 1;
