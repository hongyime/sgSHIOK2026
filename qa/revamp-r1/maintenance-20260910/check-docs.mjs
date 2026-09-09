import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026', label = process.argv[2];
if (process.cwd() !== root || !/^[a-z0-9-]+$/.test(label ?? '')) throw Error('Root/label required');
const output = resolve(root, `qa/revamp-r1/maintenance-20260910/${label}.json`);
const temporary = resolve(root, `tmp/maintenance-docs-${label}`);
if (existsSync(output) || existsSync(temporary)) throw Error('Fresh receipt and test directory required');
const files = ['README.md', 'CLAUDE.md', 'tests/test_readme.py', 'tests/test_agent_docs.py', 'tests/test_repo_integrity.py', 'scripts/check_repo_integrity.py'];
const hashes = () => files.map(path => ({ path, sha256: createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex') }));
const before = hashes(), started = Date.now();
const command = resolve(root, '.venv/Scripts/python.exe');
const args = ['-B', '-m', 'pytest', 'tests/test_readme.py', 'tests/test_agent_docs.py', 'tests/test_repo_integrity.py',
  '-p', 'no:cacheprovider', '--basetemp', temporary, '-q'];
const run = spawnSync(command, args, { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 4 * 1024 ** 2,
  env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', PYTHONUTF8: '1', PYTEST_DISABLE_PLUGIN_AUTOLOAD: '1', TEMP: resolve(root, 'tmp'), TMP: resolve(root, 'tmp') } });
const after = hashes();
const receipt = { command, args, elapsedMs: Date.now() - started, before, after,
  stable: JSON.stringify(before) === JSON.stringify(after), exitCode: run.status, stdout: run.stdout, stderr: run.stderr };
writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(receipt));
if (run.status !== 0 || !receipt.stable) process.exitCode = 1;
