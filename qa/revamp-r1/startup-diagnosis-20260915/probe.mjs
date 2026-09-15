import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:net';
import { request } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { freemem } from 'node:os';

const ROOT = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), ROOT);
assert.equal(process.argv[2], '--go');
const BASE = resolve(ROOT, 'qa/revamp-r1/startup-diagnosis-20260915'), out = process.argv[3];
assert.equal(dirname(out), BASE);
const started = Date.now(), end = started + 90000;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { root: ROOT, hostname: process.env.COMPUTERNAME, startedAt: new Date(started).toISOString(),
  scope: 'One instrumented local startup of the pinned Next build. No browser, app rebuild, data read, deployment or controlled performance comparison.',
  attempts: [], events: [], availableMiB: freemem() / 1048576, passed: false };
let child, reserve;
let stdout = '', stderr = '';
try {
  assert.ok(report.availableMiB >= 1024, 'At least1GiB available for bounded startup');
  const buildPath = resolve(ROOT, 'qa/revamp-r1/release-finalize-20260915/frontend-brzm8xg4/build.json');
  const buildBytes = readFileSync(buildPath);
  assert.equal(sha(buildBytes), 'd4b98d8d7400a82671e79bcb4802f4cf231170d29d74fd36a36a9b39da842f14');
  const build = JSON.parse(buildBytes), web = resolve(build.stage, 'web');
  const manifestBytes = readFileSync(resolve(dirname(buildPath), 'build-files.json'));
  assert.equal(sha(manifestBytes), build.buildOutput.manifestSha256);
  const expected = JSON.parse(manifestBytes).find(entry => entry.path === '.next/server/app/index.html');
  assert.ok(expected);
  assert.equal(sha(readFileSync(resolve(web, expected.path))), expected.sha256, 'STOP built HTML mismatch');
  report.buildId = build.buildId; report.expectedHtml = expected;
  reserve = createServer();
  await new Promise((done, reject) => { reserve.once('error', reject); reserve.listen(0, '127.0.0.1', done); });
  const port = reserve.address().port;
  await new Promise(done => reserve.close(done));
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => ['PATH', 'SYSTEMROOT', 'WINDIR', 'SYSTEMDRIVE', 'COMSPEC', 'PATHEXT'].includes(key.toUpperCase())));
  Object.assign(env, { TEMP: resolve(ROOT, 'tmp'), TMP: resolve(ROOT, 'tmp'), NEXT_TELEMETRY_DISABLED: '1',
    SHIOK_REPORTS_ENABLED: 'false', SHIOK_MODERATION_ENABLED: 'false',
    SHIOK_DATA_BUNDLE: 'generated_20260805_prefer_scored_routed', NEXT_PUBLIC_DATA_BASE: '/data/generated_20260805_prefer_scored_routed/',
    NEXT_PUBLIC_LAMP_OVERLAY_BASE: '/data/lamp_posts_v1/', SHIOK_QA_STARTUP_TRACE: resolve(out, 'modules.jsonl') });
  const command = ['--require', resolve(BASE, 'preload.cjs'), resolve(web, 'node_modules/next/dist/bin/next'), 'start', web, '-H', '127.0.0.1', '-p', String(port)];
  report.command = [process.execPath, ...command]; report.port = port;
  report.preloadSha256 = sha(readFileSync(resolve(BASE, 'preload.cjs')));
  child = spawn(process.execPath, command, { cwd: ROOT, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  report.childPid = child.pid;
  const note = (kind, fields = {}) => report.events.push({ kind, atMs: Date.now() - started, ...fields });
  child.on('spawn', () => note('spawn'));
  child.on('error', error => note('spawn-error', { code: error.code, message: error.message }));
  child.on('exit', (code, signal) => note('exit', { code, signal }));
  child.stdout.on('data', bytes => { note('stdout', { bytes: bytes.length }); stdout += bytes; if (stdout.length > 65536) { report.limitHit = 'stdout'; child.kill(); } });
  child.stderr.on('data', bytes => { note('stderr', { bytes: bytes.length }); stderr += bytes; if (stderr.length > 65536) { report.limitHit = 'stderr'; child.kill(); } });
  while (Date.now() < end && child.exitCode === null && !report.limitHit) {
    const attempt = { atMs: Date.now() - started };
    report.attempts.push(attempt);
    await new Promise(done => {
      const req = request({ hostname: '127.0.0.1', port, path: '/', method: 'GET', signal: AbortSignal.timeout(Math.min(2500, end - Date.now())) }, response => {
        attempt.status = response.statusCode; const chunks = []; let bytes = 0;
        response.on('data', chunk => { bytes += chunk.length; if (bytes > 1048576) { report.limitHit = 'response bytes'; req.destroy(); } else chunks.push(chunk); });
        response.on('end', () => { const body = Buffer.concat(chunks); attempt.bytes = body.length; attempt.sha256 = sha(body); attempt.completed = true; done(); });
        response.on('error', error => { attempt.error = error.code ?? error.name; done(); });
      });
      req.on('error', error => { attempt.error = error.code ?? error.name; attempt.cause = error.cause?.code; done(); });
      req.end();
    });
    attempt.elapsedMs = Date.now() - started - attempt.atMs;
    if (attempt.status === 200 && attempt.completed) {
      assert.equal(attempt.sha256, expected.sha256, 'Served HTML does not match pinned build');
      assert.equal(attempt.bytes, expected.bytes);
      report.readyAtMs = Date.now() - started; report.passed = true; break;
    }
    await new Promise(done => setTimeout(done, 1000));
  }
  if (!report.passed) throw Error('Pinned Next did not serve exact HTML within90seconds');
} catch (error) { report.failure = error.stack; }
finally {
  if (child?.exitCode === null) child.kill();
  if (child) await Promise.race([new Promise(done => child.exitCode !== null ? done() : child.once('exit', done)), new Promise(done => setTimeout(done, 4000))]);
  if (reserve?.listening) await new Promise(done => reserve.close(done));
  child?.stdout.destroy(); child?.stderr.destroy(); child?.unref();
  report.elapsedMs = Date.now() - started; report.passed = report.passed && !report.limitHit;
  writeFileSync(resolve(out, 'stdout.txt'), stdout, { flag: 'wx' });
  writeFileSync(resolve(out, 'stderr.txt'), stderr, { flag: 'wx' });
  writeFileSync(resolve(out, 'observation.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ out, passed: report.passed, readyAtMs: report.readyAtMs, failure: report.failure, elapsedMs: report.elapsedMs }, null, 2));
  process.exitCode = report.passed ? 0 : 1;
}
