import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const mode = process.argv[2];
assert.ok(['inspect', 'test', 'apply', 'test-applied'].includes(mode));
const target = JSON.parse(readFileSync(resolve(root, 'web/lib/report-project.json'), 'utf8'));
assert.equal(target.projectRef, 'ztjilsfgoephcdcsgcks');
const token = process.env.SHIOK_SUPABASE_ACCESS_TOKEN;
assert.ok(token, 'Explicit session credential required');
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/report-moderation-20260915', `${mode}-`));
const hash = x => createHash('sha256').update(x).digest('hex');
const result = { mode, target, startedAt: new Date().toISOString(), passed: false, requests: [] };
const prefix = `projects/${target.projectRef}`;
writeFileSync(resolve(out, 'runner.mjs'), readFileSync(new URL(import.meta.url)), { flag: 'wx' });
async function api(path, data) {
  assert.ok([prefix, `organizations/${target.organizationId}`, `${prefix}/database/query`,
    `${prefix}/database/migrations`, `${prefix}/advisors/security`].includes(path));
  const res = await fetch(`https://api.supabase.com/v1/${path}`, {
    method: data ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const raw = await res.text();
  result.requests.push({ path, status: res.status, ...(data ? { querySha256: hash(data.query) } : {}) });
  // Synthetic SQL only; sanitize credential and bound platform diagnostics.
  if (!res.ok) { result.errorResponse = raw.split(token).join('[withheld]').slice(0, 1600); throw Error(`HTTP ${res.status}; no retry`); }
  return JSON.parse(raw);
}
const query = (query, read_only = true) => api(`${prefix}/database/query`, { query, read_only });
const stateSQL = `select (select count(*) from shiok_reports.reports) reports,
  (select count(*) from shiok_reports.daily_usage) usage,
  (select to_jsonb(c) from shiok_reports.control c) control,
  to_regclass('shiok_reports.moderators') moderators_table,
  (select count(*) from auth.users) auth_users, (select count(*) from auth.sessions) auth_sessions;`;
try {
  const p = await api(prefix);
  for (const [k, v] of Object.entries({ id: target.projectRef, name: target.projectName,
    organization_id: target.organizationId, region: target.region, status: 'ACTIVE_HEALTHY' })) assert.equal(p[k], v);
  assert.equal((await api(`organizations/${target.organizationId}`)).plan, 'free');
  result.before = await query(stateSQL);
  assert.equal(Number(result.before[0].reports), 0);
  assert.equal(Number(result.before[0].usage), 0);
  assert.equal(result.before[0].control.enabled, false);
  if (mode === 'inspect') {
    result.authColumns = await query(`select table_name,column_name,data_type,is_nullable,column_default
      from information_schema.columns where table_schema='auth' and table_name in ('users','sessions')
      order by table_name,ordinal_position;`);
  } else {
    const names = readdirSync(resolve(root, 'supabase/migrations')).filter(n => n.endsWith('_shiok_report_moderation.sql'));
    assert.equal(names.length, 1);
    const migration = readFileSync(resolve(root, 'supabase/migrations', names[0]), 'utf8');
    const tests = readFileSync(resolve(root, 'supabase/tests/report_moderation.sql'), 'utf8');
    result.migration = { file: names[0], sha256: hash(migration) };
    result.testsSha256 = hash(tests);
    writeFileSync(resolve(out, 'migration.sql'), migration, { flag: 'wx' });
    writeFileSync(resolve(out, 'tests.sql'), tests, { flag: 'wx' });
    if (mode === 'apply') {
      const proofName = process.argv[3];
      assert.match(proofName ?? '', /^test-[A-Za-z0-9]{6}$/);
      const proof = JSON.parse(readFileSync(resolve(out, '..', proofName, 'summary.json'), 'utf8'));
      assert.equal(proof.passed, true); assert.equal(proof.productionUnchanged, true);
      assert.equal(proof.migration.sha256, result.migration.sha256);
      assert.equal(proof.testsSha256, result.testsSha256);
      assert.ok(Date.now() - Date.parse(proof.finishedAt) < 3600000);
      assert.equal(result.before[0].moderators_table, null);
      result.historyBefore = await api(`${prefix}/database/migrations`);
      assert.ok(!result.historyBefore.some(x => x.name === 'shiok_report_moderation'));
      result.applyAttempted = true;
      await api(`${prefix}/database/migrations`, { name: 'shiok_report_moderation', query: migration });
      result.historyAfter = await api(`${prefix}/database/migrations`);
      assert.equal(result.historyAfter.length, result.historyBefore.length + 1);
      result.remoteVersion = result.historyAfter.find(x => x.name === 'shiok_report_moderation').version;
    } else {
      assert.equal(result.before[0].moderators_table === null, mode === 'test');
      result.checks = await query(`begin; set local statement_timeout='25s'; ${mode === 'test' ? migration : ''}
        ${tests} select * from moderation_checks order by name; rollback;`, false);
      assert.ok(result.checks.length >= 20 && result.checks.every(x => x.passed === true));
    }
    result.after = await query(stateSQL);
    const { moderators_table: a, ...before } = result.before[0];
    const { moderators_table: b, ...after } = result.after[0];
    assert.deepEqual(after, before);
    if (mode !== 'apply') assert.equal(a, b);
    result.productionUnchanged = true;
    if (mode !== 'test') {
      result.advisors = await api(`${prefix}/advisors/security`);
      assert.ok(!(result.advisors.lints ?? []).some(x => ['WARN', 'ERROR'].includes(x.level)));
    }
  }
  result.passed = true;
} catch (error) { result.error = String(error.message).split(token).join('[withheld]'); process.exitCode = 1; }
result.finishedAt = new Date().toISOString();
writeFileSync(resolve(out, 'summary.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ out, ...result }, null, 2));
