import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/coverage-cost-20260910', old = 'qa/revamp-r1/coverage-register-20260909';
assert.equal(process.cwd(), root);
const [mode, label] = process.argv.slice(2);
assert.ok(['pilot', 'contracts', 'integrity'].includes(mode)); assert.match(label ?? '', /^[a-z0-9-]+$/);
const out = resolve(root, folder, label); mkdirSync(out);
const hash = p => createHash('sha256').update(readFileSync(resolve(root, p))).digest('hex');
const sources = ['reader.mjs', 'reader.test.mjs', 'locators.mjs', 'engine.mjs', 'projection.mjs', 'scan.mjs'].map(p => old + '/' + p)
  .concat(['profile-scan.mjs', 'budget.test.mjs', 'record.mjs'].map(p => folder + '/' + p));
const identities = () => sources.map(path => ({ path, sha256: hash(path) }));
const anchors = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/lifecycle-probe-20260910/contracts-4/command.json'))).anchorsAfter;
const checkAnchors = () => anchors.map(p => { const actual = hash(p.path); assert.equal(actual, p.expected, p.path + ' ' + actual); return { ...p, actual }; });
const before = identities(), anchorsBefore = checkAnchors();
for (const p of before) writeFileSync(resolve(out, p.path.startsWith(old) ? 'source-' + p.path.split('/').at(-1) : p.path.split('/').at(-1)), readFileSync(resolve(root, p.path)), { flag: 'wx' });
const executable = mode === 'integrity' ? resolve(root, '.venv/Scripts/python.exe') : process.execPath;
const args = mode === 'pilot' ? [resolve(root, folder, 'profile-scan.mjs'), label]
  : mode === 'integrity' ? ['-B', resolve(root, 'scripts/check_repo_integrity.py')]
  : ['--test', '--test-concurrency=1', ...['reader', 'locators', 'engine', 'projection'].map(p => resolve(root, old, p + '.test.mjs')), resolve(root, folder, 'budget.test.mjs')];
const started = performance.now();
const result = spawnSync(executable, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: mode === 'pilot' ? 360000 : 180000, maxBuffer: 8 * 1024 ** 2 });
const report = { root, host: process.env.COMPUTERNAME, base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), mode,
  executable, args, elapsedMs: performance.now() - started, exitCode: result.status, error: result.error?.message,
  stdout: result.stdout, stderr: result.stderr, before, after: identities(), anchorsBefore, anchorsAfter: checkAnchors() };
writeFileSync(resolve(out, 'command.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ label, mode, exitCode: result.status, error: result.error?.message, stdout: result.stdout, stderr: result.stderr }));
process.exitCode = result.status ?? 1;
