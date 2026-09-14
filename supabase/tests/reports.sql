-- Executed ONLY with the new migration inside one transaction which is rolled back.
create temporary table report_checks (name text primary key, passed boolean not null) on commit drop;
do $$
declare
  payload text := '{"schema_version":1,"report_type":"mapping_error","geometry":{"type":"Point","coordinates":[103.85,1.35]},"referenced_bundle_version":"synthetic-bundle-v1","note":"synthetic only"}';
  request_id uuid := '12345678-1234-4123-8123-123456789abc';
  receipt jsonb;
  retried jsonb;
  r text;
begin
  foreach r in array array['anon', 'authenticated'] loop
    assert not has_schema_privilege(r, 'shiok_reports', 'USAGE'), 'schema exposed';
    assert not has_table_privilege(r, 'shiok_reports.reports', 'SELECT'), 'reports exposed';
    assert not has_table_privilege(r, 'shiok_reports.reports', 'INSERT'), 'insert exposed';
    assert not has_table_privilege(r, 'shiok_reports.control', 'UPDATE'), 'control exposed';
    assert not has_function_privilege(r, 'public.shiok_report_submit_v1(uuid,text,text,text)', 'EXECUTE'), 'RPC exposed';
    execute format('set local role %I', r);
    begin
      perform public.shiok_report_submit_v1(request_id, payload, repeat('a',64), repeat('b',64));
      raise exception 'unauthorized RPC executed';
    exception when insufficient_privilege then null; end;
    begin
      perform 1 from shiok_reports.reports;
      raise exception 'unauthorized report read executed';
    exception when insufficient_privilege then null; end;
    reset role;
    insert into report_checks values (r || '_privileges_denied', true);
  end loop;
  assert (select bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='shiok_reports' and relkind='r'), 'RLS missing';
  assert not (select prosecdef from pg_proc where oid='public.shiok_report_submit_v1(uuid,text,text,text)'::regprocedure), 'unexpected definer';
  insert into report_checks values ('rls_and_invoker', true);
  begin
    perform public.shiok_report_submit_v1(request_id, payload, repeat('a',64), repeat('b',64));
    raise exception 'disabled intake accepted';
  exception when sqlstate 'PT503' then null; end;
  insert into report_checks values ('disabled_by_default', true);

  update shiok_reports.control set enabled=true, allowed_bundles=array['synthetic-bundle-v1'];
  begin
    perform public.shiok_report_submit_v1(request_id, payload, repeat('a',64), repeat('b',64));
    raise exception 'missing policy accepted';
  exception when sqlstate 'PT503' then null; end;
  update shiok_reports.control set policy_approved_at=clock_timestamp();
  begin
    perform public.shiok_report_submit_v1(request_id, payload, repeat('a',64), repeat('b',64));
    raise exception 'missing cleanup accepted';
  exception when sqlstate 'PT503' then null; end;
  update shiok_reports.control set cleanup_verified_at=clock_timestamp() - interval '27 hours';
  begin
    perform public.shiok_report_submit_v1(request_id, payload, repeat('a',64), repeat('b',64));
    raise exception 'stale cleanup accepted';
  exception when sqlstate 'PT503' then null; end;
  insert into report_checks values ('policy_and_cleanup_required', true);
  update shiok_reports.control set cleanup_verified_at=clock_timestamp();

  set local role service_role;
  receipt := public.shiok_report_submit_v1(request_id, payload, repeat('a',64), repeat('b',64));
  reset role;
  assert receipt->>'replayed' = 'false', 'not new receipt';
  assert (select count(*) from shiok_reports.reports) = 1, 'missing report';
  assert (select state = 'pending' and revision = 1 and canonical_content = payload and expires_at = received_at + interval '90 days' from shiok_reports.reports), 'content/state changed';
  assert (select sum(admitted) from shiok_reports.daily_usage) = 2, 'caps not charged together';
  assert not (receipt ? 'note' or receipt ? 'canonical_content' or receipt ? 'retry_proof_sha256'), 'private receipt';
  insert into report_checks values ('atomic_pending_receipt_and_both_caps', true);

  retried := public.shiok_report_submit_v1(request_id, payload, repeat('a',64), repeat('c',64));
  assert (receipt - 'replayed') = (retried - 'replayed') and retried->>'replayed' = 'true', 'unstable retry';
  assert (select count(*) from shiok_reports.reports) = 1, 'duplicate report';
  assert (select sum(admitted) from shiok_reports.daily_usage) = 2, 'duplicate debit';
  insert into report_checks values ('same_identity_retry_no_second_debit', true);
  begin
    perform public.shiok_report_submit_v1(request_id, payload, repeat('d',64), repeat('b',64));
    raise exception 'wrong proof accepted';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform public.shiok_report_submit_v1(request_id, replace(payload,'synthetic only','changed'), repeat('a',64), repeat('b',64));
    raise exception 'changed content accepted';
  exception when sqlstate 'PT409' then null; end;
  insert into report_checks values ('proof_and_content_conflicts', true);
  begin
    perform public.shiok_report_submit_v1(gen_random_uuid(), replace(payload,'synthetic-bundle-v1','unknown'), repeat('a',64), repeat('b',64));
    raise exception 'unknown bundle accepted';
  exception when sqlstate 'PT400' then null; end;
  foreach r in array array['{}', '[]', 'not json', '{"schema_version":1,"schema_version":2}', replace(payload,'"mapping_error"','"contact_me"'), repeat(' ',8193)] loop
    begin
      perform public.shiok_report_submit_v1(gen_random_uuid(), r, repeat('a',64), repeat('b',64));
      raise exception 'invalid envelope accepted';
    exception when sqlstate 'PT400' then null; end;
  end loop;
  insert into report_checks values ('bundle_and_envelope_validation', true);
  begin
    perform public.shiok_report_submit_v1(gen_random_uuid(), replace(payload,'synthetic only','\u0000'), repeat('a',64), repeat('b',64));
    raise exception 'NUL accepted';
  exception when sqlstate 'PT400' then null; end;
  insert into report_checks values ('nul_rejected_like_server_contract', true);

  update shiok_reports.daily_usage set admitted=100 where bucket='global';
  retried := public.shiok_report_submit_v1(request_id, payload, repeat('a',64), repeat('b',64));
  assert retried->>'replayed' = 'true', 'capped receipt cannot recover';
  begin
    perform public.shiok_report_submit_v1(gen_random_uuid(), payload, repeat('a',64), repeat('b',64));
    raise exception 'global cap ignored';
  exception when sqlstate 'PT429' then null; end;
  assert (select count(*) from shiok_reports.reports) = 1, 'failed request persisted';
  update shiok_reports.daily_usage set admitted=1 where bucket='global';
  update shiok_reports.daily_usage set admitted=5 where bucket=repeat('b',64);
  begin
    perform public.shiok_report_submit_v1(gen_random_uuid(), payload, repeat('a',64), repeat('b',64));
    raise exception 'bucket cap ignored';
  exception when sqlstate 'PT429' then null; end;
  assert (select admitted from shiok_reports.daily_usage where bucket='global') = 1, 'partial cap debit';
  insert into report_checks values ('global_and_bucket_caps_preserve_receipt', true);

  update shiok_reports.reports set received_at=clock_timestamp()-interval '91 days', expires_at=clock_timestamp()-interval '1 day';
  begin
    perform public.shiok_report_submit_v1(request_id, payload, repeat('a',64), repeat('b',64));
    raise exception 'expired receipt reused';
  exception when sqlstate 'PT410' then null; end;
  assert (select count(*) from shiok_reports.reports) = 1, 'expired identity recreated';
  insert into report_checks values ('expired_identity_not_recreated', true);

  insert into shiok_reports.reports (request_id,retry_proof_sha256,canonical_content,content_sha256,report_type,received_at,expires_at)
  select gen_random_uuid(),repeat('a',64),payload,repeat('d',64),'mapping_error',clock_timestamp(),clock_timestamp()+interval '90 days' from generate_series(1,499);
  begin
    perform public.shiok_report_submit_v1(gen_random_uuid(), payload, repeat('a',64), repeat('c',64));
    raise exception 'backlog cap ignored';
  exception when sqlstate 'PT429' then null; end;
  insert into report_checks values ('pending_capacity', true);
  update shiok_reports.reports set state='rejected';
  insert into shiok_reports.reports (request_id,retry_proof_sha256,canonical_content,content_sha256,report_type,received_at,expires_at,state)
  select gen_random_uuid(),repeat('a',64),payload,repeat('d',64),'shelter_request',clock_timestamp(),clock_timestamp()+interval '90 days','rejected' from generate_series(1,4500);
  begin
    perform public.shiok_report_submit_v1(gen_random_uuid(), payload, repeat('a',64), repeat('c',64));
    raise exception 'retained cap ignored';
  exception when sqlstate 'PT429' then null; end;
  insert into report_checks values ('retained_capacity', true);
end;
$$;
select * from report_checks order by name;
