import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026'; assert.equal(process.cwd(), root);
process.env.TEMP = process.env.TMP = resolve(root, 'tmp');
const mode = process.argv[2]; assert.ok(['live', 'tests'].includes(mode));
const dir = mkdtempSync(resolve(root, 'qa/revamp-r1/report-health-20260915', `${mode}-`));
const paths = ['scripts/report_cleanup_health.py', 'scripts/collect_report_cleanup_health.py',
  'tests/test_report_cleanup_health.py', 'tests/test_collect_report_cleanup_health.py'];
const hash = b => createHash('sha256').update(b).digest('hex');
const sources = () => Object.fromEntries(paths.map(p => [p, hash(readFileSync(resolve(root, p)))]));
const before = sources();
writeFileSync(resolve(dir, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
for (const p of paths) writeFileSync(resolve(dir, p.split('/').at(-1)), readFileSync(resolve(root, p)), { flag: 'wx' });
const command = mode === 'live'
  ? [resolve(root, '.venv/Scripts/python.exe'), '-B', 'scripts/collect_report_cleanup_health.py']
  : [resolve(root, '.venv/Scripts/python.exe'), '-B', '-m', 'pytest', ...paths.filter(p => p.startsWith('tests/')),
    'tests/test_readme.py', 'tests/test_agent_docs.py', 'tests/test_repo_integrity.py', '-q', '-p', 'no:cacheprovider'];
if (mode === 'live') assert.ok(process.env.SHIOK_SUPABASE_ACCESS_TOKEN, 'Explicit session credential required');
const start = Date.now();
const r = spawnSync(command[0], command.slice(1), { cwd: root, env: process.env, windowsHide: true, encoding: 'utf8',
  timeout: mode === 'live' ? 45000 : 180000, maxBuffer: 1024 * 1024 });
for (const stream of ['stdout', 'stderr']) writeFileSync(resolve(dir, `${stream}.txt`), r[stream] ?? '', { flag: 'wx' });
const result = { mode, command, startedAt: new Date(start).toISOString(), elapsedMs: Date.now() - start,
  exit: r.status, error: r.error?.code ?? null, before, after: sources(), accepted: false };
try {
  assert.deepEqual(result.before, result.after);
  assert.equal(r.error, undefined);
  if (mode === 'live') {
    assert.equal(r.stderr, '');
    result.health = JSON.parse(r.stdout);
    assert.equal(result.health.target.projectRef, 'ztjilsfgoephcdcsgcks');
    assert.equal(result.health.intake_enabled, false);
    assert.equal(result.health.cleanup, 'fresh');
    assert.equal(result.health.reason, null);
    assert.equal(result.health.status, 'unobserved');
    assert.equal(result.health.scheduler, 'unobserved');
    assert.equal(result.health.natural_run_observed, false);
    assert.equal(result.health.cleanup_admission_ready, false);
    assert.equal(r.status, 1);
    result.meaning = 'Live read-only collection succeeded; no natural cleanup run yet, so health correctly fails closed. Exit1 is not a healthy cleanup claim.';
  } else {
    assert.equal(r.status, 0); assert.match(r.stdout, /95 passed/);
    result.meaning = '30 evaluator +24 collector +41 docs/integrity =95 tests. Subtests are not separate test functions.';
  }
  result.accepted = true;
} catch (error) { result.assertion = error.message; }
writeFileSync(resolve(dir, 'summary.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ dir, ...result }, null, 2));
process.exitCode = result.accepted ? 0 : 1;
