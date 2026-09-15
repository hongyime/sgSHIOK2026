import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
process.env.TEMP = process.env.TMP = resolve(root, 'tmp');
const dir = resolve(root, 'qa/revamp-r1/report-moderation-20260915');
const read = p => JSON.parse(readFileSync(resolve(dir, p), 'utf8'));
const hash = b => createHash('sha256').update(b).digest('hex');
const migrationPath = 'supabase/migrations/20260915041505_shiok_report_moderation.sql';
const migrationHash = hash(readFileSync(resolve(root, migrationPath)));
const receipts = ['inspect-HMa6UN', 'test-JPaUxA', 'test-rbt4BC', 'apply-9WK51f', 'test-applied-u3wu1n'];
const db = Object.fromEntries(receipts.map(p => [p, read(`${p}/summary.json`)]));
for (const r of Object.values(db)) assert.equal(r.passed, true);
for (const name of ['test-rbt4BC', 'test-applied-u3wu1n']) {
  assert.equal(db[name].checks.length, 39); assert.ok(db[name].checks.every(c => c.passed));
  assert.deepEqual(db[name].isolationChecks, [
    { isolation: 'repeatable read', rejected_entry_points: 3 }, { isolation: 'serializable', rejected_entry_points: 3 },
  ]);
  assert.equal(db[name].productionUnchanged, true); assert.equal(db[name].migration.sha256, migrationHash);
}
const apply = db['apply-9WK51f']; assert.equal(apply.remoteVersion, '20260915041505');
assert.equal(apply.migration.sha256, migrationHash);
const final = db['test-applied-u3wu1n'];
assert.equal(final.after[0].reports, 0); assert.equal(final.after[0].auth_users, 0);
assert.equal(final.after[0].auth_sessions, 0); assert.equal(final.after[0].control.enabled, false);
assert.ok(final.advisors.lints.every(l => l.level === 'INFO'));
const checkNames = { full: 'checks-full-QhMTdS', focused: 'checks-focused-8YQokH', types: 'checks-types-YWGBx9', docs: process.argv[2] };
assert.match(checkNames.docs ?? '', /^checks-docs-[A-Za-z0-9]{6}$/);
const checks = Object.fromEntries(Object.entries(checkNames).map(([mode, p]) => [mode, read(`${p}/summary.json`)]));
for (const c of Object.values(checks)) { assert.equal(c.exit, 0); assert.equal(c.sourceStable, true); assert.deepEqual(c.before, c.after); }
assert.deepEqual(checks.full.before, checks.full.snapshotSources);
for (const [p, h] of Object.entries(checks.full.before)) assert.equal(hash(readFileSync(resolve(root, p))), h);
const full = readFileSync(resolve(dir, checkNames.full, 'stdout.txt'), 'utf8');
assert.match(full, /Tests\s+2531 passed \(2531\)/); assert.match(full, /Test Files\s+79 passed \(79\)/); assert.match(full, /pass 42/);
assert.deepEqual(checks.focused.tests, { passed: 94, failed: 0, files: 2 });
assert.match(readFileSync(resolve(dir, checkNames.docs, 'stdout.txt'), 'utf8'), /41 passed/);
const previous = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/report-operations-20260915/database-checkpoint.json'), 'utf8'));
for (const anchor of previous.protectedAnchors) {
  const bytes = readFileSync(resolve(root, anchor.path)); assert.equal(bytes.length, anchor.bytes); assert.equal(hash(bytes), anchor.sha256);
}
assert.equal(hash(readFileSync(resolve(root, 'pipeline/config/weights.yaml'))), previous.weights);
const old = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/report-operations-20260915/form-evidence.json'), 'utf8')).after;
const evidencePath = resolve(root, 'qa/verification/REVAMP-R1-core-walk.md');
const before = readFileSync(evidencePath); assert.equal(before.length, old.bytes); assert.equal(hash(before), old.sha256);
const integrity = execFileSync(resolve(root, '.venv/Scripts/python.exe'), ['-B', resolve(root, 'scripts/check_repo_integrity.py')], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000 });
assert.match(integrity, /repo_integrity=ok/);
const result = { root, host: process.env.COMPUTERNAME, previousGoalTurn: 'No progress: final verification/status only. Concrete implementation resumed this turn.',
  migration: { path: migrationPath, sha256: migrationHash, nativeVersion: apply.remoteVersion,
    originalCliFile: apply.migration.file, exactByteRename: true },
  database: { receipts, initialGroups: db['test-JPaUxA'].checks.length, currentGroups: 39, isolationEntryRejections: 6,
    reports: 0, authUsers: 0, authSessions: 0, intakeEnabled: false, enrollment: 'none',
    advisorLevels: final.advisors.lints.map(l => l.level),
    requestArithmetic: `${receipts.map(n => db[n].requests.length).join(' + ')} = ${receipts.reduce((s, n) => s + db[n].requests.length, 0)}` },
  validation: { receipts: checkNames, web: { passed: 2531, files: 79, dependencyGuards: 42 }, focused: checks.focused.tests,
    typeScriptExit: 0, docsPassed: 41, arithmetic: '2482 + 49 = 2531; 78 + 1 = 79. Focused 94 overlaps the full suite; guards are separate.',
    isolation: checks.full.isolation, sourceBindings: checks.full.before, integrity },
  review: read('review.json'), protectedAnchorsVerified: previous.protectedAnchors.length, weights: previous.weights,
  references: ['https://supabase.com/changelog.md', 'https://supabase.com/docs/guides/auth/sessions',
    'https://supabase.com/docs/guides/database/postgres/row-level-security'],
  findings: [
    'Private bounded queue/context and atomic moderation installed with empty allowlist; Auth verification is implemented but not connected to a public route.',
    'Review found stale REPEATABLE READ snapshots could defeat lock-only serialization. Unsupported isolation now explicitly fails; all entry gates tested.',
    'Review found source lookup unnecessarily traversed expired/overlong targets. Retained source inspection is now independent and tested through real SQL.',
    'Initial23groups missed both review findings; corrected39groups plus6isolation rejections pass before and after apply. No overlapping moderation race or real owner Auth claim.',
    'No pipeline run, frozen artifact mutation, Cloudflare, paid upgrade, runtime secret write or frontend deployment. Resident reporting remains disabled.',
  ], disagreements: [
    'Sequential green tests and a row lock do not prove safety under arbitrary transaction isolation.',
    'Authentication-only verification is not authorization, enrollment, a working owner queue UI or T17 completion.',
  ], next: 'Finish owner sign-in/enrollment, HTTP adapter/queue UI, actual Auth-to-RPC and overlapping revocation/moderation acceptance; continue health delivery, integrated resident/navigation and exact frontend release. Full goal active.' };
writeFileSync(resolve(dir, 'checkpoint.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
const output = JSON.stringify(result, null, 2);
appendFileSync(evidencePath, '\n\n## 2026-09-15: Private moderation backend and authentication checkpoint\n\n```json\n' + output + '\n```\n');
const after = readFileSync(evidencePath); assert.ok(after.subarray(0, before.length).equals(before));
writeFileSync(resolve(dir, 'evidence.json'), JSON.stringify({ before: old, after: { bytes: after.length, sha256: hash(after) }, appendOnly: true }, null, 2) + '\n', { flag: 'wx' });
console.log(output);
