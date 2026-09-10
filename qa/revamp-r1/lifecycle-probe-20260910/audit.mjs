import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { inspectLifecycle } from './analyze.mjs';

const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/lifecycle-probe-20260910';
assert.equal(process.cwd(), root);
const base = '93e72b7b095014eab80d697a6925e7117c40f2c0';
const read = p => readFileSync(resolve(root, p));
const json = p => JSON.parse(read(folder + '/' + p));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = args => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
const final = json('contracts-4/command.json'), integrity = json('integrity-1/command.json');
assert.equal(final.exitCode, 0); assert.match(final.stdout, /pass 26/); assert.match(final.stdout, /fail 0/);
assert.match(final.stdout, /skipped 0/);
assert.equal(integrity.exitCode, 0); assert.equal(integrity.stdout.trim(), 'repo_integrity=ok');
for (const report of [final, integrity]) {
  assert.equal(report.base, base);
  assert.deepEqual(report.sourceBefore, report.sourceAfter);
  for (const item of report.sourceAfter) assert.equal(hash(read(item.path)), item.sha256, item.path);
  assert.deepEqual(report.anchorsBefore, report.anchorsAfter);
  assert.equal(report.anchorsAfter.length, 11);
  for (const item of report.anchorsAfter) assert.equal(hash(read(item.path)), item.expected, item.path);
}
const attempts = ['lifecycle-1-nUrUdV', 'lifecycle-2-qhnLlG'].map(label => {
  const report = json(label + '/browser.json');
  assert.equal(report.cleanup.verified, true); assert.equal(report.serverClosed, true);
  assert.equal(report.anchorsUnchanged, true); assert.deepEqual(report.anchorsBefore, report.anchorsAfter);
  for (const source of report.sources) {
    assert.equal(hash(read(folder + '/' + label + '/' + basename(source.path))), source.sha256);
    if (report.ok) assert.equal(hash(read(source.path)), source.sha256);
  }
  return { label, report };
});
const [failed, corrected] = attempts.map(p => p.report);
assert.equal(failed.ok, false); assert.match(failed.failure, /CDP timeout: Runtime.evaluate/);
assert.equal(corrected.ok, true); assert.equal(corrected.checks.length, 7);
assert.ok(corrected.checks.every(p => p.passed));
assert.deepEqual(corrected.workerResult, { value: 'owned-worker-ready', data: { fixture: true } });
assert.deepEqual(corrected.errors, []); assert.deepEqual(corrected.denied, []);
const analysis = inspectLifecycle(corrected);
assert.deepEqual(analysis, json('analysis.json'));
assert.equal(analysis.bodies.length, 6);
assert.equal(analysis.bodies.filter(p => p.terminalMethod === 'Network.loadingFinished').length, 4);
assert.equal(analysis.bodies.filter(p => p.terminalMethod === 'Network.loadingFailed').length, 2);
assert.ok(analysis.bodies.every(p => p.terminalCounts[0] === 0 && p.terminalCounts[2] === 1));
assert.equal(analysis.bodies.filter(p => p.terminalTimestampPredatesResponseNotificationTimestamp).length, 4);
assert.equal(analysis.workers.confirmed.length, 1); assert.deepEqual(analysis.workers.unresolved, []);
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md';
const previous = git(['show', base + ':' + evidencePath]), now = read(evidencePath);
assert.ok(now.subarray(0, previous.length).equals(previous));
const changed = git(['diff', '--name-only', base, '--']).toString().trim().split('\n').filter(Boolean);
assert.deepEqual(changed.filter(p => /^(web\/|pipeline\/|raw\/|processed\/|checksums\.json$|qa\/(p[6-9]_|p10_|p11\/d_|releases\/))/.test(p)), []);
const summary = {
  root, host: process.env.COMPUTERNAME, base, runtimeChanges: 0, pipelineRuns: 0, installs: 0, builds: 0, deployments: 0,
  tests: { server: 7, workerSetup: 4, analysis: 15, arithmetic: '7 + 4 + 15 = 26', total: 26, files: 3,
    failures: 0, skips: 0, integrity: 'repo_integrity=ok', currentLockWebSuite: 'not run; installed dependency gate remains blocking' },
  attempts: attempts.map(({ label, report }) => ({ label, ok: report.ok, failure: report.failure ?? null,
    checks: report.checks.length, elapsedMs: report.elapsedMs, cleanupVerified: report.cleanup.verified, serverClosed: report.serverClosed })),
  analysis, anchorsVerified: 11,
  evidence: { path: evidencePath, originalBytes: previous.length, originalSha256: hash(previous), appendOnly: true, appendedBytes: now.length - previous.length },
  findings: [
    'Six retained 404 responses had no terminal notification until their bodies were handled. Four drains finished; two cancellations emitted ERR_ABORTED.',
    'The four finish notifications arrived later with earlier CDP timestamps. Arrival time must not be described as transfer-completion time.',
    'Explicit target/parent/session/request/URL identity proves one worker entry handoff. Its module import and data fetch completed in the child; all three resources crossed parent Fetch interception.',
    'The first probe failed on unsupported worker Fetch.enable and a subsequent evaluation timeout. It remains failed. Corrected Network/Runtime setup has four native contracts.',
    '26 native contracts and seven synthetic browser checks pass; both owned browser processes and fixture servers are terminal. No application speedup, current-lock acceptance, new screenshot or independent peer review is claimed.',
  ],
  disagreements: [
    'A missing page terminal event is not alone evidence of a broken worker or an active download. The old failed app receipts remain failed, not reclassified by this fixture.',
    'No protected payload regeneration or performance claim follows. Future app audits need explicit worker ownership and semantic fallback/body handling.',
  ],
  next: 'T19 read-only coverage scan cost reduction within its 900-second gate; dependency installation remains pending explicit approval.',
};
writeFileSync(resolve(root, folder, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ok: true, tests: 26, browserChecks: 7, anchors: 11, appendOnly: true, summary: folder + '/summary.json' }));
