-- Synthetic identities/rows inside caller-owned BEGIN/ROLLBACK. No Auth login or email.
create temporary table moderation_checks(name text primary key, passed boolean not null);
create function pg_temp.expect_state(statement text, expected text) returns void language plpgsql as $$
declare caught text;
begin
  begin execute statement; exception when others then get stacked diagnostics caught = returned_sqlstate; end;
  if caught is distinct from expected then raise exception 'Expected %, got %',expected,coalesce(caught,'success'); end if;
end;
$$;
create function pg_temp.rid(t timestamptz,n integer) returns uuid language sql as $$
 select (substr(h,1,8)||'-'||substr(h,9,4)||'-7000-8000-'||lpad(to_hex(n),12,'0'))::uuid
 from (select lpad(to_hex(floor(extract(epoch from t)*1000)::bigint),12,'0') h) s;
$$;
create function pg_temp.guards(p_ids uuid[]) returns jsonb language sql as $$
 select jsonb_agg(jsonb_build_object('receipt_id',r.receipt_id,'revision',r.revision) order by a.ord)
 from unnest(p_ids) with ordinality a(id,ord) join shiok_reports.reports r on r.receipt_id=a.id;
$$;
create function pg_temp.decide(p_id uuid,p_action text,p_target uuid default null,p_set jsonb default null,p_reason text default 'Synthetic review')
returns jsonb language sql as $$
 select public.shiok_moderator_decide_v1('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',
 clock_timestamp()+interval '20 minutes',p_id,1,p_action,p_reason,p_target,
 coalesce(p_set,pg_temp.guards(array[p_id])));
$$;
create function pg_temp.queue() returns jsonb language sql as $$
 select public.shiok_moderator_queue_v1('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',
 clock_timestamp()+interval '20 minutes','pending',null,null);
$$;
create function pg_temp.add_report(p_n integer,p_type text default 'mapping_error',p_age interval default interval '1 minute')
returns uuid language plpgsql as $$
declare t timestamptz:=clock_timestamp()-p_age; id uuid; content text;
begin
 content:=jsonb_build_object('schema_version',1,'report_type',p_type,'geometry',jsonb_build_object('type','Point','coordinates',jsonb_build_array(103.85,1.35)),
   'referenced_bundle_version','synthetic-moderation','note','Synthetic only')::text;
 insert into shiok_reports.reports(request_id,retry_proof_sha256,canonical_content,content_sha256,report_type,received_at,expires_at)
 values(pg_temp.rid(t,p_n),repeat('a',64),content,encode(sha256(convert_to(content,'UTF8')),'hex'),p_type,t,t+interval '720 hours')
 returning receipt_id into id;
 return id;
end;
$$;
do $tests$
declare
 actor uuid:='11111111-1111-4111-8111-111111111111'; sid uuid:='22222222-2222-4222-8222-222222222222';
 a uuid; b uuid; c uuid; d uuid; exp uuid; old uuid; link uuid; r jsonb; g jsonb;
 checks text[]:='{}'; before_content text; before_expiry timestamptz; q text;
begin
 if exists(select 1 from shiok_reports.reports) or exists(select 1 from shiok_reports.moderators)
   or exists(select 1 from auth.users where id=actor) or exists(select 1 from auth.sessions where id=sid) then
   raise exception 'Synthetic-only empty report/allowlist precondition';
 end if;
 insert into auth.users(id,is_anonymous,raw_user_meta_data) values(actor,false,'{"moderator":true}');
 insert into auth.sessions(id,user_id,created_at,not_after) values(sid,actor,clock_timestamp(),clock_timestamp()+interval '1 hour');
 a:=pg_temp.add_report(1); b:=pg_temp.add_report(2); c:=pg_temp.add_report(3); d:=pg_temp.add_report(4,'shelter_request');
 exp:=pg_temp.add_report(5,'mapping_error',interval '31 days');
 q:='select pg_temp.queue()';
 perform pg_temp.expect_state(q,'PT403');
 checks:=array_append(checks,'user_metadata_cannot_enroll_moderator');
 insert into shiok_reports.moderators(user_id) values(actor);
 perform pg_temp.expect_state(q,'PT403');
 update shiok_reports.moderators set enabled=true where user_id=actor;
 checks:=array_append(checks,'allowlist_defaults_disabled');
 update auth.users set is_anonymous=true where id=actor;
 perform pg_temp.expect_state(q,'PT403');
 update auth.users set is_anonymous=false,banned_until=clock_timestamp()+interval '1 day' where id=actor;
 perform pg_temp.expect_state(q,'PT403');
 update auth.users set banned_until=null,deleted_at=clock_timestamp() where id=actor;
 perform pg_temp.expect_state(q,'PT403');
 update auth.users set deleted_at=null where id=actor;
 checks:=array_append(checks,'anonymous_banned_and_soft_deleted_users_denied');
 update auth.sessions set not_after=clock_timestamp()-interval '1 second' where id=sid;
 perform pg_temp.expect_state(q,'PT403');
 update auth.sessions set not_after=clock_timestamp()+interval '1 hour' where id=sid;
 perform pg_temp.expect_state(format('select public.shiok_moderator_queue_v1(%L,%L,clock_timestamp(),''pending'',null,null)',actor,sid),'PT403');
 perform pg_temp.expect_state(format('select public.shiok_moderator_queue_v1(%L,%L,clock_timestamp()+interval ''2 hours'',''pending'',null,null)',actor,sid),'PT403');
 checks:=array_append(checks,'expired_session_token_and_unbounded_expiry_denied');
 delete from auth.sessions where id=sid;
 perform pg_temp.expect_state(q,'PT403');
 insert into auth.sessions(id,user_id,not_after) values(sid,actor,clock_timestamp()+interval '1 hour');
 checks:=array_append(checks,'deleted_session_revokes_queue');
 set local role anon;
 perform pg_temp.expect_state(q,'42501');
 perform pg_temp.expect_state('select * from shiok_reports.reports','42501');
 reset role;
 set local role authenticated;
 perform pg_temp.expect_state(q,'42501');
 perform pg_temp.expect_state('select * from shiok_reports.moderation','42501');
 reset role;
 checks:=array_append(checks,'actual_anon_and_authenticated_cannot_read_or_call_queue');
 set local role service_role;
 r:=pg_temp.queue();
 perform pg_temp.expect_state('select * from shiok_reports.moderators','42501');
 perform pg_temp.expect_state('update shiok_reports.reports set state=''accepted''','42501');
 reset role;
 if jsonb_array_length(r->'reports')<>4 or r::text like '%retry_proof%' or r::text like '%request_id%' or r::text like '%content_sha256%' then
   raise exception 'Queue leakage or expired content'; end if;
 checks:=array_append(checks,'server_queue_excludes_expired_and_retry_identifiers');
 checks:=array_append(checks,'service_role_cannot_enroll_or_directly_decide');
 perform pg_temp.expect_state(format('select public.shiok_moderator_queue_v1(%L,%L,clock_timestamp()+interval ''20 minutes'',''all'',null,null)',actor,sid),'PT400');
 perform pg_temp.expect_state(format('select public.shiok_moderator_queue_v1(%L,%L,clock_timestamp()+interval ''20 minutes'',''pending'',clock_timestamp(),null)',actor,sid),'PT400');
 checks:=array_append(checks,'queue_filter_and_cursor_fail_closed');
 select canonical_content,expires_at into before_content,before_expiry from shiok_reports.reports where receipt_id=a;
 g:=pg_temp.guards(array[a]);
 set local role service_role;
 r:=pg_temp.decide(a,'accepted',null,g);
 reset role;
 if r->>'state'<>'accepted' or (r->>'revision')::int<>2
   or not exists(select 1 from shiok_reports.moderation where receipt_id=a and moderator_id=actor and from_revision=1 and to_revision=2)
   or not exists(select 1 from shiok_reports.reports where receipt_id=a and state='accepted' and revision=2 and canonical_content=before_content and expires_at=before_expiry) then
   raise exception 'Atomic moderation or immutable original content/expiry'; end if;
 checks:=array_append(checks,'decision_and_private_audit_commit_atomically');
 checks:=array_append(checks,'decision_never_extends_expiry_or_changes_content');
 perform pg_temp.expect_state(format('select pg_temp.decide(%L,''rejected'')',a),'PT409');
 perform pg_temp.expect_state(format('select pg_temp.decide(%L,''accepted'')',exp),'PT409');
 checks:=array_append(checks,'terminal_and_expired_sources_rejected');
 perform pg_temp.expect_state(format('select pg_temp.decide(%L,''accepted'',null,''[]'')',b),'PT409');
 perform pg_temp.expect_state(format('select pg_temp.decide(%L,''accepted'',null,null,%L)',b,U&'\00a0\feff'),'PT400');
 perform pg_temp.expect_state(format('select pg_temp.decide(%L,''accepted'',null,null,%L)',b,repeat('x',1001)),'PT400');
 checks:=array_append(checks,'revision_and_unicode_reason_bounds');
 r:=pg_temp.decide(b,'duplicate',a,pg_temp.guards(array[b,a]));
 if r->>'state'<>'duplicate' then raise exception 'Duplicate failed'; end if;
 checks:=array_append(checks,'same_type_duplicate_to_terminal_target');
 perform pg_temp.expect_state(format('select pg_temp.decide(%L,''duplicate'',%L,%L)',c,b,pg_temp.guards(array[c,b])),'PT409');
 g:=pg_temp.guards(array[c,b,a]);
 r:=pg_temp.decide(c,'duplicate',b,g);
 checks:=array_append(checks,'complete_ordered_chain_read_set_required');
 perform pg_temp.expect_state(format('select pg_temp.decide(%L,''duplicate'',%L,%L)',d,a,pg_temp.guards(array[d,a])),'PT409');
 checks:=array_append(checks,'cross_type_duplicate_rejected');
 old:=pg_temp.add_report(6); link:=pg_temp.add_report(7);
 g:=pg_temp.guards(array[old,link]);
 perform pg_temp.decide(link,'rejected');
 perform pg_temp.expect_state(format('select pg_temp.decide(%L,''duplicate'',%L,%L)',old,link,g),'PT409');
 checks:=array_append(checks,'target_revision_changed_since_read_rejected');
 link:=pg_temp.add_report(8);
 perform pg_temp.decide(link,'duplicate',old,pg_temp.guards(array[link,old]));
 perform pg_temp.expect_state(format('select pg_temp.decide(%L,''duplicate'',%L,%L)',old,link,pg_temp.guards(array[old,link])),'PT409');
 checks:=array_append(checks,'converging_links_cannot_form_cycle');
 perform pg_temp.expect_state(format('select pg_temp.decide(%L,''duplicate'',%L,%L)',old,old,pg_temp.guards(array[old])),'PT409');
 perform pg_temp.expect_state(format('select pg_temp.decide(%L,''duplicate'',%L,%L)',old,exp,pg_temp.guards(array[old,exp])),'PT409');
 checks:=array_append(checks,'self_and_expired_targets_rejected');
 update shiok_reports.moderators set enabled=false where user_id=actor;
 perform pg_temp.expect_state(format('select pg_temp.decide(%L,''accepted'')',old),'PT403');
 update shiok_reports.moderators set enabled=true where user_id=actor;
 checks:=array_append(checks,'allowlist_revocation_stops_decision');
 -- Inject a synthetic audit-insert failure: state must remain pending.
 execute 'create function pg_temp.fail_audit() returns trigger language plpgsql as $x$ begin raise exception ''synthetic''; end $x$';
 execute 'create trigger synthetic_audit_failure before insert on shiok_reports.moderation for each row execute function pg_temp.fail_audit()';
 perform pg_temp.expect_state(format('select pg_temp.decide(%L,''accepted'')',old),'P0001');
 if not exists(select 1 from shiok_reports.reports where receipt_id=old and state='pending' and revision=1)
   or exists(select 1 from shiok_reports.moderation where receipt_id=old) then raise exception 'Partial audit'; end if;
 execute 'drop trigger synthetic_audit_failure on shiok_reports.moderation';
 checks:=array_append(checks,'failed_audit_rolls_back_entire_decision');
 -- Synthetic already-expired row plus its matching historical decision.
 insert into shiok_reports.moderation values(exp,1,2,'accepted',actor,clock_timestamp()-interval '31 days','Synthetic expired review',null);
 update shiok_reports.reports set state='accepted',revision=2 where receipt_id=exp;
 r:=shiok_reports.cleanup_expired_v1();
 if r->>'ok'<>'true' or exists(select 1 from shiok_reports.moderation where receipt_id=exp) then raise exception 'Audit escaped retention'; end if;
 checks:=array_append(checks,'scheduled_cleanup_cascades_private_audit_retention');
 for n in 20..50 loop perform pg_temp.add_report(n); end loop;
 r:=pg_temp.queue();
 if jsonb_array_length(r->'reports')<>25 then raise exception 'Queue bound'; end if;
 r:=public.shiok_moderator_queue_v1(actor,sid,clock_timestamp()+interval '20 minutes','pending',
   (r->'reports'->24->>'received_at')::timestamptz,(r->'reports'->24->>'receipt_id')::uuid);
 if jsonb_array_length(r->'reports')<>8 then raise exception 'Queue pagination'; end if;
 checks:=array_append(checks,'queue_keyset_paging_25_then_8');
 insert into moderation_checks select name,true from unnest(checks) name;
end;
$tests$;

-- Append after report_moderation.sql in the SAME caller-owned BEGIN/ROLLBACK.
-- Reuses only its synthetic identities, pg_temp helpers and moderation_checks.
do $edges$
declare
  actor uuid := '11111111-1111-4111-8111-111111111111';
  sid uuid := '22222222-2222-4222-8222-222222222222';
  source_id uuid; target_id uuid; expired_id uuid; missing_id uuid := gen_random_uuid();
  root_id uuid; overflow_id uuid; target_ids uuid[] := '{}';
  r jsonb; g jsonb; expected_source jsonb; expected_audit jsonb;
  checks text[] := '{}'; entry record; denied_role text; signature text;
  suffix text; statement text; caught text; fn oid;
begin
  if current_user <> 'postgres' or current_setting('transaction_isolation') <> 'read committed'
    or to_regclass('pg_temp.moderation_checks') is null then
    raise exception 'Requires original rollback moderation fixtures as postgres at READ COMMITTED';
  end if;
  if not exists(select 1 from moderation_checks where name='queue_keyset_paging_25_then_8' and passed)
    or not exists(select 1 from shiok_reports.moderators where user_id=actor and enabled)
    or not exists(select 1 from auth.sessions where id=sid and user_id=actor
      and (not_after is null or not_after>clock_timestamp()))
    or exists(select 1 from shiok_reports.reports where receipt_id=missing_id) then
    raise exception 'Original synthetic moderation fixture precondition';
  end if;

  source_id := pg_temp.add_report(2000);
  target_id := pg_temp.add_report(2001);
  expired_id := pg_temp.add_report(2002,'mapping_error',interval '31 days');
  set local role service_role;
  r := public.shiok_moderator_context_v1(actor,sid,clock_timestamp()+interval '20 minutes',source_id,target_id);
  reset role;
  if r->'source'->>'receipt_id' is distinct from source_id::text
    or r->'source'->>'state' is distinct from 'pending'
    or r->'source'->'revision' is distinct from '1'::jsonb
    or r->'source'->'reason' is distinct from 'null'::jsonb
    or jsonb_array_length(r->'target_chain') is distinct from 1
    or r->'target_chain'->0->>'receipt_id' is distinct from target_id::text
    or r->>'observed_at' is null
    or (r->'source') ?| array['request_id','retry_proof_sha256','content_sha256','canonical_content']
    or (r->'target_chain'->0) ?| array['request_id','retry_proof_sha256','content_sha256','canonical_content'] then
    raise exception 'Pending context shape, target identity or private-field leakage';
  end if;
  checks := array_append(checks,'edges_context_pending_source_and_target_without_private_identifiers');

  set local role service_role;
  perform pg_temp.expect_state(format('select public.shiok_moderator_context_v1(%L,%L,clock_timestamp()+interval ''20 minutes'',null,null)',actor,sid),'PT400');
  perform pg_temp.expect_state(format('select public.shiok_moderator_context_v1(%L,%L,clock_timestamp()+interval ''20 minutes'',%L,null)',actor,sid,missing_id),'PT409');
  perform pg_temp.expect_state(format('select public.shiok_moderator_context_v1(%L,%L,clock_timestamp()+interval ''20 minutes'',%L,null)',actor,sid,expired_id),'PT409');
  perform pg_temp.expect_state(format('select public.shiok_moderator_context_v1(%L,%L,clock_timestamp()+interval ''20 minutes'',%L,%L)',actor,sid,source_id,missing_id),'PT409');
  perform pg_temp.expect_state(format('select public.shiok_moderator_context_v1(%L,%L,clock_timestamp()+interval ''20 minutes'',%L,%L)',actor,sid,source_id,expired_id),'PT409');
  reset role;
  checks := array_append(checks,'edges_context_rejects_null_missing_and_expired_sources_or_targets');

  for n in 1..32 loop target_ids := array_append(target_ids,pg_temp.add_report(2100+n)); end loop;
  -- Build the chain through the real service gateway, including each endpoint guard.
  for n in reverse 31..1 loop
    g := pg_temp.guards(target_ids[n:32]);
    set local role service_role;
    perform pg_temp.decide(target_ids[n],'duplicate',target_ids[n+1],g);
    reset role;
  end loop;
  root_id := pg_temp.add_report(2200);
  overflow_id := pg_temp.add_report(2201);
  set local role service_role;
  r := public.shiok_moderator_context_v1(actor,sid,clock_timestamp()+interval '20 minutes',root_id,target_ids[1]);
  reset role;
  if jsonb_array_length(r->'target_chain') is distinct from 32 then raise exception 'Exact 32-target context rejected'; end if;
  for n in 1..32 loop
    if r->'target_chain'->(n-1)->>'receipt_id' is distinct from target_ids[n]::text
      or r->'target_chain'->(n-1)->>'state' is distinct from (case when n=32 then 'pending' else 'duplicate' end)
      or r->'target_chain'->(n-1)->'revision' is distinct from to_jsonb(case when n=32 then 1 else 2 end) then
      raise exception 'Incomplete or unordered 32-target context';
    end if;
  end loop;
  checks := array_append(checks,'edges_context_preserves_exact_32_target_order_and_endpoint');

  g := pg_temp.guards(array[root_id] || target_ids);
  if jsonb_array_length(g) is distinct from 33 then raise exception 'Missing source plus 32-target guards'; end if;
  set local role service_role;
  r := pg_temp.decide(root_id,'duplicate',target_ids[1],g);
  reset role;
  if r->>'state' is distinct from 'duplicate' or r->'revision' is distinct from '2'::jsonb
    or not exists(select 1 from shiok_reports.moderation where receipt_id=root_id and duplicate_of=target_ids[1]) then
    raise exception 'Exact 32-target decision failed or flattened immediate link';
  end if;
  checks := array_append(checks,'edges_32_targets_plus_source_guards_commit_with_immediate_link');

  set local role service_role;
  r := public.shiok_moderator_context_v1(actor,sid,clock_timestamp()+interval '20 minutes',root_id,null);
  reset role;
  if r->'source'->>'receipt_id' is distinct from root_id::text
    or r->'source'->>'state' is distinct from 'duplicate'
    or r->'source'->>'duplicate_of' is distinct from target_ids[1]::text
    or r->'target_chain' is distinct from '[]'::jsonb then
    raise exception 'Source inspection incorrectly traversed its 33-row stored chain';
  end if;
  checks := array_append(checks,'edges_valid_33_row_stored_chain_does_not_hide_source_context');
  g := pg_temp.guards(array[overflow_id,root_id] || target_ids);
  set local role service_role;
  perform pg_temp.expect_state(format('select pg_temp.decide(%L,''duplicate'',%L,%L)',overflow_id,root_id,g),'PT409');
  perform pg_temp.expect_state(format('select public.shiok_moderator_context_v1(%L,%L,clock_timestamp()+interval ''20 minutes'',%L,%L)',actor,sid,overflow_id,root_id),'PT409');
  reset role;
  if not exists(select 1 from shiok_reports.reports where receipt_id=overflow_id and state='pending' and revision=1)
    or exists(select 1 from shiok_reports.moderation where receipt_id=overflow_id) then
    raise exception 'Overlong target chain left a partial decision';
  end if;
  checks := array_append(checks,'edges_33_target_traversal_rejected_without_state_or_audit_change');

  -- Historical synthetic decisions predate target expiry; no sleeps or live-clock changes.
  target_id := pg_temp.add_report(2300,'mapping_error',interval '31 days');
  source_id := pg_temp.add_report(2301,'mapping_error',interval '29 days');
  insert into shiok_reports.moderation(receipt_id,from_revision,to_revision,action,moderator_id,moderated_at,reason,duplicate_of)
    values(target_id,1,2,'accepted',actor,clock_timestamp()-interval '3 days','Synthetic old target',null),
      (source_id,1,2,'duplicate',actor,clock_timestamp()-interval '2 days','Synthetic retained source',target_id);
  update shiok_reports.reports set state='accepted',revision=2 where receipt_id=target_id;
  update shiok_reports.reports set state='duplicate',revision=2 where receipt_id=source_id;
  select to_jsonb(s) into expected_source from shiok_reports.reports s where receipt_id=source_id;
  select to_jsonb(m) into expected_audit from shiok_reports.moderation m where receipt_id=source_id;
  set local role service_role;
  r := public.shiok_moderator_context_v1(actor,sid,clock_timestamp()+interval '20 minutes',source_id,null);
  reset role;
  if r->'source'->>'duplicate_of' is distinct from target_id::text
    or r->'source'->>'reason' is distinct from 'Synthetic retained source' then
    raise exception 'Expired downstream target hid retained source before cleanup';
  end if;
  checks := array_append(checks,'edges_expired_target_does_not_hide_retained_source_before_cleanup');
  r := shiok_reports.cleanup_expired_v1();
  if r->>'ok' is distinct from 'true'
    or exists(select 1 from shiok_reports.reports where receipt_id=target_id)
    or exists(select 1 from shiok_reports.moderation where receipt_id=target_id)
    or expected_source is distinct from (select to_jsonb(s) from shiok_reports.reports s where receipt_id=source_id)
    or expected_audit is distinct from (select to_jsonb(m) from shiok_reports.moderation m where receipt_id=source_id) then
    raise exception 'Target cleanup retained expired data or changed newer source/audit';
  end if;
  set local role service_role;
  r := public.shiok_moderator_context_v1(actor,sid,clock_timestamp()+interval '20 minutes',source_id,null);
  perform pg_temp.expect_state(format('select public.shiok_moderator_context_v1(%L,%L,clock_timestamp()+interval ''20 minutes'',%L,null)',actor,sid,target_id),'PT409');
  perform pg_temp.expect_state(format('select public.shiok_moderator_context_v1(%L,%L,clock_timestamp()+interval ''20 minutes'',%L,%L)',actor,sid,source_id,target_id),'PT409');
  reset role;
  if r->'source'->>'receipt_id' is distinct from source_id::text
    or r->'source'->>'state' is distinct from 'duplicate'
    or r->'source'->'revision' is distinct from '2'::jsonb
    or r->'source'->>'duplicate_of' is distinct from target_id::text
    or r->'source'->>'reason' is distinct from 'Synthetic retained source'
    or r->'target_chain' is distinct from '[]'::jsonb then
    raise exception 'Purged downstream target hid or changed retained source context';
  end if;
  checks := array_append(checks,'edges_target_cleanup_preserves_newer_source_audit_and_inspection');

  g := pg_temp.guards(array[overflow_id]);
  for entry in select * from (values
    ('public','shiok_moderator_queue_v1','queue',true),
    ('public','shiok_moderator_context_v1','context',true),
    ('public','shiok_moderator_decide_v1','decide',true),
    ('shiok_reports','moderator_queue_v1','queue',true),
    ('shiok_reports','moderator_context_v1','context',true),
    ('shiok_reports','moderator_decide_v1','decide',true),
    ('shiok_reports','require_moderator_v1','require',false),
    ('shiok_reports','moderator_chain_v1','chain',false)
  ) v(schema_name,function_name,operation,service_allowed) loop
    signature := format('%I.%I(%s)',entry.schema_name,entry.function_name,case entry.operation
      when 'queue' then 'uuid,uuid,timestamptz,text,timestamptz,uuid'
      when 'context' then 'uuid,uuid,timestamptz,uuid,uuid'
      when 'decide' then 'uuid,uuid,timestamptz,uuid,bigint,text,text,uuid,jsonb'
      when 'require' then 'uuid,uuid,timestamptz' else 'uuid,timestamptz' end);
    fn := to_regprocedure(signature);
    if fn is null or exists(select 1 from pg_proc p,
      lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
      where p.oid=fn and a.grantee=0 and a.privilege_type='EXECUTE') then
      raise exception 'Missing entry or PUBLIC execution grant: %',signature;
    end if;
    if has_function_privilege('service_role',fn,'EXECUTE') is distinct from entry.service_allowed then
      raise exception 'Unexpected service execution grant: %',signature;
    end if;
    suffix := case entry.operation
      when 'queue' then ',p_state=>''pending'',p_after_received_at=>null,p_after_receipt_id=>null'
      when 'context' then format(',p_receipt=>%L::uuid,p_duplicate=>null',overflow_id)
      when 'decide' then format(',p_receipt=>%L::uuid,p_revision=>1,p_action=>''accepted'',p_reason=>''Synthetic ACL probe'',p_duplicate=>null,p_read_set=>%L::jsonb',overflow_id,g)
      else '' end;
    if entry.operation='chain' then
      statement := format('select %I.%I(p_receipt=>%L::uuid,p_now=>clock_timestamp())',entry.schema_name,entry.function_name,overflow_id);
    else
      statement := format('select %I.%I(p_actor=>%L::uuid,p_session=>%L::uuid,p_token_expires_at=>clock_timestamp()+interval ''20 minutes''%s)',entry.schema_name,entry.function_name,actor,sid,suffix);
    end if;
    foreach denied_role in array array['anon','authenticated','service_role'] loop
      if denied_role='service_role' and entry.service_allowed then continue; end if;
      if has_function_privilege(denied_role,fn,'EXECUTE') then raise exception 'Unexpected % grant: %',denied_role,signature; end if;
      -- Invoke the entry itself, not pg_temp helpers that could mask the failing ACL.
      caught := null;
      execute format('set local role %I',denied_role);
      begin execute statement; exception when others then get stacked diagnostics caught=returned_sqlstate; end;
      reset role;
      if caught is distinct from '42501' then raise exception 'Expected ACL denial for % on %, got %',denied_role,signature,coalesce(caught,'success'); end if;
    end loop;
    if entry.service_allowed then
      statement := format('select %I.%I(p_actor=>null,p_session=>%L::uuid,p_token_expires_at=>clock_timestamp()+interval ''20 minutes''%s)',entry.schema_name,entry.function_name,sid,suffix);
      caught := null;
      set local role service_role;
      begin execute statement; exception when others then get stacked diagnostics caught=returned_sqlstate; end;
      reset role;
      if caught is distinct from 'PT403' then raise exception 'Missing private authorization on %, got %',signature,coalesce(caught,'success'); end if;
    end if;
    checks := array_append(checks,'edges_acl_' || entry.schema_name || '_' || entry.function_name);
  end loop;
  if not exists(select 1 from shiok_reports.reports where receipt_id=overflow_id and state='pending' and revision=1)
    or exists(select 1 from shiok_reports.moderation where receipt_id=overflow_id) then
    raise exception 'Denied entry probes changed source state or audit';
  end if;
  insert into moderation_checks select name,true from unnest(checks) name;
end;
$edges$;
