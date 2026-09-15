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
