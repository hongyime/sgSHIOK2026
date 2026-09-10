import { spawnSync, execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/lifecycle-probe-20260910';
if (process.cwd() !== root) throw Error('Wrong root');
const [label, mode = 'contracts'] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(label ?? '') || !['contracts', 'integrity'].includes(mode)) throw Error('Invalid receipt scope');
const out = resolve(root, folder, label);
if (existsSync(out)) throw Error('Preserve existing receipts');
mkdirSync(out);
const hash = path => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
const paths = ['browser.mjs', 'server.mjs', 'page.mjs', 'server.test.mjs', 'worker-session.mjs', 'worker-session.test.mjs', 'analyze.mjs', 'analyze.test.mjs'].map(p => folder + '/' + p).filter(p => existsSync(resolve(root, p)));
const sources = () => paths.map(path => ({ path, sha256: hash(path) }));
const anchors = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/dependency-alignment-20260910/final-contracts-2/command.json'))).anchorsAfter;
const checkAnchors = () => anchors.map(p => { const actual = hash(p.path); if (actual !== p.expected) throw Error('Protected hash differs: ' + p.path + ' ' + actual); return { ...p, actual }; });
const before = checkAnchors(), sourceBefore = sources(), started = performance.now();
const executable = mode === 'contracts' ? process.execPath : resolve(root, '.venv/Scripts/python.exe');
const tests = ['server.test.mjs', 'worker-session.test.mjs', 'analyze.test.mjs'].map(p => resolve(root, folder, p)).filter(existsSync);
const args = mode === 'contracts' ? ['--test', ...tests] : ['-B', resolve(root, 'scripts/check_repo_integrity.py')];
const result = spawnSync(executable, args, { cwd: root, encoding: 'utf8', timeout: 120000, windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
const report = { root, host: process.env.COMPUTERNAME, base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  executable, args, elapsedMs: performance.now() - started, exitCode: result.status, error: result.error?.message,
  stdout: result.stdout, stderr: result.stderr, sourceBefore, sourceAfter: sources(), anchorsBefore: before, anchorsAfter: checkAnchors() };
writeFileSync(resolve(out, 'command.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ label, exitCode: result.status, stdout: result.stdout, stderr: result.stderr }));
process.exitCode = result.status ?? 1;
