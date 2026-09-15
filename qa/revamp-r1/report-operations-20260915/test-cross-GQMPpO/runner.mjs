import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root='C:\\sgSHIOK2026';
assert.equal(process.cwd(),root);
const target=JSON.parse(readFileSync(resolve(root,'web/lib/report-project.json'),'utf8'));
assert.equal(target.projectRef,'ztjilsfgoephcdcsgcks');
const token=process.env.SHIOK_SUPABASE_ACCESS_TOKEN;
assert.ok(token,'Explicit session management credential required');
const mode=process.argv[2];assert.ok(['pilot','read-pilot','rest-pilot','test-cross'].includes(mode));
const out=mkdtempSync(resolve(root,'qa/revamp-r1/report-operations-20260915',`${mode}-`));
const label=`shiok_qa_${randomBytes(6).toString('hex')}`;
const schema=label;
const result={mode,target,schema,startedAt:new Date().toISOString(),requests:[],cases:[],passed:false};
writeFileSync(resolve(out,'runner.mjs'),readFileSync(new URL(import.meta.url)),{flag:'wx'});
const hash=text=>createHash('sha256').update(text).digest('hex');
const pending=new Set();
let schemaOid;
let restKey;
let pilotFunctionCreated=false;
let callFunctionOid;
const secrets=[token];
const redact=value=>secrets.reduce((text,secret)=>text.split(secret).join('[withheld]'),String(value));
const apiBase=`https://api.supabase.com/v1/projects/${target.projectRef}`;
async function api(suffix,data){
  assert.ok(['','/database/query','/api-keys?reveal=true'].includes(suffix));
  const start=Date.now();
  const promise=fetch(apiBase+suffix,{method:data?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(25000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
  pending.add(promise);
  try{
    const response=await promise;
    const body=await response.text();
    const entry={method:data?'POST':'GET',suffix,status:response.status,elapsedMs:Date.now()-start,...(data?{querySha256:hash(data.query)}:{})};
    result.requests.push(entry);
    if(!response.ok){entry.error=redact(body).slice(0,2000);throw new Error(`Management HTTP${response.status}; no retry`);}
    return JSON.parse(body);
  }finally{pending.delete(promise);}
}
const query=(sql,readOnly=false)=>api('/database/query',{query:sql,read_only:readOnly});
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
async function loadRestKey(){
  const keys=await api('/api-keys?reveal=true');
  for(const key of keys)if(typeof key.api_key==='string')secrets.push(key.api_key);
  restKey=keys.find(key=>key.type==='secret'&&key.api_key?.startsWith('sb_secret_'))?.api_key;
  assert.ok(restKey,'Dedicated secret API key unavailable; do not substitute another project or create keys');
}
async function rest(fn,body){
  assert.ok(fn.startsWith(label)&&/^[a-z0-9_]+$/.test(fn));assert.ok(restKey);
  const start=Date.now();
  const response=await fetch(`${target.projectUrl}/rest/v1/rpc/${fn}`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{apikey:restKey,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const raw=await response.text();
  const entry={method:'POST',suffix:`/rest/v1/rpc/${fn}`,status:response.status,elapsedMs:Date.now()-start};result.requests.push(entry);
  if(!response.ok){entry.error=redact(raw).slice(0,2000);throw new Error(`PostgREST HTTP${response.status}; no retry`);}
  return JSON.parse(raw);
}
async function baseline(){
  const [row]=await query(`select (select count(*) from shiok_reports.reports) reports,
    (select count(*) from shiok_reports.daily_usage) usage,
    (select to_jsonb(c) from shiok_reports.control c) control,
    (select jsonb_agg(jsonb_build_object('name',p.proname,'source',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex'),'config',p.proconfig,'definer',p.prosecdef,'acl',p.proacl::text) order by p.proname) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='shiok_reports' or n.nspname='public' and p.proname like 'shiok_report_submit_%')) functions,
    (select jsonb_agg(jsonb_build_object('name',c.relname,'acl',c.relacl::text,'rls',c.relrowsecurity) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='shiok_reports' and c.relkind='r') tables;`,true);
  assert.equal(Number(row.reports),0);assert.equal(Number(row.usage),0);assert.equal(row.control.enabled,false);
  return row;
}
async function observe(names){
  assert.ok(names.every(name=>name.startsWith(label)&&/^[a-z0-9_]+$/.test(name)));
  return query(`begin read only; select pid,application_name,state,wait_event_type,wait_event,pg_blocking_pids(pid) blockers from pg_stat_activity where application_name in (${names.map(name=>`'${name}'`).join(',')}) order by application_name; commit;`,mode==='read-pilot');
}
async function waitObserved(names,predicate,limit=7){
  for(let attempt=0;attempt<limit;attempt++){
    const rows=await observe(names);result.observations??=[];result.observations.push(rows);
    if(predicate(rows))return rows;
    await sleep(120);
  }
  throw new Error('Live database observation gate not met; do not restart the run');
}
function transaction(name,sql,{role='service_role',timeout='8s',hold=false}={}){
  assert.ok(['service_role','postgres'].includes(role));
  return `begin; set local application_name='${name}'; set local statement_timeout='${timeout}'; set local role ${role}; ${hold?`select singleton from ${schema}.control where singleton for update; select pg_sleep(1.5);`:''} ${sql} commit;`;
}
const bundle='qa-synthetic-bundle';
const payload=JSON.stringify({schema_version:1,report_type:'mapping_error',geometry:{type:'Point',coordinates:[103.85,1.35]},referenced_bundle_version:bundle});
const proof='a'.repeat(64),bucket='b'.repeat(64);
const q=str=>`'${str.replaceAll("'","''")}'`;
function v7(ms,suffix='123456789abc'){
  const h=BigInt(ms).toString(16).padStart(12,'0');return `${h.slice(0,8)}-${h.slice(8)}-7123-8123-${suffix}`;
}
function submit(id,otherProof=proof,otherBucket=bucket){
  return {action:'submit',id,proof:otherProof,bucket:otherBucket};
}
const cleanup={action:'cleanup',id:null,proof,bucket};
const callSql=(value,hold=false)=>`select public.${label}_call(${q(value.action)},${value.id?q(value.id)+'::uuid':'null'},${q(value.proof)},${q(value.bucket)},${hold}) result;`;
async function reset(){
  await query(`begin; delete from ${schema}.reports; delete from ${schema}.daily_usage; update ${schema}.control set enabled=true,policy_approved_at=clock_timestamp(),cleanup_verified_at=clock_timestamp(),cleanup_failed_at=null,request_floor_ms=0,allowed_bundles=array['${bundle}']; commit;`);
}
async function qaState(){
  const [row]=await query(`select (select count(*) from ${schema}.reports) reports,(select jsonb_agg(jsonb_build_object('request_id',request_id,'receipt_id',receipt_id,'received_at',received_at,'expires_at',expires_at) order by request_id) from ${schema}.reports) identities,(select jsonb_agg(to_jsonb(d) order by day,bucket) from ${schema}.daily_usage d) usage,(select to_jsonb(c) from ${schema}.control c) control;`,true);return row;
}
async function seedExpiry(ttlMs){
  assert.ok(Number.isInteger(ttlMs)&&Math.abs(ttlMs)<=5000);
  const rows=await query(`with t as materialized (select date_trunc('milliseconds',clock_timestamp())+interval '${ttlMs} milliseconds' expires_at),
    r as (select expires_at,expires_at-interval '720 hours' received_at from t),
    i as (select *,lpad(to_hex(floor(extract(epoch from received_at)*1000)::bigint),12,'0') h from r)
    insert into ${schema}.reports(request_id,retry_proof_sha256,canonical_content,content_sha256,report_type,received_at,expires_at)
    select (substr(h,1,8)||'-'||substr(h,9,4)||'-7123-8123-123456789abc')::uuid,${q(proof)},${q(payload)},encode(sha256(convert_to(${q(payload)},'UTF8')),'hex'),'mapping_error',received_at,expires_at from i returning request_id,received_at,expires_at;`);
  return rows.at(-1);
}
async function race(name,first,second,roles=['service_role','service_role']){
  const names=[`${label}_${name}_a`,`${label}_${name}_b`];
  let a,b;
  try{
    const invoke=(value,hold,role,transport)=>{
      const args={p_action:value.action,p_id:value.id,p_proof:value.proof,p_bucket:value.bucket,p_hold:hold};
      if(transport==='rest')return rest(`${label}_call`,args).then(result=>[{result}]);
      return query(transaction(hold?names[0]:names[1],callSql(value,hold),{role}));
    };
    // Same-endpoint pilots serialized. Use one management session and one actual
    // PostgREST service session; the holder itself records its live blocked peer.
    const firstTransport=roles[1]==='postgres'?'rest':'management';
    a=invoke(first,true,roles[0],firstTransport);
    void a.catch(()=>{});
    await sleep(150);
    b=invoke(second,false,roles[1],firstTransport==='rest'?'management':'rest');
    const [ar,br]=await Promise.all([a,b]);
    const av=ar.at(-1).result,bv=br.at(-1).result;
    assert.notEqual(av.pid,bv.pid);
    const row={name,first:av,second:bv,after:await qaState()};result.cases.push(row);
    assert.ok(av.blocked?.some(row=>row.pid===bv.pid&&row.blockers.includes(av.pid)),'Actual peer blocking not observed; stop, no repetition');
    assert.equal(av.role,roles[0]);assert.equal(bv.role,roles[1]);
    return row;
  }finally{await Promise.allSettled([a,b].filter(Boolean));}
}
try{
  const identity=await api('');
  for(const [key,value] of Object.entries({id:target.projectRef,name:target.projectName,organization_id:target.organizationId,region:target.region,status:'ACTIVE_HEALTHY'}))assert.equal(identity[key],value);
  result.before=await baseline();
  if(mode==='rest-pilot'){
    await loadRestKey();
    const fn=`${label}_pilot`;
    const [absent]=await query(`select to_regprocedure('public.${fn}(boolean)') is null absent;`,true);assert.equal(absent.absent,true);
    await query(`begin; create function public.${fn}(hold boolean) returns jsonb language plpgsql security invoker set search_path='' as $$begin perform set_config('application_name','${fn}',true); if hold then perform pg_sleep(4); end if; return jsonb_build_object('pid',pg_backend_pid(),'role',current_user); end; $$; revoke all on function public.${fn}(boolean) from public,anon,authenticated; grant execute on function public.${fn}(boolean) to service_role; notify pgrst,'reload schema'; commit;`);
    pilotFunctionCreated=true;await sleep(1000);
    const live=rest(fn,{hold:true});
    try{
      const observed=await waitObserved([fn],rows=>rows.some(row=>row.wait_event==='PgSleep'));
      const other=await rest(fn,{hold:false});
      const done=await live;assert.notEqual(done.pid,other.pid);assert.equal(observed[0].pid,done.pid);
      assert.equal(done.role,'service_role');assert.equal(other.role,'service_role');
      result.pilot={observed,completed:done,other};
    }finally{await Promise.allSettled([live]);}
  }else if(mode==='pilot'||mode==='read-pilot'){
    const name=`${label}_pilot`;
    const live=query(`begin read only; set local application_name='${name}'; set local statement_timeout='10s'; select pg_sleep(5); select pg_backend_pid() pid; commit;`);
    try{
      const rows=await waitObserved([name],rows=>rows.some(row=>row.wait_event==='PgSleep'));
      const done=await live;assert.equal(rows[0].pid,done.at(-1).pid);result.pilot={observed:rows,completed:done};
    }finally{await Promise.allSettled([live]);}
  }else{
    const receipt=process.argv[3];assert.match(receipt??'',/^rest-pilot-[A-Za-z0-9]{6}$/);
    const pilot=JSON.parse(readFileSync(resolve(root,'qa/revamp-r1/report-operations-20260915',receipt,'summary.json'),'utf8'));
    // The preserved pilot failed same-endpoint overlap, but its management
    // observer saw a live REST backend. Only that narrower fact is reused.
    assert.equal(pilot.mode,'rest-pilot');assert.equal(pilot.productionUnchanged,true);assert.equal(pilot.pilotFunctionRemoved,true);
    assert.ok(pilot.observations.flat().some(row=>row.wait_event==='PgSleep'));
    assert.ok(Date.now()-Date.parse(pilot.finishedAt)<3600000);
    result.prerequisite={receipt,originalPassed:pilot.passed,claim:'Management observed a live REST backend; same-endpoint concurrency was NOT proven.'};
    await loadRestKey();
    const names=['20260914161526_shiok_private_reports_v1.sql','20260915000630_shiok_report_retention_30_days.sql','20260915010921_shiok_report_cleanup.sql'];
    const transform=sql=>sql.replaceAll('public.shiok_report_submit_',`${schema}.shiok_report_submit_`).replaceAll('shiok_reports',schema);
    const reverse=sql=>sql.replaceAll(`${schema}.shiok_report_submit_`,'public.shiok_report_submit_').replaceAll(schema,'shiok_reports');
    const sources=names.map(file=>({file,sql:readFileSync(resolve(root,'supabase/migrations',file),'utf8')}));
    for(const source of sources)assert.equal(reverse(transform(source.sql)),source.sql);
    result.sources=sources.map(({file,sql})=>({file,sha256:hash(sql),transformedSha256:hash(transform(sql))}));
    const [absent]=await query(`select to_regnamespace('${schema}') is null absent;`,true);assert.equal(absent.absent,true);
    result.schemaCreationAttempted=true;
    await query(`begin; set local statement_timeout='12s'; ${sources.map(source=>transform(source.sql)).join('\n')}
      create function ${schema}.try_submit(id uuid,proof text,bucket text) returns jsonb language plpgsql security invoker set search_path='' as $$
      begin return jsonb_build_object('ok',true,'receipt',${schema}.shiok_report_submit_v2(id,${q(payload)},proof,bucket,(clock_timestamp() at time zone 'UTC')::date));
      exception when others then return jsonb_build_object('ok',false,'sqlstate',sqlstate); end; $$;
      revoke all on function ${schema}.try_submit(uuid,text,text) from public,anon,authenticated;
      grant execute on function ${schema}.try_submit(uuid,text,text) to service_role;
      create function public.${label}_call(p_action text,p_id uuid,p_proof text,p_bucket text,p_hold boolean) returns jsonb language plpgsql security invoker set search_path='' as $$
      declare entered_at timestamptz:=clock_timestamp(); answer jsonb; blocked jsonb;
      begin
        if p_action not in ('submit','cleanup') or p_action='cleanup' and current_user<>'postgres' then raise insufficient_privilege; end if;
        perform set_config('application_name','${label}_call',true);
        if p_hold then
          perform singleton from ${schema}.control where singleton for update;
          perform pg_sleep(1.5);
          select jsonb_agg(jsonb_build_object('pid',pid,'blockers',pg_blocking_pids(pid))) into blocked from pg_stat_activity where pg_backend_pid()=any(pg_blocking_pids(pid));
        end if;
        if p_action='cleanup' then answer:=${schema}.cleanup_expired_v1();
        else answer:=${schema}.try_submit(p_id,p_proof,p_bucket); end if;
        return jsonb_build_object('pid',pg_backend_pid(),'role',current_user,'entered_at',entered_at,'finished_at',clock_timestamp(),'blocked',blocked,'answer',answer);
      end; $$;
      revoke all on function public.${label}_call(text,uuid,text,text,boolean) from public,anon,authenticated;
      grant execute on function public.${label}_call(text,uuid,text,text,boolean) to service_role;
      notify pgrst,'reload schema';
      commit;`);
    const [created]=await query(`select '${schema}'::regnamespace::oid oid;`,true);schemaOid=created.oid;result.schemaOid=schemaOid;
    const [wrapper]=await query(`select 'public.${label}_call(text,uuid,text,text,boolean)'::regprocedure::oid oid;`,true);callFunctionOid=wrapper.oid;result.callFunctionOid=callFunctionOid;
    const access=await query(`begin; set local role service_role; select current_user role,pg_blocking_pids(pg_backend_pid()) own_blockers,(select count(*) from pg_stat_activity where pid=pg_backend_pid()) visible_self; rollback;`);
    assert.equal(access.at(-1).role,'service_role');assert.equal(Number(access.at(-1).visible_self),1);result.catalogAccess=access;
    await sleep(1000);
    const definitions=await query(`select p.proname,p.prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='${schema}' and p.proname<>'try_submit' order by p.proname;`,true);
    for(const definition of definitions){const expected=result.before.functions.find(row=>row.name===definition.proname);assert.ok(expected);assert.equal(hash(reverse(definition.prosrc)),expected.source);}
    assert.equal(definitions.length,4);result.normalizedFunctionBodies=4;
    await reset();
    const id=v7(Date.now());
    const same=await race('same_id',submit(id),submit(id));
    assert.equal(same.first.answer.ok,true);assert.equal(same.second.answer.ok,true);
    assert.equal(same.first.answer.receipt.receipt_id,same.second.answer.receipt.receipt_id);
    assert.equal(same.first.answer.receipt.replayed,false);assert.equal(same.second.answer.receipt.replayed,true);
    assert.equal(Number(same.after.reports),1);assert.ok(same.after.usage.every(row=>row.admitted===1));
    const conflict=await race('conflict',submit(id),submit(id,'c'.repeat(64)));
    assert.equal(conflict.second.answer.sqlstate,'PT409');assert.deepEqual(conflict.after.identities,same.after.identities);assert.deepEqual(conflict.after.usage,same.after.usage);
    for(const kind of ['global','network']){
      await reset();await query(`insert into ${schema}.daily_usage(day,bucket,admitted) values((clock_timestamp() at time zone 'UTC')::date,${q(kind==='global'?'global':bucket)},${kind==='global'?99:4});`);
      const r=await race(`${kind}_cap`,submit(v7(Date.now(),'111111111111')),submit(v7(Date.now(),'222222222222')));
      assert.equal(r.first.answer.ok,true);assert.equal(r.second.answer.sqlstate,'PT429');assert.equal(Number(r.after.reports),1);
      assert.equal(r.after.usage.find(row=>row.bucket===(kind==='global'?'global':bucket)).admitted,kind==='global'?100:5);
    }
    for(const firstKind of ['cleanup','retry']){
      await reset();const savedId=v7(Date.now());await query(transaction(`${label}_seed`,callSql(submit(savedId))));
      const prior=await qaState();
      const r=await race(`${firstKind}_first`,firstKind==='cleanup'?cleanup:submit(savedId),firstKind==='cleanup'?submit(savedId):cleanup,firstKind==='cleanup'?['postgres','service_role']:['service_role','postgres']);
      assert.deepEqual(r.after.identities,prior.identities);assert.deepEqual(r.after.usage,prior.usage);
      assert.equal((firstKind==='cleanup'?r.second:r.first).answer.receipt.replayed,true);
    }
    await reset();
    const expired=await seedExpiry(-1000);
    const expiredRetry=await race('expired_retry_first',submit(expired.request_id),cleanup,['service_role','postgres']);
    assert.equal(expiredRetry.first.answer.sqlstate,'PT410');assert.equal(expiredRetry.second.answer.reports_deleted,1);
    assert.equal(Number(expiredRetry.after.reports),0);assert.equal(expiredRetry.after.usage,null);
    await reset();
    const expiring=await seedExpiry(1200);
    const boundary=await race('expiry_while_blocked',submit(v7(Date.now())),submit(expiring.request_id));
    boundary.expiring=expiring;
    assert.ok(Date.parse(boundary.second.entered_at)<Date.parse(expiring.expires_at),'Expiry preceded contention; evidence inconclusive');
    assert.ok(Date.parse(boundary.second.finished_at)>=Date.parse(expiring.expires_at));
    assert.equal(boundary.second.answer.sqlstate,'PT410');assert.equal(Number(boundary.after.reports),2);
    assert.ok(boundary.after.usage.every(row=>row.admitted===1));
    // Cancellation occurs after report deletion begins and before quota deletion completes.
    await reset();
    const expiredAt=Date.now()-1000,receivedAt=expiredAt-720*3600000,oldId=v7(receivedAt);
    await query(`insert into ${schema}.reports(request_id,retry_proof_sha256,canonical_content,content_sha256,report_type,received_at,expires_at) values(${q(oldId)},${q(proof)},${q(payload)},encode(sha256(convert_to(${q(payload)},'UTF8')),'hex'),'mapping_error',to_timestamp(${receivedAt}/1000.0),to_timestamp(${expiredAt}/1000.0)); insert into ${schema}.daily_usage values((clock_timestamp() at time zone 'UTC')::date-2,'global',1);
      create function ${schema}.delay_usage_delete() returns trigger language plpgsql set search_path='' as $$begin perform pg_sleep(2); return old; end;$$;
      revoke all on function ${schema}.delay_usage_delete() from public,anon,authenticated,service_role;
      create trigger qa_delay_usage before delete on ${schema}.daily_usage for each row execute function ${schema}.delay_usage_delete();`);
    const cancellationBefore=await qaState();let canceled=false;
    try{await query(transaction(`${label}_timeout`,callSql(cleanup),{role:'postgres',timeout:'200ms'}));}catch(error){const last=result.requests.at(-1);assert.match(last.error??'',/57014/);assert.match(last.error,/statement timeout/);canceled=true;}
    assert.equal(canceled,true);assert.deepEqual(await qaState(),cancellationBefore);
    result.cases.push({name:'outer_statement_timeout_rolls_back_both_deletes_and_health',passed:true,before:cancellationBefore,after:await qaState()});
    await query(`drop trigger qa_delay_usage on ${schema}.daily_usage; drop function ${schema}.delay_usage_delete();`);
    const purged=await race('purge_first',cleanup,submit(oldId),['postgres','service_role']);
    assert.equal(purged.first.answer.reports_deleted,1);assert.equal(purged.second.answer.sqlstate,'PT410');assert.equal(Number(purged.after.reports),0);assert.equal(purged.after.usage,null);
  }
  result.passed=true;
}catch(error){result.error=redact(error.message);process.exitCode=1;}
finally{
  await Promise.allSettled([...pending]);
  try{
    if(pilotFunctionCreated){
      await query(`drop function public.${label}_pilot(boolean); notify pgrst,'reload schema';`);
      const [absent]=await query(`select to_regprocedure('public.${label}_pilot(boolean)') is null absent;`,true);assert.equal(absent.absent,true);result.pilotFunctionRemoved=true;
    }
    if(result.schemaCreationAttempted){
      const [identity]=await query(`select to_regnamespace('${schema}')::oid oid;`,true);
      if(identity.oid!==null){assert.ok(schemaOid&&identity.oid===schemaOid,'Unknown QA schema identity; do not drop');
        const live=await query(`select pid,application_name,state from pg_stat_activity where application_name like '${label}%' and state<>'idle';`,true);
        assert.equal(live.length,0,'QA sessions still active; do not drop');
        const [wrapper]=await query(`select to_regprocedure('public.${label}_call(text,uuid,text,text,boolean)')::oid oid;`,true);
        assert.equal(wrapper.oid,callFunctionOid,'Unexpected QA wrapper identity; do not drop');
        await query(`drop function public.${label}_call(text,uuid,text,text,boolean); drop schema ${schema} cascade; notify pgrst,'reload schema';`);
      }
      const [absent]=await query(`select to_regnamespace('${schema}') is null absent;`,true);assert.equal(absent.absent,true);result.qaSchemaRemoved=true;
    }
    result.after=await baseline();assert.deepEqual(result.after,result.before);result.productionUnchanged=true;
  }catch(error){result.cleanupError=redact(error.message);result.passed=false;process.exitCode=1;}
  result.finishedAt=new Date().toISOString();
  writeFileSync(resolve(out,'summary.json'),`${JSON.stringify(result,null,2)}\n`,{flag:'wx'});
  console.log(JSON.stringify({out,...result},null,2));
}
