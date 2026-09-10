import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/normalization-profile-20260910';
if (process.cwd() !== root) throw Error('Wrong root');
const label = process.argv[2]; if (!/^compile-[a-z0-9-]+$/.test(label ?? '')) throw Error('Fresh compile label required');
const out = resolve(root, folder, label); mkdirSync(out);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const identities = () => ['coverage-gap-register.ts', 'published-transit-options.ts', 'contiguous-route-parts.ts', 'polyline.ts', 'types.ts']
  .map(name => ({ path: 'web/lib/' + name, sha256: hash(readFileSync(resolve(root, 'web/lib', name))) }));
const sources = identities();
const args = [resolve(root, 'web/node_modules/typescript/bin/tsc'), '--ignoreConfig', '--strict', '--module', 'node16', '--target', 'es2022', '--moduleResolution', 'node16', '--skipLibCheck',
  '--outDir', resolve(out, 'compiled'), resolve(root, 'web/lib/coverage-gap-register.ts'), resolve(root, 'web/lib/contiguous-route-parts.ts')];
const started = performance.now();
const result = spawnSync(process.execPath, args, { cwd: root, windowsHide: true, encoding: 'utf8', timeout: 120000 });
const after = identities(), compiled = result.status === 0 ? readdirSync(resolve(out, 'compiled')).map(name => ({ name, sha256: hash(readFileSync(resolve(out, 'compiled', name))) })) : [];
const report = { sources, after, sourcesStable: JSON.stringify(sources) === JSON.stringify(after), compiled, args, executable: process.execPath,
  elapsedMs: performance.now() - started, exitCode: result.status, error: result.error?.message, stdout: result.stdout, stderr: result.stderr };
for (const p of sources) writeFileSync(resolve(out, p.path.split('/').at(-1)), readFileSync(resolve(root, p.path)), { flag: 'wx' });
writeFileSync(resolve(out, 'compile.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ label, ...report })); process.exitCode = result.status === 0 && report.sourcesStable ? 0 : 1;
