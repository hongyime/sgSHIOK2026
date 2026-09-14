import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const { values } = parseArgs({ args: process.argv.slice(2), options: { mode: { type: 'string' }, project: { type: 'string' }, proof: { type: 'string' } } });
const target = JSON.parse(readFileSync(resolve(root, 'web/lib/report-project.json'), 'utf8'));
assert.equal(values.project, target.projectRef, 'Explicit owner-approved project confirmation required');
assert.equal(target.projectRef, 'ztjilsfgoephcdcsgcks', 'Owner-approved project changed; re-review required');
assert.equal(target.projectUrl, `https://${target.projectRef}.supabase.co`);
assert.ok(['inspect', 'test', 'apply', 'verify', 'http'].includes(values.mode));
const token = process.env.SHIOK_SUPABASE_ACCESS_TOKEN;
assert.ok(token, 'Explicit SHIOK management credential required; no ambient-account fallback');
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/dedicated-report-project-20260915/remote-'));
const result = { target, mode: values.mode, startedAt: new Date().toISOString(), requests: [], passed: false };
const prefix = `projects/${target.projectRef}`;
const allowed = new Set([prefix, `organizations/${target.organizationId}`, ...['postgrest', 'database/query', 'database/migrations', 'advisors/security', 'api-keys?reveal=true'].map(s => `${prefix}/${s}`)]);
const sha = value => createHash('sha256').update(value).digest('hex');
// Same SQL bytes, renamed to the version assigned by this dedicated project's API.
const migrationPath = 'supabase/migrations/20260914161526_shiok_private_reports_v1.sql';
const migrationSha = '9de35faa5275c5c10706167195df81f1832a246b2d336adab192fd1b6a046604';
async function api(path, body) {
  assert.ok(allowed.has(path), 'Provider destination is not allowlisted');
  const started = Date.now();
  const response = await fetch(`https://api.supabase.com/v1/${path}`, {
    method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(25000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  result.requests.push({ path, method: body ? 'POST' : 'GET', status: response.status, elapsedMs: Date.now() - started });
  if (!response.ok) { void response.body?.cancel(); throw new Error(`Management request failed: HTTP ${response.status}; no automatic retry`); }
  return response.json();
}
const query = (sql, readOnly = true) => api(`${prefix}/database/query`, { query: sql, read_only: readOnly });
const baseSql = `select
 (select count(*) from pg_namespace where nspname='shiok_reports') as report_schemas,
 (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'shiok_report%') as report_functions,
 (select coalesce(jsonb_agg(c.relname order by c.relname),'[]'::jsonb) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p')) as public_tables;`;
async function installed() {
  const [state] = await query(`select enabled,policy_approved_at,cleanup_verified_at,allowed_bundles,
    (select count(*) from shiok_reports.reports) as reports,
    (select count(*) from shiok_reports.daily_usage) as quota_rows,
    (select jsonb_agg(jsonb_build_object('table',c.relname,'rls',c.relrowsecurity,'anon_read',has_table_privilege('anon',c.oid,'SELECT'),'authenticated_read',has_table_privilege('authenticated',c.oid,'SELECT')) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='shiok_reports' and c.relkind='r') as tables,
    (select jsonb_build_object('security_definer',prosecdef,'anon_execute',has_function_privilege('anon',oid,'EXECUTE'),'authenticated_execute',has_function_privilege('authenticated',oid,'EXECUTE'),'service_execute',has_function_privilege('service_role',oid,'EXECUTE')) from pg_proc where oid='public.shiok_report_submit_v1(uuid,text,text,text)'::regprocedure) as rpc
    from shiok_reports.control;`);
  assert.equal(state.enabled, false); assert.equal(Number(state.reports), 0); assert.equal(Number(state.quota_rows), 0);
  assert.equal(state.policy_approved_at, null); assert.equal(state.cleanup_verified_at, null); assert.deepEqual(state.allowed_bundles, []);
  assert.equal(state.tables.length, 3); assert.ok(state.tables.every(t => t.rls && !t.anon_read && !t.authenticated_read));
  assert.deepEqual(state.rpc, { security_definer: false, anon_execute: false, authenticated_execute: false, service_execute: true });
  return state;
}
try {
  const project = await api(prefix);
  assert.equal(project.id, target.projectRef); assert.equal(project.name, target.projectName);
  assert.equal(project.organization_id, target.organizationId); assert.equal(project.region, target.region);
  assert.equal(project.status, 'ACTIVE_HEALTHY');
  const org = await api(`organizations/${target.organizationId}`);
  assert.equal(org.plan, 'free');
  result.identity = { name: project.name, ref: project.id, region: project.region, status: project.status, plan: org.plan, postgres: project.database.version };
  const rest = await api(`${prefix}/postgrest`);
  result.exposedSchemas = rest.db_schema;
  assert.ok(!rest.db_schema.split(',').map(s => s.trim()).includes('shiok_reports'));
  result.before = await query(baseSql);
  result.migrationsBefore = await api(`${prefix}/database/migrations`);
  if (['test', 'apply'].includes(values.mode)) {
    assert.equal(Number(result.before[0].report_schemas), 0, 'Existing schema: do not reapply');
    assert.equal(Number(result.before[0].report_functions), 0, 'Existing RPC: do not reapply');
    assert.deepEqual(result.before[0].public_tables, [], 'Unexpected pre-existing app tables; stop');
    assert.deepEqual(result.migrationsBefore, [], 'Unexpected migration history; stop');
    const sql = readFileSync(resolve(root, migrationPath), 'utf8');
    assert.equal(sha(sql), migrationSha, 'Migration hash mismatch: stop, no repair');
    const tests = readFileSync(resolve(root, 'supabase/tests/reports.sql'), 'utf8');
    result.migration = { path: migrationPath, sha256: sha(sql), bytes: Buffer.byteLength(sql), testsSha256: sha(tests) };
    if (values.mode === 'test') {
      result.testResults = await query(`begin; set local statement_timeout='15s';\n${sql}\n${tests}\nrollback;`, false);
      assert.equal(result.testResults.length, 14); assert.ok(result.testResults.every(t => t.passed));
      result.after = await query(baseSql); assert.deepEqual(result.after, result.before);
      assert.deepEqual(await api(`${prefix}/database/migrations`), result.migrationsBefore);
    } else {
      assert.match(values.proof ?? '', /^remote-[A-Za-z0-9]{6}$/);
      const proof = JSON.parse(readFileSync(resolve(root, 'qa/revamp-r1/dedicated-report-project-20260915', values.proof, 'summary.json'), 'utf8'));
      assert.equal(proof.mode, 'test'); assert.equal(proof.passed, true); assert.deepEqual(proof.target, target);
      assert.deepEqual(proof.migration, result.migration);
      assert.ok(Date.now() - Date.parse(proof.finishedAt) >= 0 && Date.now() - Date.parse(proof.finishedAt) < 3600000, 'Test proof expired');
      result.proof = values.proof;
      result.applyAttempted = true;
      await api(`${prefix}/database/migrations`, { name: 'shiok_private_reports_v1', query: sql });
      result.applied = true;
      result.migrationsAfter = await api(`${prefix}/database/migrations`);
      assert.equal(result.migrationsAfter.length, 1); assert.equal(result.migrationsAfter[0].name, 'shiok_private_reports_v1');
      assert.match(result.migrationsAfter[0].version, /^\d{14}$/);
      result.remoteVersion = result.migrationsAfter[0].version;
      result.storage = await installed();
    }
  } else if (['verify', 'http'].includes(values.mode)) {
    result.storage = await installed();
    if (values.mode === 'verify') {
      const advisors = await api(`${prefix}/advisors/security`);
      result.reportAdvisories = (advisors.lints ?? []).filter(l => l.metadata?.schema === 'shiok_reports' || String(l.metadata?.name ?? '').startsWith('shiok_report'));
      assert.ok(!result.reportAdvisories.some(l => ['ERROR', 'WARN'].includes(l.level)));
    } else {
      const supplied = process.env.SHIOK_SUPABASE_PUBLISHABLE_KEY;
      assert.ok(supplied?.startsWith('sb_publishable_'), 'Explicit publishable key required');
      const keys = await api(`${prefix}/api-keys?reveal=true`);
      assert.ok(keys.some(k => k.type === 'publishable' && k.api_key === supplied), 'Publishable key does not match target');
      const secret = keys.find(k => k.type === 'secret' && k.api_key?.startsWith('sb_secret_'))?.api_key;
      assert.ok(secret, 'Existing server key unavailable; do not create automatically');
      const content = JSON.stringify({ schema_version: 1, report_type: 'mapping_error', geometry: { type: 'Point', coordinates: [103.85, 1.35] }, referenced_bundle_version: 'synthetic-bundle-v1', note: 'synthetic only' });
      const body = JSON.stringify({ p_request_id: '12345678-1234-4123-8123-123456789abc', p_canonical_content: content, p_retry_proof_sha256: 'a'.repeat(64), p_abuse_bucket_sha256: 'b'.repeat(64) });
      result.http = [];
      for (const test of [
        { name: 'publishable_rpc_denied', key: supplied, path: 'rpc/shiok_report_submit_v1', body, status: 401, code: '42501' },
        { name: 'private_schema_not_exposed', key: supplied, path: 'reports?select=receipt_id&limit=1', profile: 'shiok_reports', status: 406, code: 'PGRST106' },
        { name: 'service_intake_disabled', key: secret, path: 'rpc/shiok_report_submit_v1', body, status: 503, code: 'PT503' },
      ]) {
        const response = await fetch(`${target.projectUrl}/rest/v1/${test.path}`, { method: test.body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { apikey: test.key, 'Content-Type': 'application/json', ...(test.profile ? { 'Accept-Profile': test.profile } : {}) }, ...(test.body ? { body: test.body } : {}) });
        const reply = await response.json();
        result.http.push({ name: test.name, status: response.status, code: reply.code ?? null });
        assert.equal(response.status, test.status); assert.equal(reply.code, test.code);
      }
      result.afterHttp = await installed(); assert.deepEqual(result.afterHttp, result.storage);
    }
  }
  result.passed = true;
} catch (error) {
  // No provider bodies, key arrays, request headers, or exception object serialization.
  result.error = String(error.message).includes(token) ? 'Credential-bearing error withheld' : String(error.message).slice(0, 1200);
  process.exitCode = 1;
}
result.finishedAt = new Date().toISOString();
writeFileSync(resolve(out, 'summary.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ out, ...result }, null, 2));
