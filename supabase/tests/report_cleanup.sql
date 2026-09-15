-- Synthetic, dedicated disabled/empty backend only. Caller MUST wrap in BEGIN/ROLLBACK.
create temporary table cleanup_checks(name text primary key, passed boolean not null);
create function pg_temp.submit(p_id uuid,p_body text,p_proof text,p_bucket text,
  p_day date default (clock_timestamp() at time zone 'UTC')::date) returns jsonb
language sql as $$ select public.shiok_report_submit_v2(p_id,p_body,p_proof,p_bucket,p_day); $$;
create function pg_temp.report_id(t timestamptz, n integer default 1) returns uuid
language sql as $$
  select (substr(h,1,8)||'-'||substr(h,9,4)||'-7000-8000-'||lpad(to_hex(n),12,'0'))::uuid
  from (select lpad(to_hex(floor(extract(epoch from t)*1000)::bigint),12,'0') h) s;
$$;
create function pg_temp.expect_sqlstate(statement text, expected text) returns void
language plpgsql as $$
declare caught text;
begin
  begin execute statement;
  exception when others then get stacked diagnostics caught = returned_sqlstate;
  end;
  if caught is distinct from expected then
    raise exception 'Expected SQLSTATE %, got %', expected, coalesce(caught,'success');
  end if;
end;
$$;

do $tests$
declare
  original_control jsonb;
  checks text[] := '{}';
  t timestamptz := clock_timestamp();
  fresh uuid := pg_temp.report_id(t, 1);
  future_id uuid := pg_temp.report_id(t + interval '4 minutes', 2);
  old_valid uuid := pg_temp.report_id(t - interval '2 days', 3);
  old_expired uuid := pg_temp.report_id(t - interval '31 days', 4);
  old_expired2 uuid := pg_temp.report_id(t - interval '32 days', 5);
  failure_id uuid := pg_temp.report_id(t - interval '33 days', 6);
  payload text := '{"schema_version":1,"report_type":"mapping_error","geometry":{"type":"Point","coordinates":[103.85,1.35]},"referenced_bundle_version":"synthetic-cleanup","note":"Synthetic cleanup only"}';
  content_hash text;
  proof text := repeat('a',64);
  bucket text := repeat('b',64);
  receipt jsonb;
  replay jsonb;
  cleaned jsonb;
  before_usage jsonb;
  before_control jsonb;
  cutoff bigint;
  old_receipt uuid;
begin
  if exists(select 1 from shiok_reports.reports) or exists(select 1 from shiok_reports.daily_usage)
    or (select count(*) from shiok_reports.control) <> 1
    or exists(select 1 from shiok_reports.control where enabled or policy_approved_at is not null or cleanup_verified_at is not null or cardinality(allowed_bundles)<>0) then
    raise exception 'Requires disabled, empty, unactivated dedicated backend';
  end if;
  select to_jsonb(c) into original_control from shiok_reports.control c;
  content_hash := encode(sha256(convert_to(payload,'UTF8')),'hex');

  if shiok_reports.request_time_ms('017f22e2-79b0-7cc3-98c4-dc0c0c07398f') <> 1645557742000
    or shiok_reports.request_time_ms('017f22e2-79b0-4cc3-98c4-dc0c0c07398f') is not null
    or shiok_reports.request_time_ms('017f22e2-79b0-7cc3-c8c4-dc0c0c07398f') is not null
    or shiok_reports.request_time_ms(null) is not null then raise exception 'UUID interpretation'; end if;
  checks := array_append(checks,'rfc_uuidv7_vector_and_invalid_versions');
  if has_function_privilege('anon','shiok_reports.cleanup_expired_v1()','execute')
    or has_function_privilege('authenticated','shiok_reports.cleanup_expired_v1()','execute')
    or has_function_privilege('service_role','shiok_reports.cleanup_expired_v1()','execute')
    or has_table_privilege('service_role','shiok_reports.reports','delete')
    or has_column_privilege('service_role','shiok_reports.control','request_floor_ms','update')
    or has_column_privilege('service_role','shiok_reports.control','cleanup_verified_at','update')
    or has_function_privilege('service_role','public.shiok_report_submit_v1(uuid,text,text,text)','execute')
    or has_table_privilege('anon','shiok_reports.reports','select')
    or has_table_privilege('authenticated','shiok_reports.reports','select') then raise exception 'Unexpected grants'; end if;
  checks := array_append(checks,'private_invoker_grants');

  begin
    update shiok_reports.control set enabled=true, policy_approved_at=t-interval '1 minute', cleanup_verified_at=t,
      allowed_bundles=array['synthetic-cleanup'];
    receipt := pg_temp.submit(fresh,payload,proof,bucket);
    if receipt->>'replayed' <> 'false' or not exists(select 1 from shiok_reports.reports where request_id=fresh
      and expires_at=received_at+interval '30 days' and received_at>=t and received_at<=clock_timestamp()) then raise exception 'Receipt time'; end if;
    checks := array_append(checks,'new_admission_uses_server_receipt_and_30_day_expiry');
    perform pg_temp.submit(future_id,payload,proof,bucket);
    if not exists(select 1 from shiok_reports.reports where request_id=future_id and received_at<to_timestamp(shiok_reports.request_time_ms(future_id)/1000.0)) then raise exception 'Client time used as receipt'; end if;
    checks := array_append(checks,'allowed_clock_skew_does_not_change_receipt_time');

    perform pg_temp.expect_sqlstate(format('select pg_temp.submit(%L,%L,%L,%L)',pg_temp.report_id(t+interval '6 minutes',7),payload,proof,bucket),'PT400');
    perform pg_temp.expect_sqlstate(format('select pg_temp.submit(%L,%L,%L,%L)',pg_temp.report_id(t-interval '24 hours 1 second',8),payload,proof,bucket),'PT410');
    perform pg_temp.expect_sqlstate(format('select pg_temp.submit(%L,%L,%L,%L)','12345678-1234-4123-8123-123456789abc',payload,proof,bucket),'PT400');
    checks := array_append(checks,'future_stale_and_legacy_new_ids_fail_closed');
    set local role service_role;
    perform pg_temp.expect_sqlstate(format('insert into shiok_reports.reports(request_id,retry_proof_sha256,canonical_content,content_sha256,report_type,received_at,expires_at) values(%L,%L,%L,%L,''mapping_error'',%L::timestamptz,%L::timestamptz)',pg_temp.report_id(t+interval '6 minutes',9),proof,payload,content_hash,t,t+interval '30 days'),'23514');
    reset role;
    checks := array_append(checks,'direct_service_insert_cannot_bypass_request_window');
    perform pg_temp.expect_sqlstate(format('insert into shiok_reports.reports(request_id,retry_proof_sha256,canonical_content,content_sha256,report_type,received_at,expires_at) values(%L,%L,%L,%L,''mapping_error'',%L::timestamptz,%L::timestamptz)',pg_temp.report_id(t,11),proof,payload,content_hash,t,t+interval '1 minute'),'23514');
    checks := array_append(checks,'short_expiry_replay_counterexample_rejected_by_table');
    select jsonb_agg(to_jsonb(d) order by d.day,d.bucket) into before_usage from shiok_reports.daily_usage d;
    perform pg_temp.expect_sqlstate(format('select pg_temp.submit(%L,%L,%L,%L,%L::date)',pg_temp.report_id(t,12),payload,proof,bucket,(t at time zone 'UTC')::date-1),'PT503');
    perform pg_temp.expect_sqlstate(format('select pg_temp.submit(%L,%L,%L,%L,%L::date)',pg_temp.report_id(t,13),payload,proof,bucket,(t at time zone 'UTC')::date+1),'PT503');
    if before_usage is distinct from(select jsonb_agg(to_jsonb(d) order by d.day,d.bucket) from shiok_reports.daily_usage d) then raise exception 'Wrong-day hash charged quota'; end if;
    checks := array_append(checks,'wrong_utc_bucket_day_cannot_split_new_admission_quota');
    set local role service_role;
    replay := pg_temp.submit(fresh,payload,proof,bucket);
    if replay->>'replayed'<>'true' then raise exception 'Column-limited FOR UPDATE did not work'; end if;
    perform pg_temp.expect_sqlstate('select shiok_reports.cleanup_expired_v1()','42501');
    perform pg_temp.expect_sqlstate('delete from shiok_reports.reports','42501');
    perform pg_temp.expect_sqlstate('update shiok_reports.control set request_floor_ms=0','42501');
    perform pg_temp.expect_sqlstate('update shiok_reports.control set cleanup_verified_at=clock_timestamp()','42501');
    perform pg_temp.expect_sqlstate('update shiok_reports.control set cleanup_failed_at=null','42501');
    perform pg_temp.expect_sqlstate(format('select public.shiok_report_submit_v1(%L,%L,%L,%L)',fresh,payload,proof,bucket),'42501');
    reset role;
    checks := array_append(checks,'actual_submitter_can_lock_but_cannot_purge_reset_health_or_call_v1');
    begin
      set local role service_role;
      replay:=pg_temp.submit(pg_temp.report_id(t,20),payload,proof,bucket);
      if replay->>'replayed'<>'false' then raise exception 'Actual role new admission failed'; end if;
      raise sqlstate 'P0032' using message='rollback role admission';
    exception when sqlstate 'P0032' then null;
    end;
    reset role;
    checks:=array_append(checks,'actual_service_role_new_admission_succeeds');

    insert into shiok_reports.reports(request_id,retry_proof_sha256,canonical_content,content_sha256,report_type,received_at,expires_at)
      values(old_valid,proof,payload,content_hash,'mapping_error',t-interval '2 days',t+interval '28 days'),
      (old_expired,proof,payload,content_hash,'mapping_error',t-interval '31 days',t-interval '1 day'),
      (old_expired2,proof,payload,content_hash,'mapping_error',t-interval '32 days',t-interval '2 days');
    select receipt_id into old_receipt from shiok_reports.reports where request_id=old_valid;
    select jsonb_agg(to_jsonb(d) order by d.day,d.bucket) into before_usage from shiok_reports.daily_usage d;
    replay := pg_temp.submit(old_valid,payload,proof,bucket);
    if replay->>'replayed'<>'true' or (replay->>'receipt_id')::uuid<>old_receipt
      or before_usage is distinct from (select jsonb_agg(to_jsonb(d) order by d.day,d.bucket) from shiok_reports.daily_usage d) then raise exception 'Old receipt replay debited or replaced'; end if;
    checks := array_append(checks,'existing_receipt_replays_after_admission_window_without_debit');
    update shiok_reports.control set enabled=false,cleanup_verified_at=t-interval '27 hours';
    replay:=pg_temp.submit(old_valid,payload,proof,bucket,(t at time zone 'UTC')::date-1);
    if replay->>'replayed'<>'true' or (replay->>'receipt_id')::uuid<>old_receipt then raise exception 'Admission pause lost receipt'; end if;
    perform pg_temp.expect_sqlstate(format('select pg_temp.submit(%L,%L,%L,%L)',pg_temp.report_id(t,14),payload,proof,bucket),'PT503');
    update shiok_reports.control set enabled=true,cleanup_verified_at=t;
    checks := array_append(checks,'paused_stale_or_day_changed_admission_still_recovers_saved_receipt');
    perform pg_temp.expect_sqlstate(format('select pg_temp.submit(%L,%L,%L,%L)',old_expired,payload,proof,bucket),'PT410');
    perform pg_temp.expect_sqlstate(format('select pg_temp.submit(%L,%L,%L,%L)',old_expired,payload,repeat('c',64),bucket),'PT409');
    checks := array_append(checks,'expired_existing_receipt_preserves_proof_conflict_precedence');
    insert into shiok_reports.daily_usage values
      ((t at time zone 'UTC')::date-1,repeat('d',64),1),
      ((t at time zone 'UTC')::date-2,repeat('d',64),1);
    cleaned := shiok_reports.cleanup_expired_v1();
    if (cleaned->>'reports_deleted')::int<>2 or (cleaned->>'usage_deleted')::int<>1
      or (select count(*) from shiok_reports.reports)<>3
      or exists(select 1 from shiok_reports.reports where request_id in(old_expired,old_expired2)) then raise exception 'Wrong cleanup set'; end if;
    checks := array_append(checks,'expired_content_deleted_unexpired_pending_content_preserved');
    if not exists(select 1 from shiok_reports.daily_usage where day=(t at time zone 'UTC')::date-1)
      or exists(select 1 from shiok_reports.daily_usage where day<(t at time zone 'UTC')::date-1) then raise exception 'Usage retention'; end if;
    checks := array_append(checks,'utc_quota_history_bounded_to_today_and_yesterday');
    select jsonb_agg(to_jsonb(d) order by d.day,d.bucket) into before_usage from shiok_reports.daily_usage d;
    perform pg_temp.expect_sqlstate(format('select pg_temp.submit(%L,%L,%L,%L)',old_expired,payload,proof,bucket),'PT410');
    perform pg_temp.expect_sqlstate(format('select pg_temp.submit(%L,%L,%L,%L)',old_expired,replace(payload,'Synthetic cleanup only','Changed after deletion'),repeat('c',64),bucket),'PT410');
    if exists(select 1 from shiok_reports.reports where request_id=old_expired)
      or before_usage is distinct from(select jsonb_agg(to_jsonb(d) order by d.day,d.bucket) from shiok_reports.daily_usage d) then raise exception 'Purged report recreated'; end if;
    checks := array_append(checks,'purged_request_never_recreates_content_or_debits_quota');

    update shiok_reports.control set request_floor_ms=request_floor_ms+60000;
    select request_floor_ms into cutoff from shiok_reports.control;
    cleaned:=shiok_reports.cleanup_expired_v1();
    if (select request_floor_ms from shiok_reports.control)<>cutoff
      or (cleaned->>'reports_deleted')::int<>0 then raise exception 'Cleanup floor went backwards'; end if;
    perform pg_temp.expect_sqlstate(format('select pg_temp.submit(%L,%L,%L,%L)',pg_temp.report_id(to_timestamp(cutoff/1000.0),10),payload,proof,bucket),'PT410');
    checks := array_append(checks,'monotone_floor_and_exact_cutoff_rejection');
    select to_jsonb(c) into before_control from shiok_reports.control c;
    update shiok_reports.control set cleanup_verified_at=clock_timestamp()+interval '1 hour';
    perform pg_temp.expect_sqlstate('select shiok_reports.cleanup_expired_v1()','PT503');
    perform pg_temp.expect_sqlstate(format('select pg_temp.submit(%L,%L,%L,%L)',fresh,payload,proof,bucket),'PT503');
    update shiok_reports.control set cleanup_verified_at=(before_control->>'cleanup_verified_at')::timestamptz,
      request_floor_ms=floor(extract(epoch from clock_timestamp()+interval '1 hour')*1000)::bigint;
    perform pg_temp.expect_sqlstate('select shiok_reports.cleanup_expired_v1()','PT503');
    update shiok_reports.control set request_floor_ms=(before_control->>'request_floor_ms')::bigint;
    checks := array_append(checks,'clock_regression_does_not_lower_health_or_admission_floor');

    insert into shiok_reports.reports(request_id,retry_proof_sha256,canonical_content,content_sha256,report_type,received_at,expires_at)
      values(failure_id,proof,payload,content_hash,'mapping_error',t-interval '33 days',t-interval '3 days');
    execute $trigger$create function pg_temp.stop_cleanup() returns trigger language plpgsql as 'begin raise sqlstate ''P0099'' using message=''Synthetic delete failure''; end;'$trigger$;
    execute 'create trigger synthetic_cleanup_failure before delete on shiok_reports.reports for each row execute function pg_temp.stop_cleanup()';
    select to_jsonb(c) into before_control from shiok_reports.control c;
    cleaned:=shiok_reports.cleanup_expired_v1();
    if cleaned->>'ok'<>'false' or cleaned->>'error'<>'cleanup_failed' then raise exception 'Missing cleanup failure'; end if;
    if not exists(select 1 from shiok_reports.reports where request_id=failure_id)
      or (before_control-'cleanup_failed_at') is distinct from(select to_jsonb(c)-'cleanup_failed_at' from shiok_reports.control c)
      or (select cleanup_failed_at is null from shiok_reports.control) then raise exception 'Failed cleanup advanced health or omitted latch'; end if;
    execute 'drop trigger synthetic_cleanup_failure on shiok_reports.reports';
    checks := array_append(checks,'failed_delete_rolls_back_content_and_health_together');
    perform pg_temp.expect_sqlstate(format('select pg_temp.submit(%L,%L,%L,%L)',pg_temp.report_id(t,15),payload,proof,bucket),'PT503');
    replay:=pg_temp.submit(old_valid,payload,proof,bucket);
    if replay->>'replayed'<>'true' then raise exception 'Failure latch blocked receipt'; end if;
    checks := array_append(checks,'cleanup_failure_latch_pauses_new_admission_not_receipt_recovery');
    insert into shiok_reports.daily_usage values((t at time zone 'UTC')::date-3,repeat('e',64),1);
    execute 'create trigger synthetic_usage_failure before delete on shiok_reports.daily_usage for each row execute function pg_temp.stop_cleanup()';
    select to_jsonb(c) into before_control from shiok_reports.control c;
    cleaned:=shiok_reports.cleanup_expired_v1();
    if cleaned->>'ok'<>'false' or not exists(select 1 from shiok_reports.reports where request_id=failure_id)
      or not exists(select 1 from shiok_reports.daily_usage where day=(t at time zone 'UTC')::date-3)
      or (before_control-'cleanup_failed_at') is distinct from(select to_jsonb(c)-'cleanup_failed_at' from shiok_reports.control c) then raise exception 'Partial cleanup survived usage failure'; end if;
    execute 'drop trigger synthetic_usage_failure on shiok_reports.daily_usage';
    checks := array_append(checks,'second_delete_phase_failure_restores_first_delete_phase');
    update shiok_reports.control set enabled=false;
    cleaned:=shiok_reports.cleanup_expired_v1();
    if (cleaned->>'reports_deleted')::int<>1 or (cleaned->>'usage_deleted')::int<>1
      or (select enabled or cleanup_failed_at is not null from shiok_reports.control) then raise exception 'Disabled cleanup activated intake or failed to clear latch'; end if;
    checks := array_append(checks,'cleanup_operates_while_intake_disabled_without_enabling_it');

    -- Deliberate rollback of all report/control/usage mutations, retaining check names only.
    raise sqlstate 'P0031' using message='rollback synthetic report mutations';
  exception when sqlstate 'P0031' then null;
  end;
  if exists(select 1 from shiok_reports.reports) or exists(select 1 from shiok_reports.daily_usage)
    or original_control is distinct from(select to_jsonb(c) from shiok_reports.control c) then raise exception 'Synthetic state not restored'; end if;
  -- PL/pgSQL variables survive the rolled-back subtransaction; content does not.
  checks := array_append(checks,'all_synthetic_cleanup_admission_groups_passed_and_rolled_back');
  insert into cleanup_checks select name,true from unnest(checks) names(name);
end;
$tests$;
select name,passed from cleanup_checks order by name;
