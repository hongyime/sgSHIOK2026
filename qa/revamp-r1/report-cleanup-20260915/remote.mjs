import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = 'C:\\sgSHIOK2026';
assert.equal(process.cwd(), root);
const target = JSON.parse(readFileSync(resolve(root, 'web/lib/report-project.json'), 'utf8'));
assert.equal(target.projectRef, 'ztjilsfgoephcdcsgcks');
assert.equal(target.projectUrl, 'https://ztjilsfgoephcdcsgcks.supabase.co');
const token = process.env.SHIOK_SUPABASE_ACCESS_TOKEN;
assert.ok(token, 'Explicit SHIOK session credential required');
const mode = process.argv[2];
assert.ok(['inspect','test','apply','verify','inspect-advisor','probe-advisor','acl-test','acl-apply','acl-verify'].includes(mode));
const isAcl=mode.startsWith('acl-');
const operation=isAcl?mode.slice(4):mode;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const migrationName = readdirSync(resolve(root,'supabase/migrations')).filter(name => name.endsWith(isAcl?'_restrict_rls_event_trigger.sql':'_shiok_report_cleanup.sql'));
assert.equal(migrationName.length,1);
const sql = readFileSync(resolve(root,'supabase/migrations',migrationName[0]),'utf8');
const tests = readFileSync(resolve(root,isAcl?'supabase/tests/rls_event_trigger_acl.sql':'supabase/tests/report_cleanup.sql'),'utf8');
const out = mkdtempSync(resolve(root, 'qa/revamp-r1/report-cleanup-20260915/remote-'));
const result = { mode, target, requests: [], passed: false, migration: { file: migrationName[0], sha256:digest(sql), testsSha256:digest(tests) } };
const prefix = `projects/${target.projectRef}`;
const allowed = new Set([prefix, `organizations/${target.organizationId}`, `${prefix}/database/query`, `${prefix}/database/migrations`,`${prefix}/advisors/security`]);
async function api(path, data, expectedEventTriggerDenial=false) {
  assert.ok(allowed.has(path));
  const response = await fetch(`https://api.supabase.com/v1/${path}`, {
    method: data ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(25000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  result.requests.push({ path, method: data ? 'POST' : 'GET', status: response.status });
  if (!response.ok) {
    const detail = (await response.text()).split(token).join('[withheld]').slice(0,4096);
    if(expectedEventTriggerDenial && response.status===400 && detail.includes('0A000') && detail.includes('event trigger functions can only be called as event triggers')) return {denied:true,status:response.status,detail};
    result.failureResponse = detail;
    throw new Error(`Management HTTP${response.status}; no retry`);
  }
  return response.json();
}
async function state() {
  const [row] = await api(`${prefix}/database/query`, { read_only: true, query: `select
    (select count(*) from shiok_reports.reports) reports,
    (select count(*) from shiok_reports.daily_usage) usage,
    (select jsonb_agg(to_jsonb(c)) from shiok_reports.control c) control,
    (select encode(sha256(convert_to(prosrc,'UTF8')),'hex') from pg_proc where oid='public.shiok_report_submit_v1(uuid,text,text,text)'::regprocedure) rpc_sha256,
    current_setting('server_version') server_version,
    to_regclass('public.shiok_rls_qa_20260915') is not null qa_table_present,
    (select jsonb_agg(jsonb_build_object('name',e.extname,'version',e.extversion,'schema',n.nspname)) from pg_extension e join pg_namespace n on n.oid=e.extnamespace where extname='pg_cron') cron_extension,
    (select jsonb_agg(jsonb_build_object('name',name,'default_version',default_version,'installed_version',installed_version)) from pg_available_extensions where name='pg_cron') available_cron;` });
  assert.equal(Number(row.reports), 0, 'Existing reports; stop');
  assert.equal(Number(row.usage), 0, 'Existing usage; stop');
  assert.equal(row.qa_table_present,false,'Unexpected pre-existing QA table; stop');
  assert.equal(row.control.length,1);
  assert.equal(row.control[0].enabled,false);
  assert.equal(row.rpc_sha256, '8f8520e8f91aee00283102d4bce005180047b85fcee2d315ee81a326225dde68', 'RPC hash mismatch; stop');
  return row;
}
async function readback() {
  const rows=await api(`${prefix}/database/query`,{read_only:true,query:`select n.nspname||'.'||p.proname name,
    encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') sha256,p.prosecdef,p.proconfig,
    has_function_privilege('service_role',p.oid,'execute') service_execute,
    has_function_privilege('anon',p.oid,'execute') anon_execute,
    has_function_privilege('authenticated',p.oid,'execute') authenticated_execute
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.oid in
    ('shiok_reports.request_time_ms(uuid)'::regprocedure,'public.shiok_report_submit_v2(uuid,text,text,text,date)'::regprocedure,'shiok_reports.cleanup_expired_v1()'::regprocedure)
    order by name;`});
  const expected=Object.fromEntries([...sql.matchAll(/create function (shiok_reports\.request_time_ms|public\.shiok_report_submit_v2|shiok_reports\.cleanup_expired_v1)\([^]*?as \$\$([^]*?)\$\$;/g)].map(match=>[match[1],digest(match[2])]));
  assert.equal(Object.keys(expected).length,3);assert.equal(rows.length,3);
  for(const row of rows){assert.equal(row.sha256,expected[row.name]);assert.equal(row.prosecdef,false);assert.equal(row.anon_execute,false);assert.equal(row.authenticated_execute,false);assert.equal(row.service_execute,row.name!=='shiok_reports.cleanup_expired_v1');}
  const [permissions]=await api(`${prefix}/database/query`,{read_only:true,query:`select
    has_function_privilege('service_role','public.shiok_report_submit_v1(uuid,text,text,text)','execute') old_rpc,
    has_table_privilege('service_role','shiok_reports.reports','delete') report_delete,
    has_column_privilege('service_role','shiok_reports.control','request_floor_ms','update') floor_update,
    has_column_privilege('service_role','shiok_reports.control','cleanup_verified_at','update') health_update,
    has_column_privilege('service_role','shiok_reports.control','cleanup_failed_at','update') failure_update,
    (select jsonb_agg(jsonb_build_object('name',conname,'validated',convalidated,'definition',pg_get_constraintdef(oid)) order by conname) from pg_constraint where conrelid='shiok_reports.reports'::regclass and conname in ('shiok_reports_expiry_30_days','shiok_reports_request_validity')) constraints;`});
  for(const name of ['old_rpc','report_delete','floor_update','health_update','failure_update'])assert.equal(permissions[name],false);
  assert.equal(permissions.constraints.length,2);assert.ok(permissions.constraints.every(row=>row.validated));
  return {functions:rows,permissions};
}
try {
  const identity = await api(prefix);
  assert.equal(identity.id, target.projectRef); assert.equal(identity.name, target.projectName);
  assert.equal(identity.organization_id, target.organizationId); assert.equal(identity.region, target.region);
  assert.equal(identity.status, 'ACTIVE_HEALTHY');
  assert.equal((await api(`organizations/${target.organizationId}`)).plan, 'free');
  result.state = await state();
  result.history = await api(`${prefix}/database/migrations`);
  if(!isAcl&&!['verify','inspect-advisor','probe-advisor'].includes(mode)) {
    assert.deepEqual(result.state.control, [{ singleton: true, enabled: false, policy_approved_at: null, cleanup_verified_at: null, allowed_bundles: [] }]);
    assert.deepEqual(result.history.map(item => item.version), ['20260914161526', '20260915000630']);
  }
  if(mode==='probe-advisor') {
    const inspected=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/report-cleanup-20260915/remote-lE6eqC/summary.json'),'utf8'));
    assert.equal(inspected.passed,true);
    const [current]=await api(`${prefix}/database/query`,{read_only:true,query:`select pg_get_function_result(oid) returns,prosrc,proconfig from pg_proc where oid='public.rls_auto_enable()'::regprocedure;`});
    assert.equal(current.returns,'event_trigger');assert.equal(current.prosrc,inspected.functionInspection[0].prosrc);assert.deepEqual(current.proconfig,['search_path=pg_catalog']);
    result.platformFunction={name:'public.rls_auto_enable()',returns:current.returns,sourceSha256:digest(current.prosrc),proconfig:current.proconfig};
    result.invocationProbes=[];
    for(const role of ['anon','authenticated']) {
      // Management read_only uses a restricted role that cannot SET ROLE. Select
      // the normal management connection but enforce READ ONLY in SQL itself.
      const denial=await api(`${prefix}/database/query`,{read_only:false,query:`begin read only; set local role ${role}; do $$ begin if current_user <> '${role}' then raise exception 'Unexpected probe role'; end if; perform public.rls_auto_enable(); end; $$; rollback;`},true);
      assert.equal(denial.denied,true);result.invocationProbes.push({role,...denial});
    }
    result.after=await state();assert.deepEqual(result.after,result.state);
  }
  if(mode==='inspect-advisor') {
    result.functionInspection=await api(`${prefix}/database/query`,{read_only:true,query:`select
      n.nspname,p.proname,pg_get_function_result(p.oid) returns,p.prosecdef,p.prosrc,p.proconfig,
      pg_get_userbyid(p.proowner) owner,p.proacl::text acl,
      (select jsonb_agg(jsonb_build_object('name',evtname,'event',evtevent,'enabled',evtenabled,'tags',evttags)) from pg_event_trigger where evtfoid=p.oid) event_triggers
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where p.oid='public.rls_auto_enable()'::regprocedure;`});
  }
  if(operation==='test'||operation==='verify') {
    result.checks = await api(`${prefix}/database/query`,{read_only:false,query:`begin; set local statement_timeout='15s';\n${operation==='test'?sql:''}\n${tests}\nrollback;`});
    const expected = [...tests.matchAll(isAcl?/insert into rls_acl_checks values\('([^']+)',true\)/g:/array_append\(checks,'([^']+)'\)/g)].map(match=>match[1]).sort();
    assert.deepEqual(result.checks.map(row=>row.name).sort(),expected);
    assert.ok(result.checks.every(row=>row.passed===true));
    result.after = await state();
    assert.deepEqual(result.after,result.state);
    assert.deepEqual(await api(`${prefix}/database/migrations`),result.history);
  }
  if(operation==='apply') {
    assert.match(process.argv[3]??'',/^remote-[A-Za-z0-9]{6}$/);
    const proof=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/report-cleanup-20260915',process.argv[3],'summary.json'),'utf8'));
    assert.equal(proof.mode,isAcl?'acl-test':'test'); assert.equal(proof.passed,true);
    assert.deepEqual(proof.migration,result.migration); assert.deepEqual(proof.target,target);
    assert.ok(Date.now()-Date.parse(proof.finishedAt)>=0 && Date.now()-Date.parse(proof.finishedAt)<3600000);
    result.applyAttempted=true;
    await api(`${prefix}/database/migrations`,{name:isAcl?'restrict_rls_event_trigger':'shiok_report_cleanup',query:sql});
    result.after=await state();
    result.historyAfter=await api(`${prefix}/database/migrations`);
    assert.equal(result.historyAfter.length,isAcl?4:3);
    result.remoteVersion=result.historyAfter.find(row=>row.name===(isAcl?'restrict_rls_event_trigger':'shiok_report_cleanup'))?.version;
    assert.match(result.remoteVersion??'',/^\d{14}$/);
  }
  if(operation==='verify') {
    assert.ok(result.history.length===3||result.history.length===4);
    if(result.history.length===4)assert.equal(result.history[3].name,'restrict_rls_event_trigger');
    assert.equal(result.history.filter(row=>row.name==='shiok_report_cleanup').length,1);
    result.advisors=await api(`${prefix}/advisors/security`);
    assert.ok(!(result.advisors.lints??[]).some(item=>['WARN','ERROR'].includes(item.level)));
  }
  if(!isAcl&&(operation==='apply'||operation==='verify'))result.readback=await readback();
  if(isAcl){
    assert.ok(result.history.length===3||result.history.length===4);
    result.helperReadback=await api(`${prefix}/database/query`,{read_only:true,query:`select pg_get_function_result(p.oid) returns,encode(sha256(convert_to(prosrc,'UTF8')),'hex') source_sha256,proconfig,prosecdef,pg_get_userbyid(proowner) owner,has_function_privilege('postgres',p.oid,'execute') owner_execute,has_function_privilege('service_role',p.oid,'execute') service_execute,has_function_privilege('anon',p.oid,'execute') anon_execute,has_function_privilege('authenticated',p.oid,'execute') authenticated_execute,(select jsonb_agg(jsonb_build_object('name',evtname,'event',evtevent,'enabled',evtenabled,'tags',evttags)) from pg_event_trigger where evtfoid=p.oid) event_triggers from pg_proc p where p.oid='public.rls_auto_enable()'::regprocedure;`});
    assert.equal(result.helperReadback[0].source_sha256,'2782e98b348aca7d6f6f73c420fd78d2e094957dd7a52b0483d4c34f29d2a7a1');
    const prior=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/report-cleanup-20260915/remote-lE6eqC/summary.json'),'utf8')).functionInspection[0];
    for(const key of ['returns','proconfig','prosecdef','owner','event_triggers'])assert.deepEqual(result.helperReadback[0][key],prior[key]);
    assert.equal(result.helperReadback[0].owner_execute,true);assert.equal(result.helperReadback[0].service_execute,true);
    if(operation==='apply'||operation==='verify'){assert.equal(result.helperReadback[0].anon_execute,false);assert.equal(result.helperReadback[0].authenticated_execute,false);}
  }
  result.passed = true;
} catch (error) {
  result.error = String(error.message).split(token).join('[withheld]').slice(0, 500);
  process.exitCode = 1;
}
result.finishedAt = new Date().toISOString();
writeFileSync(resolve(out, 'summary.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ out, ...result }, null, 2));
