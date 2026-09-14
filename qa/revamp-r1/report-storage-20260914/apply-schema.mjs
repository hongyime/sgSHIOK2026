import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026'; assert.equal(process.cwd(),root);
assert.equal(process.argv[2], '--apply-disabled-reviewed-schema');
const proof=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/report-storage-20260914/database-uKSa8t/summary.json'),'utf8'));
assert.equal(proof.testsPassed,true); assert.equal(proof.testReply.length,14);
// This was renamed, byte-identically, to the server-assigned migration version.
const sql=readFileSync(resolve(root,'supabase/migrations/20260914085103_shiok_private_reports_v1.sql'),'utf8');
assert.equal(createHash('sha256').update(sql).digest('hex'),proof.migrationSha256);
const token=process.env.SUPABASE_ACCESS_TOKEN; assert.ok(token);
const project=proof.project, org=proof.organization;
const out=mkdtempSync(resolve(root,'qa/revamp-r1/report-storage-20260914/apply-'));
const result={project,proof:'database-uKSa8t',migrationSha256:proof.migrationSha256,requests:[],applied:false,verified:false};
async function api(path,body){
  const response=await fetch(`https://api.supabase.com/v1/${path}`,{method:body?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(25000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  result.requests.push({path,status:response.status});
  if(!response.ok){void response.body?.cancel();throw new Error(`HTTP ${response.status}; do not retry migration blindly`);}
  return response.json();
}
try {
  assert.equal((await api(`organizations/${org}`)).plan,'free');
  const target=await api(`projects/${project}`);
  assert.equal(target.name,'sgbuslaobu');assert.equal(target.organization_id,org);assert.equal(target.status,'ACTIVE_HEALTHY');
  const absent=await api(`projects/${project}/database/query`,{read_only:true,query:"select (select count(*) from pg_namespace where nspname='shiok_reports') as schemas, (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'shiok_report%') as functions;"});
  assert.equal(Number(absent[0].schemas),0);assert.equal(Number(absent[0].functions),0);
  const before=await api(`projects/${project}/database/migrations`);
  assert.ok(Array.isArray(before));
  assert.ok(!before.some(row=>row.name==='shiok_private_reports_v1'));
  result.priorMigrationCount=before.length;
  result.applyReply=await api(`projects/${project}/database/migrations`,{name:'shiok_private_reports_v1',query:sql});
  result.applied=true;
  const after=await api(`projects/${project}/database/migrations`);
  const added=after.filter(row=>!before.some(old=>old.version===row.version));
  assert.equal(added.length,1);assert.equal(added[0].name,'shiok_private_reports_v1');
  assert.deepEqual(after.filter(row=>before.some(old=>old.version===row.version)),before);
  assert.match(added[0].version,/^[0-9]{14}$/);
  result.remoteVersion=added[0].version;
  result.localPathRequired=`supabase/migrations/${added[0].version}_shiok_private_reports_v1.sql`;
  result.storage=await api(`projects/${project}/database/query`,{read_only:true,query:"select enabled, policy_approved_at, cleanup_verified_at, allowed_bundles, (select count(*) from shiok_reports.reports) as reports, (select count(*) from shiok_reports.daily_usage) as quota_rows from shiok_reports.control;"});
  assert.equal(result.storage[0].enabled,false);assert.equal(result.storage[0].policy_approved_at,null);assert.equal(result.storage[0].cleanup_verified_at,null);
  assert.equal(Number(result.storage[0].reports),0);assert.equal(Number(result.storage[0].quota_rows),0);
  result.verified=true;
}catch(error){result.error=error.message?.includes(token)?'redacted error':error.message;process.exitCode=1;}
writeFileSync(resolve(out,'summary.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,...result},null,2));
