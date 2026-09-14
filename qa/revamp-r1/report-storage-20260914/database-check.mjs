// Historical wrong-project experiment: retained, but must never execute again.
throw new Error('RETIRED: sgbuslaobu is not a SHIOK project. No access permitted.');
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const token = process.env.SUPABASE_ACCESS_TOKEN;
assert.ok(token, 'Existing authenticated environment required; never paste a token into this file.');
const project = 'ajvenxqkedajbrbnnfko';
const organization = 'mvoevnoamtddjisdqfhr';
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/report-storage-20260914/database-'));
// Management API assigned this version on application; bytes match the CLI-created candidate.
const migrationPath = 'supabase/migrations/20260914085103_shiok_private_reports_v1.sql';
const migration = readFileSync(resolve(root, migrationPath), 'utf8');
const tests = readFileSync(resolve(root, 'supabase/tests/reports.sql'), 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');
const result = { project, organization, migrationPath, migrationSha256: sha(migration), testsSha256: sha(tests), mode: 'rollback-only', requests: [], testsPassed: false };
async function api(path, body) {
  const started = Date.now();
  const response = await fetch(`https://api.supabase.com/v1/${path}`, {
    method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(25000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  result.requests.push({ path, status: response.status, elapsedMs: Date.now() - started });
  const json = await response.json();
  if (!response.ok) {
    // Query text contains only authored synthetic fixtures; never persist API/auth details.
    result.failureCode = json.code ?? null;
    result.failureMessage = typeof json.message === 'string' && !json.message.includes(token) ? json.message.slice(0,1000) : 'provider request failed';
    throw new Error(`Supabase HTTP ${response.status}`);
  }
  return json;
}
const inspect = `select
  (select count(*) from pg_namespace where nspname='shiok_reports') as report_schemas,
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'shiok_report%') as report_functions,
  (select coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'rls',c.relrowsecurity,'columns',
    (select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod)) order by a.attnum) from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
    'constraints',(select jsonb_agg(pg_get_constraintdef(x.oid) order by x.conname) from pg_constraint x where x.conrelid=c.oid)) order by c.relname),'[]'::jsonb) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='transit' and c.relkind='r') as transit_definitions;`;
try {
  const org = await api(`organizations/${organization}`);
  assert.equal(org.plan, 'free', 'Free-plan gate failed'); result.plan = org.plan;
  const target = await api(`projects/${project}`);
  assert.equal(target.name, 'sgbuslaobu'); assert.equal(target.organization_id, organization);
  assert.equal(target.status, 'ACTIVE_HEALTHY'); result.projectName = target.name; result.region = target.region;
  const rest = await api(`projects/${project}/postgrest`);
  result.exposedSchemas = rest.db_schema;
  assert.equal(typeof rest.db_schema, 'string');
  assert.ok(!rest.db_schema.split(',').map(s => s.trim()).includes('shiok_reports'));
  const before = await api(`projects/${project}/database/query`, { query: inspect, read_only: true });
  assert.equal(Number(before[0].report_schemas), 0); assert.equal(Number(before[0].report_functions), 0);
  result.before = before;
  result.testReply = await api(`projects/${project}/database/query`, { query: `begin; set local statement_timeout='10s';\n${migration}\n${tests}\nrollback;`, read_only: false });
  assert.equal(result.testReply.length, 14); assert.ok(result.testReply.every(row => row.passed === true));
  const after = await api(`projects/${project}/database/query`, { query: inspect, read_only: true });
  result.after = after; assert.deepEqual(after, before, 'Rollback/transit identity failed');
  result.testsPassed = true;
} catch (error) { result.error = error.message?.includes(token) ? 'redacted error' : error.message; process.exitCode = 1; }
writeFileSync(resolve(out, 'summary.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ out, ...result }, null, 2));
