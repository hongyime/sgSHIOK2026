import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { summarizeTransport } from './transport.mjs';
const root = 'C:\\sgSHIOK2026', folder = 'qa/revamp-r1/request-audit-20260910';
assert.equal(process.cwd(), root);
const base = 'fda1bb9591ba4e17a83dc2d420b7695fede30c10';
const read = p => readFileSync(resolve(root, p));
const json = p => JSON.parse(read(folder + '/' + p));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = args => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
const final = json('contracts-5/command.json'), integrity = json('integrity-1/command.json');
assert.equal(final.exitCode, 0); assert.match(final.stdout, /pass 36/); assert.match(final.stdout, /fail 0/);
assert.equal(integrity.exitCode, 0); assert.equal(integrity.stdout.trim(), 'repo_integrity=ok');
for (const report of [final, integrity]) {
  assert.equal(report.base, base);
  assert.deepEqual(report.sourceBefore, report.sourceAfter);
  for (const item of report.sourceAfter) assert.equal(hash(read(item.path)), item.sha256, item.path);
  assert.deepEqual(report.anchorsBefore, report.anchorsAfter);
  assert.equal(report.anchorsAfter.length, 11);
  for (const item of report.anchorsAfter) assert.equal(hash(read(item.path)), item.expected, item.path);
}
const attempts = ['cancellation-1-zReHAg', 'cancellation-2-mX2Gjr'];
const images = [], browser = attempts.map(label => {
  const report = json(label + '/browser.json');
  assert.equal(report.ok, false); assert.equal(report.cleanup.verified, true);
  assert.equal(report.anchorsUnchanged, true); assert.deepEqual(report.anchorsBefore, report.anchorsAfter);
  for (const capture of report.captures) {
    assert.equal(hash(read(folder + '/' + label + '/' + capture.name + '.png')), capture.sha256);
    assert.equal(capture.before.featureCount, 4); assert.equal(capture.after.featureCount, 4);
  }
  for (const file of readdirSync(resolve(root, folder, label)).filter(p => p.endsWith('.png'))) {
    const path = folder + '/' + label + '/' + file;
    images.push({ path, sha256: hash(read(path)), parentInspected: true });
  }
  return { label, report };
});
assert.equal(images.length, 5);
const corrected = browser[1].report;
assert.equal(hash(read(folder + '/cancellation-2-mX2Gjr/browser.mjs')), hash(read(folder + '/browser.mjs')));
assert.equal(hash(read(folder + '/cancellation-2-mX2Gjr/transport.mjs')), hash(read(folder + '/transport.mjs')));
const transport = summarizeTransport(corrected.entries);
assert.deepEqual(transport, corrected.transport);
assert.equal(transport.explainedCanceledTileCommands.length, 16);
assert.equal(transport.httpFailures.length, 4);
assert.equal(transport.pendingNetworkRequests.length, 5);
const inspection = json('inspection.json');
assert.equal(hash(read(inspection.source.path)), inspection.source.sha256);
assert.equal(inspection.failures.filter(p => p.plainResponses.some(r => r.response.status === 200 && r.finished)).length, 3);
assert.ok(inspection.failures.every(p => p.localBytes === null));
const evidencePath = 'qa/verification/REVAMP-R1-core-walk.md';
const previous = git(['show', base + ':' + evidencePath]), now = read(evidencePath);
assert.ok(now.subarray(0, previous.length).equals(previous));
const changed = git(['diff', '--name-only', base, '--']).toString().trim().split('\n').filter(Boolean);
assert.deepEqual(changed.filter(p => /^(web\/|pipeline\/|raw\/|processed\/|checksums\.json$|qa\/(p[6-9]_|p10_|p11\/d_|releases\/))/.test(p)), []);
const summary = {
  root, host: process.env.COMPUTERNAME, base, runtimeChange: false, pipelineRuns: 0, installs: 0, builds: 0, deployments: 0,
  tests: { native: 36, failures: 0, skips: 0, currentLockWebSuite: 'not run; stale dependency guard remains blocking', integrity: 'repo_integrity=ok' },
  pinnedBuild: corrected.build, currentSourceDifferences: corrected.currentDifferences,
  attempts: browser.map(({ label, report }) => ({ label, ok: report.ok, failure: report.failure,
    checks: report.checks.length, captures: report.captures.length, elapsedMs: report.elapsedMs, cleanupVerified: report.cleanup.verified })),
  transportCounts: Object.fromEntries(Object.entries(transport).map(([key, value]) => [key, Array.isArray(value) ? value.length : value])),
  explanationExample: transport.explainedCanceledTileCommands[0],
  images, uniqueImages: new Set(images.map(p => p.sha256)).size,
  anchorsVerified: 11,
  evidence: { path: evidencePath, originalBytes: previous.length, originalSha256: hash(previous), appendOnly: true, appendedBytes: now.length - previous.length },
  findings: [
    'New raw page ledger and36 native contracts preserve failed/ambiguous/incomplete transport. The real trace regression remains failed, not silently reclassified.',
    'Controlled offscreen-tile cancellation reproduces16 exact correlated interception faults; selected route has4features before/after. This does not identify the old five faults.',
    'Four gzip404s remain:3recover through completed plain responses,1optional transit shard is absent. The page trace lacks terminal events for those4responses and the worker entry. Root causes of missing terminal events are not proven.',
    'Five images parent-inspected. The first attempt failed on cyclic camera return serialization; the corrected attempt failed the terminal audit. Both raw failures and verified owned-browser cleanup are preserved.',
    'No application, protected data, dependency, build or deployment changes. Parent-only review; peer quota exhausted. The35+1=36 diagnostic tests do not extend prior1765/64 validation to the new dependency lock.',
  ],
  disagreements: [
    'Neither a functional selected route nor explained induced cancellations proves a clean full-browser audit. Do not clear T25, M17 or release gates.',
    'Missing page worker completion and recoverable404s are not proof of a broken selected route. Diagnose body/worker lifecycle without regenerating protected data or another unmotivated replay.',
  ],
  next: 'Isolated response-body lifecycle and worker-target ownership fixtures before another bounded audit. Dependency/worker installation remains pending approval.',
};
writeFileSync(resolve(root, folder, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(summary, null, 2));
