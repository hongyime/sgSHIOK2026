import { execFileSync, spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { reportInstalledDependencies } from '../../../web/scripts/check-installed-dependencies.mjs';
import { verifyFrontendRetention } from '../../../web/scripts/frontend-retention.mjs';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
assert.ok(reportInstalledDependencies(resolve(root, 'web')).ok);
const out = resolve(root, 'qa/revamp-r1/ux-reset-20260912/build-1');
const snapshot = resolve(root, 'tmp/ux-reset-20260912-build-1');
assert.ok(!existsSync(out) && !existsSync(snapshot), 'Preserve previous attempt');
const sha = b => createHash('sha256').update(b).digest('hex');
const previous = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/frontend-retention-20260910/build-2/build.json')));
const archive = previous.archive;
const manifestBytes = readFileSync(resolve(archive, 'frontend-assets.json'));
assert.equal(sha(manifestBytes), previous.capture.manifestSha256, 'Archive manifest mismatch');
const manifest = JSON.parse(manifestBytes);
assert.equal(manifest.buildId, 'e8Hlhkml4c3i_uMGJdd3P');
assert.equal(manifest.files.length, 29);
for (const entry of manifest.files) {
  const bytes = readFileSync(resolve(archive, 'assets', entry.path));
  assert.equal(bytes.length, entry.bytes, entry.path);
  assert.equal(sha(bytes), entry.sha256, entry.path);
}
mkdirSync(out); mkdirSync(snapshot);
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
const sources = [], web = resolve(snapshot, 'web');
for (const path of execFileSync('git', ['ls-files', '-z', '--', 'web'], { cwd: root, encoding: 'utf8' }).split('\0').filter(p => p && !p.startsWith('web/public/data/'))) {
  const source = resolve(root, path), target = resolve(snapshot, path);
  mkdirSync(dirname(target), { recursive: true }); copyFileSync(source, target);
  sources.push({ path, sha256: sha(readFileSync(source)) });
}
assert.ok(!existsSync(resolve(web, 'public/data')));
for (const entry of manifest.files) {
  const target = resolve(web, 'public/_retained', entry.path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, readFileSync(resolve(archive, 'assets', entry.path)), { flag: 'wx' });
}
writeFileSync(resolve(web, 'frontend-retention.json'), JSON.stringify(previous.retention, null, 2) + '\n', { flag: 'wx' });
symlinkSync(resolve(root, 'web/node_modules'), resolve(web, 'node_modules'), 'junction');
copyFileSync(resolve(web, 'next.config.js'), resolve(web, 'next.qa-base.cjs'));
const config = `const config=require('./next.qa-base.cjs');\nmodule.exports={...config,turbopack:{...config.turbopack,root:${JSON.stringify(root)}}};\n`;
writeFileSync(resolve(web, 'next.config.js'), config);
const temp = resolve(snapshot, 'compiler-tmp'); mkdirSync(temp);
const report = { root, hostname: process.env.COMPUTERNAME, snapshot, archive, sources,
  startedAt: new Date().toISOString(), base: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  archiveManifestSha256: sha(manifestBytes), retention: verifyFrontendRetention(web),
  generatedConfigSha256: sha(config), qaConfigOverride: config,
  protectedDataAbsent: true, dependencyInstall: false, deploymentIdentityVerified: false,
  command: [process.execPath, resolve(web, 'scripts/build-next-release.mjs'), 'build'] };
const child = spawn(report.command[0], report.command.slice(1), { cwd: web, windowsHide: true,
  env: { ...process.env, TEMP: temp, TMP: temp, NEXT_TELEMETRY_DISABLED: '1', NODE_OPTIONS: '--max-old-space-size=2048' } });
report.childPid = child.pid;
writeFileSync(resolve(out, 'started.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
let stdout = '', stderr = '';
child.stdout.on('data', b => { stdout += b; process.stdout.write(b); });
child.stderr.on('data', b => { stderr += b; process.stderr.write(b); });
child.on('error', e => { report.error = e.message; });
child.on('close', (code, signal) => {
  report.exitCode = code; report.signal = signal; report.finishedAt = new Date().toISOString();
  report.sourceStable = sources.every(s => sha(readFileSync(resolve(root, s.path))) === s.sha256);
  if (code === 0) {
    report.verifiedRetention = verifyFrontendRetention(web, { requireBuild: true });
    report.buildId = report.verifiedRetention.buildId;
  }
  writeFileSync(resolve(out, 'stdout.txt'), stdout, { flag: 'wx' });
  writeFileSync(resolve(out, 'stderr.txt'), stderr, { flag: 'wx' });
  writeFileSync(resolve(out, 'build.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, exitCode: code, signal, sourceStable: report.sourceStable, buildId: report.buildId }));
  process.exitCode = code === 0 && report.sourceStable ? 0 : 1;
});
