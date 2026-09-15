import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';
assert.equal(process.cwd(),root);
const target=JSON.parse(readFileSync(resolve(root,'web/lib/report-project.json'),'utf8'));
assert.equal(target.projectRef,'ztjilsfgoephcdcsgcks');
const token=process.env.SHIOK_SUPABASE_ACCESS_TOKEN;
assert.ok(token,'Explicit session credential required');
const mode=process.argv[2];assert.ok(['inspect','test-migration','apply','activate'].includes(mode));
const out=mkdtempSync(resolve(root,'qa/revamp-r1/report-operations-20260915',`scheduler-${mode}-`));
const hash=v=>createHash('sha256').update(v).digest('hex');
const result={mode,startedAt:new Date().toISOString(),target,requests:[],passed:false};
writeFileSync(resolve(out,'runner.mjs'),readFileSync(new URL(import.meta.url)),{flag:'wx'});
const prefix=`projects/${target.projectRef}`;
async function api(path,data){
  assert.ok([prefix,`organizations/${target.organizationId}`,`${prefix}/database/query`,`${prefix}/database/migrations`,`${prefix}/advisors/security`].includes(path));
  const response=await fetch(`https://api.supabase.com/v1/${path}`,{method:data?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(25000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
  const raw=await response.text();
  result.requests.push({path,status:response.status,...(data?{querySha256:hash(data.query)}:{})});
  if(!response.ok){result.errorResponse=raw.split(token).join('[withheld]').slice(0,2000);throw Error(`HTTP ${response.status}; no retry`);}
  return JSON.parse(raw);
}
const query=(sql,readOnly=true)=>api(`${prefix}/database/query`,{query:sql,read_only:readOnly});
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
  if(mode==='inspect'&&result.state[0].cron_job){
    result.jobInspection=await query(`begin read only; select current_user,
      has_table_privilege(current_user,'cron.job','UPDATE') can_direct_update,
      (select jsonb_agg(to_jsonb(j) order by jobid) from cron.job j) jobs,
      (select jsonb_agg(jsonb_build_object('name',p.proname,'definer',p.prosecdef,'owner',pg_get_userbyid(p.proowner),'acl',p.proacl::text))
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='cron' and p.proname='alter_job') alter_job;
      rollback;`,false);
  }
  if(mode==='activate'){
    const proofName=process.argv[3];assert.match(proofName??'',/^scheduler-acceptance-[A-Za-z0-9]{6}$/);
    const proof=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/report-operations-20260915',proofName,'summary.json'),'utf8'));
    assert.equal(proof.passed,true);assert.equal(proof.qaSchemaRemoved,true);assert.equal(proof.productionUnchanged,true);
    assert.deepEqual(proof.cases.map(c=>[c.name,c.passed]),[['normal',true],['ordinary_failure',true],['statement_timeout',true]]);
    assert.ok(proof.jobs.every(j=>j.removed));
    assert.ok(Date.now()-Date.parse(proof.finishedAt)>=0&&Date.now()-Date.parse(proof.finishedAt)<3600000);
    result.schedulerProof=proofName;
    result.activation=await query(`begin isolation level serializable; set local statement_timeout='30s';
    do $$ declare result jsonb; j cron.job%rowtype; begin
      select * into j from cron.job where jobname='shiok-report-cleanup-v1';
      if not found or j.jobid<>1 or j.nodename<>'localhost' or j.nodeport<>5432
        or j.active or j.username<>'postgres' or j.database<>current_database()
        or j.schedule<>'17 17 * * *' or j.command<>'SET statement_timeout = ''30s''; SELECT shiok_reports.cleanup_expired_v1();'
        or current_setting('cron.timezone')<>'GMT' or current_setting('cron.use_background_workers')<>'off'
        or not exists(select 1 from pg_proc where oid='shiok_reports.cleanup_expired_v1()'::regprocedure and
          encode(sha256(convert_to(prosrc,'UTF8')),'hex')='479bd801c44140d1d51f2d03dd7418d372eedd2892501654c6144a7488c27418')
        or exists(select 1 from shiok_reports.reports) or exists(select 1 from shiok_reports.daily_usage)
        or exists(select 1 from shiok_reports.control where enabled or policy_approved_at is not null) then
        raise exception 'Activation precondition changed; stop';
      end if;
      result:=shiok_reports.cleanup_expired_v1();
      if result->>'ok'='true' then perform cron.alter_job(j.jobid,active:=true); end if;
    end; $$;
    select jobid,jobname,schedule,command,username,active,(select to_jsonb(c) from shiok_reports.control c) control
    from cron.job where jobname='shiok-report-cleanup-v1'; commit;`,false);
    assert.equal(result.activation.length,1);assert.equal(result.activation[0].active,true);
    assert.equal(result.activation[0].control.enabled,false);assert.equal(result.activation[0].control.policy_approved_at,null);
    assert.equal(result.activation[0].control.cleanup_failed_at,null);assert.ok(result.activation[0].control.cleanup_verified_at);
    result.firstNaturalRunObserved=false;
  }else if(mode!=='inspect'){
    assert.equal(result.state[0].cron_job,null);
    const names=readdirSync(resolve(root,'supabase/migrations')).filter(n=>n.endsWith('_shiok_report_daily_cleanup.sql'));
    assert.equal(names.length,1);
    const source=readFileSync(resolve(root,'supabase/migrations',names[0]),'utf8');
    result.migration={file:names[0],sha256:hash(source)};
    writeFileSync(resolve(out,'migration.sql'),source,{flag:'wx'});
    const jobRead=`select jobid,jobname,schedule,command,database,username,active from cron.job where jobname='shiok-report-cleanup-v1';`;
    if(mode==='test-migration'){
      result.rollbackReadback=await query(`begin; ${source} ${jobRead} rollback;`,false);
      assert.equal(result.rollbackReadback.length,1);
      assert.equal(result.rollbackReadback[0].username,'postgres');
      assert.equal(result.rollbackReadback[0].active,false);
      const [absent]=await query("select to_regclass('cron.job') is null absent;");assert.equal(absent.absent,true);
      result.rollbackVerified=true;
    }else{
      const proofName=process.argv[3];assert.match(proofName??'',/^scheduler-test-migration-[A-Za-z0-9]{6}$/);
      const proof=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/report-operations-20260915',proofName,'summary.json'),'utf8'));
      assert.equal(proof.passed,true);assert.equal(proof.rollbackVerified,true);assert.equal(proof.migration.sha256,result.migration.sha256);
      assert.ok(Date.now()-Date.parse(proof.finishedAt)>=0&&Date.now()-Date.parse(proof.finishedAt)<3600000);
      result.historyBefore=await api(`${prefix}/database/migrations`);
      assert.equal(result.historyBefore.length,4);
      result.applyAttempted=true;
      await api(`${prefix}/database/migrations`,{name:'shiok_report_daily_cleanup',query:source});
      result.historyAfter=await api(`${prefix}/database/migrations`);
      assert.equal(result.historyAfter.length,5);
      result.remoteVersion=result.historyAfter.find(r=>r.name==='shiok_report_daily_cleanup').version;
      result.job=await query(jobRead);assert.equal(result.job.length,1);assert.equal(result.job[0].active,false);
      result.installed=await query("select extname,extversion from pg_extension where extname='pg_cron';");
    }
  }
  result.advisors=await api(`${prefix}/advisors/security`);
  assert.ok(!(result.advisors.lints??[]).some(l=>['WARN','ERROR'].includes(l.level)));
  result.passed=true;
}catch(error){result.error=String(error.message).split(token).join('[withheld]');process.exitCode=1;}
result.finishedAt=new Date().toISOString();
writeFileSync(resolve(out,'summary.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,...result},null,2));
