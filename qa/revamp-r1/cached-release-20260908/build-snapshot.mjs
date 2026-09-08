import { execFileSync, spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
if (process.cwd() !== root) throw Error('Wrong working root');
const name = process.argv[2];
if (!/^[a-z0-9-]+$/.test(name || '')) throw Error('Fresh build name required');
const snapshot = resolve(root, 'tmp', 'cached-release-' + name);
const output = resolve(root, 'qa/revamp-r1/cached-release-20260908', name);
if (existsSync(snapshot) || existsSync(output)) throw Error('Preserve existing snapshots and output');
mkdirSync(snapshot, { recursive: true });
mkdirSync(output, { recursive: true });
const files = execFileSync('git', ['ls-files', '-z', '--', 'web'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(path => path && !path.startsWith('web/public/data/'));
const sources = [];
for (const path of files) {
  const source = resolve(root, path), destination = resolve(snapshot, path);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
  sources.push({ path, sha256: createHash('sha256').update(readFileSync(source)).digest('hex') });
}
if (existsSync(resolve(snapshot, 'web/public/data'))) throw Error('Protected payload was copied');
symlinkSync(resolve(root, 'web/node_modules'), resolve(snapshot, 'web/node_modules'), 'junction');
// QA-only root override permits the existing dependency junction. App config is preserved verbatim.
copyFileSync(resolve(snapshot, 'web/next.config.js'), resolve(snapshot, 'web/next.qa-base.cjs'));
const wrapper = `const config = require('./next.qa-base.cjs');\nmodule.exports = { ...config, turbopack: { ...config.turbopack, root: ${JSON.stringify(root)} } };\n`;
writeFileSync(resolve(snapshot, 'web/next.config.js'), wrapper);
const temp = resolve(snapshot, 'compiler-tmp');
mkdirSync(temp);
const args = [resolve(root, 'web/node_modules/next/dist/bin/next'), 'build', resolve(snapshot, 'web')];
const report = { snapshot, output, args, protectedDataAbsent: true, dependencyInstall: false, sources,
  qaConfigOverride: wrapper, generatedConfigSha256: createHash('sha256').update(wrapper).digest('hex'),
  startedAt: new Date().toISOString(), base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim() };
const child = spawn(process.execPath, args, { cwd: root, windowsHide: true,
  env: { ...process.env, TEMP: temp, TMP: temp, NEXT_TELEMETRY_DISABLED: '1', NODE_OPTIONS: '--max-old-space-size=2048' } });
let stdout = '', stderr = '';
child.stdout.on('data', chunk => { stdout += chunk; process.stdout.write(chunk); });
child.stderr.on('data', chunk => { stderr += chunk; process.stderr.write(chunk); });
child.on('error', error => { report.error = error.message; });
child.on('close', code => {
  report.exitCode = code;
  report.finishedAt = new Date().toISOString();
  const id = resolve(snapshot, 'web/.next/BUILD_ID');
  if (existsSync(id)) report.buildId = readFileSync(id, 'utf8').trim();
  writeFileSync(resolve(output, 'build.stdout.log'), stdout);
  writeFileSync(resolve(output, 'build.stderr.log'), stderr);
  writeFileSync(resolve(output, 'build.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ snapshot, exitCode: code, buildId: report.buildId }));
  process.exitCode = code ?? 1;
});
