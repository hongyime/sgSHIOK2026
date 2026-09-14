// Historical wrong-project experiment: retained, but must never execute again.
throw new Error('RETIRED: sgbuslaobu is not a SHIOK project. No access permitted.');
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const token=process.env.SUPABASE_ACCESS_TOKEN;assert.ok(token);
const proof=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/report-storage-20260914/database-uKSa8t/summary.json'),'utf8'));
const out=mkdtempSync(resolve(root,'qa/revamp-r1/report-storage-20260914/inspection-'));
const result={project:proof.project,mode:'read-only catalog/anchors',checks:[],passed:false};
async function api(suffix,body){
  const response=await fetch(`https://api.supabase.com/v1/projects/${proof.project}/${suffix}`,{method:body?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(20000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok){void response.body?.cancel();throw new Error(`HTTP ${response.status} reading ${suffix}`);}
  return response.json();
}
try {
  const snapshot=await api('database/query',{read_only:true,query:`select
    (select jsonb_agg(jsonb_build_object('table',c.relname,'rls',c.relrowsecurity,'columns',
      (select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod)) order by a.attnum) from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
      'constraints',(select jsonb_agg(pg_get_constraintdef(x.oid) order by x.conname) from pg_constraint x where x.conrelid=c.oid)) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='transit' and c.relkind='r') as transit_definitions,
    (select jsonb_agg(jsonb_build_object('table',c.relname,'rls',c.relrowsecurity,'anon_read',has_table_privilege('anon',c.oid,'SELECT'),'authenticated_read',has_table_privilege('authenticated',c.oid,'SELECT')) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='shiok_reports' and c.relkind='r') as report_tables,
    (select jsonb_build_object('security_definer',prosecdef,'anon_execute',has_function_privilege('anon',oid,'EXECUTE'),'authenticated_execute',has_function_privilege('authenticated',oid,'EXECUTE'),'service_execute',has_function_privilege('service_role',oid,'EXECUTE')) from pg_proc where oid='public.shiok_report_submit_v1(uuid,text,text,text)'::regprocedure) as rpc,
    (select enabled from shiok_reports.control) as intake_enabled,
    (select count(*) from shiok_reports.reports) as report_count,
    (select count(*) from shiok_reports.daily_usage) as quota_rows;`});
  assert.deepEqual(snapshot[0].transit_definitions,proof.before[0].transit_definitions);
  result.checks.push('five existing transit table definitions unchanged');
  assert.equal(snapshot[0].report_tables.length,3);
  assert.ok(snapshot[0].report_tables.every(t=>t.rls&&!t.anon_read&&!t.authenticated_read));
  assert.deepEqual(snapshot[0].rpc,{security_definer:false,anon_execute:false,authenticated_execute:false,service_execute:true});
  assert.equal(snapshot[0].intake_enabled,false);assert.equal(Number(snapshot[0].report_count),0);assert.equal(Number(snapshot[0].quota_rows),0);
  result.database=snapshot[0];
  const rest=await api('postgrest');result.exposedSchemas=rest.db_schema;assert.equal(rest.db_schema,proof.exposedSchemas);
  const advisors=await api('advisors/security');
  result.reportAdvisories=(advisors.lints??[]).filter(l=>l.metadata?.schema==='shiok_reports'||String(l.metadata?.name??'').startsWith('shiok_report'));
  result.otherAdvisoryCounts=(advisors.lints??[]).filter(l=>!result.reportAdvisories.includes(l)).reduce((a,l)=>{a[l.level]=(a[l.level]??0)+1;return a;},{});
  assert.ok(!result.reportAdvisories.some(l=>l.level==='ERROR'||l.level==='WARN'));
  const sha=b=>createHash('sha256').update(b).digest('hex');
  const evidence=readFileSync(resolve(root,'qa/verification/REVAMP-R1-core-walk.md'));
  result.evidencePrefix={bytes:445529,sha256:sha(evidence.subarray(0,445529))};
  assert.equal(result.evidencePrefix.sha256,'9faf8079f99beb2e938a2f2a7ffe907d1cf1fc49714e68679b6e296e4c55cb41');
  result.migrationSha256=sha(readFileSync(resolve(root,'supabase/migrations/20260914085103_shiok_private_reports_v1.sql')));
  assert.equal(result.migrationSha256,proof.migrationSha256);
  result.weightsSha256=sha(readFileSync(resolve(root,'pipeline/config/weights.yaml')));
  assert.equal(result.weightsSha256,'5c62ac5f62e91f777a82f0dfa98eafba11ef47500c9f7822a81a31eae7d2cbec');
  const anchors=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/weekly-metadata-20260914/summary.public.json'),'utf8')).anchors;
  result.priorAnchorShape=Object.keys(anchors[0]);
  result.passed=true;
}catch(error){result.error=error.message?.includes(token)?'redacted error':error.message;process.exitCode=1;}
writeFileSync(resolve(out,'summary.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,...result},null,2));
