import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const here = resolve(root, 'qa/revamp-r1/report-http-20260915');
const read = path => readFileSync(resolve(here, path), 'utf8');
const json = path => JSON.parse(read(path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const check = name => {
  const receipt = json(`${name}/summary.json`);
  assert.equal(receipt.exit, 0);
  return receipt;
};
const counts = name => {
  const receipt = check(name);
  const output = read(`${name}/stdout.txt`);
  if (receipt.mode === 'focused') {
    const result = JSON.parse(output);
    assert.equal(result.success, true);
    assert.equal(result.numFailedTests, 0);
    return { receipt: name, tests: result.numPassedTests, files: result.testResults.length, sourceStable: receipt.sourceStable };
  }
  return {
    receipt: name,
    tests: Number(output.match(/Tests\s+(\d+) passed/)[1]),
    files: Number(output.match(/Test Files\s+(\d+) passed/)[1]),
    sourceStable: receipt.sourceStable,
  };
};
const migration = json('retention-YWBTdv/summary.json');
assert.equal(migration.passed, true);
const migrationBytes = readFileSync(resolve(root, migration.migration.path));
assert.equal(sha(migrationBytes), migration.migration.sha256);
const original = readFileSync(resolve(root, 'supabase/migrations/20260914161526_shiok_private_reports_v1.sql'));
assert.equal(sha(original), migration.migration.originalSha256);
assert.equal(migration.tests.length, 10);
assert.ok(migration.tests.every(test => test.passed));
assert.deepEqual(migration.before, migration.after);
assert.equal(migration.after.control[0].enabled, false);
const retention = ['retention-5uSINW', 'retention-eH4VMW', 'retention-YWBTdv'].map(name => {
  const receipt = json(`${name}/summary.json`);
  assert.equal(receipt.passed, true);
  return { name, mode: receipt.mode, requests: receipt.requests.length, groups: receipt.tests?.length ?? 0 };
});
const full = check('checks-3c72vb');
assert.deepEqual(full.snapshotSources, full.sources);
for (const [path, hash] of Object.entries(full.sources)) assert.equal(sha(readFileSync(resolve(root, path))), hash);
const browser = json('browser-headers-fB8xr9/observations.json');
assert.equal(browser.expectedContrastReproduced, false);
assert.equal(browser.earlierClaimThatOldPolicyNecessarilyFailsWithdrawn, true);
assert.equal(json('browser-headers-fB8xr9/cleanup-recovery.json').verified, true);

console.log('REPORT_HTTP_AND_30_DAY_EXPIRY_CHECKPOINT');
console.log(JSON.stringify({
  root,
  codeCommit: '4aab3bd',
  appliedMigration: { ...migration.migration, bytes: migrationBytes.length },
  target: migration.target,
  retention,
  sqlGroups: migration.tests,
  retainedDatabaseState: migration.after,
  focused: counts('checks-iNGYjR'),
  full: counts('checks-3c72vb'),
  dependencyGuardReceipt: 'checks-3c72vb/stdout.txt',
  typecheck: { receipt: 'checks-dCTJrQ', exit: check('checks-dCTJrQ').exit },
  docs: { receipt: 'checks-ELc0O5', exit: check('checks-ELc0O5').exit, finalLine: read('checks-ELc0O5/stdout.txt').trim().split(/\r?\n/).at(-1) },
  browser,
  retainedFailures: [
    'report-first-failure.json: new summary parser incorrectly expected text from a JSON-reporter run; corrected to use JSON.parse, no tests rerun',
    'checks-7vzkeg: initial TypeScript property-narrowing errors, fixed before final source-bound checks',
    'checks-hfV6wk and checks-Vz2azk: documentation wording regressions, protective wording restored without weakening tests',
    'browser-headers-OOLTxs: startup timeout; both runs retain original automatic-cleanup failures plus successful scoped recovery receipts',
  ],
  supersededFull: 'checks-woS150 used older snapshot63D8RA; its post-run source list does not bind that execution. Final checks-3c72vb binds snapshot azsQCy to seven unchanged current sources.',
  limits: [
    'No resident form integration or authenticated moderation yet.',
    'Expiry does not physically delete content; cleanup and retry tombstones remain before intake.',
    'Warm-instance throttle does not establish a distributed request budget.',
    'Concurrency, UTC boundary and global abuse acceptance remain open.',
    'Synthetic Chrome header capture is not deployed report endpoint or map/browser acceptance.',
    'Current map preview is a QA override, not an exact release candidate; old-client recovery, accessibility and real-device acceptance remain.',
    'No runtime secret saved, no report intake enabled, no frontend deployment, no pipeline execution.',
  ],
}, null, 2));
console.log(`management_requests=${retention.map(item => item.requests).join(' + ')} = ${retention.reduce((sum, item) => sum + item.requests, 0)}`);
console.log(`sql_group_executions=${retention.filter(item => item.groups).map(item => item.groups).join(' + ')} = ${retention.reduce((sum, item) => sum + item.groups, 0)}; unique_groups=10`);
console.log('full_web_test_movement=1990 + 1 NUL contract + 52 store + 104 HTTP + 72 browser transport = 2219');
console.log('focused_tests_overlap_full_suite; do_not_sum_as_unique_tests');
console.log('FINDINGS');
console.log('1. Owner-approved 30-day expiry is applied only to dedicated sgshiok; the original migration remains byte-identical. Database remains empty and intake disabled.');
console.log('2. Submission endpoint and explicit retry transport are implemented and tested. Inherited generic503 uncertainty loss and cumulative uncertainty loss on a denied retry were corrected.');
console.log('3. The predicted old Chrome Origin:null failure was NOT reproduced and that claim is withdrawn. Both real loopback POSTs sent the correct Origin and no Referer.');
console.log('4. Cleanup, moderation, resident form and report activation are unfinished. Core-map release can proceed independently after its own release gates.');
console.log('DISAGREEMENTS');
console.log('1. Expiry is not deletion: passing the new expiry checks cannot establish 30-day physical retention before cleanup is implemented and verified.');
console.log('2. Build-and-ship authorization is not evidence of passed release checks. The full goal remains active; this checkpoint is not a production release.');
