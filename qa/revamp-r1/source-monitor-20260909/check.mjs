import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [label, ...tests] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label ?? '') || !tests.length || tests.some(path => !/^tests\/test_source_metadata_[a-z]+\.py$/.test(path))) throw Error('Fresh label and scoped source metadata tests required');
const out = resolve(root, 'qa/revamp-r1/source-monitor-20260909', label), temp = resolve(root, 'tmp/source-monitor-tests-' + label);
if (existsSync(temp)) throw Error('Preserve prior test directory');
mkdirSync(out);
const dependencies = {
  http: ['source_metadata_http.py', 'source_metadata_state.py'], state: ['source_metadata_state.py'],
  catalog: ['build_source_metadata_catalog.py', 'source_metadata_http.py', 'check_source_metadata.py', 'source_metadata_state.py'],
  cli: ['check_source_metadata.py', 'build_source_metadata_catalog.py', 'source_metadata_http.py', 'source_metadata_state.py'],
};
const names = [...new Set([...tests, ...tests.flatMap(path => dependencies[path.match(/metadata_([a-z]+)\.py$/)[1]].map(name => 'scripts/' + name))])];
const identities = () => names.map(path => ({ path, sha256: existsSync(resolve(root, path)) ? createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex') : null }));
const before = identities(), started = Date.now();
const args = ['-B', '-m', 'pytest', ...tests, '-p', 'no:cacheprovider', '--basetemp', temp, '-q'];
const result = spawnSync(resolve(root, '.venv/Scripts/python.exe'), args, { cwd: root, windowsHide: true, encoding: 'utf8', maxBuffer: 8 * 1024 ** 2,
  env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', PYTEST_DISABLE_PLUGIN_AUTOLOAD: '1', PYTEST_ADDOPTS: '' } });
const after = identities(), report = { command: resolve(root, '.venv/Scripts/python.exe'), args, before, after, stable: JSON.stringify(before) === JSON.stringify(after), exitCode: result.status, stdout: result.stdout, stderr: result.stderr, elapsedMs: Date.now() - started };
writeFileSync(resolve(out, 'checks.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ out, ...report })); process.exitCode = result.status === 0 && report.stable ? 0 : 1;
