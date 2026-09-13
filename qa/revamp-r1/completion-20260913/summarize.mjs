import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const out = resolve(root, 'qa/revamp-r1/completion-20260913');
const sha = b => createHash('sha256').update(b).digest('hex');
const json = p => JSON.parse(readFileSync(resolve(out, p), 'utf8'));
const git = args => execFileSync('git', args, { cwd: root });
const build = json('build-2/build.json');
assert.equal(build.exitCode, 0); assert.equal(build.sourceStable, true);
const sourceIdentity = build.sources.map(s => {
  const disk = readFileSync(resolve(root, s.path)), staged = git(['show', ':' + s.path]);
  assert.equal(sha(disk), s.sha256, s.path);
  const normalizedEqual = disk.toString().replace(/\r\n/g, '\n') === staged.toString().replace(/\r\n/g, '\n');
  if (sha(disk) !== sha(staged)) {
    assert.equal(s.path, 'web/lib/__tests__/revamp-layout.test.ts');
    assert.ok(normalizedEqual);
  }
  return { ...s, stagedSha256: sha(staged), byteExact: sha(disk) === sha(staged), normalizedEqual };
});
const fixture = JSON.parse(readFileSync(resolve(root, 'web/lib/__tests__/fixtures/published-walks.provenance.json')));
const anchors = Object.values(fixture.sources).map(s => {
  const bytes = readFileSync(resolve(root, s.path)); assert.equal(sha(bytes), s.sha256, s.path);
  return { path: s.path, bytes: bytes.length, sha256: sha(bytes) };
});
const weightsSha256 = sha(readFileSync(resolve(root, 'pipeline/config/weights.yaml')));
assert.equal(weightsSha256, '5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec');
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md';
const before = git(['show', '1a8d720:' + evidencePath]).toString().replace(/\r\n/g, '\n');
const after = readFileSync(resolve(root, evidencePath), 'utf8').replace(/\r\n/g, '\n');
assert.ok(after.startsWith(before), 'Earlier evidence lines changed');
const integrity = spawnSync('python', ['-B', 'scripts/check_repo_integrity.py'], { cwd: root, encoding: 'utf8', windowsHide: true });
assert.equal(integrity.status, 0, integrity.stderr);
assert.match(integrity.stdout, /repo_integrity=ok/);
const ignore = spawnSync('git', ['check-ignore', '-v', evidencePath], { cwd: root, encoding: 'utf8', windowsHide: true });
assert.equal(ignore.status, 1);
const trackedEvidence = git(['ls-files', '--error-unmatch', evidencePath]).toString().trim();
assert.equal(trackedEvidence, evidencePath);
const protectedDiffPaths = git(['diff', '--name-only', '1a8d720', '--', 'pipeline', 'raw', 'processed', 'web/public/data', 'checksums.json']).toString();
assert.equal(protectedDiffPaths, '');
const previewResponse = await fetch('http://127.0.0.1:4412/__qa/status', { signal: AbortSignal.timeout(10000) });
assert.equal(previewResponse.status, 200);
const previewIdentity = await previewResponse.json();
assert.equal(previewIdentity.buildId, build.buildId);
const browserAttempts = ['observed-7VqjtJ', 'observed-MV325c', 'observed-QC2YjF'].map(path => {
  const r = json(path + '/browser.json');
  return { path, checks: r.checks.length, passed: r.checks.filter(c => c.pass).length,
    captures: r.samples.length, errors: r.errors, denied: r.denied,
    cleanupVerified: r.cleanup?.verified, completed: path === 'observed-QC2YjF' };
});
const browser = json('observed-QC2YjF/browser.json');
assert.ok(browser.checks.length === 80 && browser.checks.every(c => c.pass));
assert.ok(!browser.errors.length && !browser.denied.length && browser.cleanup?.verified);
const inspected = ['collapsed-1440', 'collapsed-320', 'saved-exit-e-marker', 'bus-preview-unavailable'].map(name => {
  const bytes = readFileSync(resolve(out, 'observed-QC2YjF', name + '.png'));
  return { name, sha256: sha(bytes), parentVisuallyInspected: true };
});
const summary = {
  root, hostname: process.env.COMPUTERNAME, createdAt: new Date().toISOString(),
  headBeforeFinalEvidenceCommit: git(['rev-parse', 'HEAD']).toString().trim(),
  buildId: build.buildId, preview: 'http://127.0.0.1:4412/', previewIdentity, sourceIdentity,
  finalChecks: { integrity: { command: 'python -B scripts/check_repo_integrity.py', stdout: integrity.stdout, stderr: integrity.stderr, exitCode: integrity.status },
    ignore: { command: 'git check-ignore -v ' + evidencePath, stdout: ignore.stdout, stderr: ignore.stderr, exitCode: ignore.status },
    trackedEvidence, protectedDiffPaths },
  tests: { web: { passed: 1889, files: 71, skipped: 0, receipt: 'checks-1789274018623', delta: '1784 +26 deadline +21 popup +34 reports +24 saved-ID =1889' },
    dependencyGuards: 42, pythonFocused: { passed: 181, delta: '85 existing state +96 delivery =181', fullProjectSuiteRun: false },
    typeScript: 'build-2 passed', repositoryIntegrity: 'repo_integrity=ok' },
  browserAttempts, inspected, browserBoundaries: { physicalDevice: false, representativePerformance: false,
    serviceWorker: 'bypassed for this UX acceptance; exact release acceptance remains separate',
    fallback: 'Browser plugin bootstrap failed os error3; owned Chrome/CDP fallback',
    provider: 'Two controlled503 requests: click and explicit Retry. No live provider probe this turn.',
    keyboardCorrection: 'Attempt2 omitted Enter char event; attempt3 uses existing browser-smoke rawKeyDown/char/keyUp pattern.' },
  anchors, weightsSha256, priorEvidenceLinesPreserved: true,
  reviews: { popup: 'Ampere implementation and final compact-mode read-only review; parent removed redundant action and secondary panel',
    api: 'Copernicus identified unread auth-error body; reproduced2redtests then fixed',
    route: 'Kierkegaard bounded audit/implementation; parent added disconnected-cycle rejection requirement',
    reports: 'Hegel implementation; parent reviewed strict validation and stream boundary',
    maintenance: 'Rawls implementation, Hegel independent read-only review; no blocking bug within injected-adapter contract' },
  findings: [
    'Route and search provider transactions were unbounded server-side; now one10s deadline spans auth/retry/body, with caller cancellation and late-token protection.',
    'Marker popups now show identity only; no repeated route action, timetable block or service-details panel.',
    'One public sample has6saved destinations and55unstored among61stop/exit markers. Saved Exit E had an ID-binding bug, now repaired without new geometry or score changes.',
    'Report validation and monitor delivery contracts are implemented but not live services. Durable backend, auth, actual adapter/persistence and activation remain unfinished.',
    'Production metadata is gitDirty=1 and the actual retained-generation/security boundary is unresolved; the current project is connected, but deployment is not approved.',
    'Earlier browser/test/guard failures are retained; final1889web tests,181focused Python tests and80browser checks pass within documented scope.'
  ],
  disagreements: [
    'A nearby marker does not guarantee a saved route; a frontend repair cannot manufacture the55unstored destinations in the sampled postal.',
    'Fixture success cannot stand in for a durable report, actual scheduled notice, physical phone, current account quota or production release approval.',
    'The first collapsed-service popup design kept unnecessary information; final UI shows identity only. The offscreen first-attempt target is not relabelled as a passing interaction.'
  ],
  remaining: { reporting: 'Await requested account/provider/privacy/retention/moderator/backup choices; then storage, receipts, moderation and resident flow',
    maintenance: 'Await weekly metadata/issue approval; implement actual hosted runner and transport with validated capabilities, then observe real schedule and notice readback',
    devices: 'Owner physical phone and unaided tasks; no fake participants',
    release: 'Resolve actual production assets and retained MapLibre6.1.0 security, current quota, exact staging/SW/rollback and owner release decision' },
  pipelineRuns: 0, exports: 0, installations: 0, deployments: 0, externalActivations: 0,
};
writeFileSync(resolve(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
const files = [];
function walk(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const full = resolve(path, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && !/^(?:next|proxy)(?:-\d+)?\.(?:stdout|stderr)\.txt$/.test(entry.name)
      && !entry.name.endsWith('.gz') && entry.name !== 'artifact-index.json') files.push(full);
  }
}
walk(out);
const artifacts = files.sort().map(path => {
  const bytes = readFileSync(path), compressed = /\.(?:json|txt)$/.test(path) && bytes.length > 100000;
  const committed = compressed ? path + '.gz' : path;
  if (compressed) {
    assert.ok(!existsSync(committed), 'Preserve prior archive');
    const packed = gzipSync(bytes); assert.equal(sha(gunzipSync(packed)), sha(bytes));
    writeFileSync(committed, packed, { flag: 'wx' });
  }
  const published = readFileSync(committed);
  return { path: relative(root, path).replaceAll('\\', '/'), bytes: bytes.length, sha256: sha(bytes),
    committedPath: relative(root, committed).replaceAll('\\', '/'), committedBytes: published.length,
    committedSha256: sha(published), losslessGzip: compressed };
});
writeFileSync(resolve(out, 'artifact-index.json'), JSON.stringify({ artifacts,
  excluded: 'Mutable Next/proxy stdout/stderr while serving; preview identity is recorded instead.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ buildId: build.buildId, sources: sourceIdentity.length,
  byteExact: sourceIdentity.filter(s => s.byteExact).length, browserChecks: browser.checks.length,
  captures: browser.samples.length, artifacts: artifacts.length, anchors: anchors.length }, null, 2));
