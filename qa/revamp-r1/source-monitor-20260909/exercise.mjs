import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const [phase, label] = process.argv.slice(2);
if (!['catalog', 'live'].includes(phase) || !/^[a-z0-9-]+$/.test(label ?? '')) throw Error('Explicit phase and fresh label required');
const receipt = resolve(root, 'qa/revamp-r1/source-monitor-20260909', label);
mkdirSync(receipt);
const sources = ['scripts/build_source_metadata_catalog.py', 'scripts/check_source_metadata.py', 'scripts/source_metadata_http.py', 'scripts/source_metadata_state.py', 'pipeline/config/sources.yaml', 'raw/manifest.json'];
if (phase === 'live') sources.push('source-metadata-catalog.json');
const identities = () => sources.map(path => ({ path, sha256: createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex') }));
const before = identities(), start = Date.now();
const output = resolve(root, 'qa/source-monitor', label);
if (phase === 'live' && existsSync(output)) throw Error('Preserve prior monitor output');
const args = phase === 'catalog' ? ['-B', '-m', 'scripts.build_source_metadata_catalog']
  : ['-B', '-m', 'scripts.check_source_metadata', '--output', output];
const result = spawnSync(resolve(root, '.venv/Scripts/python.exe'), args, { cwd: root, windowsHide: true, encoding: 'utf8',
  maxBuffer: 4 * 1024 ** 2, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', PYTHONUTF8: '1' } });
const after = identities();
const record = { phase, command: resolve(root, '.venv/Scripts/python.exe'), args, startedAt: new Date(start).toISOString(), elapsedMs: Date.now() - start,
  exitCode: result.status, stdout: result.stdout, stderr: result.stderr, before, after, identitiesStable: JSON.stringify(before) === JSON.stringify(after) };
writeFileSync(resolve(receipt, 'command.json'), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(record));
process.exitCode = record.identitiesStable && (result.status === 0 || (phase === 'live' && result.status === 1)) ? 0 : 1;
