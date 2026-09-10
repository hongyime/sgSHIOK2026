import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/normalization-profile-20260910';
assert.equal(process.cwd(), root);
const [mode, label, compile] = process.argv.slice(2);
assert.ok(['contracts', 'integrity', 'typecheck', 'dependencies'].includes(mode)); assert.match(label ?? '', /^[a-z0-9-]+$/);
if (mode === 'contracts') assert.match(compile ?? '', /^compile-[a-z0-9-]+$/);
const out = resolve(root, folder, label); mkdirSync(out);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = ['web/lib/contiguous-route-parts.ts', 'web/lib/published-transit-options.ts', 'web/lib/coverage-gap-register.ts',
  'web/lib/__tests__/contiguous-route-parts.test.ts', folder + '/matcher.test.mjs', folder + '/integration.test.mjs', folder + '/cases.mjs'];
const sources = () => paths.map(path => ({ path, sha256: hash(readFileSync(resolve(root, path))) }));
const before = sources();
const args = mode === 'contracts' ? ['--test', '--test-concurrency=1', resolve(root, folder, 'matcher.test.mjs'), resolve(root, folder, 'integration.test.mjs')]
  : mode === 'typecheck' ? [resolve(root, 'web/node_modules/typescript/bin/tsc'), '--project', resolve(root, 'web/tsconfig.json'), '--noEmit', '--incremental', 'false']
  : mode === 'dependencies' ? [resolve(root, 'web/scripts/check-installed-dependencies.mjs')]
  : ['-B', resolve(root, 'scripts/check_repo_integrity.py')];
const executable = mode !== 'integrity' ? process.execPath : resolve(root, '.venv/Scripts/python.exe');
const started = performance.now();
const result = spawnSync(executable, args, { cwd: root, encoding: 'utf8', windowsHide: true, env: { ...process.env, SHIOK_MATCHER_COMPILE: compile ?? '' }, timeout: 180000, maxBuffer: 4 * 1024 ** 2 });
const report = { root, host: process.env.COMPUTERNAME, base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  executable, args, compile, elapsedMs: performance.now() - started, exitCode: result.status, stdout: result.stdout, stderr: result.stderr, error: result.error?.message, before, after: sources() };
for (const p of before) writeFileSync(resolve(out, p.path.split('/').at(-1)), readFileSync(resolve(root, p.path)), { flag: 'wx' });
writeFileSync(resolve(out, 'command.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ label, exitCode: result.status, stdout: result.stdout, stderr: result.stderr })); process.exitCode = result.status ?? 1;
