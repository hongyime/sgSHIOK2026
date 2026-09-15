-- Pre-activation request validity and private content cleanup. Existing applied
-- migrations remain immutable; incompatible existing rows make this migration fail.
do $migration$
begin
create function shiok_reports.request_time_ms(p_id uuid) returns bigint
language sql immutable strict parallel safe
set search_path = ''
as $$
  select case when substr(p_id::text, 15, 1) = '7'
    and substr(p_id::text, 20, 1) in ('8', '9', 'a', 'b')
    then ('x' || replace(substr(p_id::text, 1, 13), '-', ''))::bit(48)::bigint
    else null end;
$$;
revoke all on function shiok_reports.request_time_ms(uuid) from public, anon, authenticated;
grant execute on function shiok_reports.request_time_ms(uuid) to service_role;

alter table shiok_reports.control add column request_floor_ms bigint not null default 0
  check (request_floor_ms between 0 and 281474976710655);
alter table shiok_reports.control add column cleanup_failed_at timestamptz;
alter table shiok_reports.reports drop constraint shiok_reports_expiry_30_days;
alter table shiok_reports.reports add constraint shiok_reports_expiry_30_days
  check (expires_at - received_at = interval '720 hours');
alter table shiok_reports.reports add constraint shiok_reports_request_validity check (
  shiok_reports.request_time_ms(request_id) is not null
  and shiok_reports.request_time_ms(request_id) > floor(extract(epoch from received_at) * 1000)::bigint - 86400000
  and shiok_reports.request_time_ms(request_id) <= floor(extract(epoch from received_at) * 1000)::bigint + 300000
);

create function public.shiok_report_submit_v2(
  p_request_id uuid,
  p_canonical_content text,
  p_retry_proof_sha256 text,
  p_abuse_bucket_sha256 text,
  p_abuse_day date
) returns jsonb
language plpgsql security invoker
set search_path = ''
set lock_timeout = '2s'
as $$
declare
  ctl shiok_reports.control%rowtype;
  existing shiok_reports.reports%rowtype;
  saved shiok_reports.reports%rowtype;
  payload json;
  captured_at timestamptz;
  captured_ms bigint;
  request_ms bigint;
  today date;
  digest text;
begin
  request_ms := shiok_reports.request_time_ms(p_request_id);
  if request_ms is null or p_abuse_day is null or not isfinite(p_abuse_day)
    or p_retry_proof_sha256 is null or p_retry_proof_sha256 !~ '^[0-9a-f]{64}$'
    or p_abuse_bucket_sha256 is null or p_abuse_bucket_sha256 !~ '^[0-9a-f]{64}$'
    or p_canonical_content is null or octet_length(p_canonical_content) > 8192
    or not (p_canonical_content is json object with unique keys) then
    raise sqlstate 'PT400' using message = 'invalid_report';
  end if;
  payload := p_canonical_content::json;
  if (payload ->> 'schema_version') is distinct from '1'
    or (payload ->> 'report_type') is null
    or (payload ->> 'report_type') not in ('mapping_error', 'shelter_request')
    or (payload ->> 'referenced_bundle_version') is null
    or json_typeof(payload -> 'geometry') is distinct from 'object'
    or exists (select 1 from json_object_keys(payload) k where k not in ('schema_version', 'report_type', 'geometry', 'referenced_bundle_version', 'context', 'note')) then
    raise sqlstate 'PT400' using message = 'invalid_report';
  end if;

  select * into ctl from shiok_reports.control where singleton for update;
  captured_at := clock_timestamp();
  captured_ms := floor(extract(epoch from captured_at) * 1000)::bigint;
  today := (captured_at at time zone 'UTC')::date;
  if not found or ctl.cleanup_verified_at > captured_at or ctl.cleanup_failed_at > captured_at
    or ctl.request_floor_ms > captured_ms then
    raise sqlstate 'PT503' using message = 'reporting_unavailable';
  end if;
  digest := encode(sha256(convert_to(p_canonical_content, 'UTF8')), 'hex');
  select * into existing from shiok_reports.reports where request_id = p_request_id;
  if found then
    if existing.retry_proof_sha256 <> p_retry_proof_sha256
      or existing.content_sha256 <> digest or existing.canonical_content <> p_canonical_content then
      raise sqlstate 'PT409' using message = 'request_conflict';
    end if;
    if existing.expires_at <= captured_at then
      raise sqlstate 'PT410' using message = 'receipt_expired';
    end if;
    return jsonb_build_object('receipt_id', existing.receipt_id, 'received_at', existing.received_at, 'replayed', true);
  end if;
  if not ctl.enabled or ctl.policy_approved_at is null or ctl.policy_approved_at > captured_at
    or ctl.cleanup_verified_at is null or ctl.cleanup_failed_at is not null
    or ctl.cleanup_verified_at < captured_at - interval '26 hours'
    or p_abuse_day <> today then
    raise sqlstate 'PT503' using message = 'reporting_unavailable';
  end if;
  -- A purged request cannot regain validity when cleanup advances or the clock
  -- moves backwards. The floor is global, monotone and contains no resident data.
  if request_ms <= greatest(ctl.request_floor_ms, captured_ms - 86400000) then
    raise sqlstate 'PT410' using message = 'receipt_expired';
  end if;
  if request_ms > captured_ms + 300000 then
    raise sqlstate 'PT400' using message = 'invalid_report';
  end if;
  if not ((payload ->> 'referenced_bundle_version') = any(ctl.allowed_bundles)) then
    raise sqlstate 'PT400' using message = 'unknown_bundle';
  end if;
  if coalesce((select admitted from shiok_reports.daily_usage where day = today and bucket = 'global'), 0) >= 100
    or coalesce((select admitted from shiok_reports.daily_usage where day = today and bucket = p_abuse_bucket_sha256), 0) >= 5
    or (select count(*) from shiok_reports.reports where state = 'pending') >= 500
    or (select count(*) from shiok_reports.reports) >= 5000 then
    raise sqlstate 'PT429' using message = 'report_limit_reached';
  end if;
  insert into shiok_reports.reports (request_id, retry_proof_sha256, canonical_content,
    content_sha256, report_type, received_at, expires_at)
  values (p_request_id, p_retry_proof_sha256, p_canonical_content, digest,
    payload ->> 'report_type', captured_at, captured_at + interval '720 hours')
  returning * into saved;
  insert into shiok_reports.daily_usage (day, bucket, admitted)
    values (today, 'global', 1), (today, p_abuse_bucket_sha256, 1)
    on conflict (day, bucket) do update set admitted = shiok_reports.daily_usage.admitted + 1;
  return jsonb_build_object('receipt_id', saved.receipt_id, 'received_at', saved.received_at, 'replayed', false);
end;
$$;
revoke all on function public.shiok_report_submit_v1(uuid, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.shiok_report_submit_v2(uuid, text, text, text, date) from public, anon, authenticated;
grant execute on function public.shiok_report_submit_v2(uuid, text, text, text, date) to service_role;
-- SELECT FOR UPDATE needs UPDATE privilege, but the submitter cannot rewrite
-- maintenance health or the watermark. The singleton column can only remain true.
revoke update on shiok_reports.control from service_role;
grant update(singleton) on shiok_reports.control to service_role;

create function shiok_reports.cleanup_expired_v1() returns jsonb
language plpgsql security invoker
set search_path = ''
set lock_timeout = '2s'
as $$
declare
  ctl shiok_reports.control%rowtype;
  captured_at timestamptz;
  captured_ms bigint;
  reports_deleted integer;
  usage_deleted integer;
begin
  select * into ctl from shiok_reports.control where singleton for update;
  captured_at := clock_timestamp();
  captured_ms := floor(extract(epoch from captured_at) * 1000)::bigint;
  if not found or ctl.cleanup_verified_at > captured_at or ctl.cleanup_failed_at > captured_at
    or ctl.request_floor_ms > captured_ms then
    raise sqlstate 'PT503' using message = 'cleanup_unavailable';
  end if;
  begin
    -- Only expired rows. Pending unexpired content and all admission decisions stay intact.
    delete from shiok_reports.reports where expires_at <= captured_at;
    get diagnostics reports_deleted = row_count;
    delete from shiok_reports.daily_usage where day < (captured_at at time zone 'UTC')::date - 1;
    get diagnostics usage_deleted = row_count;
    update shiok_reports.control set cleanup_verified_at = captured_at, cleanup_failed_at = null,
      request_floor_ms = greatest(request_floor_ms, captured_ms - 86400000)
      where singleton;
    return jsonb_build_object('ok',true,'completed_at',captured_at,'reports_deleted',reports_deleted,'usage_deleted',usage_deleted);
  exception when others then
    -- The inner subtransaction restores both delete phases and the watermark.
    -- Persist a content-free failure latch. Cancellation/session loss still rely
    -- on the outer timeout plus the 26-hour stale-success gate, not this handler.
    update shiok_reports.control set cleanup_failed_at=captured_at where singleton;
    return jsonb_build_object('ok',false,'completed_at',captured_at,'error','cleanup_failed');
  end;
end;
$$;
revoke all on function shiok_reports.cleanup_expired_v1() from public, anon, authenticated, service_role;
end;
$migration$;
