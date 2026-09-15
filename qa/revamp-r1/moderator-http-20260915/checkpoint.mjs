import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
process.env.TEMP = process.env.TMP = resolve(root, 'tmp');
const directory = resolve(root, 'qa/revamp-r1/moderator-http-20260915');
const [fullName, typesName, docsName] = process.argv.slice(2);
for (const name of [fullName, typesName, docsName]) assert.match(name ?? '', /^(full|types|docs)-[A-Za-z0-9]+$/);
const read = path => JSON.parse(readFileSync(resolve(directory, path), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const focused = read('focused-0kxBnb/summary.json');
const baseline = read('focused-m1q9g2/summary.json');
const firstFull = read('full-TRJo8x/summary.json');
const full = read(`${fullName}/summary.json`), types = read(`${typesName}/summary.json`), docs = read(`${docsName}/summary.json`);
for (const run of [focused, full, types, docs]) {
  assert.equal(run.accepted, true); assert.equal(run.exit, 0);
  assert.deepEqual(run.before, focused.before); assert.deepEqual(run.after, focused.before);
}
assert.equal(baseline.exit, 1); assert.equal(baseline.tests.passed, 417); assert.equal(baseline.tests.failed, 2);
assert.equal(firstFull.accepted, true); assert.equal(full.snapshotMatches, true);
assert.equal(focused.tests.passed, 419); assert.equal(focused.tests.failed, 0); assert.equal(focused.tests.pending, 0);
assert.equal(full.isolation.productionDataDirectoryAbsent, true); assert.equal(full.isolation.guardProbePassed, true);
const clean = value => value.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
const stdout = clean(readFileSync(resolve(directory, fullName, 'stdout.txt'), 'utf8'));
assert.match(stdout, /Tests\s+2856 passed\s+\(2856\)/);
assert.match(stdout, /Test Files\s+81 passed\s+\(81\)/);
assert.match(stdout, /(?:#|\u2139)\s+tests 42/); assert.match(stdout, /(?:#|\u2139)\s+fail 0/);
const docStdout = clean(readFileSync(resolve(directory, docsName, 'stdout.txt'), 'utf8'));
assert.match(docStdout, /41 passed/);
const tests = read('focused-0kxBnb/vitest.json');
const perFile = Object.fromEntries(tests.testResults.map(file => [relative(root, file.name).replaceAll('\\', '/'), {
  passed: file.assertionResults.filter(test => test.status === 'passed').length,
  failed: file.assertionResults.filter(test => test.status === 'failed').length,
}]));
for (const [path, sha] of Object.entries(focused.before)) assert.equal(hash(readFileSync(resolve(root, path))), sha, path);
const anchors = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/report-operations-20260915/database-checkpoint.json'), 'utf8'));
for (const anchor of anchors.protectedAnchors) {
  const bytes = readFileSync(resolve(root, anchor.path));
  assert.equal(bytes.length, anchor.bytes, anchor.path); assert.equal(hash(bytes), anchor.sha256, anchor.path);
}
assert.equal(hash(readFileSync(resolve(root, 'pipeline/config/weights.yaml'))), anchors.weights);
const evidence = resolve(root, 'qa/verification/REVAMP-R1-core-walk.md');
const previous = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/report-health-20260915/evidence.json'), 'utf8')).after;
const before = readFileSync(evidence); assert.equal(before.length, previous.bytes); assert.equal(hash(before), previous.sha256);
const integrity = execFileSync(resolve(root, '.venv/Scripts/python.exe'), ['-B', resolve(root, 'scripts/check_repo_integrity.py')], {
  cwd: root, windowsHide: true, encoding: 'utf8', timeout: 30000,
});
assert.match(integrity, /repo_integrity=ok/);
const ignored = spawnSync('git', ['check-ignore', '-v', 'qa/verification/REVAMP-R1-core-walk.md'], { cwd: root, encoding: 'utf8', windowsHide: true });
assert.equal(ignored.status, 1);
const result = {
  root, host: process.env.COMPUTERNAME, base: '01791821e379bbc69e45e0b5f593c5003c45cac6',
  receipts: { focused: 'focused-0kxBnb', redStreamTests: 'focused-m1q9g2', firstFull: 'full-TRJo8x', full: fullName, types: typesName, docs: docsName },
  sourceBindings: focused.before, focused: { ...focused.tests, perFile },
  full: { tests: 2856, files: 81, dependencyGuards: 42, isolation: full.isolation,
    arithmetic: '2531 + 242 store + 81 HTTP + 1 lifecycle NUL + 1 Auth stream = 2856; 79 + 2 files = 81; focused 242 + 81 + 50 + 46 = 419 overlaps full, not additive' },
  types: { command: types.command, exit: types.exit }, docs: { command: docs.command, exit: docs.exit, passed: 41 },
  preliminary: { firstFullAcceptedForEarlierSnapshot: true, redStreamTests: { passed: 417, failed: 2, exit: 1 },
    implementationHistory: 'implementation-history.json', independentReview: 'review.json', streamReview: 'stream-review.json' },
  bounds: { inputBytes: 8192, replyBytes: 393216, httpDeadlineMs: 15000, storeOperationDeadlineMs: 8000,
    pageLimit: 25, pageAllowanceArithmetic: '25 * (8192 + 6000 + 1024) = 380400 < 384 * 1024 = 393216',
    legalLargePageBytes: 356404, pressureLimiter: '30 per token hash and 60 total per minute per warm instance; not distributed quota' },
  protectedAnchorsVerified: anchors.protectedAnchors.length, weights: anchors.weights,
  integrity, checkIgnore: { stdout: ignored.stdout, exit: ignored.status },
  remote: { writes: 0, reads: 0, note: 'No Supabase calls, enrollment, migration, runtime secret or intake change this checkpoint' },
  deployment: 'Not run; no new build/browser/real Auth/concurrency claim', pipelineRuns: 0,
  findings: [
    'Implemented default-off private POST queue, context and decision routes, exact-token Auth verification, independent SQL authorization and bounded typed RPC projection.',
    'Receipt-specific reads now reconcile a lost acknowledgement without another write; client-side persistence/reconciliation UI still needs acceptance.',
    'Review found NUL reason admission and an insufficient 256KiB queue cap. Both corrected; a valid 356404-byte 25-report page now passes.',
    'Tightened the aggregate deadline test to pending at14999ms and unknown at15000ms before the store deadline at16000ms.',
    'Finite zero-progress chunk regressions failed before guards and pass after. This is stricter stream-contract hardening, not a demonstrated network exploit. Original failures and earlier accepted snapshot preserved.',
    '30-day retention remains unchanged. Owner login/queue UI, actual Auth and overlapping DB acceptance, navigation, alert delivery and exact frontend release remain open.',
  ],
  disagreements: [
    'No disagreement with30-day retention. Expires after720hours does not mean physical deletion at that instant; daily cleanup and recovery residue remain separate.',
    'Passing API fixtures and isolated tests does not establish a launched reporting service or complete the full build-and-ship goal. No physical-device acceptance is claimed.',
  ],
};
for (const name of ['review.json', 'stream-review.json', 'implementation-history.json']) read(name);
const output = JSON.stringify(result, null, 2);
writeFileSync(resolve(directory, 'checkpoint.json'), output + '\n', { flag: 'wx' });
appendFileSync(evidence, '\n\n## 2026-09-15: Private moderation HTTP and read-only reconciliation\n\n```json\n' + output + '\n```\n');
const after = readFileSync(evidence); assert.ok(after.subarray(0, before.length).equals(before));
writeFileSync(resolve(directory, 'evidence.json'), JSON.stringify({ before: previous,
  after: { bytes: after.length, sha256: hash(after) }, appendOnly: true }, null, 2) + '\n', { flag: 'wx' });
console.log(output);
