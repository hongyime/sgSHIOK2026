import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026', label = process.argv[2];
if (process.cwd() !== root || !/^[a-z0-9-]+$/.test(label ?? '')) throw Error('Root/label required');
const output = resolve(root, `qa/revamp-r1/release-staging-20260910/${label}.json`);
const temporary = resolve(root, `tmp/release-parent-${label}`);
if (existsSync(output) || existsSync(temporary)) throw Error('Fresh receipt/test directory required');
const files = ['pipeline/publish.py', 'tests/test_publish.py', 'scripts/deploy-production.ps1',
  'scripts/preflight-production.ps1', 'scripts/release-data-bundle.ps1', 'scripts/activate-data-bundle.ps1',
  'tests/test_release_scripts.py', 'scripts/release_staging.py', 'tests/test_release_staging.py',
  'README.md', 'tests/test_readme.py', 'scripts/release_process.py', 'tests/test_release_process.py',
  'tests/test_agent_docs.py', 'tests/test_repo_integrity.py', 'tests/test_run.py', 'run.py',
  'scripts/check_repo_integrity.py', 'AGENTS.md', 'CLAUDE.md', '.gitignore', '.vercelignore', 'NOTICE'];
const hashes = () => files.map(path => ({ path, sha256: createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex') }));
const before = hashes(), started = Date.now();
const testSource = readFileSync(resolve(root, 'tests/test_publish.py'), 'utf8');
if (/tests\.test_export|from pipeline\.export|export_static_artifacts/.test(testSource)) {
  throw Error('Exporter-backed test setup forbidden; no tests started');
}
const command = resolve(root, '.venv/Scripts/python.exe');
const selected = process.argv.slice(3);
const args = ['-B', '-m', 'pytest', ...(selected.length ? selected : ['tests/test_publish.py', 'tests/test_release_scripts.py']),
  '-p', 'no:cacheprovider', '--basetemp', temporary, '-q'];
const run = spawnSync(command, args, { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 ** 2,
  timeout: 240000, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', PYTHONUTF8: '1', PYTEST_DISABLE_PLUGIN_AUTOLOAD: '1', TEMP: resolve(root, 'tmp'), TMP: resolve(root, 'tmp') } });
const after = hashes();
const receipt = { command, args, elapsedMs: Date.now() - started, before, after,
  stable: JSON.stringify(before) === JSON.stringify(after), exitCode: run.status, error: run.error?.message ?? null,
  stdout: run.stdout, stderr: run.stderr };
writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, elapsedMs: receipt.elapsedMs, stable: receipt.stable, exitCode: run.status,
  tail: (run.stdout ?? '').split('\n').slice(-6), error: receipt.error }));
if (run.status !== 0 || !receipt.stable) process.exitCode = 1;
