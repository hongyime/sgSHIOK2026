import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const dir = resolve(root, 'qa/revamp-r1/dedicated-report-project-20260915');
const read = path => JSON.parse(readFileSync(resolve(dir, path), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const target = JSON.parse(readFileSync(resolve(root, 'web/lib/report-project.json'), 'utf8'));
const runNames = ['remote-OMUoZG', 'remote-FE8FdN', 'remote-P1L02N', 'remote-eTMwDV'];
const runs = runNames.map(name => read(`${name}/summary.json`));
for (const run of runs) {
  assert.equal(run.passed, true); assert.deepEqual(run.target, target);
  assert.ok(run.requests.every(r => r.path.startsWith(`projects/${target.projectRef}`) || r.path === `organizations/${target.organizationId}`));
}
const remoteVersion = runs[1].remoteVersion;
const migrationPath = `supabase/migrations/${remoteVersion}_shiok_private_reports_v1.sql`;
const migration = readFileSync(resolve(root, migrationPath));
assert.equal(sha(migration), runs[0].migration.sha256);
assert.deepEqual(runs[3].migrationsBefore, [{ version: remoteVersion, name: 'shiok_private_reports_v1' }]);
const checks = ['checks-kQ7T5j', 'checks-rwRC9p', 'checks-QAoNOK', 'checks-kFfHNh', 'checks-XgDpnF', 'checks-dnYfli'].map(name => ({ name, ...read(`${name}/summary.json`) }));
assert.ok(checks.every(c => c.exit === 0));
const snapshot = resolve(root, 'tmp/test-without-data-9BhPBX');
const sourcePaths = ['web/lib/report-project.json', 'web/app/api/reports/store.ts', 'web/lib/__tests__/report-store.test.ts', 'web/lib/reports.ts', 'web/lib/report-lifecycle.ts'];
const sources = sourcePaths.map(path => {
  const hash = sha(readFileSync(resolve(root, path)));
  assert.equal(hash, sha(readFileSync(resolve(snapshot, path))));
  return { path, sha256: hash, matchesIsolatedSnapshot: true };
});
const evidence = readFileSync(resolve(root, 'qa/verification/REVAMP-R1-core-walk.md'));
const evidencePrefix = { bytes: 454842, sha256: sha(evidence.subarray(0, 454842)) };
assert.equal(evidencePrefix.sha256, '635efe321066fed145ae4b44828768da60b23a574f4fab58b0b0821a44be7237');
const weightsSha256 = sha(readFileSync(resolve(root, 'pipeline/config/weights.yaml')));
assert.equal(weightsSha256, '5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec');
const result = {
  root, target, sources, snapshot, checks, remoteReceipts: runNames,
  migration: { path: migrationPath, sha256: sha(migration), bytes: migration.length, remoteVersion },
  http: runs[2].http, storage: runs[3].storage, evidencePrefix, weightsSha256,
  findings: ['Dedicated target verified and sole allowed origin.', 'Installed private storage disabled and empty.', 'Live public denial and disabled service admission verified.'],
  disagreements: ['Publishable key is not authorization for private writes; no resident feature completion is claimed.'],
  remaining: ['Submission API and trusted abuse buckets', 'Real concurrent admission and uncertain-commit recovery', 'Moderator authentication/queue', 'Retention cleanup and policy', 'Resident form and browser acceptance'],
  unrelatedProjectRequests: 0, frontendDeployments: 0, pipelineRuns: 0, credentialsSaved: false,
};
writeFileSync(resolve(dir, 'summary.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(result, null, 2));
