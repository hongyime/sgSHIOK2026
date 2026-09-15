import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const { values } = parseArgs({ options: { mode: { type: 'string' }, project: { type: 'string' }, proof: { type: 'string' } } });
const target = JSON.parse(readFileSync(resolve(root, 'web/lib/report-project.json'), 'utf8'));
assert.equal(values.project, 'ztjilsfgoephcdcsgcks'); assert.equal(target.projectRef, values.project);
assert.equal(target.projectUrl, 'https://ztjilsfgoephcdcsgcks.supabase.co');
assert.ok(['test', 'apply', 'verify'].includes(values.mode));
const token = process.env.SHIOK_SUPABASE_ACCESS_TOKEN;
assert.ok(token, 'Explicit SHIOK management credential required');
// Same bytes as the CLI-created file, aligned with the version assigned on application.
const migrationPath = 'supabase/migrations/20260915000630_shiok_report_retention_30_days.sql';
const oldPath = 'supabase/migrations/20260914161526_shiok_private_reports_v1.sql';
const old = readFileSync(resolve(root, oldPath), 'utf8');
const sql = readFileSync(resolve(root, migrationPath), 'utf8');
const tests = readFileSync(resolve(root, 'supabase/tests/retention_30_days.sql'), 'utf8');
const sha = text => createHash('sha256').update(text).digest('hex');
assert.equal(sha(old), '9de35faa5275c5c10706167195df81f1832a246b2d336adab192fd1b6a046604');
const body = text => text.match(/as \$\$([^]*?)\$\$;/)?.[1];
assert.ok(body(sql)); assert.equal(body(sql), body(old).replace("interval '90 days'", "interval '30 days'"), 'RPC changed beyond approved expiry');
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/report-http-20260915/retention-'));
const result = { mode: values.mode, target, requests: [], migration: { path: migrationPath, sha256: sha(sql), testsSha256: sha(tests), originalSha256: sha(old) }, passed: false };
const prefix = `projects/${target.projectRef}`;
const allowed = new Set([prefix, `organizations/${target.organizationId}`, `${prefix}/database/query`, `${prefix}/database/migrations`, `${prefix}/advisors/security`]);
async function api(path, data) {
  assert.ok(allowed.has(path));
  const response = await fetch(`https://api.supabase.com/v1/${path}`, {
    method: data ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(25000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  result.requests.push({ path, method: data ? 'POST' : 'GET', status: response.status });
  if (!response.ok) { void response.body?.cancel(); throw new Error(`Management HTTP${response.status}; no retry`); }
  return response.json();
}
const query = (text, readOnly = true) => api(`${prefix}/database/query`, { query: text, read_only: readOnly });
async function state() {
  const [row] = await query(`select
    (select count(*) from shiok_reports.reports) as reports,
    (select count(*) from shiok_reports.daily_usage) as usage,
    (select jsonb_agg(to_jsonb(c)) from shiok_reports.control c) as control,
    (select encode(sha256(convert_to(prosrc,'UTF8')),'hex') from pg_proc where oid='public.shiok_report_submit_v1(uuid,text,text,text)'::regprocedure) as rpc_sha256,
    (select count(*) from pg_constraint where conrelid='shiok_reports.reports'::regclass and conname='shiok_reports_expiry_30_days' and convalidated) as retention_constraints;`);
  assert.equal(Number(row.reports), 0, 'Existing reports: stop'); assert.equal(Number(row.usage), 0, 'Existing usage: stop');
  assert.deepEqual(row.control, [{ singleton: true, enabled: false, policy_approved_at: null, cleanup_verified_at: null, allowed_bundles: [] }]);
  return row;
}
try {
  const identity = await api(prefix);
  assert.equal(identity.id, target.projectRef); assert.equal(identity.name, target.projectName);
  assert.equal(identity.organization_id, target.organizationId); assert.equal(identity.region, target.region);
  assert.equal(identity.status, 'ACTIVE_HEALTHY');
  assert.equal((await api(`organizations/${target.organizationId}`)).plan, 'free');
  result.before = await state();
  result.historyBefore = await api(`${prefix}/database/migrations`);
  if (values.mode !== 'verify') {
    assert.equal(result.before.rpc_sha256, sha(body(old)), 'Existing RPC hash differs: stop');
    assert.equal(Number(result.before.retention_constraints), 0, 'Already applied: stop');
    assert.equal(result.historyBefore.length, 1); assert.equal(result.historyBefore[0].version, '20260914161526');
    if (values.mode === 'test') {
      result.tests = await query(`begin; set local statement_timeout='15s';\n${sql}\n${tests}\nrollback;`, false);
      assert.ok(result.tests.length >= 6 && result.tests.every(row => row.passed === true));
      result.after = await state(); assert.deepEqual(result.after, result.before);
      assert.deepEqual(await api(`${prefix}/database/migrations`), result.historyBefore);
    } else {
      assert.match(values.proof ?? '', /^retention-[A-Za-z0-9]{6}$/);
      const proof = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/report-http-20260915', values.proof, 'summary.json'), 'utf8'));
      assert.equal(proof.mode, 'test'); assert.equal(proof.passed, true);
      assert.deepEqual(proof.migration, result.migration); assert.deepEqual(proof.target, target);
      assert.ok(Date.now() - Date.parse(proof.finishedAt) >= 0 && Date.now() - Date.parse(proof.finishedAt) < 3600000);
      result.applyAttempted = true;
      await api(`${prefix}/database/migrations`, { name: 'shiok_report_retention_30_days', query: sql });
      result.after = await state();
      assert.equal(result.after.rpc_sha256, sha(body(sql))); assert.equal(Number(result.after.retention_constraints), 1);
      result.historyAfter = await api(`${prefix}/database/migrations`);
      assert.equal(result.historyAfter.length, 2);
      result.remoteVersion = result.historyAfter.find(row => row.name === 'shiok_report_retention_30_days')?.version;
      assert.match(result.remoteVersion ?? '', /^\d{14}$/);
    }
  } else {
    assert.equal(result.before.rpc_sha256, sha(body(sql))); assert.equal(Number(result.before.retention_constraints), 1);
    result.tests = await query(`begin; set local statement_timeout='15s';\n${tests}\nrollback;`, false);
    assert.ok(result.tests.length >= 6 && result.tests.every(row => row.passed === true));
    result.after = await state(); assert.deepEqual(result.after, result.before);
    const advisors = await api(`${prefix}/advisors/security`);
    result.reportAdvisories = (advisors.lints ?? []).filter(l => l.metadata?.schema === 'shiok_reports' || String(l.metadata?.name ?? '').startsWith('shiok_report'));
    assert.ok(!result.reportAdvisories.some(l => ['WARN', 'ERROR'].includes(l.level)));
  }
  result.passed = true;
} catch (error) {
  result.error = String(error.message).split(token).join('[withheld]').slice(0, 800);
  process.exitCode = 1;
}
result.finishedAt = new Date().toISOString();
writeFileSync(resolve(out, 'summary.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ out, ...result }, null, 2));
