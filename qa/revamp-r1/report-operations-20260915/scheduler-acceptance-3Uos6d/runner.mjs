import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';assert.equal(process.cwd(),root);
const target=JSON.parse(readFileSync(resolve(root,'web/lib/report-project.json'),'utf8'));
assert.equal(target.projectRef,'ztjilsfgoephcdcsgcks');
const token=process.env.SHIOK_SUPABASE_ACCESS_TOKEN;assert.ok(token);
const out=mkdtempSync(resolve(root,'qa/revamp-r1/report-operations-20260915/scheduler-acceptance-'));
const qa=`shiok_cron_qa_${randomBytes(6).toString('hex')}`;
const hash=x=>createHash('sha256').update(x).digest('hex');
const q=x=>`'${x.replaceAll("'","''")}'`;
const result={target,qa,startedAt:new Date().toISOString(),requests:[],cases:[],passed:false};
writeFileSync(resolve(out,'runner.mjs'),readFileSync(new URL(import.meta.url)),{flag:'wx'});
const prefix=`projects/${target.projectRef}`;
const jobs=[];let schemaOid;
async function api(path,data){
  assert.ok([prefix,`organizations/${target.organizationId}`,`${prefix}/database/query`,`${prefix}/advisors/security`].includes(path));
  const response=await fetch(`https://api.supabase.com/v1/${path}`,{method:data?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(25000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
  const raw=await response.text();result.requests.push({path,status:response.status,...(data?{querySha256:hash(data.query)}:{})});
  if(!response.ok){result.errorResponse=raw.split(token).join('[withheld]').slice(0,2000);throw Error(`HTTP${response.status}; no retry`);}
  return JSON.parse(raw);
}
const query=(sql,readOnly=false)=>api(`${prefix}/database/query`,{query:sql,read_only:readOnly});
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
async function baseline(){
  const [row]=await query(`select (select count(*) from shiok_reports.reports) reports,
    (select count(*) from shiok_reports.daily_usage) usage,(select to_jsonb(c) from shiok_reports.control c) control,
    (select jsonb_agg(to_jsonb(j) order by jobid) from cron.job j where jobname not like 'shiok_cron_qa_%') jobs,
    (select encode(sha256(convert_to(prosrc,'UTF8')),'hex') from pg_proc where oid='shiok_reports.cleanup_expired_v1()'::regprocedure) cleanup_source,
    current_setting('cron.timezone') timezone,current_setting('cron.use_background_workers') background_workers;`,true);
  assert.equal(Number(row.reports),0);assert.equal(Number(row.usage),0);assert.equal(row.control.enabled,false);
  assert.equal(row.cleanup_source,'479bd801c44140d1d51f2d03dd7418d372eedd2892501654c6144a7488c27418');
  assert.equal(row.timezone,'GMT');assert.equal(row.background_workers,'off');
  assert.equal(row.jobs.length,1);assert.equal(row.jobs[0].jobname,'shiok-report-cleanup-v1');assert.equal(row.jobs[0].active,false);
  return row;
}
async function snapshot(){return (await query(`select (select jsonb_agg(to_jsonb(r) order by request_id) from ${qa}.reports r) reports,
  (select jsonb_agg(to_jsonb(u) order by day,bucket) from ${qa}.daily_usage u) usage,
  (select to_jsonb(c) from ${qa}.control c) control,
  (select jsonb_agg(to_jsonb(o) order by id) from ${qa}.observations o) observations;`,true))[0];}
async function seed(){
  const content=JSON.stringify({schema_version:1,report_type:'mapping_error',geometry:{type:'Point',coordinates:[103.85,1.35]},referenced_bundle_version:'qa-synthetic-bundle'});
  await query(`begin; delete from ${qa}.reports; delete from ${qa}.daily_usage; delete from ${qa}.observations;
    update ${qa}.control set request_floor_ms=0,cleanup_failed_at=null,cleanup_verified_at=null;
    with times as (select date_trunc('milliseconds',clock_timestamp())-interval '721 hours' received_at
      union all select date_trunc('milliseconds',clock_timestamp())-interval '1 hour'),
    stamps as (select received_at,lpad(to_hex(floor(extract(epoch from received_at)*1000)::bigint),12,'0') h from times)
    insert into ${qa}.reports(request_id,retry_proof_sha256,canonical_content,content_sha256,report_type,received_at,expires_at)
    select (substr(h,1,8)||'-'||substr(h,9,4)||'-7123-8123-123456789abc')::uuid,${q('a'.repeat(64))},${q(content)},
      encode(sha256(convert_to(${q(content)},'UTF8')),'hex'),'mapping_error',received_at,received_at+interval '720 hours' from stamps;
    insert into ${qa}.daily_usage(day,bucket,admitted) values
      ((clock_timestamp() at time zone 'UTC')::date-2,'global',1),((clock_timestamp() at time zone 'UTC')::date,'global',1); commit;`);
}
async function removeJob(job){
  const [identity]=await query(`select jobid,jobname,command,username from cron.job where jobid=${job.id};`,true);
  if(!identity){job.removed=true;return;}
  assert.equal(identity.jobname,job.name);assert.equal(identity.command,job.command);assert.equal(identity.username,'postgres');
  const [answer]=await query(`select cron.unschedule(${job.id}) removed;`);assert.equal(answer.removed,true);
  job.removed=true;
}
async function scheduled(name,timeout){
  const before=await snapshot();
  const jobName=`${qa}_${name}`;
  const command=`SET statement_timeout = '${timeout}'; INSERT INTO ${qa}.observations(who,timeout,result) SELECT current_user,current_setting('statement_timeout'),${qa}.cleanup_expired_v1();`;
  const [absent]=await query(`select not exists(select 1 from cron.job where jobname=${q(jobName)}) absent;`,true);assert.equal(absent.absent,true);
  const [created]=await query(`select cron.schedule(${q(jobName)},'10 seconds',${q(command)}) id;`);
  const job={id:created.id,name:jobName,command,removed:false};jobs.push(job);
  let runs=[];
  try{
    for(let attempt=0;attempt<14;attempt++){
      await sleep(2000);
      runs=await query(`select jobid,runid,job_pid,database,username,status,return_message,start_time,end_time from cron.job_run_details where jobid=${job.id} order by runid;`,true);
      if(runs.some(r=>r.end_time))break;
    }
    await removeJob(job);
    assert.equal(runs.length,1,'Exactly one bounded QA cron run expected');
    assert.ok(runs[0].end_time,'Scheduler execution not observed before gate');assert.equal(runs[0].username,'postgres');
    const after=await snapshot();
    const c={name,before,job:{...job},runs,after,passed:false};result.cases.push(c);
    if(name==='normal'){
      assert.equal(runs[0].status,'succeeded');assert.equal(after.reports.length,1);assert.equal(after.usage.length,1);
      assert.equal(after.observations.length,1);assert.equal(after.observations[0].who,'postgres');assert.equal(after.observations[0].timeout,'30s');
      assert.equal(after.observations[0].result.ok,true);assert.equal(after.observations[0].result.reports_deleted,1);assert.equal(after.observations[0].result.usage_deleted,1);
      assert.ok(after.control.cleanup_verified_at);assert.equal(after.control.cleanup_failed_at,null);
      assert.equal(after.reports[0].request_id,before.reports.find(r=>r.expires_at>after.control.cleanup_verified_at).request_id);
    }else if(name==='ordinary_failure'){
      assert.equal(runs[0].status,'succeeded');assert.equal(after.observations[0].result.ok,false);
      assert.ok(after.control.cleanup_failed_at);assert.equal(after.control.cleanup_verified_at,null);assert.equal(after.control.request_floor_ms,0);
      assert.deepEqual(after.reports,before.reports);assert.deepEqual(after.usage,before.usage);
    }else{
      assert.equal(runs[0].status,'failed');assert.match(runs[0].return_message,/statement timeout/);
      assert.deepEqual(after,before,'Actual scheduled cancellation must roll back all row/health writes');
    }
    c.passed=true;
  }finally{if(!job.removed)await removeJob(job);}
}
try{
  const identity=await api(prefix);
  for(const [key,value] of Object.entries({id:target.projectRef,name:target.projectName,organization_id:target.organizationId,region:target.region,status:'ACTIVE_HEALTHY'}))assert.equal(identity[key],value);
  assert.equal((await api(`organizations/${target.organizationId}`)).plan,'free');
  result.before=await baseline();
  const [absent]=await query(`select to_regnamespace('${qa}') is null absent;`,true);assert.equal(absent.absent,true);
  const sources=['20260914161526_shiok_private_reports_v1.sql','20260915000630_shiok_report_retention_30_days.sql','20260915010921_shiok_report_cleanup.sql'];
  result.sources=[];const transformed=[];
  for(const name of sources){
    const source=readFileSync(resolve(root,'supabase/migrations',name),'utf8');
    const changed=source.replaceAll('public.shiok_report_submit_',`${qa}.shiok_report_submit_`).replaceAll('shiok_reports',qa);
    assert.equal(changed.replaceAll(qa,'shiok_reports').replaceAll('shiok_reports.shiok_report_submit_','public.shiok_report_submit_'),source);
    result.sources.push({name,sha256:hash(source),transformedSha256:hash(changed)});transformed.push(changed);
  }
  await query(`begin; ${transformed.join('\n')}
    create table ${qa}.observations(id bigint generated always as identity primary key,who text,timeout text,result jsonb);
    alter table ${qa}.observations enable row level security;
    revoke all on ${qa}.observations from public,anon,authenticated,service_role; commit;`);
  const [identityRow]=await query(`select oid from pg_namespace where nspname='${qa}';`,true);schemaOid=identityRow.oid;result.schemaOid=schemaOid;
  const [body]=await query(`select prosrc,prosecdef,proacl::text acl from pg_proc where oid='${qa}.cleanup_expired_v1()'::regprocedure;`,true);
  assert.equal(hash(body.prosrc.replaceAll(qa,'shiok_reports')),result.before.cleanup_source);assert.equal(body.prosecdef,false);
  result.cleanupBinding={normalizedHash:result.before.cleanup_source,acl:body.acl};
  await seed();await scheduled('normal','30s');
  await seed();
  await query(`create function ${qa}.fail_delete() returns trigger language plpgsql set search_path='' as $$begin raise exception 'synthetic_cleanup_failure'; end;$$;
    revoke all on function ${qa}.fail_delete() from public,anon,authenticated,service_role;
    create trigger fail_delete before delete on ${qa}.daily_usage for each row execute function ${qa}.fail_delete();`);
  await scheduled('ordinary_failure','30s');
  await query(`drop trigger fail_delete on ${qa}.daily_usage;`);
  await seed();
  await query(`create function ${qa}.delay_delete() returns trigger language plpgsql set search_path='' as $$begin perform pg_sleep(2); return old; end;$$;
    revoke all on function ${qa}.delay_delete() from public,anon,authenticated,service_role;
    create trigger delay_delete before delete on ${qa}.daily_usage for each row execute function ${qa}.delay_delete();`);
  await scheduled('statement_timeout','200ms');
  result.passed=true;
}catch(error){result.error=String(error.message).split(token).join('[withheld]');process.exitCode=1;}
finally{
  try{
    for(const job of jobs)if(!job.removed)await removeJob(job);
    if(schemaOid){
      const [safe]=await query(`select (select oid from pg_namespace where nspname='${qa}') oid,
        (select count(*) from cron.job where jobname like '${qa}%') jobs,
        (select count(*) from cron.job_run_details where jobid in (${jobs.map(j=>j.id).join(',')||'0'}) and end_time is null) active;`,true);
      assert.equal(safe.oid,schemaOid);assert.equal(Number(safe.jobs),0);assert.equal(Number(safe.active),0);
      await query(`drop schema ${qa} cascade;`);
      const [gone]=await query(`select to_regnamespace('${qa}') is null removed;`,true);assert.equal(gone.removed,true);result.qaSchemaRemoved=true;
    }
    result.after=await baseline();assert.deepEqual(result.after,result.before);result.productionUnchanged=true;
    result.advisors=await api(`${prefix}/advisors/security`);assert.ok(!(result.advisors.lints??[]).some(l=>['WARN','ERROR'].includes(l.level)));
  }catch(error){result.cleanupError=String(error.message).split(token).join('[withheld]');result.passed=false;process.exitCode=1;}
}
result.jobs=jobs;result.finishedAt=new Date().toISOString();
writeFileSync(resolve(out,'summary.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,passed:result.passed,cases:result.cases.map(c=>({name:c.name,passed:c.passed})),qaSchemaRemoved:result.qaSchemaRemoved,productionUnchanged:result.productionUnchanged,error:result.error,cleanupError:result.cleanupError},null,2));
