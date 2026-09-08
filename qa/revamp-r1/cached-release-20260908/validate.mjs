import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const name = process.argv[2];
if (!/^[a-z0-9-]+$/.test(name || '')) throw Error('Fresh validation name required');
const out = resolve(root, 'qa/revamp-r1/cached-release-20260908', name);
if (existsSync(out)) throw Error('Preserve earlier validation');
mkdirSync(out);
const sources = JSON.parse(readFileSync(resolve(root, 'web/lib/__tests__/fixtures/published-walks.provenance.json'), 'utf8')).sources;
const report = { startedAt: new Date().toISOString(), inputs: [], commands: [], pipelineRuns: 0, dependencyInstalls: 0, deployment: false };
let failed = false;
for (const source of Object.values(sources)) {
  const bytes = readFileSync(resolve(root, source.path));
  const actual = createHash('sha256').update(bytes).digest('hex');
  const result = { path: source.path, bytes: bytes.length, expected: source.sha256, actual, match: actual === source.sha256 && bytes.length === source.bytes };
  report.inputs.push(result);
  if (!result.match) { failed = true; console.error('STOP_INPUT_MISMATCH', JSON.stringify(result)); break; }
}
const commands = [
  [process.execPath, ['C:/sgSHIOK2026/web/scripts/test-without-production-data.mjs', '--reporter=dot']],
  [process.execPath, ['C:/sgSHIOK2026/web/node_modules/typescript/bin/tsc', '--project', 'C:/sgSHIOK2026/web/tsconfig.json', '--noEmit', '--incremental', 'false']],
  ['python', ['C:/sgSHIOK2026/scripts/check_repo_integrity.py']],
  ['git', ['diff', '--check']],
];
if (!failed) for (const [command, args] of commands) {
  const start = Date.now();
  const result = spawnSync(command, args, { cwd: root, windowsHide: true, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024 });
  const item = { command, args, stdout: result.stdout, stderr: result.stderr, exitCode: result.status, error: result.error?.message, elapsedSeconds: (Date.now() - start) / 1000 };
  report.commands.push(item);
  console.log(JSON.stringify(item));
  if (result.status !== 0) { failed = true; break; }
}
report.changedTrackedPaths = execFileSync('git', ['diff', 'HEAD', '--name-only'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
report.finishedAt = new Date().toISOString();
report.ok = !failed;
writeFileSync(resolve(out, 'validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ok: report.ok, inputAnchors: report.inputs.length, output: out }));
process.exitCode = failed ? 1 : 0;
