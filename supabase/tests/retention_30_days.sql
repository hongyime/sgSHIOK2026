-- Run as the migration owner in the dedicated SHIOK project's fresh-session rollback harness:
-- BEGIN; SET LOCAL statement_timeout = '15s'; <new 30-day migration>; <this file>; ROLLBACK;
-- Standalone after migration is also supported: all persistent fixture writes roll back
-- inside DO. Only temporary check names survive until this session ends. No COMMIT is issued.
-- The historical reports.sql tests describe the immutable 90-day migration, not this policy.
-- Require disabled intake and empty report/usage tables. Never substitute resident data.
-- Migration preflight: no existing report may have expires_at > received_at + interval '30 days'.
-- A validating CHECK must reject conflicting rows, not rewrite or remove them.
do $$
declare
  payload text := '{"schema_version":1,"report_type":"mapping_error","geometry":{"type":"Point","coordinates":[103.85,1.35]},"referenced_bundle_version":"synthetic-retention-v1","note":"synthetic retention test only"}';
  test_request_id uuid := '12345678-1234-4123-8123-123456789abc';
  direct_id uuid := '22345678-1234-4123-8123-123456789abc';
  rejected_id uuid := '32345678-1234-4123-8123-123456789abc';
  initial_control jsonb;
  saved shiok_reports.reports%rowtype;
  after_retry shiok_reports.reports%rowtype;
  receipt jsonb;
  retried jsonb;
  boundary timestamptz;
  excessive interval;
  violated_constraint text;
  role_name text;
  checks text[] := array[]::text[];
begin
  set local timezone = 'UTC';
  set local plpgsql.check_asserts = on;
  set local lock_timeout = '2s';
  create temporary table retention_30_day_checks (name text primary key, passed boolean not null) on commit preserve rows;
  assert (select count(*) from shiok_reports.control) = 1, 'missing singleton control';
  select to_jsonb(c) into initial_control from shiok_reports.control c where singleton for update;
  assert (select enabled is false from shiok_reports.control where singleton), 'intake must already be disabled';
  assert (select count(*) from shiok_reports.reports) = 0, 'non-synthetic reports present: stop';
  assert (select count(*) from shiok_reports.daily_usage) = 0, 'existing usage present: stop';
  checks := array_append(checks, 'disabled_empty_baseline');

  assert exists (
    select 1 from pg_constraint
    where conrelid = 'shiok_reports.reports'::regclass
      and conname = 'shiok_reports_expiry_30_days' and contype = 'c' and convalidated
  ), 'validated 30-day expiry constraint missing';
  assert not (select prosecdef from pg_proc where oid = 'public.shiok_report_submit_v1(uuid,text,text,text)'::regprocedure), 'unexpected security definer';
  assert (select proconfig @> array['lock_timeout=2s'] from pg_proc
    where oid = 'public.shiok_report_submit_v1(uuid,text,text,text)'::regprocedure), 'RPC lock timeout changed';
  assert exists (
    select 1 from pg_proc p, unnest(p.proconfig) s(setting)
    where p.oid = 'public.shiok_report_submit_v1(uuid,text,text,text)'::regprocedure
      and s.setting in ('search_path=', 'search_path=""')
  ), 'RPC search path is not empty';
  assert has_function_privilege('service_role', 'public.shiok_report_submit_v1(uuid,text,text,text)', 'EXECUTE'), 'service RPC grant missing';
  foreach role_name in array array['anon', 'authenticated'] loop
    assert not has_function_privilege(role_name, 'public.shiok_report_submit_v1(uuid,text,text,text)', 'EXECUTE'), 'public RPC exposure';
    assert not has_schema_privilege(role_name, 'shiok_reports', 'USAGE'), 'private schema exposure';
  end loop;
  checks := array_append(checks, 'validated_constraint_and_unchanged_rpc_boundary');

  -- Every persistent test mutation is inside this deliberately rolled-back subtransaction.
  -- PL/pgSQL local variables retain the check names, but report/control/usage changes do not.
  begin
    update shiok_reports.control set enabled = true,
      allowed_bundles = array['synthetic-retention-v1'],
      policy_approved_at = clock_timestamp(), cleanup_verified_at = clock_timestamp()
      where singleton;

    set local role service_role;
    receipt := public.shiok_report_submit_v1(test_request_id, payload, repeat('a',64), repeat('b',64));
    reset role;
    select * into saved from shiok_reports.reports r where r.request_id = test_request_id;
    assert found, 'new report missing';
    assert receipt ->> 'replayed' = 'false', 'first receipt is not new';
    assert receipt ->> 'receipt_id' = saved.receipt_id::text, 'receipt identity mismatch';
    assert (receipt ->> 'received_at')::timestamptz = saved.received_at, 'receipt timestamp mismatch';
    assert saved.expires_at = saved.received_at + interval '30 days', 'expiry is not exactly 30 days';
    assert saved.expires_at - saved.received_at = interval '30 days', 'UTC expiry duration mismatch';
    assert saved.state = 'pending' and saved.revision = 1 and saved.canonical_content = payload, 'report content/state changed';
    assert saved.retry_proof_sha256 = repeat('a',64)
      and saved.content_sha256 = encode(sha256(convert_to(payload, 'UTF8')), 'hex'), 'report identity changed';
    assert (select count(*) from shiok_reports.reports) = 1, 'unexpected report count';
    assert (select count(*) = 2 and sum(admitted) = 2 from shiok_reports.daily_usage), 'both caps were not charged once';
    checks := array_append(checks, 'new_report_expires_exactly_30_days');

    set local role service_role;
    retried := public.shiok_report_submit_v1(test_request_id, payload, repeat('a',64), repeat('c',64));
    reset role;
    select * into after_retry from shiok_reports.reports r where r.request_id = test_request_id;
    assert saved is not distinct from after_retry, 'retry changed or extended report';
    assert receipt - 'replayed' = retried - 'replayed' and retried ->> 'replayed' = 'true', 'retry receipt changed';
    assert (select count(*) from shiok_reports.reports) = 1, 'retry created another report';
    assert (select count(*) = 2 and sum(admitted) = 2 from shiok_reports.daily_usage), 'retry charged usage';
    checks := array_append(checks, 'replay_preserves_identity_expiry_and_usage');

    boundary := clock_timestamp();
    set local role service_role;
    foreach excessive in array array[interval '30 days 1 microsecond', interval '90 days'] loop
      begin
        insert into shiok_reports.reports (request_id, retry_proof_sha256, canonical_content,
          content_sha256, report_type, received_at, expires_at)
        values (rejected_id, repeat('a',64), payload, encode(sha256(convert_to(payload, 'UTF8')), 'hex'),
          'mapping_error', boundary, boundary + excessive);
        raise exception 'service-role insert beyond 30 days accepted';
      exception when check_violation then
        get stacked diagnostics violated_constraint = constraint_name;
        assert violated_constraint = 'shiok_reports_expiry_30_days', 'rejected by the wrong constraint';
      end;
    end loop;
    reset role;
    assert not exists (select 1 from shiok_reports.reports r where r.request_id = rejected_id), 'rejected insert persisted';
    checks := array_append(checks, 'service_insert_over_30_days_rejected');

    set local role service_role;
    insert into shiok_reports.reports (request_id, retry_proof_sha256, canonical_content,
      content_sha256, report_type, received_at, expires_at)
    values (direct_id, repeat('a',64), payload, encode(sha256(convert_to(payload, 'UTF8')), 'hex'),
      'mapping_error', boundary, boundary + interval '30 days');
    reset role;
    assert (select expires_at = received_at + interval '30 days' from shiok_reports.reports r where r.request_id = direct_id), 'inclusive 30-day boundary rejected';
    checks := array_append(checks, 'service_insert_exactly_30_days_allowed');

    -- Use one captured boundary, not two clock reads or a sleep. The RPC runs at/after expiry.
    boundary := clock_timestamp();
    update shiok_reports.reports r set received_at = boundary - interval '30 days', expires_at = boundary
      where r.request_id = test_request_id;
    select * into saved from shiok_reports.reports r where r.request_id = test_request_id;
    set local role service_role;
    begin
      perform public.shiok_report_submit_v1(test_request_id, payload, repeat('a',64), repeat('b',64));
      raise exception 'receipt still usable at day 30';
    exception when sqlstate 'PT410' then null; end;
    reset role;
    select * into after_retry from shiok_reports.reports r where r.request_id = test_request_id;
    assert saved is not distinct from after_retry, 'expired receipt was recreated or extended';
    assert (select count(*) from shiok_reports.reports) = 2, 'expired identity was recreated';
    assert (select count(*) = 2 and sum(admitted) = 2 from shiok_reports.daily_usage), 'expired retry charged usage';
    checks := array_append(checks, 'day_30_receipt_expired_without_recreation');

    set local role service_role;
    begin
      perform public.shiok_report_submit_v1(test_request_id, payload, repeat('d',64), repeat('b',64));
      raise exception 'expired receipt accepted a different proof';
    exception when sqlstate 'PT409' then null; end;
    reset role;
    checks := array_append(checks, 'expired_receipt_keeps_conflict_precedence');

    raise sqlstate 'P0030' using message = 'rollback_synthetic_retention_fixtures';
  exception when sqlstate 'P0030' then null;
  end;

  assert (select count(*) from shiok_reports.reports) = 0, 'synthetic reports survived rollback';
  assert (select count(*) from shiok_reports.daily_usage) = 0, 'synthetic usage survived rollback';
  assert (select to_jsonb(c) from shiok_reports.control c where singleton) is not distinct from initial_control, 'control was not restored';
  checks := array_append(checks, 'subtransaction_restores_reports_usage_and_control');

  assert (select enabled is false from shiok_reports.control where singleton), 'intake enabled after test rollback';
  set local role service_role;
  begin
    perform public.shiok_report_submit_v1(test_request_id, payload, repeat('a',64), repeat('b',64));
    raise exception 'disabled intake accepted after rollback';
  exception when sqlstate 'PT503' then null; end;
  reset role;
  assert (select count(*) from shiok_reports.reports) = 0, 'disabled attempt created a report';
  assert (select count(*) from shiok_reports.daily_usage) = 0, 'disabled attempt charged usage';
  checks := array_append(checks, 'intake_disabled_after_test_rollback');

  assert cardinality(checks) = 10, 'incomplete retention checks';
  insert into pg_temp.retention_30_day_checks select name, true from unnest(checks) as names(name);
end;
$$;
select * from pg_temp.retention_30_day_checks order by name;
