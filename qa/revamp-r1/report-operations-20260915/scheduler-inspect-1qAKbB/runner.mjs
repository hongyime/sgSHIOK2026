import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';
assert.equal(process.cwd(),root);
const target=JSON.parse(readFileSync(resolve(root,'web/lib/report-project.json'),'utf8'));
assert.equal(target.projectRef,'ztjilsfgoephcdcsgcks');
const token=process.env.SHIOK_SUPABASE_ACCESS_TOKEN;
assert.ok(token,'Explicit session credential required');
const mode=process.argv[2];assert.equal(mode,'inspect');
const out=mkdtempSync(resolve(root,'qa/revamp-r1/report-operations-20260915',`scheduler-${mode}-`));
const hash=v=>createHash('sha256').update(v).digest('hex');
const result={mode,startedAt:new Date().toISOString(),target,requests:[],passed:false};
writeFileSync(resolve(out,'runner.mjs'),readFileSync(new URL(import.meta.url)),{flag:'wx'});
const prefix=`projects/${target.projectRef}`;
async function api(path,data){
  assert.ok([prefix,`organizations/${target.organizationId}`,`${prefix}/database/query`,`${prefix}/advisors/security`].includes(path));
  const response=await fetch(`https://api.supabase.com/v1/${path}`,{method:data?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(25000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
  const raw=await response.text();
  result.requests.push({path,status:response.status,...(data?{querySha256:hash(data.query)}:{})});
  if(!response.ok){result.errorResponse=raw.split(token).join('[withheld]').slice(0,2000);throw Error(`HTTP ${response.status}; no retry`);}
  return JSON.parse(raw);
}
const query=sql=>api(`${prefix}/database/query`,{query:sql,read_only:true});
try{
  const project=await api(prefix);
  for(const [key,value] of Object.entries({id:target.projectRef,name:target.projectName,organization_id:target.organizationId,region:target.region,status:'ACTIVE_HEALTHY'}))assert.equal(project[key],value);
  assert.equal((await api(`organizations/${target.organizationId}`)).plan,'free');
  result.state=await query(`select current_user,current_database(),current_setting('server_version') version,
    current_setting('cron.timezone',true) cron_timezone,current_setting('cron.use_background_workers',true) cron_background_workers,
    current_setting('cron.database_name',true) cron_database,current_setting('cron.log_run',true) cron_log_run,
    (select jsonb_agg(to_jsonb(e)) from pg_available_extensions e where name='pg_cron') cron_extension,
    to_regclass('cron.job') cron_job,(select count(*) from shiok_reports.reports) reports,
    (select count(*) from shiok_reports.daily_usage) usage,(select to_jsonb(c) from shiok_reports.control c) control;`);
  assert.equal(Number(result.state[0].reports),0);assert.equal(Number(result.state[0].usage),0);assert.equal(result.state[0].control.enabled,false);
  result.advisors=await api(`${prefix}/advisors/security`);
  assert.ok(!(result.advisors.lints??[]).some(l=>['WARN','ERROR'].includes(l.level)));
  result.passed=true;
}catch(error){result.error=String(error.message).split(token).join('[withheld]');process.exitCode=1;}
result.finishedAt=new Date().toISOString();
writeFileSync(resolve(out,'summary.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,...result},null,2));
