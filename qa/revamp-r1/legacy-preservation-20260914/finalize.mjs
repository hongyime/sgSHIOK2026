import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { hostname } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';
import { publicTrace } from '../legacy-reload-20260913/publish-trace.mjs';

const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
process.env.TEMP = process.env.TMP = resolve(root, 'tmp');
const base = 'e0bb3fada7e5e20d80eeac13383817b789a03fe2';
const prefix = 'qa/revamp-r1/legacy-preservation-20260914';
const directory = 'observed-0t2Mmh';
const out = resolve(root, prefix);
const read = p => readFileSync(resolve(root, p));
const json = p => JSON.parse(read(p));
const sha = b => createHash('sha256').update(b).digest('hex');
const write = (p, v) => writeFileSync(resolve(out, p), JSON.stringify(v, null, 2) + '\n', { flag: 'wx' });
const git = (...args) => execFileSync('git', args, { cwd: root, windowsHide: true, maxBuffer: 32000000 });
assert.equal(git('rev-parse', 'HEAD').toString().trim(), base);
const admission = json(`${prefix}/revised-admission.json`);
assert.equal(admission.admitted, true);
for (const [path, hash] of Object.entries(admission.sources)) assert.equal(sha(read(`${prefix}/${path}`)), hash, path);
assert.ok(admission.checks.every(r => r.status === 0));
assert.ok(admission.checks.at(-1).stdout.includes('tests 47'));
assert.ok(admission.checks.at(-1).stdout.includes('pass 47'));
const raw = read(`${prefix}/${directory}/browser.json`);
const browser = JSON.parse(raw), supervisor = json(`${prefix}/${directory}/supervisor.json`);
assert.equal(browser.ok, false);
assert.equal(supervisor.exitCode, 1);
assert.equal(supervisor.cleanup.verified, true);
assert.equal(browser.cleanup.verified, true);
assert.equal(browser.server.releaseSwitches, 0);
assert.equal(browser.anchorsUnchanged, true);
assert.equal(browser.finalBoundsClear, true);
assert.equal(browser.commandDiagnostics.pending, 0);
assert.equal(browser.captures.length, 0);
assert.equal(browser.preservationSteps, undefined);
assert.equal(browser.reload, undefined);
assert.equal(browser.chromeTerminal.code, 4294967295);
assert.equal(browser.checks.length, 5);
assert.ok(browser.checks.every(c => c.pass));
const command = id => browser.commandDiagnostics.entries.find(c => c.id === id);
assert.equal(command(27).elapsedMs, 10000);
assert.equal(command(27).lastLateReplyMs - command(27).startedMs, 20849);
assert.equal(command(28).outcome, 'timeout');
const published = publicTrace(browser);
const publicBytes = Buffer.from(JSON.stringify(published.trace, null, 2) + '\n');
const compressed = gzipSync(publicBytes);
assert.deepEqual(gunzipSync(compressed), publicBytes);
writeFileSync(resolve(out, directory, 'browser.public.json.gz'), compressed, { flag: 'wx' });
const traceIdentity = {
  raw: { bytes: raw.length, sha256: sha(raw), published: false, reason: 'Private network header/cookie metadata; redacted trace published instead.' },
  public: { path: `${directory}/browser.public.json.gz`, bytes: publicBytes.length, sha256: sha(publicBytes), compressedBytes: compressed.length, compressedSha256: sha(compressed), redactions: published.redactions },
};
const { events, ...receipt } = published.trace;
write(`${directory}/receipt.json`, { ...receipt, eventCount: events.length, traceIdentity });
const image = read(`${prefix}/${directory}/old-selected.png`);
assert.equal(image.length, 226847);
const capture = { path: `${directory}/old-selected.png`, bytes: image.length, sha256: sha(image), parentInspected: true, completedBracket: false, accepted: false, observation: 'Old interface, partial basemap tiles; no visually identifiable selected route. Not current-app acceptance.' };
const anchors = Object.values(json('web/lib/__tests__/fixtures/published-walks.provenance.json').sources).map(s => {
  const bytes = read(s.path);
  assert.equal(sha(bytes), s.sha256, 'STOP input mismatch ' + s.path);
  assert.equal(bytes.length, s.bytes);
  return { path: s.path, bytes: bytes.length, sha256: sha(bytes) };
});
const weightSha256 = sha(read('pipeline/config/weights.yaml'));
assert.equal(weightSha256, '5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec');
assert.equal(git('diff', '--name-only', base, '--', 'web', 'pipeline', 'raw', 'processed', 'checksums.json', 'qa/p6_*', 'qa/p7_*', 'qa/p8_*', 'qa/p9_*', 'qa/p10_*', 'qa/p11/d_*', 'qa/releases').toString().trim(), '');
const start = Date.now();
const run = spawnSync('python', ['-B', 'scripts/check_repo_integrity.py'], { cwd: root, windowsHide: true, encoding: 'utf8', timeout: 60000 });
const integrity = { command: ['python', '-B', 'scripts/check_repo_integrity.py'], exitCode: run.status, stdout: run.stdout, stderr: run.stderr, elapsedMs: Date.now() - start };
write('integrity.json', integrity);
assert.equal(run.status, 0);
assert.ok(run.stdout.includes('repo_integrity=ok'));
const evidence = 'qa/verification/REVAMP-R1-core-walk.md';
const before = git('show', `${base}:${evidence}`), after = read(evidence);
assert.equal(before.length, 425693);
assert.deepEqual(after.subarray(0, before.length), before);
assert.ok(after.subarray(before.length).includes('FINDINGS'));
assert.ok(after.subarray(before.length).includes('DISAGREEMENTS'));
const ignore = spawnSync('git', ['check-ignore', '-v', evidence, `${prefix}/summary.json`], { cwd: root, windowsHide: true, encoding: 'utf8' });
assert.equal(ignore.status, 1);
assert.equal(git('ls-files', '--', evidence).toString().trim(), evidence);
write('tracking.json', { command: ['git', 'check-ignore', '-v', evidence, `${prefix}/summary.json`], exitCode: ignore.status, stdout: ignore.stdout, stderr: ignore.stderr, evidenceTracked: true });
const build = json('qa/revamp-r1/selection-recovery-20260913/build-2/build.json');
for (const s of build.sources) assert.equal(sha(read(s.path)), s.sha256, s.path);
const preview = await (await fetch('http://127.0.0.1:4420/__qa/status', { signal: AbortSignal.timeout(10000) })).json();
assert.equal(preview.buildId, build.buildId);
assert.equal(preview.readOnlyData, true);
const board = Buffer.from(await (await fetch('http://127.0.0.1:4420/postplan.html', { signal: AbortSignal.timeout(10000) })).arrayBuffer());
assert.equal(sha(board), sha(read('postplan.html')));
const findings = [
  'Corrected canonical-HTML cache preservation assumption; 24 new plus 23 retained offline cases pass. Browser did not reach the correction.',
  'Old-page screenshot after-check and browser-level probe timed out before any release switch. One unbracketed PNG inspected; no migration acceptance.',
  'Unsupported zero-page-in preflight was corrected without resampling; failed receipt retained. Runtime memory was 4076.171875MiB, not proof of responsiveness.',
  'Reporting and maintenance remain local contracts/integration, not activated services. Physical-device and exact-release acceptance remain open.',
];
const disagreements = [
  'A timeout before serving the new release cannot establish a current-app regression or PASS.',
  'More fixture tests or a memory threshold cannot replace service ownership, real devices or release approval.',
];
const summary = {
  root, hostname: hostname(), base, createdAt: new Date().toISOString(), goal: 'ACTIVE', productSourceChanges: 0,
  tests: { new: 24, retainedExecuted: 23, total: 47, failed: 0, skipped: 0, arithmetic: '24+8+10+5=47', retainedWeb: { tests: 1990, files: 73, guards: 42, rerun: false }, retainedMaintenance: { tests: 1039, files: 13, rerun: false, fullProject: false } },
  browser: { directory, accepted: false, checks: 5, passedPreconditions: 5, releaseSwitches: 0, preparationReached: false, commands: [26, 27, 28, 29, 30].map(command), capture, traceIdentity, driverMs: browser.elapsedMs, supervisorMs: supervisor.elapsedMs, supervisorLimitMs: supervisor.budgetMs, cleanupVerified: true, chromeTerminal: browser.chromeTerminal, server: { requests: browser.server.requests.length, totalBytes: browser.server.totalBytes, closed: browser.server.closed, activeUpstreams: browser.server.activeUpstreams, activeSockets: browser.server.activeSockets, limitHit: browser.server.limitHit } },
  arithmetic: ['25453-15453=10000ms timeout', '36302-15453=20849ms late reply', '36302-25453=10849ms after timeout', '240000+45000+15000=300000ms supervisor limit', '53820<300000ms'],
  integrity, anchors, weightSha256, preview, unchangedBuildSources: build.sources.length,
  taskBoard: { url: 'http://127.0.0.1:4420/postplan.html', sha256: sha(board) },
  evidence: { path: evidence, previousBytes: before.length, previousSha256: sha(before), bytes: after.length, addedBytes: after.length - before.length, exactPrefix: true },
  findings, disagreements, next: 'No repeated browser attempt this checkpoint. Need usable browser/physical-device acceptance or explicit limited-release decision; report and maintenance operator choices remain open.',
  pipelineRuns: 0, pipelineSeconds: 0, installations: 0, externalNotices: 0, deployments: 0,
};
write('summary.json', summary);
const files = [];
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, e.name);
    if (e.isDirectory()) walk(path);
    else {
      const name = relative(out, path).replaceAll('\\', '/');
      if (name.endsWith('/browser.json')) continue;
      const bytes = readFileSync(path);
      files.push({ path: `${prefix}/${name}`, bytes: bytes.length, sha256: sha(bytes) });
    }
  }
}
walk(out);
write('artifact-index.json', { files });
write('stage-paths.json', [...files.map(f => f.path), `${prefix}/artifact-index.json`, `${prefix}/stage-paths.json`]);
console.log(JSON.stringify({ tests: summary.tests, browserAccepted: false, screenshotAccepted: false, cleanup: true, evidence: summary.evidence, anchors: anchors.length, integrityExit: run.status, previewBuild: preview.buildId, artifacts: files.length }, null, 2));
